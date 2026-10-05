package com.crimelens.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "threat_locations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThreatLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "threat_id", nullable = false)
    private Threat threat;

    @Column(name = "state_name", length = 100)
    private String stateName;

    @Column(name = "lat")
    private Double lat;

    @Column(name = "lng")
    private Double lng;
}
