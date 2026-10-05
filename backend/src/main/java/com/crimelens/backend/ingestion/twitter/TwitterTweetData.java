package com.crimelens.backend.ingestion.twitter;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TwitterTweetData {
    private String id;
    private String text;
    @JsonProperty("created_at")
    private Instant createdAt;
    @JsonProperty("author_id")
    private String authorId;
    @JsonProperty("public_metrics")
    private TwitterPublicMetrics publicMetrics;
}
