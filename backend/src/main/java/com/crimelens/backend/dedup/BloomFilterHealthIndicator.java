package com.crimelens.backend.dedup;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BloomFilterHealthIndicator implements HealthIndicator {

    private final BloomFilterService bloomFilterService;

    @Override
    public Health health() {
        BloomFilterStats stats = bloomFilterService.getStats();
        if (stats.isAvailable()) {
            return Health.up()
                    .withDetail("capacity", stats.getCapacity())
                    .withDetail("itemsInserted", stats.getItemsInserted())
                    .withDetail("falsePositiveRate", stats.getCurrentFalsePositiveRate())
                    .build();
        } else {
            return Health.down()
                    .withDetail("reason", "Bloom filter unavailable")
                    .build();
        }
    }
}
