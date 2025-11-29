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
- **Base de données PostgreSQL** avec SQLAlchemy ORM
- **Export de données** (Excel/PDF) pour rapports
- **MQTT Broker** intégré pour communication IoT

### Frontend (React + Vite)
- **Dashboard 3 catégories** : IoT Monitoring, IDS Alerts, Security Logs
- **Visualisations Recharts** (graphiques, courbes, barres)
- **Gestion des dispositifs** (CRUD complet)
- **Système d'alertes** avec filtres et recherche
- **Interface admin** pour la gestion des utilisateurs
- **Design moderne** avec Tailwind CSS et Lucide Icons
- **Animations** avec fond animé et effets glassmorphism
- **Export de données** en temps réel

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

## 📦 Structure du projet

```
SIAC-IoT/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app principale
│   │   ├── models.py            # Modèles Pydantic/SQLAlchemy
│   │   ├── database.py          # Configuration DB
│   │   ├── ml_service.py        # Service ML (IsolationForest)
│   │   └── feature_engineering.py # Extraction de features
│   ├── Dockerfile
│   ├── .dockerignore
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               # IoT Monitoring, IDS Alerts, Logs, Admin
│   │   ├── components/          # Composants réutilisables
│   │   ├── contexts/            # AuthContext
│   │   └── lib/                 # API client, utils
│   ├── Dockerfile
│   ├── nginx.conf               # Configuration Nginx production
│   └── package.json
├── infra/
│   ├── postgres/
│   │   └── init.sql             # Schéma DB et données initiales
│   ├── mosquitto/
│   │   └── config/
│   │       └── mosquitto.conf   # Configuration MQTT broker
│   └── grafana/
│       └── provisioning/
│           ├── datasources/     # Configuration InfluxDB datasource
│           └── dashboards/      # Configuration dashboards
├── docker-compose.yml           # Configuration principale
├── docker-compose.override.yml  # Développement (hot-reload)
├── docker-compose.prod.yml      # Production (optimisé)
└── .env.example                 # Variables d'environnement

```

## 🐳 Architecture Docker

La plateforme SIAC-IoT utilise une architecture microservices avec 6 services principaux :

### Services

- **PostgreSQL** : Base de données principale pour les données IoT, utilisateurs et alertes
- **Backend (FastAPI)** : API REST avec ML pour la détection d'anomalies
- **Frontend (React)** : Interface utilisateur moderne avec dashboard temps réel
- **Mosquitto (MQTT)** : Broker MQTT pour la communication IoT
- **InfluxDB** : Base de données de séries temporelles pour les métriques
- **Grafana** : Plateforme de visualisation et monitoring avancé

### Réseau

Tous les services communiquent via un réseau Docker bridge dédié (`siac-network`) avec résolution DNS automatique.

### Volumes

- `postgres_data` : Persistance des données PostgreSQL
- `influxdb_data` : Persistance des métriques InfluxDB
- `grafana_data` : Persistance des dashboards Grafana
- `mosquitto_data` : Persistance des données MQTT

### Santé et monitoring

- Health checks automatiques pour tous les services
- Logs centralisés via Docker
- Restart policies configurées pour la production

## 🛠️ Installation et démarrage

### Prérequis
- Docker et Docker Compose
- Node.js 18+ (pour développement frontend local)
- Python 3.11+ (pour développement backend local)

### Avec Docker (recommandé)

```powershell
# Cloner le projet
git clone https://github.com/Manitriniaina2002/SIAC-IoT.git
cd SIAC-IoT

# Lancer la stack complète
docker-compose up -d --build
```

**URLs d'accès :**
- **Frontend** : http://localhost:80 (production) / http://localhost:5173 (développement)
- **Backend API** : http://localhost:18000
- **Documentation API** : http://localhost:18000/docs
- **Grafana** : http://localhost:3000 (admin/admin)
- **InfluxDB** : http://localhost:18086

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
docker-compose logs postgres

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

**Frontend :**
```powershell
cd frontend
npm install
npm run dev
```

## 🔐 Authentification

**Compte admin par défaut :**
- Username : `admin`
- Password : `admin`

**Compte utilisateur par défaut :**
- Username : `user`
- Password : `user`

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

**Suricata IDS :**
- `POST /api/v1/suricata/logs` : Ingestion des logs Suricata
- `GET /api/v1/suricata/logs` : Récupération des logs avec filtres
- `GET /api/v1/suricata/stats` : Statistiques des alertes par catégorie
- `GET /api/v1/suricata/alerts` : Alertes de sécurité actives

**Export de données :**
- `GET /api/v1/export/telemetry/excel` : Export télémétrie Excel
- `GET /api/v1/export/telemetry/pdf` : Export télémétrie PDF
- `GET /api/v1/export/alerts/excel` : Export alertes Excel
- `GET /api/v1/export/alerts/pdf` : Export alertes PDF
- `GET /api/v1/export/suricata/excel` : Export logs Suricata Excel
- `GET /api/v1/export/suricata/pdf` : Export logs Suricata PDF

## 📊 API Endpoints

**Devices :**
- `GET /api/v1/devices` : Liste des dispositifs
- `POST /api/v1/devices` : Créer un dispositif
- `PUT /api/v1/devices/{id}` : Modifier un dispositif
- `DELETE /api/v1/devices/{id}` : Supprimer un dispositif

**Telemetry :**
- `POST /api/v1/telemetry` : Ingérer des données de télémétrie (ESP32)
- `GET /api/v1/telemetry/recent` : Données récentes par device

**Alerts :**
- `GET /api/v1/alerts` : Liste des alertes ML
- `GET /api/v1/alerts/recommendations` : Recommandations basées sur les alertes

**Dashboard :**
- `GET /api/v1/dashboard_summary` : Statistiques globales
- `GET /api/v1/activity_series` : Série temporelle d'activité
- `GET /api/v1/volume_series` : Série temporelle de volume

**Auth :**
- `POST /api/v1/auth/login` : Connexion
- `GET /api/v1/users/me` : Profil utilisateur
- `GET /api/v1/users` : Liste des utilisateurs (admin)
- `POST /api/v1/users` : Créer un utilisateur (admin)

**Santé système :**
- `GET /api/v1/health` : État de santé du système

## 🎨 Technologies utilisées

**Backend :**
- FastAPI 0.115.5
- PostgreSQL 15 (production) / SQLite (développement)
- SQLAlchemy 2.0.35
- scikit-learn 1.7.2 (IsolationForest)
- Pydantic 2.8.2
- python-jose (JWT)
- passlib (hashing)
- pandas/reportlab (exports Excel/PDF)

**Frontend :**
- React 18 + Vite
- Tailwind CSS + PostCSS
- Recharts (visualisations)
- Lucide React Icons
- React Router DOM v6
- React Hot Toast
- Nginx (production)

**Infrastructure :**
- Docker & Docker Compose
- PostgreSQL (base de données)
- Mosquitto (MQTT broker)
- InfluxDB 2.7 (métriques séries temporelles)
- Grafana 10.2.0 (visualisation monitoring)
- Nginx (reverse proxy & sécurité)

**Sécurité :**
- Suricata IDS (détection intrusions)
- Headers de sécurité (CSP, HSTS, etc.)
- Authentification JWT
- Gestion des rôles (admin/user)
- Health checks automatiques

## 📝 Licence

MIT License

---

**Développé par** : Manitriniaina2002  
**Dernière mise à jour** : 23 novembre 2025
