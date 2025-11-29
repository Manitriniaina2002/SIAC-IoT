import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Parameters for dataset generation - updated for actual hardware
num_devices = 5  # ESP32, Ultrasonic, DHT22, Red LED, Green LED
num_records = 1000
start_time = datetime(2025, 1, 1)

# Device configurations matching actual hardware
devices = [
    {"id": "esp32-001", "name": "ESP32 Main Controller", "type": "esp32"},
    {"id": "ultrasonic-001", "name": "Ultrasonic Distance Sensor", "type": "sensor"},
    {"id": "dht22-001", "name": "DHT22 Temperature/Humidity Sensor", "type": "sensor"},
    {"id": "led-red-001", "name": "Red LED Indicator", "type": "actuator"},
    {"id": "led-green-001", "name": "Green LED Indicator", "type": "actuator"}
]

# Generate synthetic data matching actual hardware
data = []
for _ in range(num_records):
    device = np.random.choice(devices)
    device_id = device["id"]
    timestamp = start_time + timedelta(seconds=np.random.randint(0, 86400))

    # Base sensor data
    temperature = round(np.random.uniform(18, 32), 2) if device["type"] in ["esp32", "sensor"] else None
    humidity = round(np.random.uniform(40, 80), 2) if device["type"] in ["esp32", "sensor"] else None
    distance = round(np.random.uniform(10, 200), 2) if device["type"] in ["esp32", "sensor"] else None  # Ultrasonic sensor
    motion = np.random.choice([True, False], p=[0.3, 0.7]) if device["type"] in ["esp32", "sensor"] else None

    # Actuator states
    servo_state = np.random.choice(["open", "closed", "moving"]) if device["type"] == "esp32" else None
    led_states = {
        "red_led": np.random.choice([True, False]),
        "green_led": np.random.choice([True, False])
    } if device["type"] in ["esp32", "actuator"] else None

    # Network data
    tx_bytes = np.random.randint(1000, 10000) if device["type"] == "esp32" else 0
    rx_bytes = np.random.randint(1000, 10000) if device["type"] == "esp32" else 0
    connections = np.random.randint(1, 5) if device["type"] == "esp32" else 0

    # Status and alerts
    status = np.random.choice(["online", "offline"], p=[0.9, 0.1])
    alert_type = np.random.choice(["none", "temperature_anomaly", "distance_alert", "motion_detected"], p=[0.7, 0.15, 0.1, 0.05])
    severity = "low" if alert_type == "motion_detected" else ("medium" if alert_type in ["temperature_anomaly", "distance_alert"] else "none")
    label = "normal" if alert_type == "none" else "anomaly"

    data.append({
        "device_id": device_id,
        "device_name": device["name"],
        "device_type": device["type"],
        "timestamp": timestamp,
        "temperature": temperature,
        "humidity": humidity,
        "distance": distance,
        "motion": motion,
        "servo_state": servo_state,
        "led_states": led_states,
        "tx_bytes": tx_bytes,
        "rx_bytes": rx_bytes,
        "connections": connections,
        "status": status,
        "alert_type": alert_type,
        "severity": severity,
        "label": label
    })

# Create a DataFrame
df = pd.DataFrame(data)

# Save to CSV
df.to_csv("dataset.csv", index=False)

print("Dataset generated and saved as dataset.csv")
print(f"Generated {len(data)} records for {len(devices)} devices")
print("Devices included:")
for device in devices:
    print(f"  - {device['id']}: {device['name']} ({device['type']})")