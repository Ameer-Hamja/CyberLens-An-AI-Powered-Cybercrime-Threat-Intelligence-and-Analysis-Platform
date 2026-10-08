# CyberLens / CrimeLens

The implemented stack uses Spring Boot 3 on Java 25, PostgreSQL 15/PostGIS,
Kafka, Redis Stack (including RedisBloom), FastAPI and React. PostgreSQL is
intentional: the existing schema, JSONB columns and spatial migrations require it.

Start Docker Desktop, then run from the repository root:

```sh
./scripts/init-env.sh
docker compose up -d --build --wait --wait-timeout 240
./scripts/smoke-test.sh
```

The setup script generates missing secrets in the ignored `.env` file and
preserves existing values. Admin username is `admin`; use the generated
`ADMIN_PASSWORD` from `.env`. Registration creates a persistent `USER` account
and requires a 3–100 character alphanumeric/underscore username and a password
of 12–72 characters. User tokens cannot access admin endpoints.

Open http://localhost:3000. Backend health is http://localhost:8080/actuator/health,
AI health is http://localhost:8000/health, API documentation is
http://localhost:8080/swagger-ui.html. Monitoring runs at localhost:9090
(Prometheus), localhost:3001 (Grafana), and localhost:9093 (Alertmanager).
Database host port is 5433. Grafana credentials are `admin` and the
`GRAFANA_ADMIN_PASSWORD` in `.env`.

Flyway adds 76 clearly labeled synthetic awareness incidents across Indian
states and union territories, including coordinates. `/api/incidents` and
`/api/incidents/heatmap` use the same data as the existing `/api/threats/live`
and `/api/threats/heatmap` routes. Unavailable/empty external feeds log a warning
and publish a labeled synthetic fallback; Twitter ingestion remains opt-in via
`TWITTER_ENABLED=true` and `TWITTER_BEARER_TOKEN`. Fallback incidents have source
`MANUAL` so they are not presented as verified upstream reports.

Text ingestion and scanning use bounded AI calls and local fallback when AI is
unavailable. Image analysis returns 503 when unavailable rather than inventing
an image result. Neural text/image models remain opt-in with
`ENABLE_TRANSFORMER=true` and `ENABLE_IMAGE_MODELS=true`; the default uses the
existing rules and image heuristics/OCR. Model downloads need internet access.

Run checks:

```sh
(cd backend && mvn test) # Requires JDK 25 and Docker
# On this Mac, explicitly select the installed JDK if needed:
(cd backend && JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-25.jdk/Contents/Home mvn test)
docker compose exec -T ai-service pytest tests -q
(cd frontend && npm ci && npm run lint && npm run build)
./scripts/smoke-test.sh
```

The smoke test waits for every Compose service to become healthy, registers and
logs in a unique user, checks JWT validation and admin-role isolation, publishes
a manual event through Kafka, then verifies the new incident and increased
geolocated heatmap count through nginx. It creates synthetic test records.
Set `SMOKE_BASE_URL` to override the default `http://localhost:3000`.

Stop without deleting stored data:

```sh
docker compose stop
```

The diagnosis and one-line fix explanations are in [docs/reliability.md](docs/reliability.md).
Local Alertmanager accepts alerts with a null receiver; outbound email requires
an explicitly configured SMTP account and recipient in its configuration.

## Frontend redesign

See [per-page before/after screenshots, integration notes, and browser verification commands](docs/redesign.md).

## CyberLens Shield browser extension

Build and install the Chrome/Edge and Firefox clients using [extension/README.md](extension/README.md). The extension adds URL/message checks, page warnings, alerts, a heatmap panel, JWT options and reviewed citizen reports to the existing backend.
