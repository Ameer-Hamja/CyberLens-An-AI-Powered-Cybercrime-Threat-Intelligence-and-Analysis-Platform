package com.crimelens.backend.controller;

import com.crimelens.backend.config.ClientIpResolver;
import com.crimelens.backend.exception.GlobalExceptionHandler;
import com.crimelens.backend.pipeline.ScanLogService;
import com.crimelens.backend.repository.ScanLogRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.client.RestTemplate;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.http.MediaType;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuditRegressionTest {
    @Test void ignoresSpoofedForwardedHeaderUnlessProxyExplicitlyTrusted() {
        var request = new MockHttpServletRequest();
        request.setRemoteAddr("192.0.2.1"); request.addHeader("X-Real-IP", "198.51.100.1");
        assertEquals("192.0.2.1", new ClientIpResolver("").resolve(request));
        assertEquals("198.51.100.1", new ClientIpResolver("192.0.2.1").resolve(request));
    }
    @Test void nonImageAndMissingMimeProduce415InsteadOf500() throws Exception {
        var controller = new ScanController(mock(ScanLogService.class), new RateLimiterService(), new ClientIpResolver(""), mock(ScanLogRepository.class), new SimpleMeterRegistry(), new RestTemplate());
        var mvc = MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(new GlobalExceptionHandler()).build();
        for (String mime : new String[]{"text/plain", null}) {
            mvc.perform(multipart("/api/scan/image").file(new MockMultipartFile("file", "test.txt", mime, "hello".getBytes())))
               .andExpect(status().isUnsupportedMediaType()).andExpect(jsonPath("$.success").value(false));
        }
    }
    @Test void malformedJsonProduces400() throws Exception {
        var controller = new ScanController(mock(ScanLogService.class), new RateLimiterService(), new ClientIpResolver(""), mock(ScanLogRepository.class), new SimpleMeterRegistry(), new RestTemplate());
        MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(new GlobalExceptionHandler()).build()
            .perform(post("/api/scan").contentType(MediaType.APPLICATION_JSON).content("{bad"))
            .andExpect(status().isBadRequest());
    }
}
