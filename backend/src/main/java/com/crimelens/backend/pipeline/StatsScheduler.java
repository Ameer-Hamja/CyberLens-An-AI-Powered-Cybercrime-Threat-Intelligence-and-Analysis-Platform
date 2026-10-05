package com.crimelens.backend.pipeline;

import com.crimelens.backend.dto.StatsDTO;
import com.crimelens.backend.repository.ThreatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "ingestion.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class StatsScheduler {

    private final com.crimelens.backend.controller.StatsController statsController;
    private final WebSocketBroadcastService webSocketBroadcastService;

    @Scheduled(fixedDelay = 60000, initialDelay = 30000)
    public void pushStats() {
        StatsDTO stats = buildStats();
        webSocketBroadcastService.broadcastStats(stats);
    }

    private StatsDTO buildStats() {
        return statsController.getStats().getData();
    }
}
