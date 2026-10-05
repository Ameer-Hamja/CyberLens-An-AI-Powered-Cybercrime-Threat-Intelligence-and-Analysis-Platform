package com.crimelens.backend.ingestion.cybercrimeGov;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class CybercrimeGovScraper {

    @Value("${ingestion.cybercrimeGov.baseUrl:https://cybercrime.gov.in}")
    private String baseUrl;

    public List<ScrapedPage> scrapeAdvisories() {
        List<ScrapedPage> pages = new ArrayList<>();
        try {
            Document doc = Jsoup.connect(baseUrl + "/awareness")
                    .userAgent("Mozilla/5.0 (compatible; CrimeLens-Bot/1.0)")
                    .followRedirects(false)
                    .timeout(10000)
                    .get();

            Elements elements = doc.select("div.advisory-card, article.awareness-item, div.news-item");
            
            for (Element element : elements) {
                if (pages.size() >= 20) break;

                Element titleElem = element.select("h2, h3, .title").first();
                String title = titleElem != null ? titleElem.text() : "Unknown Title";

                Element linkElem = element.select("a[href]").first();
                String link = linkElem != null ? linkElem.absUrl("href") : "";

                Element snippetElem = element.select("p, .description, .content").first();
                String snippet = snippetElem != null ? snippetElem.text() : "";

                String content = snippet;
                if (!link.isEmpty() && link.startsWith("http")) {
                    String fullContent = fetchPageContent(link);
                    if (!fullContent.isEmpty()) {
                        content = fullContent;
                    }
                }

                pages.add(ScrapedPage.builder()
                        .title(title)
                        .url(link.isEmpty() ? baseUrl + "/awareness#" + title.hashCode() : link)
                        .content(content)
                        .section("Awareness")
                        .build());
            }
            return pages;
        } catch (Exception e) {
            log.warn("Failed to scrape Cybercrime.gov.in advisories: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private String fetchPageContent(String url) {
        try {
            var target = java.net.URI.create(url);
            var origin = java.net.URI.create(baseUrl);
            if (!"https".equalsIgnoreCase(target.getScheme()) || !origin.getHost().equalsIgnoreCase(target.getHost()) || target.getUserInfo() != null) return "";
            String text = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (compatible; CrimeLens-Bot/1.0)")
                    .followRedirects(false)
                    .timeout(8000)
                    .get()
                    .body()
                    .text();
            return text.length() > 3000 ? text.substring(0, 3000) : text;
        } catch (Exception e) {
            log.debug("Failed to fetch full page content for {}: {}", url, e.getMessage());
            return "";
        }
    }
}
