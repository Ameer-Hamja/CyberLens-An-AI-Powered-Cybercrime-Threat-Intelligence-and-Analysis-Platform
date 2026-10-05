# CrimeLens

## Run Locally With Docker

Start Docker Desktop, then run from this folder:

```sh
docker compose --project-name cyberlens up -d --build frontend
docker compose --project-name cyberlens ps
```

This starts the frontend, Java 25 backend, AI service, PostgreSQL/PostGIS,
Redis, Kafka, ZooKeeper, and Elasticsearch. Compose reads `.env` automatically.
Database settings support both `POSTGRES_*` and the existing
`DB_USER`, `DB_PASSWORD`, and `DB_NAME` variables.

- Application: http://localhost:3000
- Scanner: http://localhost:3000/scan
- Backend health: http://localhost:8080/actuator/health
- API documentation: http://localhost:8080/swagger-ui.html
- AI health: http://localhost:8000/health
- PostgreSQL host port: 5433 (container port remains 5432)

Local AI uses rule-based text analysis and image heuristics/OCR by default.
Set `ENABLE_TRANSFORMER=true` and `ENABLE_IMAGE_MODELS=true` in `.env` to
enable neural models, then recreate the AI service. Model downloads require
internet access, additional disk space, and a longer first startup.

Optional monitoring/exporters can be started with:

```sh
docker compose --project-name cyberlens up -d prometheus grafana alertmanager kafka-exporter postgres-exporter redis-exporter
```

To stop without deleting database volumes:

```sh
docker compose --project-name cyberlens stop
```

Do not use `down -v` unless you intend to delete stored data. The compose stack
retains PostgreSQL 15 for compatibility with the existing local data volume.

## Checks

```sh
cd frontend
npm run lint
npm run build
```

```sh
docker exec crimelens-ai-service pytest tests -q
```

The backend requires JDK 25. External feed ingestion depends on upstream
availability; an empty live feed is valid until threats are ingested.
