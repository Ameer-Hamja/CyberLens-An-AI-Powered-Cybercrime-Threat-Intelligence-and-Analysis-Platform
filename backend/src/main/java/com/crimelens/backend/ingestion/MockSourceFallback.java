package com.crimelens.backend.ingestion;
import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.Map;
@Component @RequiredArgsConstructor @Slf4j
public class MockSourceFallback {
    private final IngestionPublisher publisher;
    public void publish(SourceType source) {
        log.warn("{} unavailable or empty; publishing explicitly labeled synthetic fallback", source);
        publisher.publish(ThreatRawEvent.builder()
                .sourceUrl("https://example.invalid/fallback/" + source)
                .title("Synthetic fallback awareness example")
                .rawText("[Synthetic fallback " + source + "] Maharashtra: A phishing SMS impersonates a bank and asks for OTP credentials through a fraudulent link.")
                .sourceType(SourceType.MANUAL).publishedAt(Instant.now())
                .metadata(Map.of("mock", "true", "unavailable_source", source.name())).build());
    }
}
