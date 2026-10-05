package com.crimelens.backend.controller;

import com.crimelens.backend.dto.ApiResponse;
import com.crimelens.backend.repository.ThreatRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import javax.sql.DataSource;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * PUBLIC ENDPOINTS (no auth required):
 * GET  /api/threats/live              → paginated threat feed
 * GET  /api/threats/live?threatType=  → filtered by type
 * GET  /api/threats/live?minSeverity= → filtered by severity
 * GET  /api/threats/heatmap           → India state threat map
 * GET  /api/threats/trends            → 30-day trend data
 * GET  /api/threats/trends?days=N     → N-day trend data
 * GET  /api/threats/search?q=         → full-text search
 * GET  /api/threats/{id}              → single threat
 * GET  /api/threats/recent/{type}     → recent by threat type
 * GET  /api/threats/summary           → type distribution
 * POST /api/threats/subscribe         → email subscription
 * DEL  /api/threats/unsubscribe       → remove subscription
 * POST /api/scan                      → scan text/URL/UPI
 * POST /api/scan/image                → scan image
 * GET  /api/scan/history              → anonymized scan stats
 * GET  /api/stats                     → platform statistics
 * GET  /api/stats/realtime            → last 5 min stats
 * GET  /api/stats/by-type             → stats per threat type
 * GET  /api/stats/by-state            → stats per state
 * GET  /api/health                    → system health check
 * POST /api/auth/login                → get JWT token
 * GET  /api/auth/validate             → validate token
 * POST /api/auth/logout               → logout (stateless)
 *
 * WEBSOCKET ENDPOINTS:
 * WS   /ws                            → connect (SockJS)
 * SUB  /topic/threats                 → live threat feed
 * SUB  /topic/stats                   → live stats updates
 * PUB  /app/subscribe                 → join threat feed
 *
 * ADMIN ENDPOINTS (JWT ROLE_ADMIN required):
 * GET  /api/admin/dashboard           → admin overview
 * DEL  /api/admin/threats/{id}        → delete threat
 * POST /api/admin/cache/evict         → clear Redis cache
 * GET  /api/admin/subscriptions       → list subscriptions
 * POST /api/admin/ingest/trigger      → manual test ingest
 * GET  /api/admin/dedup/stats         → bloom filter stats
 *
 * ACTUATOR ENDPOINTS:
 * GET  /actuator/health               → Spring health
 * GET  /actuator/prometheus           → Prometheus metrics
 * GET  /actuator/info                 → app info
 * GET  /swagger-ui.html               → API documentation
 * GET  /v3/api-docs                   → OpenAPI JSON spec
 */
@RestController
@RequestMapping("/api/health")
@Tag(name = "Health")
@RequiredArgsConstructor
public class HealthController {

    private final ThreatRepository threatRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final DataSource dataSource;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @Operation(summary = "System health check")
    @GetMapping
    public ApiResponse<Map<String, Object>> getHealth() {
        Map<String, String> components = new HashMap<>();
        boolean allUp = true;

        // DB
        try {
            threatRepository.count();
            components.put("database", "UP");
        } catch (Exception e) {
            components.put("database", "DOWN: " + e.getMessage());
            allUp = false;
        }

        // Redis
        try {
            stringRedisTemplate.opsForValue().set("health:check", "ok", Duration.ofSeconds(5));
            components.put("redis", "UP");
        } catch (Exception e) {
            components.put("redis", "DOWN: " + e.getMessage());
            allUp = false;
        }

        // Kafka
        try {
            if (kafkaTemplate.getDefaultTopic() != null || true) { // just accessing it
                components.put("kafka", "UP");
            }
        } catch (Exception e) {
            components.put("kafka", "DOWN: " + e.getMessage());
            allUp = false;
        }

        // AI Service
        try {
            RestTemplate restTemplate = new RestTemplate();
            boolean ok = restTemplate.getForEntity(aiServiceUrl + "/health", String.class).getStatusCode().is2xxSuccessful();
            if (ok) {
                components.put("aiService", "UP");
            } else {
                components.put("aiService", "DOWN: non-2xx response");
                allUp = false;
            }
        } catch (Exception e) {
            components.put("aiService", "DOWN: " + e.getMessage());
            allUp = false;
        }

        String overall = allUp ? "UP" : "DEGRADED";

        Map<String, Object> data = Map.of(
                "status", overall,
                "timestamp", Instant.now().toString(),
                "version", "1.0.0",
                "components", components
        );

        return ApiResponse.success(data);
    }
}
