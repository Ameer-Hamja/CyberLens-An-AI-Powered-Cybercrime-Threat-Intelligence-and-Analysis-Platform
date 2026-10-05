package com.crimelens.backend.ingestion.twitter;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TwitterSearchResponse {
    private List<TwitterTweetData> data;
    private TwitterMeta meta;
}
