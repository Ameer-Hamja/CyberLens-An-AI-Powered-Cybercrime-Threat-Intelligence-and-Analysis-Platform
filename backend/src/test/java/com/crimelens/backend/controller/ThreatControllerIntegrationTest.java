package com.crimelens.backend.controller;

import com.crimelens.backend.entity.Threat;
import com.crimelens.backend.entity.ThreatType;
import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.repository.ThreatRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
public class ThreatControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis/redis-stack:latest"))
            .withExposedPorts(6379);

    @Container
    static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.1"));

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ThreatRepository threatRepository;

    @BeforeEach
    void setUp() {
        threatRepository.deleteAll();
        
        Threat t1 = new Threat();
        t1.setSourceUrl("http://test1.com");
        t1.setRawText("Test phishing");
        t1.setSourceType(SourceType.CERT_IN);
        t1.setThreatType(ThreatType.PHISHING);
        t1.setSeverity(4);
        t1.setCreatedAt(Instant.now());
        threatRepository.save(t1);

        Threat t2 = new Threat();
        t2.setSourceUrl("http://test2.com");
        t2.setRawText("Test ransomware");
        t2.setSourceType(SourceType.TWITTER);
        t2.setThreatType(ThreatType.RANSOMWARE);
        t2.setSeverity(5);
        t2.setCreatedAt(Instant.now());
        threatRepository.save(t2);
    }

    @Test
    void test_getLiveThreats_returns200() throws Exception {
        mockMvc.perform(get("/api/threats/live"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void test_getLiveThreats_filtersByThreatType() throws Exception {
        mockMvc.perform(get("/api/threats/live?threatType=PHISHING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].threatType", is("PHISHING")));
    }

    @Test
    void test_getLiveThreats_filtersByMinSeverity() throws Exception {
        mockMvc.perform(get("/api/threats/live?minSeverity=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].severity", is(5)));
    }

    @Test
    void test_getThreatById_returns404_whenNotFound() throws Exception {
        mockMvc.perform(get("/api/threats/" + UUID.randomUUID()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void test_getHeatmap_returnsStateList() throws Exception {
        mockMvc.perform(get("/api/threats/heatmap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void test_getTrends_defaultsTo30Days() throws Exception {
        mockMvc.perform(get("/api/threats/trends"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.days", is(30)));
    }

    @Test
    void test_subscribe_returns200() throws Exception {
        String payload = "{\"email\":\"test@test.com\",\"states\":[\"Tamil Nadu\"],\"threatTypes\":[\"PHISHING\"]}";
        mockMvc.perform(post("/api/threats/subscribe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", is("Subscribed successfully")));
    }

    @Test
    void test_subscribe_rejectsDuplicateEmail() throws Exception {
        String payload = "{\"email\":\"dup@test.com\",\"states\":[\"Tamil Nadu\"],\"threatTypes\":[\"PHISHING\"]}";
        mockMvc.perform(post("/api/threats/subscribe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/threats/subscribe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", is("Already subscribed")));
    }
}
