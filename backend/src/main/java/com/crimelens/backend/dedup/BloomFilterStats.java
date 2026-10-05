package com.crimelens.backend.dedup;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BloomFilterStats {
    private long capacity;
    private long itemsInserted;
    private double currentFalsePositiveRate;
    private boolean available;

    public static BloomFilterStats unknown() {
        return BloomFilterStats.builder()
                .available(false)
                .capacity(0)
                .itemsInserted(0)
                .currentFalsePositiveRate(0.0)
                .build();
    }
}
