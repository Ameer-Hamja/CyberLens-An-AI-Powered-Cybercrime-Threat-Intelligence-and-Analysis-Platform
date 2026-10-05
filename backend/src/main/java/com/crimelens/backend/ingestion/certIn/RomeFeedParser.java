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
            SyndFeedInput input = new SyndFeedInput();
            SyndFeed feed = input.build(new XmlReader(new URL(feedUrl)));
            return feed.getEntries();
        } catch (MalformedURLException e) {
            log.error("Malformed feed URL: {}", feedUrl, e);
            return Collections.emptyList();
        } catch (FeedException e) {
            log.error("Failed to parse feed from URL: {}", feedUrl, e);
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Unexpected error fetching feed from URL: {}", feedUrl, e);
            return Collections.emptyList();
        }
    }
}
