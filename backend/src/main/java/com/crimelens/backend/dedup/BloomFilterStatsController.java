package com.crimelens.backend.dedup;

import com.crimelens.backend.dto.ApiResponse;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Counter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dedup")
@Slf4j
@RequiredArgsConstructor
public class BloomFilterStatsController {

    private final BloomFilterService bloomFilterService;
    private final MeterRegistry meterRegistry;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Map<String, Object>> getStats() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("bloomFilter", bloomFilterService.getStats());
        
        Counter seenCounter = meterRegistry.find("dedup.events.seen").counter();
        Counter duplicateCounter = meterRegistry.find("dedup.events.duplicate").counter();
        Counter acceptedCounter = meterRegistry.find("dedup.events.new").counter();
        
        double totalSeen = seenCounter != null ? seenCounter.count() : 0;
        double duplicates = duplicateCounter != null ? duplicateCounter.count() : 0;
        double accepted = acceptedCounter != null ? acceptedCounter.count() : 0;
        
        double duplicateRate = totalSeen > 0 ? (duplicates / totalSeen * 100) : 0.0;
        
        Map<String, Object> counters = new HashMap<>();
        counters.put("totalSeen", (long) totalSeen);
        counters.put("duplicates", (long) duplicates);
        counters.put("accepted", (long) accepted);
        counters.put("duplicateRate", String.format("%.2f", duplicateRate));
        
        response.put("counters", counters);
        
        return ApiResponse.ok(response);
    }
}
