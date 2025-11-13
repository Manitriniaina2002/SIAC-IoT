from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class AuthRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class Device(BaseModel):
    device_id: str
    name: Optional[str]
    fw_version: Optional[str]
    last_seen: Optional[datetime]
    tags: Optional[List[str]] = []


class TelemetrySensors(BaseModel):
    temperature: Optional[float]
    humidity: Optional[float]


class TelemetryNet(BaseModel):
    tx_bytes: int
    rx_bytes: int
    connections: int


class Telemetry(BaseModel):
    device_id: str
    ts: datetime
    sensors: Optional[TelemetrySensors]
    net: Optional[TelemetryNet]
    meta: Optional[Dict[str, Any]]
    sig: Optional[str]


class Alert(BaseModel):
    alert_id: str
    device_id: str
    ts: datetime
    severity: str
    score: float
    reason: Optional[str]
    acknowledged: bool = False
    metadata: Optional[Dict[str, Any]]
