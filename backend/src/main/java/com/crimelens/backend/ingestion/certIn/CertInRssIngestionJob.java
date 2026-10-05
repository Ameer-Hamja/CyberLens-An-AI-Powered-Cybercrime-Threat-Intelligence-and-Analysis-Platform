package com.crimelens.backend.ingestion.certIn;

import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.ingestion.IngestionMetrics;
import com.crimelens.backend.ingestion.IngestionPublisher;
import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import com.rometools.rome.feed.synd.SyndCategory;
import com.rometools.rome.feed.synd.SyndEntry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "ingestion.enabled", havingValue = "true", matchIfMissing = true)
@Slf4j
@RequiredArgsConstructor
public class CertInRssIngestionJob {

    private final RomeFeedParser romeFeedParser;
    private final IngestionPublisher ingestionPublisher;
    private final IngestionMetrics metrics;

    @Value("${ingestion.certIn.feedUrl}")
    private String feedUrl;

    private static final Pattern ADVISORY_ID_PATTERN = Pattern.compile("CIAD-\\d{4}-\\d{4}");

    @Scheduled(fixedDelayString = "${ingestion.certIn.fixedDelay:900000}",
               initialDelayString = "${ingestion.certIn.initialDelay:10000}")
    public void fetchAndPublish() {
        try {
            metrics.recordJobExecution(SourceType.CERT_IN);
            List<SyndEntry> entries = romeFeedParser.parse(feedUrl);
            int count = 0;

            for (SyndEntry entry : entries) {
                String desc = entry.getDescription() != null ? entry.getDescription().getValue() : "";
                String rawText = stripHtml(desc) + " " + entry.getTitle();
                
                Instant publishedAt = entry.getPublishedDate() != null ? 
                        entry.getPublishedDate().toInstant() : Instant.now();

                Map<String, String> meta = new HashMap<>();
                meta.put("advisory_id", extractAdvisoryId(entry.getUri()));
                meta.put("category", extractCategory(entry.getCategories()));

                ThreatRawEvent event = ThreatRawEvent.builder()
                        .sourceUrl(entry.getLink())
                        .title(entry.getTitle())
                        .rawText(rawText)
                        .sourceType(SourceType.CERT_IN)
                        .publishedAt(publishedAt)
                        .metadata(meta)
                        .build();

                ingestionPublisher.publish(event);
                count++;
            }
            log.info("Successfully fetched and published {} events from CERT-In", count);
        } catch (Exception e) {
            log.error("Error during CERT-In ingestion job execution", e);
        }
    }

    private String stripHtml(String html) {
        if (html == null || html.isEmpty()) return "";
        return Jsoup.parse(html).text();
    }

    private String extractAdvisoryId(String uri) {
        if (uri == null) return "UNKNOWN";
        Matcher matcher = ADVISORY_ID_PATTERN.matcher(uri);
        if (matcher.find()) {
            return matcher.group();
        }
        return "UNKNOWN";
    }

    private String extractCategory(List<SyndCategory> cats) {
        if (cats == null || cats.isEmpty()) {
            return "General";
        }
        return cats.stream()
                .map(SyndCategory::getName)
                .collect(Collectors.joining(", "));
    }
}
