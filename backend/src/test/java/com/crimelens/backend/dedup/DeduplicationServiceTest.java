package com.crimelens.backend.dedup;

import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeduplicationServiceTest {

    @Mock
    private BloomFilterService bloomFilterService;

    @Mock
    private ContentHasher contentHasher;

    private DeduplicationService deduplicationService;
    private SimpleMeterRegistry meterRegistry;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        deduplicationService = new DeduplicationService(bloomFilterService, contentHasher, meterRegistry);
    }

    @Test
    void check_returnsAccepted_whenEventIsNew() {
        ThreatRawEvent event = ThreatRawEvent.builder().sourceType(SourceType.TWITTER).build();
        when(contentHasher.hash(event)).thenReturn("hash123");
        when(bloomFilterService.mightContain("hash123")).thenReturn(false);

        DeduplicationResult result = deduplicationService.check(event);

        assertTrue(result.isAccepted());
        assertEquals("hash123", result.getContentHash());
        verify(bloomFilterService, never()).add("hash123");
        deduplicationService.markForwarded("hash123");
        verify(bloomFilterService).add("hash123");
        assertEquals(1.0, meterRegistry.counter("dedup.events.new").count());
    }

    @Test
    void check_returnsDuplicate_whenBloomPositive() {
        ThreatRawEvent event = ThreatRawEvent.builder().sourceType(SourceType.TWITTER).build();
        when(contentHasher.hash(event)).thenReturn("hash123");
        when(bloomFilterService.mightContain("hash123")).thenReturn(true);

        DeduplicationResult result = deduplicationService.check(event);

        assertFalse(result.isAccepted());
        verify(bloomFilterService, never()).add(anyString());
        assertEquals(1.0, meterRegistry.counter("dedup.events.duplicate").count());
    }

    @Test
    void check_failsOpen_whenBloomFilterThrows() {
        ThreatRawEvent event = ThreatRawEvent.builder().sourceType(SourceType.TWITTER).build();
        when(contentHasher.hash(event)).thenReturn("hash123");
        when(bloomFilterService.mightContain("hash123")).thenThrow(new RuntimeException("Redis down"));

        DeduplicationResult result = deduplicationService.check(event);

        assertTrue(result.isAccepted());
        assertEquals(1.0, meterRegistry.counter("dedup.events.failOpen").count());
    }
}
