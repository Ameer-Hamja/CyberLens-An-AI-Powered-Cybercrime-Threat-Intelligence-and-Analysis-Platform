package com.crimelens.backend.ingestion.cybercrimeGov;

import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.ingestion.IngestionMetrics;
import com.crimelens.backend.ingestion.IngestionPublisher;
import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "ingestion.enabled", havingValue = "true", matchIfMissing = true)
@Slf4j
@RequiredArgsConstructor
public class CybercrimeGovIngestionJob {

    private final CybercrimeGovScraper scraper;
    private final IngestionPublisher publisher;
    private final IngestionMetrics metrics;

    @Scheduled(fixedDelayString = "${ingestion.cybercrimeGov.fixedDelay:1800000}",
               initialDelayString = "${ingestion.cybercrimeGov.initialDelay:20000}")
    public void fetchAndPublish() {
        try {
            metrics.recordJobExecution(SourceType.CYBERCRIME_GOV);
            List<ScrapedPage> pages = scraper.scrapeAdvisories();
            int count = 0;

            for (ScrapedPage page : pages) {
                Map<String, String> meta = new HashMap<>();
                meta.put("page_title", page.getTitle());
                meta.put("section", page.getSection());

                ThreatRawEvent event = ThreatRawEvent.builder()
                        .sourceUrl(page.getUrl())
                        .title(page.getTitle())
                        .rawText(page.getContent() + " " + page.getTitle())
                        .sourceType(SourceType.CYBERCRIME_GOV)
                        .publishedAt(Instant.now())
                        .metadata(meta)
                        .build();

                publisher.publish(event);
                count++;
            }
            log.info("Successfully fetched and published {} events from Cybercrime.gov.in", count);
        } catch (Exception e) {
            log.error("Error during Cybercrime.gov.in ingestion job execution", e);
        }
    }
}
