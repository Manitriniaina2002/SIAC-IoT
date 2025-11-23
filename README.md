# SIAC-IoT — Plateforme de surveillance IoT

Plateforme moderne de surveillance IoT avec détection d'anomalies par Machine Learning et interface de gestion en temps réel.

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
- **Ingestion de télémétrie** en temps réel
- **Système d'alertes** automatique avec recommandations
- **Authentification JWT** avec gestion des rôles (admin/user)
- **Base de données SQLite** avec SQLAlchemy ORM

### Frontend (React + Vite)
- **Dashboard interactif** avec statistiques en temps réel
- **Visualisations Recharts** (graphiques, courbes, barres)
- **Gestion des dispositifs** (CRUD complet)
- **Système d'alertes** avec filtres et recherche
- **Interface admin** pour la gestion des utilisateurs
- **Design moderne** avec Tailwind CSS et Lucide Icons
- **Animations** avec fond animé et effets glassmorphism

### Machine Learning
- **Feature Engineering** : extraction de 7 caractéristiques depuis la télémétrie
- **IsolationForest** : détection d'anomalies non supervisée
- **Entraînement automatique** sur données normales simulées
- **Persistance du modèle** avec pickle
- **API de statut** : visualisation de l'état du modèle en temps réel

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
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               # Dashboard, Devices, Alerts, Admin, Login
│   │   ├── components/          # Composants réutilisables
│   │   ├── contexts/            # AuthContext
│   │   └── lib/                 # API client, utils
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml

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

**URLs :**
- Frontend : http://localhost:5173
- Backend API : http://localhost:8000
- Documentation API : http://localhost:8000/docs
- Grafana : http://localhost:3000 (admin/admin)
- InfluxDB : http://localhost:8086

### Production

```bash
# Utiliser la configuration de production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Ou avec des variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs de production
docker-compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Développement

**Avec Docker (recommandé) :**
```bash
# Développement avec hot-reload
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
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
- `GET /api/v1/ml/status` : Statut du modèle
- `GET /api/v1/alerts/recommendations` : Recommandations basées sur les alertes

## 📊 API Endpoints

**Devices :**
- `GET /api/v1/devices` : Liste des dispositifs
- `POST /api/v1/devices` : Créer un dispositif
- `PUT /api/v1/devices/{id}` : Modifier un dispositif
- `DELETE /api/v1/devices/{id}` : Supprimer un dispositif

**Telemetry :**
- `POST /api/v1/telemetry` : Ingérer des données de télémétrie

**Alerts :**
- `GET /api/v1/alerts` : Liste des alertes
- `GET /api/v1/alerts/recommendations` : Recommandations

**Dashboard :**
- `GET /api/v1/dashboard_summary` : Statistiques globales
- `GET /api/v1/activity_series` : Série temporelle d'activité
- `GET /api/v1/volume_series` : Série temporelle de volume

**Auth :**
- `POST /api/v1/auth/login` : Connexion
- `GET /api/v1/users/me` : Profil utilisateur

## 🎨 Technologies utilisées

**Backend :**
- FastAPI 0.115.12
- SQLAlchemy 2.0.44
- scikit-learn 1.5.2
- Pydantic v2
- python-jose (JWT)
- passlib (hashing)

**Frontend :**
- React 18
- Vite
- Tailwind CSS
- Recharts
- Lucide React Icons
- React Router DOM
- React Hot Toast

## 📝 Licence

MIT License

---

**Développé par** : Manitriniaina2002  
**Dernière mise à jour** : 14 novembre 2025
