package com.crimelens.backend.controller;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@org.springframework.context.annotation.Import(IntegrationTestBase.TestCacheConfig.class)
public abstract class IntegrationTestBase {
    @org.springframework.boot.test.context.TestConfiguration
    @org.springframework.cache.annotation.EnableCaching
    static class TestCacheConfig {
        @org.springframework.context.annotation.Bean
        org.springframework.cache.CacheManager cacheManager() { return new org.springframework.cache.support.NoOpCacheManager(); }
    }
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgis/postgis:15-3.3").asCompatibleSubstituteFor("postgres"));
    static final GenericContainer<?> REDIS = new GenericContainer<>(DockerImageName.parse("redis/redis-stack:latest")).withExposedPorts(6379);
    static final KafkaContainer KAFKA = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.1"));
    static { POSTGRES.start(); REDIS.start(); KAFKA.start(); }

    @DynamicPropertySource
    static void infrastructure(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        properties.add("spring.datasource.username", POSTGRES::getUsername);
        properties.add("spring.datasource.password", POSTGRES::getPassword);
        properties.add("spring.data.redis.host", REDIS::getHost);
        properties.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
        properties.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
        properties.add("spring.flyway.enabled", () -> true);
        properties.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        properties.add("ingestion.enabled", () -> false);
        properties.add("ai.service.url", () -> "http://localhost:1");
        properties.add("app.jwt.secret", () -> "integration_test_secret_at_least_32_characters");
        properties.add("ADMIN_PASSWORD", () -> "admin123");
    }
}
