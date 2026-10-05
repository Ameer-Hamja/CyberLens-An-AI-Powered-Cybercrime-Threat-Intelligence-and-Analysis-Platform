package com.crimelens.backend.ingestion;

import com.crimelens.backend.config.KafkaTopics;
import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class IngestionPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final IngestionMetrics metrics;

    public void publish(ThreatRawEvent event) {
        try {
            String json = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(KafkaTopics.RAW_THREATS, event.getSourceUrl(), json)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish event: {}", ex.getMessage());
                            metrics.recordFailed(event.getSourceType());
                        } else {
                            log.debug("Published event to partition {}", result.getRecordMetadata().partition());
                            metrics.recordPublished(event.getSourceType());
                        }
                    });
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize ThreatRawEvent: {}", e.getMessage());
            metrics.recordFailed(event.getSourceType());
        }
    }
}
