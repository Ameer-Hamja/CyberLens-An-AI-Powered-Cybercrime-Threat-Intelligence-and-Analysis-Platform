package com.crimelens.backend.pipeline;

import com.crimelens.backend.dto.ScanRequestDTO;
import com.crimelens.backend.dto.ScanResponseDTO;
import com.crimelens.backend.entity.ScanLog;
import com.crimelens.backend.entity.ThreatType;
import com.crimelens.backend.repository.ScanLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ScanLogService {

    private final ScanLogRepository scanLogRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    public ScanResponseDTO scan(ScanRequestDTO request) {
        String inputHash = sha256(request.getInputText());
        ScanResponseDTO result;
        try {
            ScanRequest aiReq = new ScanRequest(request.getInputText());
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    aiServiceUrl + "/scan/",
                    HttpMethod.POST,
                    new HttpEntity<>(aiReq, jsonHeaders()),
                    new ParameterizedTypeReference<>() {}
            );
            Map<String, Object> body = resp.getBody();
            if (body != null && body.containsKey("data")) {
                result = objectMapper.convertValue(body.get("data"), ScanResponseDTO.class);
            } else {
                result = fallbackScan(request.getInputText());
            }
        } catch (ResourceAccessException e) {
            log.warn("AI service unreachable for scan request");
            result = fallbackScan(request.getInputText());
        } catch (Exception e) {
            log.error("AI service error during scan", e);
            result = fallbackScan(request.getInputText());
        }

        try {
            ScanLog logRecord = new ScanLog();
            logRecord.setInputHash(inputHash);
            logRecord.setRiskScore(result.getRiskScore());
            logRecord.setThreatType(ThreatType.valueOf(result.getThreatType()));
            scanLogRepository.save(logRecord);
        } catch (Exception e) {
            log.warn("Failed to save scan log", e);
        }

        return result;
    }

    private ScanResponseDTO fallbackScan(String text) {
        return ScanResponseDTO.builder()
                .riskScore(50)
                .threatType("OTHER")
                .explanation("We were unable to fully analyze this input right now. Exercise caution and avoid sharing personal information.")
                .isDangerous(false)
                .indicators(List.of("Analysis service temporarily unavailable"))
                .classifierUsed("fallback")
                .processingTimeMs(0.0)
                .build();
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            return "unknown";
        }
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    public String getAiServiceUrl() {
        return aiServiceUrl;
    }
}
