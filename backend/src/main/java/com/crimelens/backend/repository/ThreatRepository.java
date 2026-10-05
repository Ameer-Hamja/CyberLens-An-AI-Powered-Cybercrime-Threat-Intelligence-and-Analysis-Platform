package com.crimelens.backend.repository;

import com.crimelens.backend.dto.HeatmapDTO;
import com.crimelens.backend.dto.TrendDTO;
import com.crimelens.backend.entity.Threat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.crimelens.backend.entity.ThreatType;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface ThreatRepository extends JpaRepository<Threat, UUID>, JpaSpecificationExecutor<Threat> {

    java.util.Optional<Threat> findByContentHash(String hash);
    boolean existsByContentHash(String hash);

    @Query(value = "SELECT tl.state_name FROM threat_locations tl " +
            "GROUP BY tl.state_name " +
            "ORDER BY COUNT(*) DESC LIMIT 1",
            nativeQuery = true)
    String findTopState();

    @Query(value = "SELECT t.threat_type FROM threats t " +
            "GROUP BY t.threat_type " +
            "ORDER BY COUNT(*) DESC LIMIT 1",
            nativeQuery = true)
    String findTopThreatType();

    @Query("SELECT new com.crimelens.backend.dto.HeatmapDTO(" +
            "tl.stateName, COUNT(t), AVG(t.severity)) " +
            "FROM Threat t JOIN ThreatLocation tl ON tl.threat = t " +
            "GROUP BY tl.stateName")
    List<HeatmapDTO> findHeatmapData();

    @Query("SELECT new com.crimelens.backend.dto.TrendDTO(" +
            "CAST(t.createdAt AS LocalDate), " +
            "CAST(t.threatType AS string), COUNT(t)) " +
            "FROM Threat t " +
            "WHERE t.createdAt >= :since " +
            "GROUP BY CAST(t.createdAt AS LocalDate), t.threatType " +
            "ORDER BY CAST(t.createdAt AS LocalDate) ASC")
    List<TrendDTO> findTrends(@Param("since") Instant since);

    Page<Threat> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Threat> findTop50ByOrderByCreatedAtDesc();
    
    long countByCreatedAtAfter(Instant date);

    List<Threat> findTop50ByThreatTypeOrderByCreatedAtDesc(ThreatType type);

    Long countBySeverityGreaterThanEqual(Integer severity);

    @Query("SELECT AVG(t.severity) FROM Threat t")
    Double findAverageSeverity();

    @Query(nativeQuery = true, value = 
           "SELECT threat_type, COUNT(*) as count, AVG(severity) as avg_severity, " +
           "MAX(created_at) as last_seen FROM threats GROUP BY threat_type")
    List<Object[]> findThreatSummaryRaw();

    @Modifying
    @Transactional
    void deleteBySourceUrl(String sourceUrl);

    @Query("SELECT COUNT(t) FROM Threat t WHERE t.createdAt >= :since " +
           "AND t.severity >= :minSeverity")
    Long countByCreatedAtAfterAndSeverityGreaterThanEqual(
            @Param("since") Instant since, 
            @Param("minSeverity") Integer minSeverity);
}
