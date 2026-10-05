package com.crimelens.backend.controller;

import com.crimelens.backend.dto.ApiResponse;
import com.crimelens.backend.dto.ScanRequestDTO;
import com.crimelens.backend.dto.ScanResponseDTO;
import com.crimelens.backend.pipeline.ScanLogService;
import com.crimelens.backend.repository.ScanLogRepository;
import io.github.bucket4j.Bucket;
import io.micrometer.core.instrument.MeterRegistry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Set;

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
@RequestMapping("/api/scan")
@Slf4j
@Tag(name = "Citizen Scanner")
@RequiredArgsConstructor
public class ScanController {

    private final ScanLogService scanLogService;
    private final RateLimiterService rateLimiterService;
    private final ScanLogRepository scanLogRepository;
    private final MeterRegistry meterRegistry;

    @Operation(summary = "Scan suspicious text, URL, SMS, or UPI ID")
    @PostMapping
    public ResponseEntity<ApiResponse<ScanResponseDTO>> scanText(
            @Valid @RequestBody ScanRequestDTO request,
            HttpServletRequest httpRequest) {

        String ip = extractClientIp(httpRequest);
        Bucket bucket = rateLimiterService.resolveBucket(ip);

        if (!bucket.tryConsume(1)) {
            HttpHeaders retryHeaders = new HttpHeaders();
            retryHeaders.set("X-RateLimit-Retry-After", "60");
            retryHeaders.set("X-RateLimit-Limit", "10");
            return ResponseEntity.status(429)
                    .headers(retryHeaders)
                    .body(ApiResponse.error("Rate limit exceeded. Maximum 10 scans per minute.", 429));
        }

        ScanResponseDTO result = scanLogService.scan(request);
        meterRegistry.counter("scan.requests.total",
                "type", "text", "dangerous", String.valueOf(result.getIsDangerous())).increment();

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Operation(summary = "Scan image for AI generation, morphing, or scam content")
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Object>> scanImage(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest httpRequest) {

        String ip = extractClientIp(httpRequest);
        Bucket bucket = rateLimiterService.resolveBucket(ip);

        if (!bucket.tryConsume(1)) {
            HttpHeaders retryHeaders = new HttpHeaders();
            retryHeaders.set("X-RateLimit-Retry-After", "60");
            retryHeaders.set("X-RateLimit-Limit", "10");
            return ResponseEntity.status(429)
                    .headers(retryHeaders)
                    .body(ApiResponse.error("Rate limit exceeded. Maximum 10 scans per minute.", 429));
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("No file provided"));
        }

        Set<String> allowed = Set.of("image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp");
        if (!allowed.contains(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Unsupported file type: " + file.getContentType());
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "File too large. Maximum 10MB.");
        }

        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.MULTIPART_FORM_DATA);

            org.springframework.util.MultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            body.add("file", new MultipartInputStreamFileResource(file.getInputStream(), file.getOriginalFilename()));

            org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity =
                    new org.springframework.http.HttpEntity<>(body, headers);

            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            ResponseEntity<String> response = restTemplate.exchange(
                    scanLogService.getAiServiceUrl() + "/scan/image",
                    org.springframework.http.HttpMethod.POST,
                    requestEntity,
                    String.class
            );

            meterRegistry.counter("scan.requests.total", "type", "image").increment();

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> respMap = mapper.readValue(response.getBody(), new com.fasterxml.jackson.core.type.TypeReference<>() {});
            if (respMap.containsKey("data")) {
                return ResponseEntity.ok(ApiResponse.success(respMap.get("data")));
            }
            return ResponseEntity.ok(ApiResponse.success(respMap));

        } catch (org.springframework.web.client.ResourceAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ApiResponse.error("Image analysis service temporarily unavailable"));
        } catch (Exception e) {
            log.error("Image scan proxy error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get anonymized scan history stats")
    @GetMapping("/history")
    public ApiResponse<Map<String, Object>> getHistory() {
        long totalScans = scanLogRepository.count();
        long dangerousScans = scanLogRepository.countByRiskScoreGreaterThanEqual(60);
        String topThreatType = scanLogRepository.findTopThreatType();

        return ApiResponse.success(Map.of(
                "totalScans", totalScans,
                "dangerousScans", dangerousScans,
                "safeScans", totalScans - dangerousScans,
                "topThreatType", topThreatType
        ));
    }

    private String extractClientIp(HttpServletRequest request) {
        String[] headers = {
                "X-Forwarded-For",
                "X-Real-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP"
        };
        for (String header : headers) {
            String val = request.getHeader(header);
            if (val != null && !val.isEmpty() && !"unknown".equalsIgnoreCase(val)) {
                return val.split(",")[0].trim();
            }
        }
        String ip = request.getRemoteAddr();
        return ip != null ? ip : "unknown";
    }
}
