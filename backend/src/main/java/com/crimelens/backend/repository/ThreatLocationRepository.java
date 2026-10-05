package com.crimelens.backend.repository;

import com.crimelens.backend.entity.ThreatLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ThreatLocationRepository extends JpaRepository<ThreatLocation, UUID> {
    List<ThreatLocation> findByThreat_Id(UUID threatId);
}
