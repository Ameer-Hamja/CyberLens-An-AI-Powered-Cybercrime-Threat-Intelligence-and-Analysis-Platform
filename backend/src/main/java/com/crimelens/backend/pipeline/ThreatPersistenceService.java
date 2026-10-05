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
    private final com.crimelens.backend.dedup.BloomFilterService bloomFilterService;

    public Threat persist(ClassificationResponse response) {
        if (response.getContentHash() == null || !response.getContentHash().matches("[0-9a-f]{64}")) {
            throw new IllegalArgumentException("Classified event requires a SHA-256 fingerprint");
        }
        var existing = threatRepository.findByContentHash(response.getContentHash());
        if (existing.isPresent()) return existing.get();
        Threat threat = new Threat();
        threat.setContentHash(response.getContentHash());
        threat.setSourceUrl(response.getSourceUrl());
        threat.setRawText(truncate(response.getRawText(), 5000));
        threat.setThreatType(ThreatType.valueOf(response.getThreatType()));
        threat.setSeverity(response.getSeverity());
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

        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
            new org.springframework.transaction.support.TransactionSynchronization() {
                @Override public void afterCommit() {
                    bloomFilterService.add(response.getContentHash());
                    elasticsearchIndexService.indexAsync(saved);
                }
            });

        log.info("Persisted threat: id={}, type={}, severity={}, geo={}", saved.getId(), saved.getThreatType(), saved.getSeverity(), response.getGeoTags());

        return saved;
    }

    private String truncate(String text, int maxLen) {
        return text == null ? null : text.length() > maxLen ? text.substring(0, maxLen) : text;
    }
}
