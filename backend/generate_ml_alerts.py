"""
Generate test ML anomaly alerts in InfluxDB
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.influxdb_data_service import influx_data_service, AlertData
from datetime import datetime, timedelta
import random
import uuid

def generate_ml_alerts(count=20):
    """Generate test ML anomaly detection alerts with diverse characteristics"""
    
    devices = ["esp32-001", "dht22-001", "ultrasonic-001", "servo-001"]
    
    # More diverse and specific alert scenarios
    alert_scenarios = [
        {
            "reason": "Anomalie ML: Température critique supérieure à 85°C détectée",
            "severity": "high",
            "score_range": (0.85, 1.0),
            "category": "temperature"
        },
        {
            "reason": "Anomalie ML: Température en hausse progressive (tendance anormale)",
            "severity": "medium",
            "score_range": (0.6, 0.8),
            "category": "temperature"
        },
        {
            "reason": "Anomalie ML: Pic de trafic réseau inhabituel - possible exfiltration",
            "severity": "high",
            "score_range": (0.8, 0.95),
            "category": "network"
        },
        {
            "reason": "Anomalie ML: Connexions multiples simultanées anormales",
            "severity": "medium",
            "score_range": (0.5, 0.75),
            "category": "network"
        },
        {
            "reason": "Anomalie ML: Humidité excessive détectée (>90%)",
            "severity": "medium",
            "score_range": (0.55, 0.8),
            "category": "humidity"
        },
        {
            "reason": "Anomalie ML: Corrélation température-humidité inhabituelle",
            "severity": "medium",
            "score_range": (0.6, 0.85),
            "category": "comportement"
        },
        {
            "reason": "Anomalie ML: Comportement global du capteur diverge du modèle",
            "severity": "high",
            "score_range": (0.75, 0.95),
            "category": "ml"
        },
        {
            "reason": "Anomalie ML: Pattern de données erratique détecté",
            "severity": "medium",
            "score_range": (0.5, 0.7),
            "category": "ml"
        },
        {
            "reason": "Anomalie ML: Trafic réseau tx_bytes anormalement élevé",
            "severity": "high",
            "score_range": (0.8, 0.98),
            "category": "network"
        },
        {
            "reason": "Anomalie ML: Variation de température trop rapide",
            "severity": "low",
            "score_range": (0.3, 0.5),
            "category": "temperature"
        }
    ]
    
    print(f"Generating {count} diverse ML alerts...")
    
    for i in range(count):
        # Select random scenario
        scenario = random.choice(alert_scenarios)
        
        # Generate timestamp (from now to 7 days ago)
        hours_ago = random.randint(0, 168)  # 7 days = 168 hours
        ts = datetime.utcnow() - timedelta(hours=hours_ago)
        
        # Use scenario-based severity and score
        severity = scenario["severity"]
        score = random.uniform(*scenario["score_range"])
        
        # Add some metadata based on category
        metadata = {
            "source": "ml_isolation_forest",
            "model_version": "1.0",
            "category": scenario["category"],
            "detection_confidence": round(score, 3)
        }
        
        # Add scenario-specific metadata
        if scenario["category"] == "temperature":
            metadata["temp_celsius"] = random.uniform(75, 95) if severity == "high" else random.uniform(60, 80)
        elif scenario["category"] == "network":
            metadata["tx_bytes"] = random.randint(50000, 200000) if severity == "high" else random.randint(20000, 60000)
            metadata["connections"] = random.randint(10, 50)
        elif scenario["category"] == "humidity":
            metadata["humidity_percent"] = random.uniform(85, 98)
        
        alert = AlertData(
            alert_id=f"ml_{uuid.uuid4().hex[:8]}",
            device_id=random.choice(devices),
            ts=ts,
            severity=severity,
            score=score,
            reason=scenario["reason"],
            acknowledged=random.random() > 0.7,  # 30% acknowledged
            metadata=metadata
        )
        
        success = influx_data_service.save_alert(alert)
        if success:
            print(f"✓ Alert {i+1}/{count}: {alert.device_id} - {severity} ({scenario['category']}) - {score:.2f}")
        else:
            print(f"✗ Failed to save alert {i+1}")
    
    print(f"\n✅ Generated {count} diverse ML alerts successfully!")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Generate test ML alerts')
    parser.add_argument('-c', '--count', type=int, default=20, help='Number of alerts to generate')
    args = parser.parse_args()
    
    generate_ml_alerts(args.count)
