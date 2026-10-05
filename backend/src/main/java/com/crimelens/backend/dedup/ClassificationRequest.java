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
    @com.fasterxml.jackson.annotation.JsonProperty("source_url")
    private String sourceUrl;
    @com.fasterxml.jackson.annotation.JsonProperty("raw_metadata")
    private Map<String, String> rawMetadata;
}
