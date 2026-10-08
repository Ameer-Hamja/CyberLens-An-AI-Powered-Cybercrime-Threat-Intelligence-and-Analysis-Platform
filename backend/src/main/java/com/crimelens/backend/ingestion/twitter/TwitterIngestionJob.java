package com.crimelens.backend.ingestion.twitter;

import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.ingestion.IngestionMetrics;
import com.crimelens.backend.ingestion.IngestionPublisher;
import com.crimelens.backend.ingestion.model.ThreatRawEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ingestion.twitter.enabled", havingValue = "true")
public class TwitterIngestionJob {

    private final TwitterApiClient twitterApiClient;
    private final IngestionPublisher publisher;
    private final IngestionMetrics metrics;
    private final com.crimelens.backend.ingestion.MockSourceFallback fallback;

    private Instant lastFetchedAt = Instant.now().minus(1, ChronoUnit.HOURS);

    @Scheduled(fixedDelayString = "${ingestion.twitter.fixedDelay:900000}",
               initialDelayString = "${ingestion.twitter.initialDelay:30000}")
    public void fetchAndPublish() {
        try {
            metrics.recordJobExecution(SourceType.TWITTER);
            List<TwitterTweetData> tweets = twitterApiClient.searchRecentTweets(lastFetchedAt);
            if (tweets.isEmpty()) { fallback.publish(SourceType.TWITTER); return; }
            int count = 0;

            for (TwitterTweetData tweet : tweets) {
                String text = tweet.getText() != null ? tweet.getText() : "";
                String title = text.substring(0, Math.min(100, text.length()));

                Map<String, String> meta = new HashMap<>();
                meta.put("tweet_id", tweet.getId());
                meta.put("author_id", tweet.getAuthorId());
                if (tweet.getPublicMetrics() != null) {
                    meta.put("retweet_count", String.valueOf(tweet.getPublicMetrics().getRetweetCount()));
                    meta.put("like_count", String.valueOf(tweet.getPublicMetrics().getLikeCount()));
                }

                ThreatRawEvent event = ThreatRawEvent.builder()
                        .sourceUrl("https://twitter.com/i/web/status/" + tweet.getId())
                        .rawText(text)
                        .title(title)
                        .sourceType(SourceType.TWITTER)
                        .publishedAt(tweet.getCreatedAt() != null ? tweet.getCreatedAt() : Instant.now())
                        .metadata(meta)
                        .build();

                publisher.publish(event);
                count++;
            }
            
            lastFetchedAt = Instant.now();
            log.info("Successfully fetched and published {} tweets", count);
        } catch (Exception e) {
            fallback.publish(SourceType.TWITTER);
            log.error("Error during Twitter ingestion job execution", e);
        }
    }
}
