package com.crimelens.backend.pipeline;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ElasticsearchQueryService {

    private final ElasticsearchOperations elasticsearchOperations;
    private final com.crimelens.backend.repository.ThreatRepository threatRepository;

    public List<ThreatDocument> search(String query, String threatType, String state, int page, int size) {
        try {
            NativeQuery searchQuery = NativeQuery.builder()
                    .withQuery(q -> q
                            .bool(b -> {
                                b.must(m -> m
                                        .multiMatch(mm -> mm
                                                .query(query)
                                                .fields("rawText^2", "citizenExplanation^1.5", "threatType^1", "geoTags^1")
                                                .fuzziness("AUTO")
                                        )
                                );
                                if (threatType != null && !threatType.isEmpty()) {
                                    b.filter(f -> f.term(t -> t.field("threatType").value(threatType)));
                                }
                                if (state != null && !state.isEmpty()) {
                                    b.filter(f -> f.term(t -> t.field("geoTags").value(state)));
                                }
                                return b;
                            })
                    )
                    .withPageable(PageRequest.of(page, size))
                    .build();

            SearchHits<ThreatDocument> hits = elasticsearchOperations.search(searchQuery, ThreatDocument.class);
            if (hits.isEmpty()) return databaseSearch(query, threatType, state, page, size);
            return hits.stream().map(SearchHit::getContent).collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("ES search unavailable; using database: {}", e.getMessage());
            return databaseSearch(query, threatType, state, page, size);
        }
    }

    private List<ThreatDocument> databaseSearch(String query, String threatType, String state, int page, int size) {
        org.springframework.data.jpa.domain.Specification<com.crimelens.backend.entity.Threat> spec = (root, criteria, cb) ->
                cb.like(cb.lower(root.get("rawText")), "%" + query.toLowerCase(java.util.Locale.ROOT) + "%");
        if (threatType != null && !threatType.isBlank()) {
            spec = spec.and(com.crimelens.backend.repository.ThreatSpecification.hasType(
                    com.crimelens.backend.entity.ThreatType.valueOf(threatType.toUpperCase(java.util.Locale.ROOT))));
        }
        if (state != null && !state.isBlank()) {
            spec = spec.and((root, criteria, cb) -> {
                var subquery = criteria.subquery(java.util.UUID.class);
                var location = subquery.from(com.crimelens.backend.entity.ThreatLocation.class);
                subquery.select(location.get("threat").get("id")).where(cb.equal(location.get("stateName"), state));
                return root.get("id").in(subquery);
            });
        }
        return threatRepository.findAll(spec, PageRequest.of(Math.max(0, page), Math.max(1, Math.min(100, size))))
                .stream().map(ThreatDocument::from).toList();
    }

    public List<ThreatDocument> findSimilar(java.util.UUID threatId, int limit) {
        try {
            ThreatDocument doc = elasticsearchOperations.get(threatId.toString(), ThreatDocument.class);
            if (doc == null) return Collections.emptyList();

            NativeQuery searchQuery = NativeQuery.builder()
                    .withQuery(q -> q
                            .moreLikeThis(mlt -> mlt
                                    .fields("rawText")
                                    .like(l -> l.document(d -> d.id(threatId.toString())))
                                    .minTermFreq(1)
                                    .maxQueryTerms(12)
                            )
                    )
                    .withPageable(PageRequest.of(0, limit))
                    .build();

            SearchHits<ThreatDocument> hits = elasticsearchOperations.search(searchQuery, ThreatDocument.class);
            return hits.stream()
                    .map(SearchHit::getContent)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("ES findSimilar failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public java.util.Map<String, Long> aggregateByType() {
        try {
            NativeQuery query = NativeQuery.builder()
                    .withQuery(q -> q.matchAll(ma -> ma))
                    .withAggregation("by_type",
                            co.elastic.clients.elasticsearch._types.aggregations.Aggregation.of(a -> a
                                    .terms(t -> t.field("threatType").size(50))))
                    .withMaxResults(0)
                    .build();

            SearchHits<ThreatDocument> hits = elasticsearchOperations.search(query, ThreatDocument.class);
            
            java.util.Map<String, Long> result = new java.util.HashMap<>();
            if (hits.getAggregations() != null) {
                org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregations aggregations =
                        (org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregations) hits.getAggregations();
                
                co.elastic.clients.elasticsearch._types.aggregations.StringTermsAggregate terms = 
                        aggregations.get("by_type").aggregation().getAggregate().sterms();
                
                for (co.elastic.clients.elasticsearch._types.aggregations.StringTermsBucket bucket : terms.buckets().array()) {
                    result.put(bucket.key().stringValue(), bucket.docCount());
                }
            }
            return result;
        } catch (Exception e) {
            log.error("ES aggregateByType failed: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
