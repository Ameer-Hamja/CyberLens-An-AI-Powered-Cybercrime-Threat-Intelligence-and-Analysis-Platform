package com.crimelens.backend.dedup;

import com.crimelens.backend.config.KafkaTopics;
import com.crimelens.backend.dto.ApiResponse;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.entity.ThreatType;
import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class RawThreatForwarder {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    public void forward(ThreatRawEvent event, String contentHash) {
        ClassificationResponse response = null;
        try {
            String url = aiServiceUrl + "/classify/";
            ClassificationRequest req = ClassificationRequest.builder()
                    .text(event.getRawText())
                    .sourceUrl(event.getSourceUrl())
                    .rawMetadata(event.getMetadata())
                    .build();

            ResponseEntity<ApiResponse<ClassificationResponse>> apiResponse = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(req), new ParameterizedTypeReference<>() {});
            if (apiResponse.getStatusCode().is2xxSuccessful() && apiResponse.getBody() != null
                    && apiResponse.getBody().isSuccess() && apiResponse.getBody().getData() != null) {
                response = apiResponse.getBody().getData();
                response.setRawText(event.getRawText());
                response.setContentHash(contentHash);
                response.setSourceUrl(event.getSourceUrl());
                response.setSourceType(event.getSourceType());
                response.setPublishedAt(event.getPublishedAt());
            }
        } catch (ResourceAccessException e) {
            log.warn("AI service unreachable, using stub classifier");
            response = stubClassify(event, contentHash);
        } catch (HttpServerErrorException e) {
            log.error("AI service error {}: {}", e.getStatusCode(), e.getMessage());
            response = stubClassify(event, contentHash);
        } catch (Exception e) {
            log.error("Unexpected error calling AI service: {}", e.getMessage());
            response = stubClassify(event, contentHash);
        }

        if (response == null) {
            response = stubClassify(event, contentHash);
        }
        if (response != null) {
            try {
                String json = objectMapper.writeValueAsString(response);
                kafkaTemplate.send(KafkaTopics.CLASSIFIED_THREATS, contentHash, json);
            } catch (Exception e) {
                log.error("Failed to serialize or publish classified response: {}", e.getMessage());
            }
        }
    }

    private ClassificationResponse stubClassify(ThreatRawEvent event, String contentHash) {
        String text = event.getRawText() != null ? event.getRawText().toLowerCase() : "";
        ThreatType type = ThreatType.OTHER;

        if (text.contains("phish") || text.contains("fake website") || text.contains("fraudulent link")) {
            type = ThreatType.PHISHING;
        } else if (text.contains("upi") || text.contains("payment") || text.contains("transfer")) {
            type = ThreatType.UPI_FRAUD;
        } else if (text.contains("kyc") || text.contains("know your customer") || text.contains("account suspend")) {
            type = ThreatType.KYC_SCAM;
        } else if (text.contains("otp") || text.contains("one time password")) {
            type = ThreatType.OTP_THEFT;
        } else if (text.contains("sim swap") || text.contains("sim port")) {
            type = ThreatType.SIM_SWAP;
        } else if (text.contains("ransom") || text.contains("encrypt") || text.contains("decrypt")) {
            type = ThreatType.RANSOMWARE;
        } else if (text.contains("call") || text.contains("vish") || text.contains("voice")) {
            type = ThreatType.VISHING;
        }

        return ClassificationResponse.builder()
            .rawText(event.getRawText())
                .threatType(type.name())
                .severity(3)
                .confidence(0.5)
                .detectedLanguage("en")
                .geoTags(List.of("India"))
                .citizenExplanation("Potential " + type.name().replace("_", " ").toLowerCase() + " threat detected. Exercise caution.")
                .contentHash(contentHash)
                .sourceUrl(event.getSourceUrl())
                .sourceType(event.getSourceType())
                .publishedAt(event.getPublishedAt())
                .build();
    }
}
