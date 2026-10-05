package com.crimelens.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsDTO implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Long totalThreats;
    private Long threatsToday;
    private Long threatsThisWeek;
    private Long threatsThisMonth;
    private Double avgSeverity;
    private Long highSeverityCount;
    private Long totalScans;
    private String topState;
    private String topThreatType;
}
