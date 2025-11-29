-- SIAC-IoT Database Initialization
-- This script creates the necessary tables for the SIAC-IoT application

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(255) UNIQUE NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20) NOT NULL,
    score DECIMAL(10,6) DEFAULT 0.0,
    reason TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    meta JSONB
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
    device_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    fw_version VARCHAR(255),
    last_seen TIMESTAMP WITH TIME ZONE,
    tags JSONB,
    type VARCHAR(100),
    location VARCHAR(255)
);

-- Create telemetry table
CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    distance DECIMAL(8,2),
    motion BOOLEAN,
    rfid_uid VARCHAR(255),
    servo_state VARCHAR(50),
    led_states JSONB,
    tx_bytes BIGINT DEFAULT 0,
    rx_bytes BIGINT DEFAULT 0,
    connections INTEGER DEFAULT 0
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Suricata alerts table
CREATE TABLE IF NOT EXISTS suricata_alerts (
    id BIGSERIAL PRIMARY KEY,
    event_ts TIMESTAMP WITH TIME ZONE,
    event_type VARCHAR(255),
    src_ip VARCHAR(255),
    src_port VARCHAR(10),
    dest_ip VARCHAR(255),
    dest_port VARCHAR(10),
    proto VARCHAR(10),
    signature TEXT,
    signature_id VARCHAR(255),
    severity VARCHAR(20),
    raw JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alerts_alert_id ON alerts(alert_id);
CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_ts ON alerts(ts);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);

CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);

CREATE INDEX IF NOT EXISTS idx_telemetry_device_id ON telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_ts ON telemetry(ts);

CREATE INDEX IF NOT EXISTS idx_suricata_alerts_event_ts ON suricata_alerts(event_ts);
CREATE INDEX IF NOT EXISTS idx_suricata_alerts_src_ip ON suricata_alerts(src_ip);
CREATE INDEX IF NOT EXISTS idx_suricata_alerts_dest_ip ON suricata_alerts(dest_ip);
CREATE INDEX IF NOT EXISTS idx_suricata_alerts_severity ON suricata_alerts(severity);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, hashed_password, role)
VALUES ('admin', 'admin@siac.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fWdWlWjHi', 'admin')
ON CONFLICT (username) DO NOTHING;