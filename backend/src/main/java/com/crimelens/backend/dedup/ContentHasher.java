package com.crimelens.backend.dedup;

import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Component
public class ContentHasher {

    public String hash(ThreatRawEvent event) {
        try {
            String canonical = event.getSourceType().name()
                    + "|" + normalizeUrl(event.getSourceUrl())
                    + "|" + normalizeText(event.getRawText());

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(canonical.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String normalizeUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return "unknown";
        }
        String normalized = url.toLowerCase();
        normalized = normalized.replaceAll("\\?.*", "");
        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String normalizeText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "empty";
        }
        String normalized = text.toLowerCase()
                .replaceAll("[^a-z0-9 ]", "")
                .replaceAll("\\s+", " ")
                .trim();
        
        if (normalized.isEmpty()) {
            return "empty";
        }
        
        return normalized.length() > 500 ? normalized.substring(0, 500) : normalized;
    }
}
