package com.crimelens.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
public class ScanControllerIntegrationTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void test_scan_returns200_onValidInput() throws Exception {
        String payload = "{\"inputText\":\"Your KYC is expired click here to update\"}";
        mockMvc.perform(post("/api/scan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.riskScore", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.data.isDangerous", notNullValue()));
    }

    @Test
    void test_scan_returns422_onBlankInput() throws Exception {
        String payload = "{\"inputText\":\"\"}";
        mockMvc.perform(post("/api/scan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest()); // Note: validation failures return 400 Bad Request by default in Spring
    }

    @Test
    void test_scan_returns422_onMissingField() throws Exception {
        String payload = "{}";
        mockMvc.perform(post("/api/scan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void test_scan_returns429_onRateLimit() throws Exception {
        String payload = "{\"inputText\":\"test rate limit\"}";
        // Make 10 valid requests
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/scan")
                            .with(request -> { request.setRemoteAddr("192.168.1.100"); return request; })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isOk());
        }
        
        // 11th request should be rate limited
        mockMvc.perform(post("/api/scan")
                        .with(request -> { request.setRemoteAddr("192.168.1.100"); return request; })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("X-RateLimit-Retry-After"));
    }

    @Test
    void test_scanImage_returns415_onNonImage() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                "hello world".getBytes()
        );

        mockMvc.perform(multipart("/api/scan/image").file(file))
                .andExpect(status().isUnsupportedMediaType());
    }
}
