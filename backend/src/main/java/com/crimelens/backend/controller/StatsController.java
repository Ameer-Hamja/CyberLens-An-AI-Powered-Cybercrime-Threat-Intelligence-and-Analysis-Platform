package com.crimelens.backend.controller;

import com.crimelens.backend.dto.ApiResponse;
import com.crimelens.backend.dto.HeatmapDTO;
import com.crimelens.backend.dto.StatsDTO;
import com.crimelens.backend.dto.TypeStatsDTO;
import com.crimelens.backend.entity.ThreatType;
import com.crimelens.backend.repository.ScanLogRepository;
import com.crimelens.backend.repository.ThreatRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
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
@RequestMapping("/api/stats")
@Slf4j
@Tag(name = "Statistics")
@RequiredArgsConstructor
public class StatsController {

    private final ThreatRepository threatRepository;
    private final ScanLogRepository scanLogRepository;
    private final MeterRegistry meterRegistry;

    @GetMapping
    @Cacheable(value = "stats", unless = "#result == null")
    public ApiResponse<StatsDTO> getStats() {
        long totalThreats = threatRepository.count();
        long threatsToday = threatRepository.countByCreatedAtAfter(
                Instant.now().truncatedTo(ChronoUnit.DAYS));
        long threatsThisWeek = threatRepository.countByCreatedAtAfter(
                Instant.now().minus(7, ChronoUnit.DAYS));
        long threatsThisMonth = threatRepository.countByCreatedAtAfter(
                Instant.now().minus(30, ChronoUnit.DAYS));
        String mostActiveState = threatRepository.findTopState();
        String topThreatType = threatRepository.findTopThreatType();
        long totalScans = scanLogRepository.count();
        Double avgSeverity = threatRepository.findAverageSeverity();
        long highSeverityCount = threatRepository.countBySeverityGreaterThanEqual(4);

        StatsDTO stats = StatsDTO.builder()
                .totalThreats(totalThreats)
                .threatsToday(threatsToday)
                .threatsThisWeek(threatsThisWeek)
                .threatsThisMonth(threatsThisMonth)
                .avgSeverity(avgSeverity != null ? avgSeverity : 0.0)
                .highSeverityCount(highSeverityCount)
                .totalScans(totalScans)
                .topState(mostActiveState)
                .topThreatType(topThreatType)
                .build();

        return ApiResponse.success(stats);
    }

    @GetMapping("/realtime")
    public ApiResponse<Map<String, Object>> getRealtimeStats() {
        long recentCount = threatRepository.countByCreatedAtAfter(
                Instant.now().minus(5, ChronoUnit.MINUTES));

        return ApiResponse.success(Map.of(
                "last5Minutes", recentCount,
                "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/by-type")
    @Cacheable(value = "stats-by-type")
    public ApiResponse<Map<String, TypeStatsDTO>> getStatsByType() {
        List<Object[]> rawSummary = threatRepository.findThreatSummaryRaw();
        long totalThreats = threatRepository.count();
        Map<String, TypeStatsDTO> map = new HashMap<>();

        for (Object[] row : rawSummary) {
            String type = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            Double avgSeverity = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            Instant lastSeen = null;
            if (row[3] instanceof Timestamp) {
                lastSeen = ((Timestamp) row[3]).toInstant();
            } else if (row[3] instanceof Instant) {
                lastSeen = (Instant) row[3];
            }
            double percentage = totalThreats > 0 ? (count * 100.0) / totalThreats : 0.0;

            map.put(type, TypeStatsDTO.builder()
                    .threatType(type)
                    .count(count)
                    .avgSeverity(avgSeverity)
                    .lastSeen(lastSeen)
                    .percentageOfTotal(percentage)
                    .build());
        }

        return ApiResponse.success(map);
    }

    @GetMapping("/by-state")
    @Cacheable(value = "stats-by-state")
    public ApiResponse<List<HeatmapDTO>> getStatsByState() {
        List<HeatmapDTO> data = threatRepository.findHeatmapData();
        return ApiResponse.success(data);
    }
}
