package com.crimelens.backend.pipeline;

import com.crimelens.backend.dto.StatsDTO;
import com.crimelens.backend.dto.ThreatDTO;
import com.crimelens.backend.entity.Threat;
import com.crimelens.backend.mapper.ThreatMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class WebSocketBroadcastService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ThreatMapper threatMapper;
    private final ObjectMapper objectMapper;
    private final PipelineMetrics pipelineMetrics;

    public void broadcast(Threat threat) {
        try {
            ThreatDTO dto = threatMapper.toDTO(threat);
            try {
                List<String> geoTags = objectMapper.readValue(threat.getGeoTags(), new TypeReference<List<String>>() {});
                dto.setGeoTags(geoTags);
            } catch (Exception e) {
                dto.setGeoTags(new ArrayList<>());
            }
            
            messagingTemplate.convertAndSend("/topic/threats", dto);
            pipelineMetrics.recordBroadcast();
            log.debug("Broadcast threat {} to WebSocket clients", threat.getId());
        } catch (Exception e) {
            log.warn("WebSocket broadcast failed: {}", e.getMessage());
        }
    }

    public void broadcastStats(StatsDTO stats) {
        try {
            messagingTemplate.convertAndSend("/topic/stats", stats);
        } catch (Exception e) {
            log.warn("WebSocket broadcast stats failed: {}", e.getMessage());
        }
    }
}
