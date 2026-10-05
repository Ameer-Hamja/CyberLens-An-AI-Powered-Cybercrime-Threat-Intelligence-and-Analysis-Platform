package com.crimelens.backend.controller;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {
    private record Entry(Bucket bucket, long expiresAt) {}
    private final ConcurrentHashMap<String, Entry> buckets = new ConcurrentHashMap<>();
    public Bucket resolveBucket(String ip) {
        long now = System.currentTimeMillis();
        buckets.entrySet().removeIf(entry -> entry.getValue().expiresAt() < now);
        return buckets.compute(ip, (key, entry) -> {
            Bucket bucket = entry == null ? Bucket.builder().addLimit(Bandwidth.builder().capacity(10).refillGreedy(10, Duration.ofMinutes(1)).build()).build() : entry.bucket();
            return new Entry(bucket, now + Duration.ofMinutes(5).toMillis());
        }).bucket();
    }
}
