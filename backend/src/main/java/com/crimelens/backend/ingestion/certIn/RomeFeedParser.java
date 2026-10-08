package com.crimelens.backend.ingestion.certIn;

import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.FeedException;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class RomeFeedParser {

    @PostConstruct
    public void init() {
        System.setProperty("sun.net.client.defaultConnectTimeout", "5000");
        System.setProperty("sun.net.client.defaultReadTimeout", "5000");
    }

    public List<SyndEntry> parse(String feedUrl) {
        try {
            var connection = new URL(feedUrl).openConnection();
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            try (var reader = new XmlReader(connection)) {
                return new SyndFeedInput().build(reader).getEntries();
            }
        } catch (Exception e) {
            log.warn("CERT-In feed unavailable at {}: {}", feedUrl, e.getMessage());
            return Collections.emptyList();
        }
    }
}
