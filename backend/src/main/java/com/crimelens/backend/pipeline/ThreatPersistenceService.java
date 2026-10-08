package com.crimelens.backend.pipeline;

import com.crimelens.backend.dedup.ClassificationResponse;
import com.crimelens.backend.entity.Threat;
import com.crimelens.backend.entity.ThreatLocation;
import com.crimelens.backend.entity.ThreatType;
import com.crimelens.backend.repository.ThreatLocationRepository;
import com.crimelens.backend.repository.ThreatRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor
public class ThreatPersistenceService {

    private final ThreatRepository threatRepository;
    private final ThreatLocationRepository threatLocationRepository;
    private final ElasticsearchIndexService elasticsearchIndexService;
    private final ObjectMapper objectMapper;

    @org.springframework.cache.annotation.CacheEvict(cacheNames = {"threats-live", "threats-heatmap", "threats-trends", "threats-summary", "stats", "stats-by-type", "stats-by-state"}, allEntries = true)
    public Threat persist(ClassificationResponse response) {
        Threat threat = new Threat();
        threat.setSourceUrl(response.getSourceUrl());
        threat.setRawText(truncate(response.getRawText(), 5000));
        threat.setThreatType(ThreatType.valueOf(response.getThreatType()));
        threat.setSeverity(response.getSeverity() == null ? 1 : Math.max(1, Math.min(5, response.getSeverity())));
        threat.setConfidence(response.getConfidence());
        threat.setDetectedLanguage(response.getDetectedLanguage());
        threat.setCitizenExplanation(response.getCitizenExplanation());
        threat.setSourceType(response.getSourceType());
        threat.setCreatedAt(response.getPublishedAt() != null ? response.getPublishedAt() : Instant.now());

        try {
            threat.setGeoTags(objectMapper.writeValueAsString(response.getGeoTags()));
        } catch (JsonProcessingException e) {
            threat.setGeoTags("[]");
        }

        Threat saved = threatRepository.save(threat);

        if (response.getGeoTags() != null) {
            for (String geoTag : response.getGeoTags()) {
                LatLng coords = GeoCoordinates.forState(geoTag);
                if (coords != null) {
                    ThreatLocation loc = new ThreatLocation();
                    loc.setThreat(saved);
                    loc.setStateName(geoTag);
                    loc.setLat(coords.lat());
                    loc.setLng(coords.lng());
                    threatLocationRepository.save(loc);
                }
            }
        }

        elasticsearchIndexService.indexAsync(saved);

        log.info("Persisted threat: id={}, type={}, severity={}, geo={}", saved.getId(), saved.getThreatType(), saved.getSeverity(), response.getGeoTags());

        return saved;
    }

    private String truncate(String text, int maxLen) {
        return text == null ? null : text.length() > maxLen ? text.substring(0, maxLen) : text;
    }
}
