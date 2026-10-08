package com.crimelens.backend.shield;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.web.client.RestTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import com.crimelens.backend.repository.ThreatRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class ShieldScanServiceTest {
 @Test void outagesDoNotBecomeSafe(){var redis=mock(StringRedisTemplate.class);var http=mock(RestTemplate.class);var threats=mock(ThreatRepository.class);when(threats.findHighSeverityTexts(any())).thenReturn(List.of());when(http.postForObject(anyString(),any(),eq(Map.class))).thenThrow(new RuntimeException());var service=new ShieldScanService(redis,http,new ObjectMapper(),threats);ReflectionTestUtils.setField(service,"aiUrl","http://localhost:1");assertEquals("SUSPICIOUS",service.scan("https://example.com",true).verdict());}
 @Test void knownBadFromIncidentTextWins(){var redis=mock(StringRedisTemplate.class);var http=mock(RestTemplate.class);var threats=mock(ThreatRepository.class);when(threats.findHighSeverityTexts(any())).thenReturn(List.of("Avoid https://fraud.example/login as reported by citizens"));when(http.postForObject(anyString(),any(),eq(Map.class))).thenReturn(Map.of("data",Map.of("score",0,"reasons",List.of(),"category","OTHER")));var service=new ShieldScanService(redis,http,new ObjectMapper(),threats);ReflectionTestUtils.setField(service,"aiUrl","http://ai");assertEquals(100,service.scan("https://fraud.example",true).score());}
 @Test void cachedVerdictSkipsAi(){var redis=mock(StringRedisTemplate.class);var values=mock(ValueOperations.class);when(redis.opsForValue()).thenReturn(values);when(values.get(anyString())).thenReturn("{\"verdict\":\"DANGEROUS\",\"score\":95,\"reasons\":[\"Known bad\"],\"category\":\"PHISHING\"}");var http=mock(RestTemplate.class);var service=new ShieldScanService(redis,http,new ObjectMapper(),mock(ThreatRepository.class));assertEquals(95,service.scan("https://fraud.example",true).score());verifyNoInteractions(http);}
 @Test void fallbackRateLimitEnforcesQuota(){var redis=mock(StringRedisTemplate.class);var rate=new ShieldRateLimiter(redis);for(int n=0;n<30;n++)rate.check("test-identity",false);assertThrows(org.springframework.web.server.ResponseStatusException.class,()->rate.check("test-identity",false));}
}
