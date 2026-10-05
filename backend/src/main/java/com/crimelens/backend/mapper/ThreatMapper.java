package com.crimelens.backend.mapper;

import com.crimelens.backend.dto.ThreatDTO;
import com.crimelens.backend.entity.Threat;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mapstruct.Mapper;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ThreatMapper {
    
    default ThreatDTO toDTO(Threat threat) {
        if (threat == null) {
            return null;
        }
        ThreatDTO dto = new ThreatDTO();
        dto.setId(threat.getId());
        dto.setSourceUrl(threat.getSourceUrl());
        dto.setThreatType(threat.getThreatType());
        dto.setSeverity(threat.getSeverity());
        dto.setConfidence(threat.getConfidence());
        dto.setDetectedLanguage(threat.getDetectedLanguage());
        dto.setGeoTags(parseGeoTags(threat.getGeoTags()));
        dto.setCitizenExplanation(threat.getCitizenExplanation());
        dto.setCreatedAt(threat.getCreatedAt());
        dto.setSourceType(threat.getSourceType());
        return dto;
    }
    
    default List<ThreatDTO> toDTOList(List<Threat> threats) {
        if (threats == null) {
            return new ArrayList<>();
        }
        List<ThreatDTO> list = new ArrayList<>(threats.size());
        for (Threat threat : threats) {
            list.add(toDTO(threat));
        }
        return list;
    }
    
    default List<String> parseGeoTags(String geoTagsJson) {
        if (geoTagsJson == null || geoTagsJson.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            return Arrays.asList(mapper.readValue(geoTagsJson, String[].class));
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
