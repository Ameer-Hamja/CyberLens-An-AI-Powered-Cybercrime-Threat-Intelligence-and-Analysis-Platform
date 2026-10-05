package com.crimelens.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeatmapDTO implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private String stateName;
    private Long count;
    private Double avgSeverity;
    private Double lat;
    private Double lng;

    /** JPA @Query projection constructor — lat/lng populated post-query. */
    public HeatmapDTO(String stateName, Long count, Double avgSeverity) {
        this.stateName = stateName;
        this.count = count;
        this.avgSeverity = avgSeverity;
    }
}
