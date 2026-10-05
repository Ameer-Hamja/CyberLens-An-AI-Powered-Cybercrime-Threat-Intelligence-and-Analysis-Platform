package com.crimelens.backend.dedup;

import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class DeduplicationService {

    private final BloomFilterService bloomFilterService;
    private final ContentHasher contentHasher;
    private final Counter seenCounter;
    private final Counter duplicateCounter;
    private final Counter newCounter;
    private final Counter failOpenCounter;

    public DeduplicationService(BloomFilterService bloomFilterService,
                                ContentHasher contentHasher,
                                MeterRegistry meterRegistry) {
        this.bloomFilterService = bloomFilterService;
        this.contentHasher = contentHasher;
        this.seenCounter = meterRegistry.counter("dedup.events.seen");
        this.duplicateCounter = meterRegistry.counter("dedup.events.duplicate");
        this.newCounter = meterRegistry.counter("dedup.events.new");
        this.failOpenCounter = meterRegistry.counter("dedup.events.failOpen");
    }

    public DeduplicationResult check(ThreatRawEvent event) {
        String hash = contentHasher.hash(event);
        seenCounter.increment();

        boolean isDuplicate;
        try {
            isDuplicate = bloomFilterService.mightContain(hash);
        } catch (Exception e) {
            failOpenCounter.increment();
            log.warn("Bloom filter mightContain threw exception, failing open for hash {}: {}", hash, e.getMessage());
            isDuplicate = false;
        }

        if (isDuplicate) {
            duplicateCounter.increment();
            log.debug("Duplicate event discarded: hash={}, source={}", hash, event.getSourceType());
            return DeduplicationResult.duplicate(hash);
        } else {
            try {
                bloomFilterService.add(hash);
            } catch (Exception e) {
                log.warn("Bloom filter add threw exception for hash {}: {}", hash, e.getMessage());
            }
            newCounter.increment();
            log.debug("New event accepted: hash={}, source={}", hash, event.getSourceType());
            return DeduplicationResult.accepted(hash);
        }
    }
}
