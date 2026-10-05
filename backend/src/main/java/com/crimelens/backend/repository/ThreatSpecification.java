package com.crimelens.backend.repository;

import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.entity.Threat;
import com.crimelens.backend.entity.ThreatType;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;

public class ThreatSpecification {

    public static Specification<Threat> hasType(ThreatType type) {
        return (root, query, cb) ->
                type == null ? cb.conjunction()
                        : cb.equal(root.get("threatType"), type);
    }

    public static Specification<Threat> minSeverity(Integer severity) {
        return (root, query, cb) ->
                severity == null ? cb.conjunction()
                        : cb.greaterThanOrEqualTo(
                        root.get("severity"), severity);
    }

    public static Specification<Threat> createdAfter(Instant since) {
        return (root, query, cb) ->
                since == null ? cb.conjunction()
                        : cb.greaterThanOrEqualTo(
                        root.get("createdAt"), since);
    }

    public static Specification<Threat> fromSource(SourceType source) {
        return (root, query, cb) ->
                source == null ? cb.conjunction()
                        : cb.equal(root.get("sourceType"), source);
    }
}
