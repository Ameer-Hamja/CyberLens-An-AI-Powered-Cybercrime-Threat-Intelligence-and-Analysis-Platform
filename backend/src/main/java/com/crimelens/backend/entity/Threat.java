package com.crimelens.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "threats")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Threat {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "source_url", length = 2048)
    private String sourceUrl;

    @Column(name = "raw_text", columnDefinition = "TEXT", nullable = false)
    private String rawText;

    @Enumerated(EnumType.STRING)
    @Column(name = "threat_type", length = 50)
    private ThreatType threatType;

    @Column(name = "severity")
    private Integer severity;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "detected_language", length = 10)
    private String detectedLanguage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "geo_tags", columnDefinition = "jsonb")
    private String geoTags;

    @Column(name = "citizen_explanation", columnDefinition = "TEXT")
    private String citizenExplanation;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", length = 50)
    private SourceType sourceType;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}
