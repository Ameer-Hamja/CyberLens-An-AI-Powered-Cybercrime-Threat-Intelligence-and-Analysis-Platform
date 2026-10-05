package com.crimelens.backend.dedup;

import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

@ExtendWith(MockitoExtension.class)
class ContentHasherTest {

    private final ContentHasher hasher = new ContentHasher();

    @Test
    void hash_returnsSameHashForSameContent() {
        ThreatRawEvent event1 = ThreatRawEvent.builder()
                .sourceType(SourceType.CERT_IN)
                .sourceUrl("https://example.com/123")
                .rawText("This is a phishing attempt")
                .build();
                
        ThreatRawEvent event2 = ThreatRawEvent.builder()
                .sourceType(SourceType.CERT_IN)
                .sourceUrl("https://example.com/123")
                .rawText("This is a phishing attempt")
                .build();

        assertEquals(hasher.hash(event1), hasher.hash(event2));
    }

    @Test
    void hash_returnsDifferentHashForDifferentUrls() {
        ThreatRawEvent event1 = ThreatRawEvent.builder()
                .sourceType(SourceType.CERT_IN)
                .sourceUrl("https://example.com/123")
                .rawText("content")
                .build();
                
        ThreatRawEvent event2 = ThreatRawEvent.builder()
                .sourceType(SourceType.CERT_IN)
                .sourceUrl("https://example.com/456")
                .rawText("content")
                .build();

        assertNotEquals(hasher.hash(event1), hasher.hash(event2));
    }

    @Test
    void hash_isInsensitiveToWhitespaceVariations() {
        ThreatRawEvent event1 = ThreatRawEvent.builder()
                .sourceType(SourceType.TWITTER)
                .sourceUrl("http://t.co")
                .rawText("UPI fraud   alert")
                .build();
                
        ThreatRawEvent event2 = ThreatRawEvent.builder()
                .sourceType(SourceType.TWITTER)
                .sourceUrl("http://t.co")
                .rawText("UPI fraud alert")
                .build();

        assertEquals(hasher.hash(event1), hasher.hash(event2));
    }

    @Test
    void hash_isInsensitiveToUrlTrailingSlash() {
        ThreatRawEvent event1 = ThreatRawEvent.builder()
                .sourceType(SourceType.CERT_IN)
                .sourceUrl("https://cert-in.org.in/advisory")
                .rawText("alert")
                .build();
                
        ThreatRawEvent event2 = ThreatRawEvent.builder()
                .sourceType(SourceType.CERT_IN)
                .sourceUrl("https://cert-in.org.in/advisory/")
                .rawText("alert")
                .build();

        assertEquals(hasher.hash(event1), hasher.hash(event2));
    }
}
