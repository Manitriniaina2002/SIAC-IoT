# SIAC-IoT — Plateforme de surveillance IoT

Plateforme moderne de surveillance IoT avec détection d'anomalies par Machine Learning, sécurité réseau avec Suricata, et interface de gestion en temps réel.

**Matériel IoT supporté :**
- **ESP32** : Microcontrôleur principal
- **Capteur Ultrason** : Détection de distance
- **Capteur DHT22** : Température et humidité
- **LED Rouge** : Indicateur d'alerte
- **LED Verte** : Indicateur d'état normal

## 🌐 Application déployée

**🚀 Backend API :** https://siac-iot-backend.onrender.com  
**📚 Documentation API :** https://siac-iot-backend.onrender.com/docs  
**🎨 Frontend :** https://siac-iot-frontend.onrender.com *(si déployé)*

**Connexion :**
- Username : `admin`
- Password : `admin123`

> ⚠️ **Note :** Le service gratuit Render se met en veille après 15 minutes d'inactivité. Le premier chargement peut prendre 30-60 secondes (cold start).

---

## 🚀 Fonctionnalités

### Backend (FastAPI)
- **API REST** complète pour la gestion des dispositifs IoT
- **Détection d'anomalies ML** avec IsolationForest (scikit-learn)
- **Sécurité réseau** avec intégration Suricata (logs et alertes)
- **Ingestion de télémétrie** en temps réel (ESP32 sensors)
- **Système d'alertes** automatique avec recommandations
- **Authentification JWT** avec gestion des rôles (admin/user)
- **Base de données InfluxDB 2.x** pour toutes les données (utilisateurs, appareils, télémétrie, alertes)
- **Export de données** (Excel/PDF) pour rapports
- **MQTT Broker** intégré pour communication IoT
- **Migration PostgreSQL → InfluxDB** terminée

### Frontend (React + Vite)
- **Dashboard 3 catégories** : IoT Monitoring, IDS Alerts, Security Logs
- **Visualisations Recharts** (graphiques, courbes, barres)
- **Gestion des dispositifs** (CRUD complet)
- **Système d'alertes** avec filtres et recherche
- **Interface admin** pour la gestion des utilisateurs
- **Design moderne** avec Tailwind CSS et Lucide Icons
- **Animations** avec fond animé et effets glassmorphism
- **Export de données** en temps réel
- **WebSocket** pour mises à jour temps réel

### Machine Learning
- **Feature Engineering** : extraction de 7 caractéristiques depuis la télémétrie
- **IsolationForest** : détection d'anomalies non supervisée
- **Entraînement automatique** sur données normales simulées
- **Persistance du modèle** avec pickle
- **API de statut** : visualisation de l'état du modèle en temps réel

### Sécurité & Monitoring
- **Suricata IDS** : détection d'intrusions réseau
- **Headers de sécurité** (CSP, HSTS, X-Frame-Options)
- **InfluxDB + Grafana** : métriques et visualisation avancée
- **MQTT Mosquitto** : communication sécurisée IoT
- **Health checks** automatiques pour tous les services
- **WebSocket sécurisé** pour communications temps réel

## 📦 Structure du projet

```
SIAC-IoT/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app principale
│   │   ├── influxdb_data_service.py   # Service InfluxDB (CRUD complet)
│   │   ├── ml_service.py              # Service ML (IsolationForest)
│   │   ├── feature_engineering.py     # Extraction de features
│   │   ├── models.py                  # Modèles Pydantic
│   │   └── database.py                # Configuration DB (legacy)
│   ├── Dockerfile
│   ├── .dockerignore
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/                     # IoT Monitoring, IDS Alerts, Logs, Admin
│   │   ├── components/                # Composants réutilisables
│   │   ├── contexts/                  # AuthContext
│   │   └── lib/                       # API client, utils, WebSocket
│   ├── Dockerfile
│   ├── nginx.conf                     # Configuration Nginx production
│   └── package.json
├── infra/
│   ├── postgres/                      # Legacy - utilisé uniquement pour migration
│   │   └── init.sql                   # Schéma DB historique
│   ├── mosquitto/
│   │   └── config/
│   │       └── mosquitto.conf         # Configuration MQTT broker
│   ├── grafana/
│   │   └── provisioning/
│   │       ├── datasources/           # Configuration InfluxDB datasource
│   │       └── dashboards/            # Configuration dashboards
│   └── suricata/
│       ├── logs/                      # Logs Suricata
│       └── rules/
│           └── siac-iot.rules         # Règles de sécurité personnalisées
├── docker-compose.yml                 # Configuration principale
├── docker-compose.override.yml        # Développement (hot-reload)
├── docker-compose.prod.yml            # Production (optimisé)
├── render.yaml                        # Configuration déploiement Render
├── migrate_postgres_to_influx.py      # Script de migration (utilisé une fois)
└── README.md

```

## 🐳 Architecture Docker

La plateforme SIAC-IoT utilise une architecture microservices avec 7 services principaux :

### Services

- **InfluxDB 2.7** : Base de données de séries temporelles principale pour toutes les données (utilisateurs, appareils, télémétrie, alertes, logs Suricata)
- **Backend (FastAPI)** : API REST avec ML pour la détection d'anomalies
- **Frontend (React)** : Interface utilisateur moderne avec dashboard temps réel
- **Mosquitto (MQTT)** : Broker MQTT pour la communication IoT
- **Grafana** : Plateforme de visualisation et monitoring avancé
- **PostgreSQL** : Base de données historique (conservée pour compatibilité)
- **Suricata** : IDS réseau pour la sécurité

### Migration Complétée

✅ **Migration PostgreSQL → InfluxDB terminée**
- Toutes les données utilisateur migrées
- Tous les appareils IoT migrés
- Structure de données optimisée pour séries temporelles
- API backward-compatible maintenue

### Réseau

Tous les services communiquent via un réseau Docker bridge dédié (`siac-network`) avec résolution DNS automatique.

### Volumes

- `influxdb_data` : Persistance des données InfluxDB (base principale)
- `postgres_data` : Persistance des données PostgreSQL (historique)
- `grafana_data` : Persistance des dashboards Grafana
- `mosquitto_data` : Persistance des données MQTT

### Santé et monitoring

- Health checks automatiques pour tous les services
- Logs centralisés via Docker
- Restart policies configurées pour la production
- WebSocket monitoring pour connexions temps réel

## 🛠️ Installation et démarrage

### Prérequis

- Docker et Docker Compose
- Node.js 18+ (pour développement frontend local)
- Python 3.11+ (pour développement backend local)

### Avec Docker (recommandé)

```bash
# Cloner le projet
git clone https://github.com/Manitriniaina2002/SIAC-IoT.git
cd SIAC-IoT

# Lancer la stack complète
docker-compose up -d --build
```

**URLs d'accès :**

- **Frontend** : `http://localhost:3000` (React dev server)
- **Backend API** : `http://localhost:18000`
- **Documentation API** : `http://localhost:18000/docs`
- **Grafana** : `http://localhost:3100` (admin/password)
- **InfluxDB** : `http://localhost:18086`
- **Mosquitto MQTT** : localhost:1885

### Production

```bash
# Configuration de production optimisée
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Avec variables d'environnement personnalisées
cp .env.example .env
# Éditer .env avec vos valeurs de production
docker-compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Développement

**Avec Docker (recommandé) :**

```bash
# Développement avec hot-reload automatique
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

**Dépannage :**

```bash
# Vérifier l'état des services
docker-compose ps

# Voir les logs d'un service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs influxdb

# Redémarrer un service
docker-compose restart backend

# Nettoyer les volumes (⚠️ supprime les données)
docker-compose down -v
docker-compose up -d --build

# Construire sans cache
docker-compose build --no-cache
```

**Backend local :**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend local :**

```powershell
cd frontend
npm install
npm run dev
```

## 🔐 Authentification

**Compte admin par défaut :**

- Username : `admin`
- Password : `admin123`

**Comptes migrés depuis PostgreSQL :**

- Tous les utilisateurs existants ont été migrés vers InfluxDB
- Mots de passe préservés et sécurisés

## 🤖 Machine Learning

Le modèle IsolationForest est entraîné automatiquement au démarrage du backend sur 1000 échantillons de données normales simulées. Il analyse 7 features extraites de la télémétrie :

- Température
- Humidité
- Log(Tx Bytes)
- Log(Rx Bytes)
- Connexions actives
- Heure du jour
- Jour de la semaine

**API ML :**

- `GET /api/v1/ml/status` : Statut du modèle IsolationForest
- `POST /api/v1/ml/train` : Réentraînement manuel du modèle

## 📊 API Endpoints

**Devices :**

- `GET /api/v1/devices` : Liste des dispositifs
- `POST /api/v1/devices` : Créer un dispositif
- `PUT /api/v1/devices/{id}` : Modifier un dispositif
- `DELETE /api/v1/devices/{id}` : Supprimer un dispositif

**Telemetry :**

- `POST /api/v1/telemetry` : Ingérer des données de télémétrie (ESP32)
- `GET /api/v1/telemetry/recent` : Données récentes par device
- `GET /api/v1/influx/sensor-data` : Données capteurs pour graphiques

**Alerts :**

- `GET /api/v1/alerts/recent` : Liste des alertes récentes
- `GET /api/v1/alerts/active` : Alertes actives
- `GET /api/v1/alerts/recommendations` : Recommandations basées sur les alertes

**Dashboard :**

- `GET /api/v1/dashboard_summary` : Statistiques globales
- `GET /api/v1/metrics/devices_activity_24h` : Activité des appareils (24h)
- `GET /api/v1/metrics/data_volume_7d` : Volume de données (7 jours)

**Auth :**

- `POST /api/v1/auth/login` : Connexion
- `GET /api/v1/users/me` : Profil utilisateur
- `GET /api/v1/users` : Liste des utilisateurs (admin)
- `POST /api/v1/users` : Créer un utilisateur (admin)

**Suricata IDS :**

- `POST /api/v1/suricata/logs` : Ingestion des logs Suricata
- `GET /api/v1/suricata/logs/recent` : Récupération des logs récents
- `GET /api/v1/suricata/logs/stats` : Statistiques des alertes par catégorie
- `GET /api/v1/suricata/logs/alerts` : Alertes de sécurité actives

**Export de données :**

- `GET /api/v1/telemetry/export?format=excel` : Export télémétrie Excel
- `GET /api/v1/telemetry/export?format=pdf` : Export télémétrie PDF
- `GET /api/v1/alerts/export?format=excel` : Export alertes Excel
- `GET /api/v1/alerts/export?format=pdf` : Export alertes PDF

**Santé système :**

- `GET /api/v1/health` : État de santé du système
- `WebSocket /ws` : Connexions temps réel

## 🎨 Technologies utilisées

**Backend :**

- FastAPI 0.115.5
- InfluxDB 2.7 (base de données principale)
- SQLAlchemy 2.0.35 (legacy PostgreSQL)
- scikit-learn 1.7.2 (IsolationForest)
- Pydantic 2.8.2
- python-jose (JWT)
- passlib (hashing)
- pandas/reportlab (exports Excel/PDF)
- WebSocket support (fastapi)

**Frontend :**

- React 18 + Vite
- Tailwind CSS + PostCSS
- Recharts (visualisations)
- Lucide React Icons
- React Router DOM v6
- React Hot Toast
- WebSocket client
- Nginx (production)

**Infrastructure :**

- Docker & Docker Compose
- InfluxDB 2.7 (base de données séries temporelles)
- PostgreSQL 15 (base historique - migration terminée)
- Mosquitto (MQTT broker)
- Grafana 10.2.0 (visualisation monitoring)
- Suricata IDS (sécurité réseau)
- Nginx (reverse proxy & sécurité)

**Sécurité :**

- Suricata IDS (détection intrusions)
- Headers de sécurité (CSP, HSTS, etc.)
- Authentification JWT
- Gestion des rôles (admin/user)
- Health checks automatiques
- WebSocket sécurisé

## 📝 Migration PostgreSQL → InfluxDB

**✅ Migration Terminée**

La migration complète des données de PostgreSQL vers InfluxDB a été réalisée avec succès :

- **Utilisateurs** : 1 compte admin migré
- **Appareils** : 5 appareils IoT migrés (ESP32, DHT22, LEDs, Ultrason)
- **Télémétrie** : Structure prête pour données temps réel
- **Alertes** : Système d'alertes opérationnel
- **Logs Suricata** : Intégration sécurité réseau

**Avantages d'InfluxDB :**

- Optimisé pour séries temporelles
- Requêtes Flux performantes
- Stockage efficace des métriques IoT
- Intégration native avec Grafana
- API moderne et scalable

## 📝 Licence

MIT License

---

**Développé par** : Manitriniaina2002  
**Dernière mise à jour** : 29 novembre 2025
