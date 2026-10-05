package com.crimelens.backend.config;

import com.crimelens.backend.dto.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.redis.serializer.JdkSerializationRedisSerializer;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ResponseSerializationTest {
    @Test
    void cachedResponsesRoundTrip() {
        var serializer = new JdkSerializationRedisSerializer();
        var threat = ThreatDTO.builder().id(UUID.randomUUID()).createdAt(Instant.now()).build();
        List<Object> payloads = List.of(
                PagedResponse.of(new PageImpl<>(List.of(threat))),
                new StatsDTO(),
                List.of(new HeatmapDTO()),
                Map.of("OTHER", new TypeStatsDTO()),
                List.of(new ThreatSummaryDTO()),
                List.of(new TrendDTO()));
        for (Object payload : payloads) {
            var response = ApiResponse.ok(payload);
            assertEquals(response, serializer.deserialize(serializer.serialize(response)));
        }
    }

    @Test
    void aiSnakeCaseFieldsPreserveFrontendCamelCaseContract() throws Exception {
        var mapper = new ObjectMapper();
        var response = mapper.readValue("""
                {"risk_score":85,"threat_type":"OTP_THEFT","explanation":"Never share OTP",
                 "is_dangerous":true,"indicators":[],"classifier_used":"rule_based","processing_time_ms":1.5}
                """, ScanResponseDTO.class);
        assertEquals(85, response.getRiskScore());
        assertEquals("OTP_THEFT", response.getThreatType());
        assertTrue(response.getIsDangerous());
        assertEquals("rule_based", response.getClassifierUsed());
        var json = mapper.readTree(mapper.writeValueAsString(response));
        assertEquals(85, json.get("riskScore").asInt());
        assertFalse(json.has("risk_score"));
    }
}
