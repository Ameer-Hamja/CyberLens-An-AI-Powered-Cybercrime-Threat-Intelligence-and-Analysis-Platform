package com.crimelens.backend.ingestion.twitter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class TwitterApiClient {

    @Value("#{'${ingestion.twitter.keywords:UPI fraud,phishing India,KYC scam,OTP fraud,cyber fraud India,cybercrime alert India}'.split(',')}")
    private List<String> keywords;

    private final RestTemplate twitterRestTemplate;

    public TwitterApiClient(@Qualifier("twitterRestTemplate") RestTemplate twitterRestTemplate) {
        this.twitterRestTemplate = twitterRestTemplate;
    }

    public List<TwitterTweetData> searchRecentTweets(Instant since) {
        try {
            String query = String.join(" OR ", keywords) + " -is:retweet lang:en";

            String url = UriComponentsBuilder.fromHttpUrl("https://api.twitter.com/2/tweets/search/recent")
                    .queryParam("query", query)
                    .queryParam("start_time", since.toString())
                    .queryParam("max_results", 50)
                    .queryParam("tweet.fields", "created_at,author_id,public_metrics,entities")
                    .queryParam("expansions", "author_id")
                    .toUriString();

            TwitterSearchResponse response = twitterRestTemplate.getForObject(url, TwitterSearchResponse.class);

            if (response != null && response.getData() != null) {
                return response.getData();
            }
            return Collections.emptyList();
        } catch (HttpClientErrorException.TooManyRequests e) {
            log.warn("Twitter rate limit hit, backing off");
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Error fetching tweets from Twitter API", e);
            return Collections.emptyList();
        }
    }
}
