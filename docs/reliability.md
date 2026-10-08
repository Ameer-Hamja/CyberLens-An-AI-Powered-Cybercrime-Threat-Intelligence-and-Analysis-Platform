# Reliability diagnosis and repairs

The initial `docker compose up --build` and every available service log were
inspected before edits; fresh starts and browser checks added the findings below.
The implementation uses PostgreSQL/PostGIS, not MySQL; existing data volumes
and database migrations were retained.

1. PostgreSQL probes targeted the username as a database — specify `POSTGRES_DB` in `pg_isready`.
2. Frontend started before backend readiness — require a healthy backend and probe its API through nginx.
3. Exporters and Alertmanager lacked probes — add HTTP healthchecks for every Compose service.
4. Redis exporter lacked `wget` — use its versioned Alpine image with the probe tool.
5. Frontend `localhost` probe selected an unbound IPv6 address — probe `127.0.0.1`.
6. Default passwords/JWT/Grafana signing keys were committed — require environment secrets and generate missing local values.
7. Classified incidents violated the severity constraint — constrain persisted severity to 1–5.
8. Database constraint failures were mislabeled as duplicates and discarded — propagate persistence failures for Kafka error handling.
9. Raw Kafka messages were never acknowledged — acknowledge successful delivery, duplicates and malformed messages explicitly.
10. Classified Kafka sends completed asynchronously — await delivery before acknowledging the raw record.
11. Bloom entries were added before delivery — mark them only after the classified message is delivered so failed sends can retry.
12. AI HTTP clients had no timeouts — use a shared bounded client for classification, scans and image requests.
13. CERT-In returned non-RSS content and logged repeated stack traces — close its reader, bound requests and log concise failures.
14. CERT-In and cybercrime.gov.in returned empty feeds on failure — publish explicitly labeled synthetic awareness fallbacks.
15. Twitter failures/rate limits returned empty feeds — the enabled job now logs and publishes the same labeled fallback.
16. Registration did not exist — persist BCrypt user credentials through a new Flyway migration and reuse login/JWT handling.
17. Every valid JWT became an admin — sign and read the authenticated role, with registrations restricted to `USER`.
18. Servlet error dispatch turned forbidden responses into 401 — write explicit JSON 401/403 responses without error-page dispatch.
19. `/api/incidents` routes were missing — alias the existing incident feed and heatmap without duplicating logic or data.
20. Cached feeds and heatmaps remained stale after ingestion — evict their caches on successful persistence.
21. No initial incidents existed — add 76 synthetic awareness examples with realistic Indian scenarios and spatial coordinates.
22. Generic exception handling turned 400/415 errors into 500 — preserve response-status errors and handle malformed input explicitly.
23. Scan metrics reused a name with conflicting tags — give image scan requests a separate metric name.
24. Empty scan history could throw on a null top type — return `OTHER` for an empty history.
25. Integration tests declared containers but did not configure Spring connections — bind dynamic properties and validate real Flyway migrations.
26. Test application contexts outlived their containers — close each context after its test class and disable background ingestion/listeners in tests.
27. Alertmanager rejected unsupported email fields — use `headers.Subject` and `text`, with a null local receiver until SMTP is configured.
28. Grafana logged missing provisioning directories — include the expected empty directories and remove startup plugin downloads.
29. Kafka could fail on a stale ZooKeeper broker session — enable restart recovery and retain ZooKeeper/Kafka volumes.
30. Nginx cached a removed backend IP and returned 502 — refresh the backend through Docker DNS for API and WebSocket requests.
31. Search used `.keyword` on fields already mapped as keywords — query the actual keyword fields.
32. Seeded/unindexed incidents disappeared from search — fall back to the database when the index is empty or unavailable.
33. Scan outage results were constant — use conservative local keyword checks and disclose reduced analysis.
34. No end-to-end smoke script existed — verify every service, registration/login/RBAC, Kafka ingestion, feed and heatmap through the frontend proxy.

35. Unsubscribe threw `No EntityManager with actual transaction` — annotate the derived repository deletion with `@Transactional`.

36. Grafana 10 ran against data previously used by Grafana 13 and logged missing tables — pin the installed compatible 13.2.2 version and enable its supported alerting configuration.

Regression coverage includes real HTTP role denial, raw-message delivery failure
without acknowledgment or Bloom marking, and fallback behavior for all three
external sources. Synthetic records are labeled in citizen explanations; they
are not verified crime reports. External feed availability is outside this project.

## Verified on 6 October 2026

- All 14 Compose services running and healthy.
- Backend: 39 tests passed, zero failures/errors/skips.
- AI: 29 tests passed; only dependency warnings remain.
- Frontend: lint and production build passed; Vite reports a non-blocking bundle-size warning.
- Chromium: dashboard, trends, search, text scan and image upload passed with no console/API errors; WebSockets connected.
- Smoke: registration, login, JWT validation, user/admin isolation, Kafka ingestion, incident feed and geolocated heatmap passed through nginx.
- AI container stopped deliberately: ingestion and conservative text scan fallback passed within bounded timeout, then AI was restored.
- REST: stats, filters, trends, heatmap, search, detail, scan history, subscription lifecycle and CORS preflight passed; invalid filters returned 400.
- Grafana configured admin login and provisioned dashboards passed; all six Prometheus scrape targets were up.
- External-source fallback regression tests passed; current CERT-In and cybercrime.gov.in failures produce logged synthetic fallbacks.

Reproduction commands are in the root README. Neural model downloads and real
Twitter credentials were not required or tested. Local alert email delivery is
not enabled without SMTP configuration.
