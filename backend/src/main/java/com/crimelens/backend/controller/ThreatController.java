package com.crimelens.backend.controller;

import com.crimelens.backend.dto.*;
import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.entity.Subscription;
import com.crimelens.backend.entity.Threat;
import com.crimelens.backend.entity.ThreatType;
import com.crimelens.backend.mapper.ThreatMapper;
import com.crimelens.backend.entity.Threat;
import com.crimelens.backend.entity.ThreatType;
import com.crimelens.backend.pipeline.ElasticsearchQueryService;
import com.crimelens.backend.pipeline.ThreatDocument;
import com.crimelens.backend.repository.SubscriptionRepository;
import com.crimelens.backend.repository.ThreatRepository;
import com.crimelens.backend.repository.ThreatSpecification;
import io.micrometer.core.instrument.MeterRegistry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.summingLong;

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
@RequestMapping({"/api/threats", "/api/incidents"})
@Slf4j
@Tag(name = "Threats", description = "Threat intelligence endpoints")
@RequiredArgsConstructor
public class ThreatController {

    private final ThreatRepository threatRepository;
    private final ThreatMapper threatMapper;
    private final ElasticsearchQueryService elasticsearchQueryService;
    private final SubscriptionRepository subscriptionRepository;
    private final MeterRegistry meterRegistry;

    @Operation(summary = "Get paginated live threat feed")
    @GetMapping({"", "/live"})
    @Cacheable(value = "threats-live", key = "#page + '-' + #size + '-' + #threatType + '-' + #minSeverity")
    public ApiResponse<PagedResponse<ThreatDTO>> getLiveThreats(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String threatType,
            @RequestParam(required = false) Integer minSeverity) {

        size = Math.max(1, Math.min(100, size));
        if (page < 0) page = 0;

        Specification<Threat> spec = Specification.where(null);
        if (threatType != null && !threatType.isEmpty()) {
            spec = spec.and(ThreatSpecification.hasType(parseThreatType(threatType)));
        }
        if (minSeverity != null) {
            spec = spec.and(ThreatSpecification.minSeverity(minSeverity));
        }

        Page<Threat> result = threatRepository.findAll(spec,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return ApiResponse.success(PagedResponse.of(result, threatMapper::toDTO));
    }

    @Operation(summary = "Get threat density by Indian state")
    @GetMapping("/heatmap")
    @Cacheable(value = "threats-heatmap", unless = "#result == null")
    public ApiResponse<List<HeatmapDTO>> getHeatmap() {
        List<HeatmapDTO> data = threatRepository.findHeatmapData();
        for (HeatmapDTO dto : data) {
            com.crimelens.backend.pipeline.LatLng coords = com.crimelens.backend.pipeline.GeoCoordinates.forState(dto.getStateName());
            if (coords != null) {
                dto.setLat(coords.lat());
                dto.setLng(coords.lng());
            }
        }
        return ApiResponse.success(data);
    }

    @Operation(summary = "Get threat trends over time")
    @GetMapping("/trends")
    @Cacheable(value = "threats-trends", key = "#days")
    public ApiResponse<Map<String, Object>> getTrends(
            @RequestParam(defaultValue = "30") int days) {

        if (days < 1 || days > 365) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Days must be between 1 and 365");
        }

        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        List<TrendDTO> trends = threatRepository.findTrends(since);

        Map<LocalDate, Map<String, Long>> grouped = trends.stream()
                .collect(groupingBy(TrendDTO::getDate,
                        groupingBy(TrendDTO::getThreatType,
                                summingLong(TrendDTO::getCount))));

        return ApiResponse.success(Map.of(
                "trends", trends,
                "grouped", grouped,
                "days", days
        ));
    }

    @Operation(summary = "Full-text search across threats")
    @GetMapping("/search")
    public ApiResponse<Map<String, Object>> search(
            @RequestParam @NotBlank @Size(min = 2, max = 200) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String threatType,
            @RequestParam(required = false) String state) {

        page = Math.max(0, page);
        size = Math.max(1, Math.min(100, size));
        if (threatType != null && !threatType.isBlank()) parseThreatType(threatType);
        String query = q.trim();
        if (query.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Search query cannot be blank");
        }

        List<ThreatDocument> results = elasticsearchQueryService.search(query, threatType, state, page, size);

        return ApiResponse.success(Map.of(
                "results", results,
                "query", query,
                "total", results.size()
        ));
    }

    @Operation(summary = "Get single threat by ID")
    @GetMapping("/{id}")
    public ApiResponse<ThreatDTO> getThreatById(@PathVariable UUID id) {
        Threat threat = threatRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Threat not found with id: " + id));
        return ApiResponse.success(threatMapper.toDTO(threat));
    }

    @Operation(summary = "Get recent threats by type")
    @GetMapping("/recent/{threatType}")
    public ApiResponse<List<ThreatDTO>> getRecentByType(
            @PathVariable String threatType,
            @RequestParam(defaultValue = "10") int limit) {

        if (limit < 1 || limit > 50) limit = 10;
        ThreatType type = parseThreatType(threatType);

        List<Threat> threats = threatRepository.findTop50ByThreatTypeOrderByCreatedAtDesc(type)
                .stream().limit(limit).toList();

        return ApiResponse.success(threatMapper.toDTOList(threats));
    }

    @Operation(summary = "Get threat type distribution summary")
    @GetMapping("/summary")
    @Cacheable(value = "threats-summary")
    public ApiResponse<List<ThreatSummaryDTO>> getSummary() {
        List<Object[]> rawSummary = threatRepository.findThreatSummaryRaw();
        List<ThreatSummaryDTO> summary = rawSummary.stream().map(row -> {
            Instant lastSeen = null;
            if (row[3] instanceof Timestamp) {
                lastSeen = ((Timestamp) row[3]).toInstant();
            } else if (row[3] instanceof Instant) {
                lastSeen = (Instant) row[3];
            }
            return ThreatSummaryDTO.builder()
                    .threatType((String) row[0])
                    .count(((Number) row[1]).longValue())
                    .avgSeverity(row[2] != null ? ((Number) row[2]).doubleValue() : 0.0)
                    .lastSeen(lastSeen)
                    .build();
        }).toList();

        return ApiResponse.success(summary);
    }

    @Operation(summary = "Subscribe to threat alerts by email")
    @PostMapping("/subscribe")
    public ApiResponse<String> subscribe(@Valid @RequestBody SubscribeRequestDTO request) {
        if (subscriptionRepository.existsByEmail(request.getEmail())) {
            return ApiResponse.success("Already subscribed");
        }

        Subscription sub = new Subscription();
        sub.setEmail(request.getEmail());
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            if (request.getStates() != null) sub.setStates(mapper.writeValueAsString(request.getStates()));
            if (request.getThreatTypes() != null) sub.setThreatTypes(mapper.writeValueAsString(request.getThreatTypes()));
        } catch (Exception e) {
            log.error("Failed to map subscription filters", e);
        }
        sub.setCreatedAt(Instant.now());
        subscriptionRepository.save(sub);

        return ApiResponse.success("Subscribed successfully");
    }

    @Operation(summary = "Unsubscribe from threat alerts")
    @DeleteMapping("/unsubscribe")
    public ApiResponse<String> unsubscribe(@RequestParam @Email String email) {
        subscriptionRepository.deleteByEmail(email);
        return ApiResponse.success("Unsubscribed successfully");
    }

    private ThreatType parseThreatType(String raw) {
        try {
            return ThreatType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid threat type: " + raw +
                            ". Valid values: " + Arrays.toString(ThreatType.values()));
        }
    }
}
