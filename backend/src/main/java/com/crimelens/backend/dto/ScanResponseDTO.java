package com.crimelens.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanResponseDTO {
    @JsonAlias("risk_score")
    private Integer riskScore;
    @JsonAlias("threat_type")
    private String threatType;
    private String explanation;
    @JsonAlias("is_dangerous")
    private Boolean isDangerous;
    private List<String> indicators;
    @JsonAlias("classifier_used")
    private String classifierUsed;
    @JsonAlias("processing_time_ms")
    private Double processingTimeMs;
}
