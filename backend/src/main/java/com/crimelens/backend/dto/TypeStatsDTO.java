package com.crimelens.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypeStatsDTO implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private String threatType;
    private Long count;
    private Double avgSeverity;
    private Instant lastSeen;
    private Double percentageOfTotal;
}
