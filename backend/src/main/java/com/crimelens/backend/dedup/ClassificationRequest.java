package com.crimelens.backend.dedup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassificationRequest {
    private String text;
    private String sourceUrl;
    private Map<String, String> rawMetadata;
}
