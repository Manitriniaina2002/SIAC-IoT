"""
Service ML pour la détection d'anomalies avec IsolationForest.
"""
from sklearn.ensemble import IsolationForest
import numpy as np
import pickle
import os
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from .feature_engineering import TelemetryFeatureEngineer, generate_normal_training_data


class AnomalyDetectionService:
    """
    Service de détection d'anomalies utilisant IsolationForest.
    """
    
    def __init__(self, model_path: str = "model_isolation_forest.pkl"):
        self.model_path = model_path
        self.model: Optional[IsolationForest] = None
        self.model_status = "pending"  # pending, training, trained, error
        self.trained_at: Optional[datetime] = None
        self.feature_engineer = TelemetryFeatureEngineer()
        
        # Charger le modèle s'il existe
        if os.path.exists(model_path):
            self._load_model()
    
    def _load_model(self) -> bool:
        """Charge le modèle depuis le disque."""
        try:
            with open(self.model_path, 'rb') as f:
                data = pickle.load(f)
                self.model = data['model']
                self.trained_at = data.get('trained_at')
                self.model_status = "trained"
            return True
        except Exception as e:
            self.model_status = "error"
            return False
    
    def _save_model(self):
        """Sauvegarde le modèle sur le disque."""
        try:
            with open(self.model_path, 'wb') as f:
                pickle.dump({
                    'model': self.model,
                    'trained_at': self.trained_at
                }, f)
        except Exception:
            pass
    
    def train_on_simulated_data(self, n_samples: int = 1000, contamination: float = 0.05):
        """
        Entraîne le modèle sur des données normales simulées.
        
        Args:
            n_samples: Nombre d'échantillons simulés
            contamination: Proportion d'anomalies attendue (pour calibrage)
        """
        try:
            self.model_status = "training"
            
            # Générer des données normales
            X_train = generate_normal_training_data(n_samples)
            
            # Entraîner IsolationForest
            self.model = IsolationForest(
                contamination=contamination,
                random_state=42,
                n_estimators=100,
                max_samples='auto',
                n_jobs=-1
            )
            self.model.fit(X_train)
            
            self.trained_at = datetime.utcnow()
            self.model_status = "trained"
            
            # Sauvegarder le modèle
            self._save_model()
            
            return True
        except Exception as e:
            self.model_status = "error"
            return False
    
    def predict_anomaly(self, telemetry_dict: Dict[str, Any]) -> Tuple[bool, float, str]:
        """
        Prédit si une télémétrie est anormale.
        
        Args:
            telemetry_dict: Dict avec temperature, humidity, tx_bytes, rx_bytes, connections, ts
            
        Returns:
            Tuple (is_anomaly, anomaly_score, status)
            - is_anomaly: True si anomalie détectée
            - anomaly_score: Score d'anomalie (plus négatif = plus anormal)
            - status: 'trained' ou 'pending'
        """
        if self.model is None or self.model_status != "trained":
            return False, 0.0, "pending"
        
        try:
            # Extraire les features
            X = self.feature_engineer.extract_features_from_dict(telemetry_dict)
            
            # Prédire (-1 = anomalie, 1 = normal)
            prediction = self.model.predict(X)[0]
            
            # Score d'anomalie (plus négatif = plus anormal)
            anomaly_score = self.model.decision_function(X)[0]
            
            is_anomaly = (prediction == -1)
            
            return is_anomaly, float(anomaly_score), "trained"
        except Exception as e:
            return False, 0.0, "error"
    
    def predict_from_records(self, telemetry_records: list) -> np.ndarray:
        """
        Prédit des anomalies pour une liste de records de télémétrie.
        
        Args:
            telemetry_records: Liste d'objets TelemetryORM
            
        Returns:
            Array numpy de prédictions (-1 = anomalie, 1 = normal)
        """
        if self.model is None or not telemetry_records:
            return np.array([])
        
        try:
            X = self.feature_engineer.extract_features(telemetry_records)
            return self.model.predict(X)
        except Exception:
            return np.array([])
    
    def get_status(self) -> Dict[str, Any]:
        """
        Retourne le statut du modèle.
        
        Returns:
            Dict avec status, trained_at, et autres infos
        """
        return {
            "status": self.model_status,
            "trained_at": self.trained_at.isoformat() if self.trained_at else None,
            "model_loaded": self.model is not None,
            "model_path": self.model_path
        }


# Instance globale du service
anomaly_service = AnomalyDetectionService()
