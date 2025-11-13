# SIAC-IoT — Plateforme de surveillance IoT

Prototype d'une plateforme de surveillance IoT pour la détection d'anomalies et la cybersécurité des objets connectés.

Contenu créé par le scaffold :
- `backend/` : service FastAPI minimal (endpoints d'ingestion, prédiction, health)
- `frontend/` : squelette frontend (placeholder)
- `design/` : documentation et wireframes
- `docker-compose.yml` : stack dev (backend, mosquitto, influxdb, grafana)

How to run (dev):

Install Docker and Docker Compose, then:

```powershell
docker-compose up -d --build
```

Backend will be available at http://localhost:8000 (OpenAPI at /docs)

---

Voir `design/` pour la conception détaillée et les wireframes.
