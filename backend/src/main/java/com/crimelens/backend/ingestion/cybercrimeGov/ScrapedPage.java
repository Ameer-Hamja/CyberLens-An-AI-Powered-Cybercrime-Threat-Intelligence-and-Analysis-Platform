package com.crimelens.backend.ingestion.cybercrimeGov;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScrapedPage {
    private String title;
    private String url;
    private String content;
    private String section;
}
