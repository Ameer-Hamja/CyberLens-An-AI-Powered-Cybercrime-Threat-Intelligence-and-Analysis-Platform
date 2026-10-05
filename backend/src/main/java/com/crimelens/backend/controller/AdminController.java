package com.crimelens.backend.controller;

import com.crimelens.backend.dedup.BloomFilterService;
import com.crimelens.backend.dedup.BloomFilterStats;
import com.crimelens.backend.dto.AdminDashboardDTO;
import com.crimelens.backend.dto.ApiResponse;
import com.crimelens.backend.dto.PagedResponse;
import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.entity.Subscription;
import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import com.crimelens.backend.config.KafkaTopics;
import com.crimelens.backend.repository.SubscriptionRepository;
import com.crimelens.backend.repository.ThreatRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.HashMap;

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
@RequestMapping("/api/admin")
@Slf4j
@Tag(name = "Admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final ThreatRepository threatRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final BloomFilterService bloomFilterService;
    private final CacheManager cacheManager;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Operation(summary = "Get admin dashboard overview")
    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboardDTO> getDashboard() {
        long totalThreats = threatRepository.count();
        long threatsToday = threatRepository.countByCreatedAtAfter(
                Instant.now().truncatedTo(ChronoUnit.DAYS));
        
        Map<String, Object> threats = new HashMap<>();
        threats.put("total", totalThreats);
        threats.put("today", threatsToday);
        
        long totalSubs = subscriptionRepository.count();
        Map<String, Object> subscriptions = Map.of("total", totalSubs);
        
        BloomFilterStats bloomStats = bloomFilterService.getStats();
        
        Map<String, Object> system = new HashMap<>();
        system.put("javaVersion", System.getProperty("java.version"));
        system.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        
        AdminDashboardDTO dashboard = AdminDashboardDTO.builder()
                .threats(threats)
                .subscriptions(subscriptions)
                .bloomFilter(new ObjectMapper().convertValue(bloomStats, Map.class))
                .system(system)
                .build();
                
        return ApiResponse.success(dashboard);
    }

    @Operation(summary = "Delete threat by ID")
    @DeleteMapping("/threats/{id}")
    public ApiResponse<String> deleteThreat(@PathVariable UUID id) {
        if (!threatRepository.existsById(id)) {
            throw new EntityNotFoundException("Threat not found with id: " + id);
        }
        threatRepository.deleteById(id);
        
        cacheManager.getCacheNames().forEach(name -> {
            var cache = cacheManager.getCache(name);
            if (cache != null) cache.clear();
        });
        
        log.info("Admin deleted threat: {}", id);
        return ApiResponse.success("Threat deleted");
    }

    @Operation(summary = "Evict Redis cache")
    @PostMapping("/cache/evict")
    public ApiResponse<String> evictCache(@RequestParam(required = false) String cacheName) {
        if (cacheName != null) {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) cache.clear();
            log.info("Cache evicted: {}", cacheName);
            return ApiResponse.success("Cache evicted: " + cacheName);
        } else {
            cacheManager.getCacheNames().forEach(name -> {
                var cache = cacheManager.getCache(name);
                if (cache != null) cache.clear();
            });
            log.info("All caches evicted by admin");
            return ApiResponse.success("Cache evicted: all");
        }
    }

    @Operation(summary = "List email subscriptions")
    @GetMapping("/subscriptions")
    public ApiResponse<PagedResponse<Subscription>> getSubscriptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Page<Subscription> subs = subscriptionRepository.findAll(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        
        return ApiResponse.success(PagedResponse.of(subs));
    }

    @Operation(summary = "Manually trigger data ingestion")
    @PostMapping("/ingest/trigger")
    public ApiResponse<String> triggerIngest(@RequestParam SourceType sourceType) {
        try {
            ThreatRawEvent testEvent = ThreatRawEvent.builder()
                    .sourceUrl("https://test.crimelens.in/manual-" + UUID.randomUUID())
                    .rawText("Test ingestion triggered by admin for source: " + sourceType)
                    .title("Manual test event")
                    .sourceType(sourceType)
                    .publishedAt(Instant.now())
                    .metadata(Map.of("trigger", "admin", "admin_id", "system"))
                    .build();
                    
            kafkaTemplate.send(KafkaTopics.RAW_THREATS, objectMapper.writeValueAsString(testEvent));
            return ApiResponse.success("Test event published to raw-threats topic");
        } catch (Exception e) {
            log.error("Failed to publish test event: {}", e.getMessage());
            return ApiResponse.error("Failed to trigger ingestion: " + e.getMessage());
        }
    }

}
