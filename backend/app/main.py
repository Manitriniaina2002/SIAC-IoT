from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.responses import JSONResponse, FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from .models import (
    AuthRequest,
    AuthResponse,
    Device,
    DeviceCreate,
    DeviceUpdate,
    Telemetry,
    DeviceORM,
    UserORM,
    TelemetryORM,
    AlertORM,
    SuricataLog,
    SuricataLogORM,
    User,
    UserCreate,
    UserUpdate,
)
from .models import (
    AuthRequest,
    AuthResponse,
    Device,
    DeviceCreate,
    DeviceUpdate,
    Telemetry,
    DeviceORM,
    UserORM,
    TelemetryORM,
    AlertORM,
    SuricataLog,
    SuricataLogORM,
    User,
    UserCreate,
    UserUpdate,
)
from typing import List, Set
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import Base, engine, get_db, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from passlib.context import CryptContext
from typing import Optional
import math
import os
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors
import io
import json
import threading
import paho.mqtt.client as mqtt
import smtplib
from email.mime.text import MIMEText
import json
import threading
import paho.mqtt.client as mqtt

try:
    from .ml_service import anomaly_service
except ImportError:
    anomaly_service = None

try:
    from .influxdb_service import influx_service
except ImportError:
    influx_service = None

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app = FastAPI(title="SIAC-IoT Backend")

# CORS configuration - support production and development
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers middleware
app.add_middleware(SecurityHeadersMiddleware)


@app.on_event("startup")
def on_startup():
    # Create DB tables if not exist
    Base.metadata.create_all(bind=engine)
    # Seed initial data if empty (idempotent)
    db = SessionLocal()
    try:
        # Check if using PostgreSQL or SQLite
        db_url = os.getenv("DATABASE_URL", "sqlite:///./siac.db")
        is_postgres = db_url.startswith("postgresql://") or db_url.startswith("postgres://")
        
        # Migration: add columns if missing
        try:
            if is_postgres:
                # PostgreSQL: Check and add columns if they don't exist
                # Check for email column in users table
                result = db.execute(text("""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='email'
                """)).fetchone()
                if not result:
                    db.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255)"))
                    db.commit()
                
                # Check for type column in devices table
                result = db.execute(text("""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name='devices' AND column_name='type'
                """)).fetchone()
                if not result:
                    db.execute(text("ALTER TABLE devices ADD COLUMN type VARCHAR(100)"))
                    db.commit()
                
                # Check for location column in devices table
                result = db.execute(text("""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name='devices' AND column_name='location'
                """)).fetchone()
                if not result:
                    db.execute(text("ALTER TABLE devices ADD COLUMN location VARCHAR(255)"))
                    db.commit()
                
                # Check for new telemetry columns
                telemetry_cols = ['distance', 'motion', 'servo_state', 'led_states']
                for col in telemetry_cols:
                    result = db.execute(text(f"""
                        SELECT column_name FROM information_schema.columns 
                        WHERE table_name='telemetry' AND column_name='{col}'
                    """)).fetchone()
                    if not result:
                        if col == 'distance':
                            db.execute(text("ALTER TABLE telemetry ADD COLUMN distance FLOAT"))
                        elif col == 'motion':
                            db.execute(text("ALTER TABLE telemetry ADD COLUMN motion BOOLEAN"))
                        elif col == 'servo_state':
                            db.execute(text("ALTER TABLE telemetry ADD COLUMN servo_state VARCHAR(100)"))
                        elif col == 'led_states':
                            db.execute(text("ALTER TABLE telemetry ADD COLUMN led_states JSON"))
                        db.commit()
            else:
                # SQLite: Use PRAGMA
                cols = db.execute(text("PRAGMA table_info(users)")).fetchall()
                col_names = {row[1] for row in cols}
                if "email" not in col_names:
                    db.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255)"))
                    db.commit()

                cols = db.execute(text("PRAGMA table_info(devices)")).fetchall()
                col_names = {row[1] for row in cols}
                if "type" not in col_names:
                    db.execute(text("ALTER TABLE devices ADD COLUMN type VARCHAR(100)"))
                    db.commit()
                if "location" not in col_names:
                    db.execute(text("ALTER TABLE devices ADD COLUMN location VARCHAR(255)"))
                    db.commit()
                
                # Check for new telemetry columns
                cols = db.execute(text("PRAGMA table_info(telemetry)")).fetchall()
                col_names = {row[1] for row in cols}
                new_telemetry_cols = {
                    "distance": "REAL",
                    "motion": "BOOLEAN",
                    "servo_state": "VARCHAR(100)",
                    "led_states": "JSON"
                }
                for col, col_type in new_telemetry_cols.items():
                    if col not in col_names:
                        db.execute(text(f"ALTER TABLE telemetry ADD COLUMN {col} {col_type}"))
                        db.commit()
        except Exception as e:
            db.rollback()
            print(f"Migration error (non-critical): {e}")

        # Seed devices if empty
        try:
            device_count = db.query(DeviceORM).count()
            if device_count == 0:
                now = datetime.utcnow()
                seed = [
                    DeviceORM(device_id="esp32-001", name="ESP32 Main Controller", fw_version="1.0.0", last_seen=now, tags=["esp32", "main", "controller"], type="esp32", location="Salle principale"),
                    DeviceORM(device_id="ultrasonic-001", name="Ultrasonic Distance Sensor", fw_version="1.0.0", last_seen=now, tags=["ultrasonic", "distance", "sensor"], type="sensor", location="Zone de détection"),
                    DeviceORM(device_id="dht22-001", name="DHT22 Temperature/Humidity Sensor", fw_version="1.0.0", last_seen=now, tags=["dht22", "temperature", "humidity", "sensor"], type="sensor", location="Zone environnementale"),
                    DeviceORM(device_id="led-red-001", name="Red LED Indicator", fw_version="1.0.0", last_seen=now, tags=["led", "red", "indicator"], type="actuator", location="Panneau de contrôle"),
                    DeviceORM(device_id="led-green-001", name="Green LED Indicator", fw_version="1.0.0", last_seen=now, tags=["led", "green", "indicator"], type="actuator", location="Panneau de contrôle"),
                ]
                db.add_all(seed)
                db.commit()
        except Exception as e:
            db.rollback()
            print(f"Device seed error: {e}")

        # Seed default admin user if not exists
        try:
            admin = db.query(UserORM).filter(UserORM.username == "admin").first()
            if not admin:
                pwd = get_password_hash("admin123")
                db.add(UserORM(username="admin", hashed_password=pwd, role="admin", email="admin@siac.local", created_at=datetime.utcnow()))
                db.commit()
            else:
                # If existing admin has non-pbkdf2 hash (e.g., legacy bcrypt), reset to default for compatibility
                if admin.hashed_password and not admin.hashed_password.startswith("$pbkdf2-sha256$") and not admin.hashed_password.startswith("pbkdf2_sha256$"):
                    admin.hashed_password = get_password_hash("admin123")
                    if not admin.email:
                        admin.email = "admin@siac.local"
                    db.commit()
        except Exception as e:
            db.rollback()
            print(f"User seed error: {e}")
    except Exception as e:
        db.rollback()
        print(f"Startup error: {e}")
    finally:
        db.close()
    
    # Initialize MQTT client
    init_mqtt_client()
    
    # Entraîner le modèle ML si pas déjà entraîné
    try:
        if anomaly_service and anomaly_service.model_status == "pending":
            anomaly_service.train_on_simulated_data(n_samples=1000)
    except Exception as e:
        print(f"Warning: ML service initialization failed: {e}")
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# MQTT Client setup
mqtt_client = None
mqtt_connected = False

# WebSocket connections
websocket_connections = set()

def on_mqtt_connect(client, userdata, flags, rc):
    global mqtt_connected
    if rc == 0:
        mqtt_connected = True
        print("MQTT connected successfully")
        # Subscribe to ESP32 telemetry topics
        client.subscribe("devices/+/telemetry")
        print("Subscribed to devices/+/telemetry")
    else:
        mqtt_connected = False
        print(f"MQTT connection failed with code {rc}")

def on_mqtt_disconnect(client, userdata, rc):
    global mqtt_connected
    mqtt_connected = False
    print(f"MQTT disconnected with code {rc}")

def on_mqtt_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        device_id = msg.topic.split('/')[1]  # Extract device_id from topic
        
        # Process telemetry data
        process_telemetry(device_id, payload)
    except Exception as e:
        print(f"Error processing MQTT message: {e}")

def process_telemetry(device_id: str, payload: dict):
    """Process incoming telemetry from ESP32 devices"""
    try:
        db = SessionLocal()
        
        # Extract sensor data
        sensors = payload.get('sensors', {})
        net = payload.get('net', {})
        
        # Create telemetry record
        telemetry = TelemetryORM(
            device_id=device_id,
            ts=datetime.utcnow(),
            temperature=sensors.get('temperature'),
            humidity=sensors.get('humidity'),
            distance=sensors.get('distance'),
            motion=sensors.get('motion'),
            servo_state=sensors.get('servo_state'),
            led_states=sensors.get('led_states'),
            tx_bytes=net.get('tx_bytes', 0),
            rx_bytes=net.get('rx_bytes', 0),
            connections=net.get('connections', 0)
        )
        
        db.add(telemetry)
        
        # Update device last_seen
        device = db.query(DeviceORM).filter(DeviceORM.device_id == device_id).first()
        if device:
            device.last_seen = datetime.utcnow()
            # Broadcast device status update
            import asyncio
            asyncio.create_task(broadcast_websocket_message({
                "type": "device_status",
                "device_id": device_id,
                "last_seen": device.last_seen.isoformat(),
                "status": "online"
            }))
        else:
            # Create device if it doesn't exist
            device = DeviceORM(
                device_id=device_id,
                name=f"ESP32-{device_id}",
                type="esp32",
                last_seen=datetime.utcnow()
            )
            db.add(device)
            # Broadcast new device
            import asyncio
            asyncio.create_task(broadcast_websocket_message({
                "type": "device_status",
                "device_id": device_id,
                "name": device.name,
                "type": device.type,
                "last_seen": device.last_seen.isoformat(),
                "status": "online"
            }))
        
        # Write sensor data to InfluxDB
        if influx_service:
            influx_service.write_sensor_data(
                device_id=device_id,
                temperature=sensors.get('temperature'),
                humidity=sensors.get('humidity'),
                distance=sensors.get('distance'),
                timestamp=datetime.utcnow()
            )

        # Check for anomalies using ML service
        if anomaly_service:
            features = [
                sensors.get('temperature', 0) or 0,
                sensors.get('humidity', 0) or 0,
                sensors.get('distance', 0) or 0,
                1 if sensors.get('motion', False) else 0,
                net.get('tx_bytes', 0),
                net.get('rx_bytes', 0),
                net.get('connections', 0)
            ]
            
            is_anomaly, score = anomaly_service.predict_anomaly(features)
            
            if is_anomaly:
                # Create alert
                alert = AlertORM(
                    alert_id=str(uuid.uuid4()),
                    device_id=device_id,
                    ts=datetime.utcnow(),
                    severity="high" if score > 0.8 else "medium",
                    score=score,
                    reason="Anomaly detected in sensor data",
                    acknowledged=False
                )
                db.add(alert)

                # Write alert to InfluxDB
                if influx_service:
                    influx_service.write_alert(
                        device_id=device_id,
                        temp=sensors.get('temperature'),
                        temp_high=True if sensors.get('temperature', 0) > 30 else None,  # Example threshold
                        temp_low=True if sensors.get('temperature', 0) < 10 else None,   # Example threshold
                        hum=sensors.get('humidity'),
                        hum_high=True if sensors.get('humidity', 0) > 80 else None,     # Example threshold
                        message=f"Anomaly detected: {score:.2f}",
                        timestamp=datetime.utcnow()
                    )

                # Send email alert if configured
                maybe_send_email_alert(alert)
                
                # Broadcast alert via WebSocket
                import asyncio
                asyncio.create_task(broadcast_websocket_message({
                    "type": "alert",
                    "alert_id": alert.alert_id,
                    "device_id": device_id,
                    "severity": alert.severity,
                    "score": score,
                    "reason": alert.reason,
                    "ts": alert.ts.isoformat()
                }))
        
        db.commit()
        
        # Broadcast telemetry update via WebSocket
        import asyncio
        asyncio.create_task(broadcast_websocket_message({
            "type": "telemetry",
            "device_id": device_id,
            "sensors": sensors,
            "net": net,
            "ts": datetime.utcnow().isoformat()
        }))
        
        print(f"Processed telemetry for device {device_id}")
        
    except Exception as e:
        print(f"Error processing telemetry: {e}")
        db.rollback()
    finally:
        db.close()

def init_mqtt_client():
    global mqtt_client
    mqtt_host = os.environ.get("MQTT_HOST", "localhost")
    mqtt_port = int(os.environ.get("MQTT_PORT", "1883"))
    mqtt_user = os.environ.get("MQTT_USER")
    mqtt_pass = os.environ.get("MQTT_PASS")
    
    mqtt_client = mqtt.Client()
    mqtt_client.on_connect = on_mqtt_connect
    mqtt_client.on_disconnect = on_mqtt_disconnect
    mqtt_client.on_message = on_mqtt_message
    
    if mqtt_user and mqtt_pass:
        mqtt_client.username_pw_set(mqtt_user, mqtt_pass)
    
    try:
        mqtt_client.connect(mqtt_host, mqtt_port, 60)
        mqtt_client.loop_start()  # Start in background thread
        print(f"MQTT client initialized for {mqtt_host}:{mqtt_port}")
    except Exception as e:
        print(f"Failed to initialize MQTT client: {e}")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

@app.get("/", include_in_schema=False)
def root():
    return {"status": "ok"}


@app.get("/api/v1/health")
def health():
    influx_status = "connected" if influx_service and influx_service.is_connected() else "disconnected"
    return {"status": "ok", "components": {"mqtt": "connected" if mqtt_connected else "disconnected", "influx": influx_status}}


async def broadcast_websocket_message(message: dict):
    """Broadcast message to all connected WebSocket clients"""
    disconnected = set()
    for websocket in websocket_connections:
        try:
            await websocket.send_json(message)
        except:
            disconnected.add(websocket)
    
    # Remove disconnected clients
    websocket_connections.difference_update(disconnected)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_connections.add(websocket)
    
    try:
        while True:
            # Keep connection alive, clients can send ping messages if needed
            data = await websocket.receive_text()
            # Echo back for connection health check
            await websocket.send_json({"type": "pong", "data": data})
    except:
        pass
    finally:
        websocket_connections.discard(websocket)


@app.post("/api/v1/auth/login", response_model=AuthResponse)
def login(req: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(UserORM).filter(UserORM.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return AuthResponse(
        access_token=str(uuid.uuid4()),
        refresh_token=str(uuid.uuid4()),
        username=user.username,
        role=user.role or "admin",
    )


# Users CRUD
@app.get("/api/v1/users", response_model=List[User])
def list_users(db: Session = Depends(get_db)):
    return db.query(UserORM).all()


@app.post("/api/v1/users", response_model=User, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(UserORM).filter(UserORM.username == payload.username).first():
        raise HTTPException(status_code=409, detail="Username already exists")
    row = UserORM(
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        email=payload.email,
        role=payload.role or "viewer",
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.put("/api/v1/users/{user_id}", response_model=User)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    row = db.query(UserORM).filter(UserORM.id == user_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.email is not None:
        row.email = payload.email
    if payload.role is not None:
        row.role = payload.role
    if payload.is_active is not None:
        row.is_active = payload.is_active
    if payload.password:
        row.hashed_password = get_password_hash(payload.password)
    db.commit()
    db.refresh(row)
    return row


@app.delete("/api/v1/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    row = db.query(UserORM).filter(UserORM.id == user_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(row)
    db.commit()
    return JSONResponse(status_code=204, content=None)


@app.get("/api/v1/devices", response_model=List[Device])
def list_devices(db: Session = Depends(get_db)):
    rows = db.query(DeviceORM).all()
    return rows


@app.get("/api/v1/devices/{device_id}", response_model=Device)
def get_device(device_id: str, db: Session = Depends(get_db)):
    row = db.query(DeviceORM).filter(DeviceORM.device_id == device_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Device not found")
    return row


@app.post("/api/v1/devices", response_model=Device, status_code=201)
def create_device(payload: DeviceCreate, db: Session = Depends(get_db)):
    exists = db.query(DeviceORM).filter(DeviceORM.device_id == payload.device_id).first()
    if exists:
        raise HTTPException(status_code=409, detail="Device already exists")
    row = DeviceORM(
        device_id=payload.device_id,
        name=payload.name,
        fw_version=payload.fw_version,
        tags=payload.tags or [],
        type=payload.type,
        location=payload.location,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.put("/api/v1/devices/{device_id}", response_model=Device)
def update_device(device_id: str, payload: DeviceUpdate, db: Session = Depends(get_db)):
    row = db.query(DeviceORM).filter(DeviceORM.device_id == device_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Device not found")
    if payload.name is not None:
        row.name = payload.name
    if payload.fw_version is not None:
        row.fw_version = payload.fw_version
    if payload.tags is not None:
        row.tags = payload.tags
    if payload.type is not None:
        row.type = payload.type
    if payload.location is not None:
        row.location = payload.location
    db.commit()
    db.refresh(row)
    return row


@app.post("/api/v1/devices/{device_id}/commands")
def send_device_command(device_id: str, cmd_green: Optional[bool] = None, cmd_red: Optional[bool] = None):
    """Send command to device and record in InfluxDB"""
    if not mqtt_connected:
        raise HTTPException(status_code=503, detail="MQTT not connected")

    # Prepare command payload
    command_payload = {}
    if cmd_green is not None:
        command_payload["cmd_green"] = cmd_green
    if cmd_red is not None:
        command_payload["cmd_red"] = cmd_red

    if not command_payload:
        raise HTTPException(status_code=400, detail="No command specified")

    # Publish to MQTT
    try:
        mqtt_client.publish(f"devices/{device_id}/commands", json.dumps(command_payload))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send MQTT command: {str(e)}")

    # Write command to InfluxDB
    if influx_service:
        influx_service.write_command(
            device_id=device_id,
            cmd_green=cmd_green,
            cmd_red=cmd_red,
            timestamp=datetime.utcnow()
        )

    return {"status": "command_sent", "device_id": device_id, "commands": command_payload}


@app.post("/api/v1/telemetry", status_code=202)
def ingest_telemetry(t: Telemetry, db: Session = Depends(get_db)):
    temp = t.sensors.temperature if t.sensors and t.sensors.temperature is not None else None
    hum = t.sensors.humidity if t.sensors and t.sensors.humidity is not None else None
    dist = t.sensors.distance if t.sensors and t.sensors.distance is not None else None
    motion = t.sensors.motion if t.sensors and t.sensors.motion is not None else None
    servo = t.sensors.servo_state if t.sensors and t.sensors.servo_state is not None else None
    leds = t.sensors.led_states if t.sensors and t.sensors.led_states is not None else None
    tx = t.net.tx_bytes if t.net and t.net.tx_bytes is not None else 0
    rx = t.net.rx_bytes if t.net and t.net.rx_bytes is not None else 0
    conns = t.net.connections if t.net and t.net.connections is not None else 0

    row = TelemetryORM(
        device_id=t.device_id,
        ts=t.ts or datetime.utcnow(),
        temperature=temp,
        humidity=hum,
        distance=dist,
        motion=motion,
        servo_state=servo,
        led_states=leds,
        tx_bytes=tx,
        rx_bytes=rx,
        connections=conns,
    )
    db.add(row)
    db.commit()

    # Try ML model prediction first
    is_anomaly = False
    model_used = False
    model_status = getattr(anomaly_service, 'model_status', 'unavailable') if anomaly_service else 'unavailable'
    
    try:
        payload = {
            'temperature': temp,
            'humidity': hum,
            'distance': dist,
            'motion': motion,
            'servo_state': servo,
            'led_states': leds,
            'tx_bytes': tx,
            'rx_bytes': rx,
            'connections': conns,
            'ts': (t.ts or datetime.utcnow()).isoformat(),
        }
        
        # Try ML model prediction
        if anomaly_service:
            pred_is_anom, anom_score, status = anomaly_service.predict_anomaly(payload)
            if status == 'trained':
                model_used = True
        else:
            pred_is_anom, anom_score, status = False, 0.0, "unavailable"
            if pred_is_anom:
                is_anomaly = True
                alert = AlertORM(
                    alert_id=str(uuid.uuid4()),
                    device_id=t.device_id,
                    ts=t.ts or datetime.utcnow(),
                    severity="high",
                    score=float(-anom_score) if isinstance(anom_score, (int, float)) else 0.0,
                    reason=f"Anomalie détectée par modèle ML (score={anom_score:.4f})",
                    acknowledged=False,
                    meta={"metric": "ml", "model": "isolation_forest"},
                )
                db.add(alert)
                db.commit()
                maybe_send_email_alert(alert)
    except Exception:
        # On any model error, don't block ingestion
        pass

    # Fallback to simple z-score detection on temperature when model not ready
    if not model_used and temp is not None:
        recent = (
            db.query(TelemetryORM)
            .filter(TelemetryORM.device_id == t.device_id, TelemetryORM.temperature.isnot(None))
            .order_by(TelemetryORM.ts.desc())
            .limit(20)
            .all()
        )
        vals = [r.temperature for r in recent if r.temperature is not None]
        if len(vals) >= 5:
            mean = sum(vals) / len(vals)
            var = sum((v - mean) ** 2 for v in vals) / len(vals)
            std = math.sqrt(var)
            if std > 0 and abs(temp - mean) > 3 * std:
                is_anomaly = True
                alert = AlertORM(
                    alert_id=str(uuid.uuid4()),
                    device_id=t.device_id,
                    ts=t.ts or datetime.utcnow(),
                    severity="high",
                    score=abs(temp - mean) / std,
                    reason=f"Température anormale: {temp:.2f} (μ={mean:.2f}, σ={std:.2f})",
                    acknowledged=False,
                    meta={"metric": "temperature"},
                )
                db.add(alert)
                db.commit()
                maybe_send_email_alert(alert)

    return JSONResponse(status_code=202, content={
        "received": True,
        "device_id": t.device_id,
        "is_anomaly": is_anomaly,
        "model_used": model_used,
        "model_status": model_status,
    })


@app.post("/api/v1/predict")
def predict(t: Telemetry):
    # Dummy prediction: random threshold logic can be replaced by real model
    return {"score": 0.1, "is_anomaly": False, "threshold": 0.7}


@app.get("/api/v1/dashboard_summary")
def dashboard_summary(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    start_today = datetime(now.year, now.month, now.day)
    last24 = now - timedelta(hours=24)

    devices_count = db.query(DeviceORM).count()
    alerts_active = db.query(AlertORM).filter(AlertORM.acknowledged == False).count()
    anomalies_24h = db.query(AlertORM).filter(AlertORM.ts >= last24).count()

    telemetry_today = (
        db.query(TelemetryORM)
        .filter(TelemetryORM.ts >= start_today)
        .all()
    )
    bytes_today = sum((t.tx_bytes or 0) + (t.rx_bytes or 0) for t in telemetry_today)
    gb_today = round(bytes_today / (1024 ** 3), 2)

    return {
        "devices_count": devices_count,
        "alerts_active": alerts_active,
        "anomalies_24h": anomalies_24h,
        "data_volume_today_gb": gb_today,
    }


@app.get("/api/v1/alerts/recent")
def recent_alerts(limit: int = 5, db: Session = Depends(get_db)):
    rows = (
        db.query(AlertORM)
        .order_by(AlertORM.ts.desc())
        .limit(max(1, min(limit, 50)))
        .all()
    )
    # Pydantic can serialize ORM thanks to model_config on Alert
    return rows


@app.get("/api/v1/alerts/active")
def active_alerts(db: Session = Depends(get_db)):
    rows = (
        db.query(AlertORM)
        .filter(AlertORM.acknowledged == False)
        .order_by(AlertORM.ts.desc())
        .all()
    )
    return rows


@app.post("/api/v1/alerts/{alert_id}/ack")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    row = db.query(AlertORM).filter(AlertORM.alert_id == alert_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    row.acknowledged = True
    db.commit()
    db.refresh(row)
    return row


@app.post("/api/v1/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str, db: Session = Depends(get_db)):
    # For now, resolve == acknowledge
    row = db.query(AlertORM).filter(AlertORM.alert_id == alert_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    row.acknowledged = True
    db.commit()
    db.refresh(row)
    return row


@app.get("/api/v1/alerts/recommendations")
def get_alert_recommendations(db: Session = Depends(get_db)):
    """
    Retourne des recommandations d'actions simples basées sur les alertes actives.
    """
    active_alerts = (
        db.query(AlertORM)
        .filter(AlertORM.acknowledged == False)
        .order_by(AlertORM.ts.desc())
        .limit(10)
        .all()
    )
    
    recommendations = []
    
    for alert in active_alerts:
        rec = {
            "alert_id": alert.alert_id,
            "device_id": alert.device_id,
            "severity": alert.severity,
            "reason": alert.reason,
            "actions": []
        }
        
        # Recommandations basées sur le type d'anomalie
        if alert.meta and alert.meta.get("metric") == "temperature":
            rec["actions"] = [
                "Vérifier le système de climatisation",
                "Inspecter les capteurs de température",
                "Vérifier la ventilation de l'équipement"
            ]
        elif alert.meta and alert.meta.get("metric") == "ml":
            rec["actions"] = [
                "Analyser les logs détaillés du device",
                "Vérifier les patterns de télémétrie récents",
                "Inspecter physiquement le dispositif si comportement inhabituel persiste"
            ]
        elif "température" in (alert.reason or "").lower():
            rec["actions"] = [
                "Ajuster les seuils de température",
                "Vérifier l'environnement du capteur"
            ]
        else:
            rec["actions"] = [
                "Vérifier les logs du device",
                "Redémarrer le device si nécessaire",
                "Contacter le support technique"
            ]
        
        # Ajouter la device location si disponible
        device = db.query(DeviceORM).filter(DeviceORM.device_id == alert.device_id).first()
        if device:
            rec["device_name"] = device.name
            rec["device_location"] = device.location
            rec["device_type"] = device.type
        
        recommendations.append(rec)
    
    return {
        "count": len(recommendations),
        "recommendations": recommendations
    }


@app.get("/api/v1/ml/status")
def get_ml_status():
    """
    Retourne le statut du modèle ML.
    """
    try:
        if anomaly_service:
            status = anomaly_service.get_status()
            return status
        else:
            return {"status": "error", "message": "ML service not available"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/v1/ml/train")
def train_ml_model(n_samples: int = 1000):
    """
    Force l'entraînement du modèle ML (pour admin).
    """
    try:
        if not anomaly_service:
            raise HTTPException(status_code=503, detail="ML service not available")
        
        success = anomaly_service.train_on_simulated_data(n_samples=n_samples)
        if success:
            return {"status": "success", "message": f"Model trained with {n_samples} samples"}
        else:
            raise HTTPException(status_code=500, detail="Training failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# InfluxDB Endpoints
@app.get("/api/v1/influx/measurements/{measurement}")
def get_influx_measurements(measurement: str, limit: int = 20):
    """Get recent measurements from InfluxDB"""
    if not influx_service or not influx_service.is_connected():
        raise HTTPException(status_code=503, detail="InfluxDB not connected")

    try:
        result = influx_service.get_recent_measurements(measurement, limit)
        if result:
            # Convert to simple format
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        "time": record.get_time().isoformat(),
                        "measurement": record.get_measurement(),
                        "device": record.values.get("device"),
                        "fields": {k: v for k, v in record.values.items() if not k.startswith("_")}
                    })
            return {"data": data}
        return {"data": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query InfluxDB: {str(e)}")


@app.get("/api/v1/influx/sensor-data")
def get_sensor_data(device_id: Optional[str] = None, limit: int = 50):
    """Get sensor data from InfluxDB"""
    if not influx_service or not influx_service.is_connected():
        raise HTTPException(status_code=503, detail="InfluxDB not connected")

    try:
        device_filter = f'|> filter(fn: (r) => r.device == "{device_id}")' if device_id else ""
        flux_query = f'''
        from(bucket: "bucket_iot")
        |> range(start: -24h)
        |> filter(fn: (r) => r._measurement == "measurement")
        {device_filter}
        |> limit(n: {limit})
        |> sort(columns: ["_time"], desc: true)
        '''

        result = influx_service.query_data(flux_query)
        if result:
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        "time": record.get_time().isoformat(),
                        "device": record.values.get("device"),
                        "temperature": record.values.get("temperature"),
                        "humidity": record.values.get("humidity"),
                        "distance": record.values.get("distance")
                    })
            return {"data": data}
        return {"data": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query sensor data: {str(e)}")


@app.get("/api/v1/influx/commands")
def get_commands(device_id: Optional[str] = None, limit: int = 20):
    """Get command history from InfluxDB"""
    if not influx_service or not influx_service.is_connected():
        raise HTTPException(status_code=503, detail="InfluxDB not connected")

    try:
        device_filter = f'|> filter(fn: (r) => r.device == "{device_id}")' if device_id else ""
        flux_query = f'''
        from(bucket: "bucket_iot")
        |> range(start: -24h)
        |> filter(fn: (r) => r._measurement == "commands")
        {device_filter}
        |> limit(n: {limit})
        |> sort(columns: ["_time"], desc: true)
        '''

        result = influx_service.query_data(flux_query)
        if result:
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        "time": record.get_time().isoformat(),
                        "device": record.values.get("device"),
                        "cmd_green": record.values.get("cmd_green"),
                        "cmd_red": record.values.get("cmd_red")
                    })
            return {"data": data}
        return {"data": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query commands: {str(e)}")


@app.get("/api/v1/influx/alerts")
def get_influx_alerts(device_id: Optional[str] = None, limit: int = 20):
    """Get alerts from InfluxDB"""
    if not influx_service or not influx_service.is_connected():
        raise HTTPException(status_code=503, detail="InfluxDB not connected")

    try:
        device_filter = f'|> filter(fn: (r) => r.device == "{device_id}")' if device_id else ""
        flux_query = f'''
        from(bucket: "bucket_iot")
        |> range(start: -24h)
        |> filter(fn: (r) => r._measurement == "alerts")
        {device_filter}
        |> limit(n: {limit})
        |> sort(columns: ["_time"], desc: true)
        '''

        result = influx_service.query_data(flux_query)
        if result:
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        "time": record.get_time().isoformat(),
                        "device": record.values.get("device"),
                        "temp": record.values.get("temp"),
                        "temp_high": record.values.get("tempHigh"),
                        "temp_low": record.values.get("tempLow"),
                        "hum": record.values.get("hum"),
                        "hum_high": record.values.get("humHigh"),
                        "distance": record.values.get("distance"),
                        "distance_alert": record.values.get("distanceAlert"),
                        "message": record.values.get("message")
                    })
            return {"data": data}
        return {"data": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query alerts: {str(e)}")


@app.get("/api/v1/telemetry/recent")
def recent_telemetry(limit: int = 20, db: Session = Depends(get_db)):
    rows = (
        db.query(TelemetryORM)
        .order_by(TelemetryORM.ts.desc())
        .limit(max(1, min(limit, 100)))
        .all()
    )
    # Convert to dict format for frontend
    result = []
    for row in rows:
        item = {
            "device_id": row.device_id,
            "ts": row.ts.isoformat(),
            "sensors": {
                "temperature": row.temperature,
                "humidity": row.humidity,
                "distance": row.distance,
                "motion": row.motion,
                "servo_state": row.servo_state,
                "led_states": row.led_states,
            },
            "net": {
                "tx_bytes": row.tx_bytes,
                "rx_bytes": row.rx_bytes,
                "connections": row.connections,
            }
        }
        result.append(item)
    return result


@app.get("/api/v1/metrics/devices_activity_24h")
def devices_activity_24h(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    start = now - timedelta(hours=24)
    # Fetch telemetry and alerts in last 24h
    tel_rows = (
        db.query(TelemetryORM)
        .filter(TelemetryORM.ts >= start)
        .all()
    )
    alert_rows = (
        db.query(AlertORM)
        .filter(AlertORM.ts >= start)
        .all()
    )
    # Bucket by hour label HH:00
    buckets = {}
    def hour_key(dt: datetime):
        return dt.replace(minute=0, second=0, microsecond=0)
    # devices: distinct device ids per hour
    dev_buckets: dict[datetime, Set[str]] = {}
    for r in tel_rows:
        hk = hour_key(r.ts)
        dev_buckets.setdefault(hk, set()).add(r.device_id)
    # alerts count per hour
    alert_buckets: dict[datetime, int] = {}
    for a in alert_rows:
        hk = hour_key(a.ts)
        alert_buckets[hk] = alert_buckets.get(hk, 0) + 1
    # Build sorted series for last 24h
    out = []
    for i in range(24, -1, -4):
        # Represent 6 points across 24h like the placeholder
        t = now - timedelta(hours=i)
        hk = hour_key(t)
        time_label = hk.strftime("%H:00")
        out.append({
            "time": time_label,
            "devices": len(dev_buckets.get(hk, set())),
            "alerts": alert_buckets.get(hk, 0),
        })
    return out


@app.get("/api/v1/metrics/data_volume_7d")
def data_volume_7d(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    start = now - timedelta(days=6)
    tel_rows = (
        db.query(TelemetryORM)
        .filter(TelemetryORM.ts >= start.replace(hour=0, minute=0, second=0, microsecond=0))
        .all()
    )
    buckets = {}
    def day_key(dt: datetime):
        return datetime(dt.year, dt.month, dt.day)
    for r in tel_rows:
        dk = day_key(r.ts)
        buckets.setdefault(dk, 0)
        buckets[dk] += (r.tx_bytes or 0) + (r.rx_bytes or 0)
    out = []
    for i in range(6, -1, -1):
        d = now - timedelta(days=i)
        dk = day_key(d)
        vol_gb = round((buckets.get(dk, 0)) / (1024 ** 3), 2)
        out.append({
            "day": ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"][dk.weekday()],
            "volume": vol_gb,
        })
    return out


# Suricata Security Logs Endpoints
@app.post("/api/v1/suricata/logs", status_code=202)
def ingest_suricata_log(log: SuricataLog, db: Session = Depends(get_db)):
    # For now, just insert the log without aggregation since the new schema doesn't have occurrences
    row = SuricataLogORM(
        event_ts=log.event_ts,
        event_type=log.event_type,
        src_ip=log.src_ip,
        src_port=log.src_port,
        dest_ip=log.dest_ip,
        dest_port=log.dest_port,
        proto=log.proto,
        signature=log.signature,
        signature_id=log.signature_id,
        severity=log.severity,
        raw=log.raw,
    )
    db.add(row)
    db.commit()
    return {"status": "created"}


@app.get("/api/v1/suricata/logs/recent")
def get_recent_suricata_logs(limit: int = 20, db: Session = Depends(get_db)):
    rows = (
        db.query(SuricataLogORM)
        .order_by(SuricataLogORM.event_ts.desc())
        .limit(max(1, min(limit, 100)))
        .all()
    )
    return rows


@app.get("/api/v1/suricata/logs/stats")
def get_suricata_stats(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    last24 = now - timedelta(hours=24)
    
    total_logs = db.query(SuricataLogORM).count()
    logs_24h = db.query(SuricataLogORM).filter(SuricataLogORM.event_ts >= last24).count()
    
    # Derive categories from signatures (simplified logic)
    def categorize_signature(signature):
        if not signature:
            return 'unknown'
        sig_lower = signature.lower()
        if 'mqtt' in sig_lower and 'tls' in sig_lower:
            return 'mqtt_no_tls'
        elif 'brute' in sig_lower or 'admin' in sig_lower:
            return 'brute_force'
        elif 'scan' in sig_lower or 'nmap' in sig_lower:
            return 'network_scan'
        elif 'dos' in sig_lower or 'flood' in sig_lower:
            return 'dos'
        elif 'tls' in sig_lower:
            return 'tls_error'
        elif 'docker' in sig_lower or '172.17' in sig_lower:
            return 'intrusion'
        else:
            return 'other'
    
    # Get all logs from last 24h and categorize them
    recent_logs = db.query(SuricataLogORM).filter(SuricataLogORM.event_ts >= last24).all()
    categories = {}
    severities = {}
    
    for log in recent_logs:
        cat = categorize_signature(log.signature)
        categories[cat] = categories.get(cat, 0) + 1
        
        sev = log.severity or '3'
        severities[sev] = severities.get(sev, 0) + 1
    
    return {
        "total_logs": total_logs,
        "logs_24h": logs_24h,
        "categories": categories,
        "severities": severities,
    }


@app.get("/api/v1/suricata/logs/alerts")
def get_suricata_alerts(db: Session = Depends(get_db)):
    # Return high-priority security alerts (severity '1' and '2')
    rows = (
        db.query(SuricataLogORM)
        .filter(SuricataLogORM.severity.in_(['1', '2']))
        .order_by(SuricataLogORM.event_ts.desc())
        .limit(50)
        .all()
    )
    return rows


# Export endpoints
@app.get("/api/v1/telemetry/export")
async def export_telemetry(format: str = "excel", db: Session = Depends(get_db)):
    telemetries = db.query(TelemetryORM).all()
    data = [
        {
            "id": t.id,
            "device_id": t.device_id,
            "ts": t.ts,
            "temperature": t.temperature,
            "humidity": t.humidity,
            "distance": t.distance,
            "motion": t.motion,
            "servo_state": t.servo_state,
            "led_states": str(t.led_states),
            "tx_bytes": t.tx_bytes,
            "rx_bytes": t.rx_bytes,
            "connections": t.connections
        } for t in telemetries
    ]
    
    if format == "excel":
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)
        return FileResponse(buffer, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename='telemetry.xlsx')
    elif format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        table_data = [["ID", "Device ID", "Timestamp", "Temp", "Humidity", "Distance", "Motion", "Servo", "LEDs", "TX", "RX", "Connections"]]
        for d in data:
            table_data.append([d["id"], d["device_id"], str(d["ts"]), d["temperature"], d["humidity"], d["distance"], d["motion"], d["servo_state"], d["led_states"], d["tx_bytes"], d["rx_bytes"], d["connections"]])
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)
        doc.build(elements)
        buffer.seek(0)
        return FileResponse(buffer, media_type='application/pdf', filename='telemetry.pdf')
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'excel' or 'pdf'")


@app.get("/api/v1/alerts/export")
async def export_alerts(format: str = "excel", db: Session = Depends(get_db)):
    alerts = db.query(AlertORM).all()
    data = [
        {
            "id": a.id,
            "alert_id": a.alert_id,
            "device_id": a.device_id,
            "ts": a.ts,
            "severity": a.severity,
            "score": a.score,
            "reason": a.reason,
            "acknowledged": a.acknowledged,
            "meta": str(a.meta)
        } for a in alerts
    ]
    
    if format == "excel":
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)
        return FileResponse(buffer, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename='alerts.xlsx')
    elif format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        table_data = [["ID", "Alert ID", "Device ID", "Timestamp", "Severity", "Score", "Reason", "Acknowledged", "Meta"]]
        for d in data:
            table_data.append([d["id"], d["alert_id"], d["device_id"], str(d["ts"]), d["severity"], d["score"], d["reason"], d["acknowledged"], d["meta"]])
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)
        doc.build(elements)
        buffer.seek(0)
        return FileResponse(buffer, media_type='application/pdf', filename='alerts.pdf')
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'excel' or 'pdf'")


@app.get("/api/v1/logs/export")
async def export_logs(format: str = "excel", db: Session = Depends(get_db)):
    logs = db.query(SuricataLogORM).all()
    data = [
        {
            "id": l.id,
            "event_ts": l.event_ts,
            "event_type": l.event_type,
            "src_ip": l.src_ip,
            "src_port": l.src_port,
            "dest_ip": l.dest_ip,
            "dest_port": l.dest_port,
            "proto": l.proto,
            "signature": l.signature,
            "signature_id": l.signature_id,
            "severity": l.severity,
            "raw": str(l.raw),
            "created_at": l.created_at
        } for l in logs
    ]
    
    if format == "excel":
        df = pd.DataFrame(data)
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False, engine='openpyxl')
        buffer.seek(0)
        return FileResponse(buffer, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename='logs.xlsx')
    elif format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        table_data = [["ID", "Event TS", "Event Type", "Src IP", "Src Port", "Dest IP", "Dest Port", "Proto", "Signature", "Sig ID", "Severity", "Raw", "Created At"]]
        for d in data:
            table_data.append([d["id"], str(d["event_ts"]), d["event_type"], d["src_ip"], d["src_port"], d["dest_ip"], d["dest_port"], d["proto"], d["signature"], d["signature_id"], d["severity"], d["raw"], str(d["created_at"])])
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(table)
        doc.build(elements)
        buffer.seek(0)
        return FileResponse(buffer, media_type='application/pdf', filename='logs.pdf')
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'excel' or 'pdf'")


def maybe_send_email_alert(alert: AlertORM):
    try:
        host = os.environ.get("SMTP_HOST")
        to_addr = os.environ.get("ALERT_EMAIL_TO")
        if not host or not to_addr:
            return
        port = int(os.environ.get("SMTP_PORT", "25"))
        user = os.environ.get("SMTP_USER")
        pwd = os.environ.get("SMTP_PASS")
        sender = os.environ.get("SMTP_FROM", user or "alerts@siac.local")
        subj = f"[SIAC-IoT] Alerte {alert.severity.upper()} - {alert.device_id}"
        body = f"Device: {alert.device_id}\nTime: {alert.ts}\nReason: {alert.reason}\nScore: {alert.score}"
        msg = MIMEText(body)
        msg['Subject'] = subj
        msg['From'] = sender
        msg['To'] = to_addr
        with smtplib.SMTP(host, port, timeout=5) as s:
            if user and pwd:
                s.starttls()
                s.login(user, pwd)
            s.sendmail(sender, [to_addr], msg.as_string())
    except Exception:
        # Best-effort only; ignore failures
        pass
