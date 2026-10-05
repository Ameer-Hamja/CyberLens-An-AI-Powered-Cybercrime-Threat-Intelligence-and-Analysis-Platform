package com.crimelens.backend.ingestion.model;

import com.crimelens.backend.entity.SourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThreatRawEvent {
    private String sourceUrl;
    private String rawText;
    private String title;
    private SourceType sourceType;
    private Instant publishedAt;
    private Map<String, String> metadata;
}
