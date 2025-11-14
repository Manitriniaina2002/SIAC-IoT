"""
Module de feature engineering pour transformer les données de télémétrie
avant la détection d'anomalies par le modèle ML.
"""
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta


class TelemetryFeatureEngineer:
    """
    Classe pour extraire et transformer les features de télémétrie
    afin d'améliorer la détection d'anomalies.
    """

    @staticmethod
    def extract_features(telemetry_records: List[Any]) -> np.ndarray:
        """
        Extrait les features d'une liste de records de télémétrie.
        
        Args:
            telemetry_records: Liste d'objets TelemetryORM
            
        Returns:
            Matrice numpy de features (n_samples, n_features)
        """
        if not telemetry_records:
            return np.array([]).reshape(0, 7)
        
        features = []
        for record in telemetry_records:
            feature_vector = TelemetryFeatureEngineer._compute_single_feature(record)
            features.append(feature_vector)
        
        return np.array(features)
    
    @staticmethod
    def _compute_single_feature(record: Any) -> List[float]:
        """
        Calcule le vecteur de features pour un seul record.
        
        Features extraites:
        1. temperature (ou 0 si None)
        2. humidity (ou 0 si None)
        3. tx_bytes normalisé (log1p)
        4. rx_bytes normalisé (log1p)
        5. connections
        6. heure du jour (0-23 normalisé à 0-1)
        7. jour de la semaine (0-6 normalisé à 0-1)
        """
        temp = record.temperature if record.temperature is not None else 0.0
        hum = record.humidity if record.humidity is not None else 0.0
        tx = np.log1p(record.tx_bytes) if record.tx_bytes else 0.0
        rx = np.log1p(record.rx_bytes) if record.rx_bytes else 0.0
        conns = float(record.connections) if record.connections else 0.0
        
        # Features temporelles
        hour_normalized = record.ts.hour / 23.0 if record.ts else 0.0
        weekday_normalized = record.ts.weekday() / 6.0 if record.ts else 0.0
        
        return [temp, hum, tx, rx, conns, hour_normalized, weekday_normalized]
    
    @staticmethod
    def extract_features_from_dict(telemetry_dict: Dict[str, Any]) -> np.ndarray:
        """
        Extrait les features d'un dictionnaire de télémétrie (pour prédiction en temps réel).
        
        Args:
            telemetry_dict: Dict contenant temperature, humidity, tx_bytes, rx_bytes, connections, ts
            
        Returns:
            Vecteur numpy de features (1, n_features)
        """
        temp = telemetry_dict.get('temperature', 0.0) or 0.0
        hum = telemetry_dict.get('humidity', 0.0) or 0.0
        tx = np.log1p(telemetry_dict.get('tx_bytes', 0))
        rx = np.log1p(telemetry_dict.get('rx_bytes', 0))
        conns = float(telemetry_dict.get('connections', 0))
        
        ts = telemetry_dict.get('ts', datetime.utcnow())
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts.replace('Z', '+00:00'))
        
        hour_normalized = ts.hour / 23.0
        weekday_normalized = ts.weekday() / 6.0
        
        return np.array([[temp, hum, tx, rx, conns, hour_normalized, weekday_normalized]])
    
    @staticmethod
    def compute_rolling_stats(telemetry_records: List[Any], window: int = 10) -> Dict[str, float]:
        """
        Calcule des statistiques glissantes sur une fenêtre de records.
        
        Args:
            telemetry_records: Liste des derniers records de télémétrie (triés par ts)
            window: Taille de la fenêtre
            
        Returns:
            Dict avec mean, std, min, max pour temperature et humidity
        """
        if len(telemetry_records) < 2:
            return {
                'temp_mean': 0.0, 'temp_std': 0.0,
                'hum_mean': 0.0, 'hum_std': 0.0
            }
        
        temps = [r.temperature for r in telemetry_records[-window:] if r.temperature is not None]
        hums = [r.humidity for r in telemetry_records[-window:] if r.humidity is not None]
        
        return {
            'temp_mean': np.mean(temps) if temps else 0.0,
            'temp_std': np.std(temps) if len(temps) > 1 else 0.0,
            'hum_mean': np.mean(hums) if hums else 0.0,
            'hum_std': np.std(hums) if len(hums) > 1 else 0.0,
        }
    
    @staticmethod
    def detect_rate_change(telemetry_records: List[Any], metric: str = 'temperature') -> float:
        """
        Détecte le taux de changement d'une métrique (dérivée).
        
        Args:
            telemetry_records: Liste des derniers records (au moins 2)
            metric: 'temperature', 'humidity', ou 'connections'
            
        Returns:
            Taux de changement (différence entre les 2 derniers points)
        """
        if len(telemetry_records) < 2:
            return 0.0
        
        last = telemetry_records[-1]
        prev = telemetry_records[-2]
        
        last_val = getattr(last, metric, None)
        prev_val = getattr(prev, metric, None)
        
        if last_val is None or prev_val is None:
            return 0.0
        
        return float(last_val - prev_val)


def generate_normal_training_data(n_samples: int = 1000) -> np.ndarray:
    """
    Génère des données de télémétrie normales simulées pour l'entraînement.
    
    Args:
        n_samples: Nombre d'échantillons à générer
        
    Returns:
        Matrice numpy (n_samples, 7) de données normales
    """
    np.random.seed(42)
    
    # Température: distribution normale autour de 22°C, std 3°C
    temperature = np.random.normal(22, 3, n_samples)
    
    # Humidité: distribution normale autour de 50%, std 10%
    humidity = np.random.normal(50, 10, n_samples)
    
    # tx_bytes: log-normal (la plupart des valeurs basses, quelques pics)
    tx_bytes = np.random.lognormal(8, 1.5, n_samples)
    
    # rx_bytes: log-normal similaire
    rx_bytes = np.random.lognormal(7.5, 1.5, n_samples)
    
    # connections: Poisson (nombre de connexions actives)
    connections = np.random.poisson(5, n_samples)
    
    # Heure du jour: uniforme sur 24h, normalisé
    hour_normalized = np.random.uniform(0, 1, n_samples)
    
    # Jour de semaine: uniforme sur 7 jours, normalisé
    weekday_normalized = np.random.uniform(0, 1, n_samples)
    
    # Assembler la matrice
    X = np.column_stack([
        temperature,
        humidity,
        tx_bytes,
        rx_bytes,
        connections,
        hour_normalized,
        weekday_normalized
    ])
    
    return X
