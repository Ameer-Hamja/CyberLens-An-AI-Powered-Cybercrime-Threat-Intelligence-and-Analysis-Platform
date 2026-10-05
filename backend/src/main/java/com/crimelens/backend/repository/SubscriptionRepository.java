package com.crimelens.backend.repository;

import com.crimelens.backend.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findByEmail(String email);
    boolean existsByEmail(String email);
    void deleteByEmail(String email);
    org.springframework.data.domain.Page<Subscription> findAll(org.springframework.data.domain.Pageable pageable);
}
