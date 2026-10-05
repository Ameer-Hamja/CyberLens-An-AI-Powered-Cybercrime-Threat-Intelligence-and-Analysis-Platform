package com.crimelens.backend.pipeline;

import com.crimelens.backend.dto.StatsDTO;
import com.crimelens.backend.repository.ThreatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
public class StatsScheduler {

    private final ThreatRepository threatRepository;
    private final WebSocketBroadcastService webSocketBroadcastService;

    @Scheduled(fixedDelay = 60000, initialDelay = 30000)
    public void pushStats() {
        StatsDTO stats = buildStats();
        webSocketBroadcastService.broadcastStats(stats);
    }

    private StatsDTO buildStats() {
        long totalThreats = threatRepository.count();
        long threatsToday = threatRepository.countByCreatedAtAfter(Instant.now().truncatedTo(ChronoUnit.DAYS));
        String topState = threatRepository.findTopState();
        String topThreatType = threatRepository.findTopThreatType();
        return StatsDTO.builder()
                .totalThreats(totalThreats)
                .threatsToday(threatsToday)
                .topState(topState)
                .topThreatType(topThreatType)
                .build();
    }
}
