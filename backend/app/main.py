from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from .models import (
    AuthRequest,
    AuthResponse,
    Device,
    Telemetry,
)
from typing import List
import uuid

app = FastAPI(title="SIAC-IoT Backend")

@app.get("/", include_in_schema=False)
def root():
    return {"status": "ok"}


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "components": {"mqtt": "ok", "influx": "ok"}}


@app.post("/api/v1/auth/login", response_model=AuthResponse)
def login(req: AuthRequest):
    # Dummy auth for scaffold
    if req.username == "admin" and req.password == "admin":
        return AuthResponse(access_token=str(uuid.uuid4()), refresh_token=str(uuid.uuid4()))
    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.get("/api/v1/devices", response_model=List[Device])
def list_devices():
    # Empty list for scaffold
    return []


@app.post("/api/v1/telemetry", status_code=202)
def ingest_telemetry(t: Telemetry):
    # Here you'd validate, enrich and store telemetry (TSDB/objectstore)
    # For scaffold we just acknowledge
    return JSONResponse(status_code=202, content={"received": True, "device_id": t.device_id})


@app.post("/api/v1/predict")
def predict(t: Telemetry):
    # Dummy prediction: random threshold logic can be replaced by real model
    return {"score": 0.1, "is_anomaly": False, "threshold": 0.7}
