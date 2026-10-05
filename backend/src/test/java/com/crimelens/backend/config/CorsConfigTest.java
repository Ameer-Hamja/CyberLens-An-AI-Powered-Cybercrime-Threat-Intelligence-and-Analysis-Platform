package com.crimelens.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;

class CorsConfigTest {
    @Test
    void allowsConfiguredHostedFrontend() {
        var source = new CorsConfig().corsConfigurationSource("https://cyberlens.example.com");
        var config = source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/stats"));
        assertNotNull(config);
        assertEquals("https://cyberlens.example.com", config.checkOrigin("https://cyberlens.example.com"));
        assertNull(config.checkOrigin("https://untrusted.example.com"));
    }

    @Test
    void retainsLocalDevelopmentOrigin() {
        var source = new CorsConfig().corsConfigurationSource("https://cyberlens.example.com");
        var config = source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/stats"));
        assertNotNull(config);
        assertEquals("http://localhost:3000", config.checkOrigin("http://localhost:3000"));
    }
}
