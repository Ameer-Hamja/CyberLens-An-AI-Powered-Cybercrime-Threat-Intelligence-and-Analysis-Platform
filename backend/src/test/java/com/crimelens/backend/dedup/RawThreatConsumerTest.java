package com.crimelens.backend.dedup;

import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RawThreatConsumerTest {

    @Mock
    private DeduplicationService deduplicationService;

    @Mock
    private RawThreatForwarder rawThreatForwarder;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private org.springframework.kafka.support.Acknowledgment acknowledgment;

    @InjectMocks
    private RawThreatConsumer consumer;

    private ThreatRawEvent event;
    private final String validJson = "{\"title\":\"test\"}";

    @BeforeEach
    void setUp() throws JsonProcessingException {
        event = ThreatRawEvent.builder().title("test").build();
    }

    @Test
    void consume_forwardsEvent_whenAccepted() throws JsonProcessingException {
        when(objectMapper.readValue(validJson, ThreatRawEvent.class)).thenReturn(event);
        when(deduplicationService.check(event)).thenReturn(DeduplicationResult.accepted("hash123"));

        consumer.consume(validJson, "raw-threats", 0, 100L, acknowledgment);

        verify(rawThreatForwarder).forward(event, "hash123");
        verify(acknowledgment).acknowledge();
    }

    @Test
    void consume_doesNotForward_whenDuplicate() throws JsonProcessingException {
        when(objectMapper.readValue(validJson, ThreatRawEvent.class)).thenReturn(event);
        when(deduplicationService.check(event)).thenReturn(DeduplicationResult.duplicate("hash123"));

        consumer.consume(validJson, "raw-threats", 0, 100L, acknowledgment);

        verify(rawThreatForwarder, never()).forward(any(), anyString());
    }

    @Test
    void consume_doesNotThrow_onMalformedJson() throws JsonProcessingException {
        String badJson = "invalid";
        when(objectMapper.readValue(badJson, ThreatRawEvent.class)).thenThrow(new JsonProcessingException("error") {});

        // Should not throw
        consumer.consume(badJson, "raw-threats", 0, 100L, acknowledgment);
        
        verify(deduplicationService, never()).check(any());
    }
    @Test
    void failedDelivery_isRetried_withoutAcknowledgmentOrBloomMark() throws Exception {
        when(objectMapper.readValue(validJson, ThreatRawEvent.class)).thenReturn(event);
        when(deduplicationService.check(event)).thenReturn(DeduplicationResult.accepted("hash123"));
        doThrow(new IllegalStateException("Kafka unavailable")).when(rawThreatForwarder).forward(event, "hash123");
        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class,
                () -> consumer.consume(validJson, "raw-threats", 0, 100L, acknowledgment));
        verify(acknowledgment, never()).acknowledge();
        verify(deduplicationService, never()).markForwarded(anyString());
    }

}
