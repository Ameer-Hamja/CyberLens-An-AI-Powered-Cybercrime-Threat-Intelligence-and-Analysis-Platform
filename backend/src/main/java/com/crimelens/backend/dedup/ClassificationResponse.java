package com.crimelens.backend.dedup;

import com.fasterxml.jackson.annotation.JsonAlias;

import com.crimelens.backend.entity.SourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassificationResponse {
    private String rawText;
    @JsonAlias("threat_type")
    private String threatType;
    private Integer severity;
    private Double confidence;
    @JsonAlias("detected_language")
    private String detectedLanguage;
    @JsonAlias("geo_tags")
    private List<String> geoTags;
    @JsonAlias("citizen_explanation")
    private String citizenExplanation;
    private String contentHash;
    private String sourceUrl;
    private SourceType sourceType;
    private Instant publishedAt;
}
