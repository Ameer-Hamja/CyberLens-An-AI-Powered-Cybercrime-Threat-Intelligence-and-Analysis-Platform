package com.crimelens.backend.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;

import java.time.Duration;

@Configuration
@EnableCaching
@org.springframework.context.annotation.Profile("!test")
public class CacheConfig implements org.springframework.cache.annotation.CachingConfigurer {

    @Override public org.springframework.cache.interceptor.CacheErrorHandler errorHandler() {
        return new org.springframework.cache.interceptor.LoggingCacheErrorHandler();
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory)
                .withCacheConfiguration("threats-live",
                        RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofSeconds(30))
                                .disableCachingNullValues())
                .withCacheConfiguration("threats-heatmap",
                        RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofMinutes(5))
                                .disableCachingNullValues())
                .withCacheConfiguration("threats-trends",
                        RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofMinutes(10))
                                .disableCachingNullValues())
                .withCacheConfiguration("threats-summary",
                        RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofMinutes(5))
                                .disableCachingNullValues())
                .withCacheConfiguration("stats",
                        RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofSeconds(60))
                                .disableCachingNullValues())
                .withCacheConfiguration("stats-by-type",
                        RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofMinutes(5))
                                .disableCachingNullValues())
                .withCacheConfiguration("stats-by-state",
                        RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofMinutes(5))
                                .disableCachingNullValues())
                .build();
    }
}
