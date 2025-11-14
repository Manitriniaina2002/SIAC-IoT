# Guide de déploiement sur Render

## 📋 Prérequis

1. Compte GitHub avec le repo SIAC-IoT
2. Compte Render gratuit : https://render.com

## 🚀 Étape 1 : Préparer le code

### Modifier CORS dans `backend/app/main.py`

Remplacer les lignes 34-40 par :

```python
import os

# CORS configuration
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### L'API URL est déjà configurée dans `frontend/src/lib/api.js` ✅

```javascript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

### Commit et push les changements

```powershell
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

## 🌐 Étape 2 : Déployer sur Render

### Option A : Avec render.yaml (Automatique)

1. Aller sur https://dashboard.render.com
2. Cliquer **"New +"** → **"Blueprint"**
3. Connecter votre repo GitHub `Manitriniaina2002/SIAC-IoT`
4. Render détecte automatiquement le fichier `render.yaml`
5. Cliquer **"Apply"**

Render va créer automatiquement :
- ✅ Backend (Web Service Python)
- ✅ Frontend (Static Site)
- ✅ PostgreSQL Database (gratuit)

### Option B : Manuellement

**1. Créer la base de données :**
- **"New +"** → **"PostgreSQL"**
- Name: `siac-iot-db`
- Plan: **Free**
- Créer et noter l'URL de connexion

**2. Créer le backend :**
- **"New +"** → **"Web Service"**
- Connecter repo GitHub
- Configuration :
  - Name: `siac-iot-backend`
  - Runtime: **Python 3**
  - Build Command: `pip install -r backend/requirements.txt`
  - Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Variables d'environnement :
  - `DATABASE_URL`: Internal Database URL (copier depuis la DB)
  - `JWT_SECRET`: `your-super-secret-jwt-key-12345`
  - `CORS_ORIGINS`: (laisser vide pour l'instant)
- Cliquer **"Create Web Service"**

**3. Créer le frontend :**
- **"New +"** → **"Static Site"**
- Connecter repo GitHub
- Configuration :
  - Name: `siac-iot-frontend`
  - Build Command: `cd frontend && npm install && npm run build`
  - Publish Directory: `frontend/dist`
- Variables d'environnement :
  - `VITE_API_URL`: `https://siac-iot-backend.onrender.com`
- Cliquer **"Create Static Site"**

**4. Mettre à jour CORS :**
- Retourner dans le backend
- Modifier `CORS_ORIGINS`: `https://siac-iot-frontend.onrender.com`
- Redéployer le backend

## ✅ Étape 3 : Vérification

Une fois déployé :

1. **Frontend** : https://siac-iot-frontend.onrender.com
2. **Backend API** : https://siac-iot-backend.onrender.com/docs
3. **Health check** : https://siac-iot-backend.onrender.com/api/v1/health

## 🔐 Connexion

Les comptes par défaut seront créés automatiquement :

- **Admin** : `admin` / `admin`
- **User** : `user` / `user`

## ⚠️ Notes importantes

### Free Tier Limitations
- **Backend** : Se met en veille après 15 minutes d'inactivité
- **Premier chargement** : Peut prendre 30-60 secondes (cold start)
- **PostgreSQL** : 1 GB gratuit, expire après 90 jours

### SQLite → PostgreSQL

Le code actuel utilise SQLite. Pour PostgreSQL en production, installer `psycopg2` :

**Ajouter dans `backend/requirements.txt` :**
```
psycopg2-binary==2.9.9
```

**Modifier `backend/app/database.py` :**
```python
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./siac_iot.db")

# Fix pour Render PostgreSQL (postgres:// → postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, echo=True)
```

### Persistence du modèle ML

Le modèle `model_isolation_forest.pkl` est sauvegardé dans le système de fichiers éphémère de Render.
Il sera ré-entraîné à chaque redémarrage du service (ce qui est acceptable pour ce projet).

Pour une persistence permanente, utiliser un service de stockage externe (AWS S3, etc.).

## 🐛 Troubleshooting

### Le backend ne démarre pas
- Vérifier les logs dans le dashboard Render
- Vérifier que `DATABASE_URL` est correctement configuré
- Vérifier que toutes les dépendances sont dans `requirements.txt`

### CORS errors dans le frontend
- Vérifier que `CORS_ORIGINS` contient l'URL exacte du frontend
- Vérifier que `VITE_API_URL` pointe vers le backend

### Le modèle ML ne se charge pas
- Normal au premier démarrage, il s'entraîne automatiquement
- Vérifier les logs : "Model trained successfully"

## 🔄 Mises à jour

Render redéploie automatiquement à chaque push sur la branche `main`.

Pour forcer un redéploiement manuel :
1. Aller dans le service (backend ou frontend)
2. Cliquer **"Manual Deploy"** → **"Deploy latest commit"**

## 💰 Upgrade vers plan payant (optionnel)

Pour éviter le cold start et avoir plus de ressources :
- **Starter Plan** : $7/mois par service
- **Avantages** : Pas de sleep, plus de RAM/CPU, déploiements plus rapides

---

**Besoin d'aide ?** Consulter la documentation Render : https://render.com/docs
