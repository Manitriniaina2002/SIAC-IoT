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
    
    def generate_recommendations(self, alert: Dict[str, Any], telemetry_history: list = None) -> Dict[str, Any]:
        """
        Génère des recommandations intelligentes basées sur l'analyse ML de l'anomalie.
        
        Args:
            alert: Dictionnaire contenant les données de l'alerte (device_id, severity, score, reason, etc.)
            telemetry_history: Historique de télémétrie pour analyse de tendance (optionnel)
            
        Returns:
            Dict avec recommendations, priority, root_cause_analysis
        """
        if self.model is None or self.model_status != "trained":
            return {
                "status": "ml_not_ready",
                "recommendations": ["Modèle ML non entraîné - recommandations génériques disponibles"],
                "priority": "low",
                "confidence": 0.0
            }
        
        try:
            severity = alert.get("severity", "low")
            score = abs(alert.get("anomaly_score", 0.0))  # Plus le score est élevé, plus l'anomalie est forte
            reason = alert.get("reason", "").lower()
            device_id = alert.get("device_id", "unknown")
            
            # Analyse de la sévérité basée sur le score d'anomalie
            if score > 0.75:
                priority = "critical"
                urgency = "immédiate"
            elif score > 0.5:
                priority = "high"
                urgency = "dans les 2 heures"
            elif score > 0.3:
                priority = "medium"
                urgency = "dans les 24 heures"
            else:
                priority = "low"
                urgency = "surveillance continue"
            
            recommendations = []
            root_causes = []
            
            # Analyse contextuelle avancée basée sur le type d'anomalie détecté par ML
            
            # Anomalies de température critique
            if "température critique" in reason or "85°c" in reason or ">85" in reason:
                root_causes.extend([
                    "Température critique dépassant les seuils de sécurité (>85°C)",
                    "Risque immédiat de défaillance matérielle ou incendie",
                    "Analyse ML: Déviation thermique extrême du comportement normal"
                ])
                recommendations.extend([
                    "🚨 URGENCE CRITIQUE: Couper l'alimentation du device immédiatement",
                    "🔥 Évacuer la zone si fumée ou odeur de brûlé détectée",
                    "❄️ Activer le refroidissement d'urgence si disponible",
                    "📞 Contacter immédiatement l'équipe de sécurité technique",
                    "🌡️ Ne pas redémarrer avant inspection complète par un technicien qualifié",
                    "📊 Analyser les logs des 2 dernières heures pour identifier la cause de surchauffe"
                ])
            
            # Anomalies de température progressive
            elif "température" in reason and ("hausse" in reason or "progressive" in reason or "tendance" in reason):
                root_causes.extend([
                    "Tendance de hausse progressive de température détectée par ML",
                    "Possible obstruction du système de ventilation",
                    "Défaillance potentielle du système de refroidissement"
                ])
                recommendations.extend([
                    "🌡️ Surveiller l'évolution de la température toutes les 15 minutes",
                    "🔍 Inspecter les ventilateurs et dissipateurs thermiques",
                    "🧹 Nettoyer les entrées/sorties d'air du boîtier",
                    "📈 Analyser la courbe de température sur les 48 dernières heures",
                    "❄️ Améliorer la ventilation de la salle/armoire",
                    "⚙️ Vérifier la charge processeur et réduire si possible"
                ])
            
            # Anomalies de température variable rapide
            elif "température" in reason and ("rapide" in reason or "variation" in reason):
                root_causes.extend([
                    "Fluctuations thermiques anormalement rapides",
                    "Capteur défectueux ou mal calibré possible",
                    "Environnement instable (climatisation défaillante)"
                ])
                recommendations.extend([
                    "🔧 Vérifier la calibration du capteur de température",
                    "🌡️ Comparer avec un thermomètre de référence",
                    "❄️ Contrôler le fonctionnement de la climatisation",
                    "📊 Filtrer les données pour éliminer le bruit du capteur",
                    "🔄 Remplacer le capteur si oscillations persistent"
                ])
            
            # Anomalies réseau - Pic de trafic
            elif "trafic" in reason and ("pic" in reason or "exfiltration" in reason):
                root_causes.extend([
                    "Pic de trafic réseau inhabituel détecté par analyse ML",
                    "Possible exfiltration de données ou attaque DDoS",
                    "Comportement réseau divergeant fortement du modèle normal"
                ])
                recommendations.extend([
                    "🛡️ SÉCURITÉ: Isoler immédiatement le device du réseau",
                    "🔒 Vérifier l'intégrité du firmware (possible compromission)",
                    "📡 Capturer et analyser les paquets réseau avec Wireshark",
                    "🔍 Examiner les destinations IP dans les logs MQTT/réseau",
                    "🔐 Réinitialiser les certificats TLS et clés MQTT",
                    "🚨 Vérifier les règles IDS/Suricata pour ce device",
                    "📞 Escalader au CERT/équipe cybersécurité si données sensibles"
                ])
            
            # Anomalies réseau - Connexions multiples
            elif "connexion" in reason and ("multiples" in reason or "simultanées" in reason):
                root_causes.extend([
                    "Nombre anormal de connexions simultanées",
                    "Possible scan de port ou attaque par force brute",
                    "Configuration MQTT incorrecte (reconnexions multiples)"
                ])
                recommendations.extend([
                    "🔒 Vérifier les logs d'authentification MQTT Broker",
                    "🚫 Bloquer les IP suspectes dans le firewall",
                    "⚙️ Vérifier la configuration keepalive et reconnexion MQTT",
                    "🔐 Activer l'authentification TLS client si non configurée",
                    "📊 Analyser la fréquence et durée des connexions",
                    "🛡️ Mettre à jour les règles Suricata pour détecter ce pattern"
                ])
            
            # Anomalies réseau - tx_bytes élevé
            elif "tx_bytes" in reason or ("trafic" in reason and "élevé" in reason):
                root_causes.extend([
                    "Volume de données transmises anormalement élevé",
                    "Boucle de transmission ou erreur de programmation possible",
                    "Capteur envoyant des données trop fréquemment"
                ])
                recommendations.extend([
                    "📡 Réduire la fréquence de publication MQTT si trop élevée",
                    "🔍 Vérifier le code embarqué pour boucles infinies",
                    "📊 Analyser le payload des messages MQTT (taille excessive?)",
                    "⚙️ Implémenter un throttling côté device",
                    "💾 Vérifier la compression des données si applicable",
                    "🔄 Redémarrer le device après correction du code"
                ])
            
            # Anomalies d'humidité excessive
            elif "humidité" in reason and ("excessive" in reason or ">90" in reason or "90%" in reason):
                root_causes.extend([
                    "Taux d'humidité critique détecté (>90%)",
                    "Risque de condensation et court-circuit",
                    "Possible fuite d'eau à proximité du capteur"
                ])
                recommendations.extend([
                    "💧 URGENT: Inspecter visuellement pour fuites ou infiltrations d'eau",
                    "🌊 Vérifier canalisations, toiture, climatisation",
                    "⚡ Couper l'alimentation si présence d'eau confirmée",
                    "🔧 Installer un déshumidificateur dans la zone",
                    "📊 Comparer avec d'autres capteurs de la même salle",
                    "🔄 Déplacer le device si environnement inadapté"
                ])
            
            # Anomalies de corrélation température-humidité
            elif "corrélation" in reason and "température" in reason and "humidité" in reason:
                root_causes.extend([
                    "Pattern inhabituel de corrélation température/humidité",
                    "Climatisation défaillante ou mal régulée",
                    "Capteur DHT22/DHT11 défectueux possible"
                ])
                recommendations.extend([
                    "🌡️💧 Tracer graphiquement température vs humidité",
                    "❄️ Vérifier le cycle de la climatisation (chaud/froid)",
                    "🔧 Tester avec un autre capteur DHT22 de référence",
                    "📊 Analyser les patterns sur 7 jours pour validation",
                    "⚙️ Recalibrer ou remplacer le capteur si anomalie confirmée"
                ])
            
            # Anomalies ML génériques - Comportement global divergent
            elif "comportement" in reason and "diverge" in reason:
                root_causes.extend([
                    "Le modèle ML a détecté une déviation multidimensionnelle",
                    "Combinaison anormale de plusieurs métriques simultanément",
                    "Possible défaillance matérielle ou firmware corrompu"
                ])
                recommendations.extend([
                    "🤖 Analyser toutes les métriques: temp, humidity, tx, rx, connexions",
                    "📊 Comparer avec le profil normal du device sur 30 jours",
                    "⚙️ Vérifier la version du firmware (hash MD5)",
                    "🔍 Inspecter les logs embarqués si accessibles",
                    "🔄 Effectuer un redémarrage à froid (cold reboot)",
                    "🛠️ Reflasher le firmware si comportement persiste",
                    "📞 Envisager remplacement hardware si aucune amélioration"
                ])
            
            # Anomalies ML - Pattern erratique
            elif "erratique" in reason or "pattern" in reason:
                root_causes.extend([
                    "Comportement de données imprévisible et non structuré",
                    "Interférences électromagnétiques possibles",
                    "Alimentation instable (variations de voltage)"
                ])
                recommendations.extend([
                    "⚡ Vérifier la stabilité de l'alimentation électrique",
                    "📡 Éloigner des sources d'interférences (WiFi, moteurs)",
                    "🔧 Installer un filtre/condensateur sur l'alimentation",
                    "📊 Appliquer un filtre médian sur les données",
                    "🔄 Tester avec une alimentation stabilisée de laboratoire"
                ])
            
            # Fallback pour anomalies génériques
            else:
                root_causes.append("Anomalie détectée par analyse ML - Classification en cours")
                recommendations.extend([
                    f"🔍 Analyser les données de télémétrie récentes du device {device_id}",
                    "📋 Consulter tous les logs système disponibles",
                    "🔧 Effectuer une inspection physique du dispositif",
                    "📊 Comparer les métriques avec les valeurs de référence",
                    "📞 Contacter le support technique pour diagnostic approfondi"
                ])
            
            # Recommandations additionnelles basées sur la sévérité
            if priority == "critical":
                recommendations.insert(0, "🚨 ALERTE CRITIQUE: Intervention immédiate requise - Risque de panne ou sécurité")
                recommendations.append("📞 Alerter le responsable technique et l'équipe d'intervention d'urgence")
            elif priority == "high":
                recommendations.append("⏰ Planifier une intervention dans les 2 prochaines heures")
                recommendations.append("📋 Créer un ticket de maintenance prioritaire")
            elif priority == "medium":
                recommendations.append("📅 Programmer une maintenance préventive sous 24h")
            
            # Ajouter analyse de tendance si historique disponible
            if telemetry_history and len(telemetry_history) > 5:
                recommendations.append("📈 Analyser la tendance d'évolution sur les dernières mesures disponibles")
            
            return {
                "status": "ml_generated",
                "device_id": device_id,
                "priority": priority,
                "urgency": urgency,
                "confidence": min(score, 1.0),  # Score normalisé entre 0 et 1
                "root_cause_analysis": root_causes,
                "recommendations": recommendations,
                "ml_score": float(score),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "recommendations": ["Erreur lors de la génération des recommandations ML"],
                "priority": "unknown",
                "confidence": 0.0
            }


# Instance globale du service
anomaly_service = AnomalyDetectionService()
