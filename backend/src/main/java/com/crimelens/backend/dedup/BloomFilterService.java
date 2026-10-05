package com.crimelens.backend.dedup;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.connection.ReturnType;
import java.nio.charset.StandardCharsets;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class BloomFilterService {

    private final StringRedisTemplate stringRedisTemplate;

    @Value("${dedup.bloomFilter.key:crimelens:bloom:threats}")
    private String bloomKey;

    @Value("${dedup.bloomFilter.expectedInsertions:1000000}")
    private long expectedInsertions;

    @Value("${dedup.bloomFilter.falsePositiveProbability:0.01}")
    private double fpp;

    @PostConstruct
    public void initBloomFilter() {
        try {
            stringRedisTemplate.execute((RedisCallback<Object>) conn -> {
                conn.execute("BF.RESERVE",
                        bloomKey.getBytes(),
                        String.valueOf(fpp).getBytes(),
                        String.valueOf(expectedInsertions).getBytes());
                return null;
            });
            log.info("Bloom filter initialized at key: {}", bloomKey);
        } catch (Exception e) {
            log.debug("Bloom filter reserve failed (likely already exists): {}", e.getMessage());
        }
    }

    public boolean mightContain(String contentHash) {
        try {
            Long result = stringRedisTemplate.execute((RedisCallback<Long>) conn -> {
                Object obj = conn.scriptingCommands().eval(
                        "return redis.call('BF.EXISTS', KEYS[1], ARGV[1])".getBytes(StandardCharsets.UTF_8),
                        ReturnType.INTEGER, 1, bloomKey.getBytes(StandardCharsets.UTF_8),
                        contentHash.getBytes(StandardCharsets.UTF_8));
                if (obj instanceof Long) return (Long) obj;
                if (obj instanceof Integer) return ((Integer) obj).longValue();
                if (obj instanceof Number) return ((Number) obj).longValue();
                return 0L;
            });
            return result != null && result == 1L;
        } catch (Exception e) {
            log.warn("Bloom filter mightContain check failed for hash {}: {}", contentHash, e.getMessage());
            return false;
        }
    }

    public void add(String contentHash) {
        try {
            stringRedisTemplate.execute((RedisCallback<Object>) conn -> {
                conn.scriptingCommands().eval(
                        "return redis.call('BF.ADD', KEYS[1], ARGV[1])".getBytes(StandardCharsets.UTF_8),
                        ReturnType.INTEGER, 1, bloomKey.getBytes(StandardCharsets.UTF_8),
                        contentHash.getBytes(StandardCharsets.UTF_8));
                return null;
            });
        } catch (Exception e) {
            log.warn("Bloom filter add failed for hash {}: {}", contentHash, e.getMessage());
        }
    }

    public BloomFilterStats getStats() {
        try {
            List<Object> info = stringRedisTemplate.execute((RedisCallback<List<Object>>) conn ->
                    conn.scriptingCommands().eval(
                            "return redis.call('BF.INFO', KEYS[1])".getBytes(StandardCharsets.UTF_8),
                            ReturnType.MULTI, 1, bloomKey.getBytes(StandardCharsets.UTF_8)));
            
            if (info != null) {
                long capacity = 0;
                long itemsInserted = 0;
                
                for (int i = 0; i < info.size(); i += 2) {
                    String key = new String((byte[]) info.get(i));
                    long value = (Long) info.get(i + 1);
                    if ("Capacity".equals(key)) {
                        capacity = value;
                    } else if ("Number of items inserted".equals(key)) {
                        itemsInserted = value;
                    }
                }
                
                return BloomFilterStats.builder()
                        .available(true)
                        .capacity(capacity)
                        .itemsInserted(itemsInserted)
                        .currentFalsePositiveRate(fpp)
                        .build();
            }
        } catch (Exception e) {
            log.warn("Failed to get Bloom filter stats: {}", e.getMessage());
        }
        return BloomFilterStats.unknown();
    }
}
