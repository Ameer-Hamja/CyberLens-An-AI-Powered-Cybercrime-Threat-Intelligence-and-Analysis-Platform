package com.crimelens.backend.ingestion;
import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.ingestion.certIn.*;
import com.crimelens.backend.ingestion.cybercrimeGov.*;
import com.crimelens.backend.ingestion.twitter.*;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.mockito.Mockito.*;
class SourceFallbackTest {
    @Test void emptyCertFeed_publishesFallback() {
        var parser = mock(RomeFeedParser.class);
        when(parser.parse(null)).thenReturn(List.of());
        var fallback = mock(MockSourceFallback.class);
        new CertInRssIngestionJob(parser, mock(IngestionPublisher.class), mock(IngestionMetrics.class), fallback).fetchAndPublish();
        verify(fallback).publish(SourceType.CERT_IN);
    }
    @Test void failedScraper_publishesFallback() {
        var scraper = mock(CybercrimeGovScraper.class);
        when(scraper.scrapeAdvisories()).thenThrow(new IllegalStateException("upstream timeout"));
        var fallback = mock(MockSourceFallback.class);
        new CybercrimeGovIngestionJob(scraper, mock(IngestionPublisher.class), mock(IngestionMetrics.class), fallback).fetchAndPublish();
        verify(fallback).publish(SourceType.CYBERCRIME_GOV);
    }
    @Test void emptyTwitterResponse_publishesFallback() {
        var client = mock(TwitterApiClient.class);
        when(client.searchRecentTweets(any())).thenReturn(List.of());
        var fallback = mock(MockSourceFallback.class);
        new TwitterIngestionJob(client, mock(IngestionPublisher.class), mock(IngestionMetrics.class), fallback).fetchAndPublish();
        verify(fallback).publish(SourceType.TWITTER);
    }
}
