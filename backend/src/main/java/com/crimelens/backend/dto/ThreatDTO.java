package com.crimelens.backend.dto;

import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.entity.ThreatType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThreatDTO implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private UUID id;
    private String sourceUrl;
    private ThreatType threatType;
    private Integer severity;
    private Double confidence;
    private String detectedLanguage;
    private List<String> geoTags;
    private String citizenExplanation;
    private Instant createdAt;
    private SourceType sourceType;
}
