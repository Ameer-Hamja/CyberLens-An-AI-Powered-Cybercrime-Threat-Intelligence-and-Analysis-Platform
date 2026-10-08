package com.crimelens.backend.pipeline;

import com.crimelens.backend.config.KafkaTopics;
import com.crimelens.backend.dedup.ClassificationResponse;
import com.crimelens.backend.entity.Threat;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class ClassifiedThreatConsumer {

    private final ThreatPersistenceService threatPersistenceService;
    private final WebSocketBroadcastService webSocketBroadcastService;
    private final ObjectMapper objectMapper;
    private final PipelineMetrics pipelineMetrics;

    @KafkaListener(
            topics = KafkaTopics.CLASSIFIED_THREATS,
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory",
            concurrency = "3"
    )
    public void consume(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment
    ) {
        log.debug("Consuming classified event: partition={}, offset={}", partition, offset);

        try {
            ClassificationResponse response = objectMapper.readValue(message, ClassificationResponse.class);
            Threat saved = threatPersistenceService.persist(response);
            webSocketBroadcastService.broadcast(saved);
            pipelineMetrics.recordProcessed(response.getSourceType());
            pipelineMetrics.recordPersisted();
            acknowledgment.acknowledge();
        } catch (JsonProcessingException e) {
            log.error("Poison pill at offset {}: {}", offset, e.getMessage());
            acknowledgment.acknowledge();
            pipelineMetrics.recordFailed();
        } catch (DataIntegrityViolationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to process classified event at offset {}: {}", offset, e.getMessage());
            pipelineMetrics.recordFailed();
            throw new IllegalStateException("Classified event processing failed", e);
        }
    }
}
