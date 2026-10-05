package com.crimelens.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class AdminDashboardDTO {
    private Map<String, Object> threats;
    private Map<String, Object> subscriptions;
    private Map<String, Object> bloomFilter;
    private Map<String, Object> system;
}
