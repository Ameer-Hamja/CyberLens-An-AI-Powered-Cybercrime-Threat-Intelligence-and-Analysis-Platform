package com.crimelens.backend.pipeline;

import com.crimelens.backend.entity.Threat;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(indexName = "threats")
public class ThreatDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String rawText;

    @Field(type = FieldType.Text)
    private String citizenExplanation;

    @Field(type = FieldType.Keyword)
    private String threatType;

    @Field(type = FieldType.Keyword)
    private String sourceType;

    @Field(type = FieldType.Keyword)
    private String detectedLanguage;

    @Field(type = FieldType.Integer)
    private Integer severity;

    @Field(type = FieldType.Double)
    private Double confidence;

    @Field(type = FieldType.Keyword)
    private List<String> geoTags;

    @Field(type = FieldType.Date, format = DateFormat.date_time)
    private Instant createdAt;

    @Field(type = FieldType.Keyword)
    private String sourceUrl;

    public static ThreatDocument from(Threat threat) {
        ThreatDocument doc = new ThreatDocument();
        doc.setId(threat.getId() != null ? threat.getId().toString() : null);
        doc.setRawText(threat.getRawText());
        doc.setCitizenExplanation(threat.getCitizenExplanation());
        doc.setThreatType(threat.getThreatType() != null ? threat.getThreatType().name() : null);
        doc.setSourceType(threat.getSourceType() != null ? threat.getSourceType().name() : null);
        doc.setDetectedLanguage(threat.getDetectedLanguage());
        doc.setSeverity(threat.getSeverity());
        doc.setConfidence(threat.getConfidence());
        doc.setCreatedAt(threat.getCreatedAt());
        doc.setSourceUrl(threat.getSourceUrl());

        try {
            ObjectMapper mapper = new ObjectMapper();
            List<String> geoTagsList = mapper.readValue(threat.getGeoTags(), new TypeReference<List<String>>() {});
            doc.setGeoTags(geoTagsList);
        } catch (Exception e) {
            doc.setGeoTags(new ArrayList<>());
        }

        return doc;
    }
}
