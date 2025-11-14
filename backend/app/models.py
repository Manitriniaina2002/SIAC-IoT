from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

# SQLAlchemy ORM (for SQLite persistence)
from sqlalchemy import Column, String, DateTime, JSON, Integer, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class AuthRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    username: str
    role: Optional[str] = "admin"


class Device(BaseModel):
    device_id: str
    name: Optional[str]
    fw_version: Optional[str]
    last_seen: Optional[datetime]
    tags: Optional[List[str]] = []
    type: Optional[str] = None
    location: Optional[str] = None

    # Pydantic v2: allow returning SQLAlchemy objects as response_model
    model_config = ConfigDict(from_attributes=True)


class DeviceCreate(BaseModel):
    device_id: str
    name: Optional[str] = None
    fw_version: Optional[str] = None
    tags: Optional[List[str]] = []
    type: Optional[str] = None
    location: Optional[str] = None


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    fw_version: Optional[str] = None
    tags: Optional[List[str]] = None
    type: Optional[str] = None
    location: Optional[str] = None


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
    model_config = ConfigDict(from_attributes=True)


# SQLAlchemy ORM model for persistence
class DeviceORM(Base):
    __tablename__ = "devices"

    device_id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    fw_version: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    last_seen: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    tags: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)


class User(BaseModel):
    id: Optional[int] = None
    username: str
    email: Optional[str] = None
    role: str = "admin"
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    role: str = "admin"


class UserUpdate(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserORM(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="admin")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class TelemetryORM(Base):
    __tablename__ = "telemetry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String, index=True)
    ts: Mapped[datetime] = mapped_column(DateTime, index=True)
    temperature: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    humidity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tx_bytes: Mapped[int] = mapped_column(Integer, default=0)
    rx_bytes: Mapped[int] = mapped_column(Integer, default=0)
    connections: Mapped[int] = mapped_column(Integer, default=0)


class AlertORM(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    device_id: Mapped[str] = mapped_column(String, index=True)
    ts: Mapped[datetime] = mapped_column(DateTime, index=True)
    severity: Mapped[str] = mapped_column(String)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    meta: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

