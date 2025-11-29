"""
InfluxDB-based data service to replace PostgreSQL functionality.
Provides CRUD operations for users, devices, telemetry, alerts, and Suricata logs.
"""
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
from influxdb_client.client.query_api import QueryApi
from influxdb_client.client.delete_api import DeleteApi
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from passlib.context import CryptContext
import json

# Pydantic models for data validation
from pydantic import BaseModel

class UserData(BaseModel):
    username: str
    hashed_password: str
    email: Optional[str] = None
    role: str = "admin"
    is_active: bool = True
    created_at: Optional[datetime] = None

class DeviceData(BaseModel):
    device_id: str
    name: Optional[str] = None
    fw_version: Optional[str] = None
    last_seen: Optional[datetime] = None
    tags: Optional[List[str]] = []
    type: Optional[str] = None
    location: Optional[str] = None

class TelemetryData(BaseModel):
    device_id: str
    ts: datetime
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    distance: Optional[float] = None
    motion: Optional[bool] = None
    servo_state: Optional[str] = None
    led_states: Optional[Dict[str, bool]] = None
    tx_bytes: int = 0
    rx_bytes: int = 0
    connections: int = 0

class AlertData(BaseModel):
    alert_id: str
    device_id: str
    ts: datetime
    severity: str
    score: float = 0.0
    reason: Optional[str] = None
    acknowledged: bool = False
    metadata: Optional[Dict[str, Any]] = None

class SuricataLogData(BaseModel):
    event_ts: Optional[datetime] = None
    event_type: Optional[str] = None
    src_ip: Optional[str] = None
    src_port: Optional[str] = None
    dest_ip: Optional[str] = None
    dest_port: Optional[str] = None
    proto: Optional[str] = None
    signature: Optional[str] = None
    signature_id: Optional[str] = None
    severity: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None

class InfluxDBDataService:
    """
    Unified InfluxDB service replacing PostgreSQL functionality.
    Uses different measurements for different data types.
    """

    def __init__(self):
        self.url = os.getenv("INFLUXDB_URL", "http://influxdb:8086")
        self.token = os.getenv("INFLUXDB_TOKEN", "siac-token")
        self.org = os.getenv("INFLUXDB_ORG", "siac")
        self.bucket = os.getenv("INFLUXDB_BUCKET", "bucket_iot")

        self.client = None
        self.write_api = None
        self.query_api = None
        self.delete_api = None

        # Password hashing
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        self._connect()

    def _connect(self):
        """Initialize InfluxDB client and APIs"""
        try:
            self.client = InfluxDBClient(
                url=self.url,
                token=self.token,
                org=self.org
            )
            self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
            self.query_api = self.client.query_api()
            self.delete_api = self.client.delete_api()
            print(f"Connected to InfluxDB at {self.url}")
        except Exception as e:
            print(f"Failed to connect to InfluxDB: {e}")
            self.client = None

    def is_connected(self) -> bool:
        """Check if InfluxDB connection is active"""
        return self.client is not None

    # Password utilities
    def hash_password(self, password: str) -> str:
        """Hash a password"""
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.pwd_context.verify(plain_password, hashed_password)

    # User Management
    def create_user(self, username: str, password: str, email: Optional[str] = None, role: str = "admin") -> bool:
        """Create a new user"""
        if not self.is_connected():
            return False

        try:
            hashed_password = self.hash_password(password)
            point = Point("users") \
                .tag("username", username) \
                .field("hashed_password", hashed_password) \
                .field("email", email or "") \
                .field("role", role) \
                .field("is_active", True) \
                .time(datetime.utcnow(), WritePrecision.NS)

            self.write_api.write(bucket=self.bucket, org=self.org, record=point)
            return True
        except Exception as e:
            print(f"Error creating user: {e}")
            return False

    def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username"""
        if not self.is_connected():
            return None

        flux_query = f'''
        from(bucket: "{self.bucket}")
        |> range(start: -1y)
        |> filter(fn: (r) => r._measurement == "users")
        |> filter(fn: (r) => r.username == "{username}")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 10)
        '''

        try:
            result = self.query_api.query(flux_query)
            if result and len(result) > 0:
                user_data = {"username": username}
                for table in result:
                    for record in table.records:
                        field = record["_field"]
                        value = record["_value"]
                        if field == "hashed_password":
                            user_data["password"] = value
                        elif field == "email":
                            user_data["email"] = value
                        elif field == "role":
                            user_data["role"] = value
                        elif field == "is_active":
                            user_data["is_active"] = value
                return user_data if len(user_data) > 1 else None
            return None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None

    def delete_user(self, username: str) -> bool:
        """Delete a user"""
        if not self.is_connected():
            return False

        try:
            self.delete_api.delete(
                start=datetime.utcnow() - timedelta(days=365),
                stop=datetime.utcnow() + timedelta(hours=1),
                predicate=f'_measurement="users" AND username="{username}"',
                bucket=self.bucket,
                org=self.org
            )
            return True
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False

    def list_users(self) -> List[Dict[str, Any]]:
        """List all users"""
        if not self.is_connected():
            return []

        flux_query = f'''
        from(bucket: "{self.bucket}")
        |> range(start: -1y)
        |> filter(fn: (r) => r._measurement == "users")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 100)
        '''

        try:
            result = self.query_api.query(flux_query)
            users = {}
            user_data = {}

            for table in result:
                for record in table.records:
                    username = record["username"]
                    if username not in user_data:
                        user_data[username] = {"username": username}

                    field = record["_field"]
                    value = record["_value"]
                    if field == "role":
                        user_data[username][field] = value
                    elif field == "email":
                        user_data[username][field] = value
                    elif field == "is_active":
                        user_data[username][field] = value
                    elif field == "hashed_password":
                        user_data[username]["password"] = value  # For compatibility

            return list(user_data.values())
        except Exception as e:
            print(f"Error listing users: {e}")
            return []

    def query_data(self, flux_query: str):
        """Query data using Flux query"""
        if not self.is_connected():
            return None
        return self.query_api.query(flux_query)

    # Device Management
    def create_device(self, device_data: DeviceData) -> bool:
        """Create a new device"""
        if not self.is_connected():
            return False

        try:
            point = Point("devices") \
                .tag("device_id", device_data.device_id) \
                .field("name", device_data.name or "") \
                .field("fw_version", device_data.fw_version or "") \
                .field("type", device_data.type or "") \
                .field("location", device_data.location or "") \
                .field("tags", json.dumps(device_data.tags or [])) \
                .time(datetime.utcnow(), WritePrecision.NS)

            if device_data.last_seen:
                point = point.field("last_seen", device_data.last_seen.isoformat())

            self.write_api.write(bucket=self.bucket, org=self.org, record=point)
            return True
        except Exception as e:
            print(f"Error creating device: {e}")
            return False

    def get_device(self, device_id: str) -> Optional[Dict[str, Any]]:
        """Get device by device_id"""
        if not self.is_connected():
            return None

        flux_query = f'''
        from(bucket: "{self.bucket}")
        |> range(start: -1y)
        |> filter(fn: (r) => r._measurement == "devices")
        |> filter(fn: (r) => r.device_id == "{device_id}")
        |> limit(n: 1)
        '''

        try:
            result = self.query_api.query(flux_query)
            if result and len(result) > 0 and len(result[0].records) > 0:
                record = result[0].records[0]
                return {
                    "device_id": record["device_id"],
                    "name": record["_value"] if record["_field"] == "name" else None,
                    "fw_version": record["_value"] if record["_field"] == "fw_version" else None,
                    "type": record["_value"] if record["_field"] == "type" else None,
                    "location": record["_value"] if record["_field"] == "location" else None,
                    "tags": json.loads(record["_value"]) if record["_field"] == "tags" else [],
                }
            return None
        except Exception as e:
            print(f"Error getting device: {e}")
            return None

    def list_devices(self) -> List[Dict[str, Any]]:
        """List all devices"""
        if not self.is_connected():
            return []

        flux_query = f'''
        from(bucket: "{self.bucket}")
        |> range(start: -1y)
        |> filter(fn: (r) => r._measurement == "devices")
        |> group(columns: ["device_id"])
        |> limit(n: 100)
        '''

        try:
            result = self.query_api.query(flux_query)
            devices = []
            device_data = {}

            for table in result:
                for record in table.records:
                    device_id = record["device_id"]
                    if device_id not in device_data:
                        device_data[device_id] = {"device_id": device_id}

                    field = record["_field"]
                    value = record["_value"]
                    if field == "tags":
                        device_data[device_id][field] = json.loads(value)
                    else:
                        device_data[device_id][field] = value

            return list(device_data.values())
        except Exception as e:
            print(f"Error listing devices: {e}")
            return []

    def update_device(self, device_id: str, update_data: Dict[str, Any]) -> bool:
        """Update device information"""
        if not self.is_connected():
            return False

        try:
            # Get existing device data
            device = self.get_device(device_id)
            if not device:
                return False

            # Create new point with updated data
            point = Point("devices") \
                .tag("device_id", device_id) \
                .field("name", update_data.get("name", device.get("name", ""))) \
                .field("fw_version", update_data.get("fw_version", device.get("fw_version", ""))) \
                .field("type", update_data.get("type", device.get("type", ""))) \
                .field("location", update_data.get("location", device.get("location", ""))) \
                .field("tags", json.dumps(update_data.get("tags", device.get("tags", [])))) \
                .time(datetime.utcnow(), WritePrecision.NS)

            if update_data.get("last_seen"):
                point = point.field("last_seen", update_data["last_seen"].isoformat())

            self.write_api.write(bucket=self.bucket, org=self.org, record=point)
            return True
        except Exception as e:
            print(f"Error updating device: {e}")
            return False

    def update_device_last_seen(self, device_id: str, last_seen: datetime) -> bool:
        """Update device last seen timestamp"""
        if not self.is_connected():
            return False

        try:
            # Get existing device data
            device = self.get_device(device_id)
            if not device:
                return False

            # Update with new last_seen
            update_data = {**device, "last_seen": last_seen}
            return self.update_device(device_id, update_data)
        except Exception as e:
            print(f"Error updating device last seen: {e}")
            return False

    # Telemetry Management
    def save_telemetry(self, telemetry: TelemetryData) -> bool:
        """Save telemetry data"""
        if not self.is_connected():
            return False

        try:
            point = Point("telemetry") \
                .tag("device_id", telemetry.device_id) \
                .field("temperature", telemetry.temperature or 0.0) \
                .field("humidity", telemetry.humidity or 0.0) \
                .field("distance", telemetry.distance or 0.0) \
                .field("tx_bytes", telemetry.tx_bytes) \
                .field("rx_bytes", telemetry.rx_bytes) \
                .field("connections", telemetry.connections) \
                .time(telemetry.ts, WritePrecision.NS)

            if telemetry.motion is not None:
                point = point.field("motion", telemetry.motion)
            if telemetry.servo_state:
                point = point.field("servo_state", telemetry.servo_state)
            if telemetry.led_states:
                point = point.field("led_states", json.dumps(telemetry.led_states))

            self.write_api.write(bucket=self.bucket, org=self.org, record=point)
            return True
        except Exception as e:
            print(f"Error saving telemetry: {e}")
            return False

    def get_recent_telemetry(self, device_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent telemetry data"""
        if not self.is_connected():
            return []

        device_filter = f'|> filter(fn: (r) => r.device_id == "{device_id}")' if device_id else ""

        flux_query = f'''
        from(bucket: "{self.bucket}")
        |> range(start: -24h)
        |> filter(fn: (r) => r._measurement == "telemetry")
        {device_filter}
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: {limit})
        '''

        try:
            result = self.query_api.query(flux_query)
            telemetry_data = []

            for table in result:
                for record in table.records:
                    telemetry_data.append({
                        "device_id": record["device_id"],
                        "ts": record["_time"],
                        "temperature": record["_value"] if record["_field"] == "temperature" else None,
                        "humidity": record["_value"] if record["_field"] == "humidity" else None,
                        "distance": record["_value"] if record["_field"] == "distance" else None,
                        "tx_bytes": record["_value"] if record["_field"] == "tx_bytes" else None,
                        "rx_bytes": record["_value"] if record["_field"] == "rx_bytes" else None,
                        "connections": record["_value"] if record["_field"] == "connections" else None,
                    })

            return telemetry_data
        except Exception as e:
            print(f"Error getting telemetry: {e}")
            return []

    # Alert Management
    def save_alert(self, alert: AlertData) -> bool:
        """Save alert data"""
        if not self.is_connected():
            return False

        try:
            point = Point("alerts") \
                .tag("alert_id", alert.alert_id) \
                .tag("device_id", alert.device_id) \
                .field("severity", alert.severity) \
                .field("score", alert.score) \
                .field("reason", alert.reason or "") \
                .field("acknowledged", alert.acknowledged) \
                .field("metadata", json.dumps(alert.metadata or {})) \
                .time(alert.ts, WritePrecision.NS)

            self.write_api.write(bucket=self.bucket, org=self.org, record=point)
            return True
        except Exception as e:
            print(f"Error saving alert: {e}")
            return False

    def get_recent_alerts(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent alerts"""
        if not self.is_connected():
            return []

        flux_query = f'''
        from(bucket: "{self.bucket}")
        |> range(start: -7d)
        |> filter(fn: (r) => r._measurement == "alerts")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: {limit})
        '''

        try:
            result = self.query_api.query(flux_query)
            alerts = []

            for table in result:
                for record in table.records:
                    alerts.append({
                        "alert_id": record["alert_id"],
                        "device_id": record["device_id"],
                        "ts": record["_time"],
                        "severity": record["_value"] if record["_field"] == "severity" else None,
                        "score": record["_value"] if record["_field"] == "score" else None,
                        "reason": record["_value"] if record["_field"] == "reason" else None,
                        "acknowledged": record["_value"] if record["_field"] == "acknowledged" else None,
                    })

            return alerts
        except Exception as e:
            print(f"Error getting alerts: {e}")
            return []

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get active (unacknowledged) alerts"""
        if not self.is_connected():
            return []

        flux_query = f'''
        from(bucket: "{self.bucket}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "alerts")
        |> filter(fn: (r) => r._field == "acknowledged" and r._value == false)
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 100)
        '''

        try:
            result = self.query_api.query(flux_query)
            alerts = []

            for table in result:
                for record in table.records:
                    alert = {
                        "alert_id": record["alert_id"],
                        "device_id": record["device_id"],
                        "ts": record["_time"],
                        "acknowledged": False,
                    }
                    # Get other fields for this alert
                    for field_record in table.records:
                        if (field_record["alert_id"] == record["alert_id"] and
                            field_record["_time"] == record["_time"]):
                            field = field_record["_field"]
                            value = field_record["_value"]
                            if field != "acknowledged":
                                alert[field] = value
                    alerts.append(alert)

            return alerts
        except Exception as e:
            print(f"Error getting active alerts: {e}")
            return []

    # Suricata Log Management
    def save_suricata_log(self, log_data: SuricataLogData) -> bool:
        """Save Suricata log data"""
        if not self.is_connected():
            return False

        try:
            point = Point("suricata_logs") \
                .field("event_type", log_data.event_type or "") \
                .field("src_ip", log_data.src_ip or "") \
                .field("src_port", log_data.src_port or "") \
                .field("dest_ip", log_data.dest_ip or "") \
                .field("dest_port", log_data.dest_port or "") \
                .field("proto", log_data.proto or "") \
                .field("signature", log_data.signature or "") \
                .field("signature_id", log_data.signature_id or "") \
                .field("severity", log_data.severity or "") \
                .field("raw", json.dumps(log_data.raw or {})) \
                .time(log_data.event_ts or datetime.utcnow(), WritePrecision.NS)

            self.write_api.write(bucket=self.bucket, org=self.org, record=point)
            return True
        except Exception as e:
            print(f"Error saving Suricata log: {e}")
            return False

    def get_recent_suricata_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent Suricata logs"""
        if not self.is_connected():
            return []

        flux_query = f'''
        from(bucket: "{self.bucket}")
        |> range(start: -24h)
        |> filter(fn: (r) => r._measurement == "suricata_logs")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: {limit})
        '''

        try:
            result = self.query_api.query(flux_query)
            logs = []

            for table in result:
                for record in table.records:
                    logs.append({
                        "event_ts": record["_time"],
                        "event_type": record["_value"] if record["_field"] == "event_type" else None,
                        "src_ip": record["_value"] if record["_field"] == "src_ip" else None,
                        "src_port": record["_value"] if record["_field"] == "src_port" else None,
                        "dest_ip": record["_value"] if record["_field"] == "dest_ip" else None,
                        "dest_port": record["_value"] if record["_field"] == "dest_port" else None,
                        "proto": record["_value"] if record["_field"] == "proto" else None,
                        "signature": record["_value"] if record["_field"] == "signature" else None,
                        "signature_id": record["_value"] if record["_field"] == "signature_id" else None,
                        "severity": record["_value"] if record["_field"] == "severity" else None,
                    })

            return logs
        except Exception as e:
            print(f"Error getting Suricata logs: {e}")
            return []

    # Dashboard Analytics
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get dashboard summary statistics"""
        if not self.is_connected():
            return {}

        try:
            # Device count
            device_query = f'''
            from(bucket: "{self.bucket}")
            |> range(start: -24h)
            |> filter(fn: (r) => r._measurement == "devices")
            |> group()
            |> count()
            '''
            device_result = self.query_api.query(device_query)
            device_count = 0
            if device_result and len(device_result) > 0:
                device_count = device_result[0].records[0]["_value"] if device_result[0].records else 0

            # Alert count (last 24h)
            alert_query = f'''
            from(bucket: "{self.bucket}")
            |> range(start: -24h)
            |> filter(fn: (r) => r._measurement == "alerts")
            |> count()
            '''
            alert_result = self.query_api.query(alert_query)
            alert_count_24h = 0
            if alert_result and len(alert_result) > 0:
                alert_count_24h = alert_result[0].records[0]["_value"] if alert_result[0].records else 0

            # Active alerts (unacknowledged)
            active_alert_query = f'''
            from(bucket: "{self.bucket}")
            |> range(start: -30d)
            |> filter(fn: (r) => r._measurement == "alerts")
            |> filter(fn: (r) => r._field == "acknowledged" and r._value == false)
            |> count()
            '''
            active_alert_result = self.query_api.query(active_alert_query)
            alerts_active = 0
            if active_alert_result and len(active_alert_result) > 0:
                alerts_active = active_alert_result[0].records[0]["_value"] if active_alert_result[0].records else 0

            # Anomalies in last 24h (ML-detected alerts)
            anomaly_query = f'''
            from(bucket: "{self.bucket}")
            |> range(start: -24h)
            |> filter(fn: (r) => r._measurement == "alerts")
            |> filter(fn: (r) => r._field == "reason" and contains(value: r._value, set: ["ML", "anomalie"]))
            |> count()
            '''
            anomaly_result = self.query_api.query(anomaly_query)
            anomalies_24h = 0
            if anomaly_result and len(anomaly_result) > 0:
                anomalies_24h = anomaly_result[0].records[0]["_value"] if anomaly_result[0].records else 0

            # Telemetry count (last 24h)
            telemetry_query = f'''
            from(bucket: "{self.bucket}")
            |> range(start: -24h)
            |> filter(fn: (r) => r._measurement == "telemetry")
            |> count()
            '''
            telemetry_result = self.query_api.query(telemetry_query)
            telemetry_count_24h = 0
            if telemetry_result and len(telemetry_result) > 0:
                telemetry_count_24h = telemetry_result[0].records[0]["_value"] if telemetry_result[0].records else 0

            # Data volume today (GB)
            from datetime import datetime, timedelta
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            data_volume_query = f'''
            from(bucket: "{self.bucket}")
            |> range(start: {today_start.isoformat()}Z)
            |> filter(fn: (r) => r._measurement == "telemetry")
            |> filter(fn: (r) => r._field == "tx_bytes" or r._field == "rx_bytes")
            |> sum()
            '''
            data_volume_result = self.query_api.query(data_volume_query)
            data_volume_today_bytes = 0
            if data_volume_result and len(data_volume_result) > 0:
                for table in data_volume_result:
                    for record in table.records:
                        data_volume_today_bytes += record.get_value() or 0
            data_volume_today_gb = round(data_volume_today_bytes / (1024 ** 3), 2)

            return {
                "total_devices": device_count,
                "alerts_24h": alert_count_24h,
                "alerts_active": alerts_active,
                "anomalies_24h": anomalies_24h,
                "telemetry_24h": telemetry_count_24h,
                "data_volume_today_gb": data_volume_today_gb,
                "system_status": "operational" if self.is_connected() else "error"
            }
        except Exception as e:
            print(f"Error getting dashboard summary: {e}")
            return {}

    def seed_initial_data(self):
        """Seed initial data for development"""
        try:
            # Create default admin user
            if not self.get_user("admin"):
                self.create_user("admin", "admin123", "admin@siac.local", "admin")
                print("Created default admin user")

            # Create some sample devices
            sample_devices = [
                {
                    "device_id": "esp32_001",
                    "name": "Living Room Sensor",
                    "type": "temperature_humidity",
                    "location": "living_room",
                    "fw_version": "1.0.0"
                },
                {
                    "device_id": "esp32_002",
                    "name": "Kitchen Motion Sensor",
                    "type": "motion_distance",
                    "location": "kitchen",
                    "fw_version": "1.0.0"
                },
                {
                    "device_id": "esp32_003",
                    "name": "Bedroom Environmental Sensor",
                    "type": "multi_sensor",
                    "location": "bedroom",
                    "fw_version": "1.0.0"
                }
            ]

            for device_info in sample_devices:
                if not self.get_device(device_info["device_id"]):
                    device_data = DeviceData(**device_info)
                    self.create_device(device_data)
                    print(f"Created sample device: {device_info['device_id']}")

        except Exception as e:
            print(f"Error seeding initial data: {e}")

# Global instance
influx_data_service = InfluxDBDataService()