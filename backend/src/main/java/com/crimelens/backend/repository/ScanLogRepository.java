package com.crimelens.backend.repository;

import com.crimelens.backend.entity.ScanLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

@Repository
public interface ScanLogRepository extends JpaRepository<ScanLog, UUID> {
    
    Long countByRiskScoreGreaterThanEqual(Integer riskScore);
    
    @Query("SELECT s.threatType FROM ScanLog s GROUP BY s.threatType " +
           "ORDER BY COUNT(s) DESC")
    List<String> findTopThreatTypes(Pageable pageable);
    
    default String findTopThreatType() {
        return findTopThreatTypes(PageRequest.of(0, 1))
                .stream().findFirst().orElse("UNKNOWN");
    }
}
