-- SIAC-IoT Database Initialization
-- This script creates the necessary tables for the SIAC-IoT application

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    type VARCHAR(50),
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create telemetry table
CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    tx_bytes BIGINT,
    rx_bytes BIGINT,
    connections INTEGER,
    distance DECIMAL(8,2),
    motion BOOLEAN,
    rfid_uid VARCHAR(255),
    servo_state VARCHAR(50),
    led_states JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_score DECIMAL(10,6),
    model_status VARCHAR(20) DEFAULT 'pending'
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
    id SERIAL PRIMARY KEY,
    event_ts TIMESTAMP WITH TIME ZONE NOT NULL,
    src_ip INET,
    src_port INTEGER,
    dest_ip INET,
    dest_port INTEGER,
    proto VARCHAR(10),
    signature TEXT,
    category VARCHAR(100),
    severity INTEGER,
    raw JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);

CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

CREATE INDEX IF NOT EXISTS idx_telemetry_device_id ON telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp);
CREATE INDEX IF NOT EXISTS idx_telemetry_is_anomaly ON telemetry(is_anomaly);

CREATE INDEX IF NOT EXISTS idx_suricata_alerts_event_ts ON suricata_alerts(event_ts);
CREATE INDEX IF NOT EXISTS idx_suricata_alerts_src_ip ON suricata_alerts(src_ip);
CREATE INDEX IF NOT EXISTS idx_suricata_alerts_dest_ip ON suricata_alerts(dest_ip);
CREATE INDEX IF NOT EXISTS idx_suricata_alerts_category ON suricata_alerts(category);
CREATE INDEX IF NOT EXISTS idx_suricata_alerts_severity ON suricata_alerts(severity);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, hashed_password, role)
VALUES ('admin', 'admin@siac.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fWdWlWjHi', 'admin')
ON CONFLICT (username) DO NOTHING;