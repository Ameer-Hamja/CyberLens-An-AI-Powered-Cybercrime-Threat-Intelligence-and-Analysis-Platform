package com.crimelens.backend.ingestion.twitter;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TwitterMeta {
    private String newestId;
    private String oldestId;
    private Integer resultCount;
    private String nextToken;
}
