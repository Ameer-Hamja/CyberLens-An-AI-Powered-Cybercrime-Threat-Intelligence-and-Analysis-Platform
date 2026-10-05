package com.crimelens.backend.pipeline;

import com.crimelens.backend.entity.Threat;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
@RequiredArgsConstructor
public class ElasticsearchIndexService {

    private final ElasticsearchOperations elasticsearchOperations;
    private volatile boolean mapped;
    private synchronized void ensureMapping() {
        if (!mapped) {
            var index = elasticsearchOperations.indexOps(ThreatDocument.class);
            if (!index.exists()) index.createWithMapping();
            mapped = true;
        }
    }

    @Async("elasticsearchExecutor")
    public CompletableFuture<Void> deleteAsync(java.util.UUID id) {
        try { elasticsearchOperations.delete(id.toString(), ThreatDocument.class); }
        catch (Exception ex) { log.warn("Search index deletion failed for {}", id, ex); }
        return CompletableFuture.completedFuture(null);
    }

    @Async("elasticsearchExecutor")
    public CompletableFuture<Void> indexAsync(Threat threat) {
        try {
            ensureMapping();
            ThreatDocument doc = ThreatDocument.from(threat);
            elasticsearchOperations.save(doc);
            log.debug("Indexed threat {} to Elasticsearch", threat.getId());
        } catch (Exception e) {
            log.warn("ES index failed for {}: {}", threat.getId(), e.getMessage());
        }
        return CompletableFuture.completedFuture(null);
    }
}
