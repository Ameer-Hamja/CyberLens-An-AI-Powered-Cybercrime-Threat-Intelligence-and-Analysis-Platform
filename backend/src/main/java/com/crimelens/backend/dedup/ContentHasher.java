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
            if (event == null || event.getSourceType() == null || event.getRawText() == null || event.getRawText().isBlank()) {
                throw new IllegalArgumentException("Raw event requires source type and nonempty text");
            }
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
        String normalized = url.trim();
        if (normalized.endsWith("/")) normalized = normalized.substring(0, normalized.length() - 1);
        return normalized;
    }

    private String normalizeText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "empty";
        }
        return java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFKC)
                .toLowerCase(java.util.Locale.ROOT).replaceAll("\\s+", " ").trim();
    }
}
