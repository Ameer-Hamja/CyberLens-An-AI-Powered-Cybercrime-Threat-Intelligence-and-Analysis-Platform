package com.crimelens.backend.dedup;

import com.crimelens.backend.config.KafkaTopics;
import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class RawThreatConsumer {

    private final DeduplicationService deduplicationService;
    private final RawThreatForwarder rawThreatForwarder;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = KafkaTopics.RAW_THREATS,
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(@Payload String message,
                        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        @Header(KafkaHeaders.OFFSET) long offset) {
        log.debug("Received raw event: topic={}, partition={}, offset={}", topic, partition, offset);

        try {
            ThreatRawEvent event = objectMapper.readValue(message, ThreatRawEvent.class);
            DeduplicationResult result = deduplicationService.check(event);

            if (result.isAccepted()) {
                rawThreatForwarder.forward(event, result.getContentHash());
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize raw event at offset {}: {}", offset, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error processing event at offset {}: {}", offset, e.getMessage());
        }
    }
}
