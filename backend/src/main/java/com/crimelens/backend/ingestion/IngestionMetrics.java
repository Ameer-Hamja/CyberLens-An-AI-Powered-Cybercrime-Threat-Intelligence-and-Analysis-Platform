package com.crimelens.backend.ingestion;

import com.crimelens.backend.entity.SourceType;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class IngestionMetrics {

    private final MeterRegistry registry;

    public IngestionMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    public void recordPublished(SourceType source) {
        Counter.builder("ingestion.events.published")
                .tag("source", source.name())
                .register(registry)
                .increment();
    }

    public void recordFailed(SourceType source) {
        Counter.builder("ingestion.events.failed")
                .tag("source", source.name())
                .register(registry)
                .increment();
    }

    public void recordJobExecution(SourceType source) {
        Counter.builder("ingestion.jobs.executed")
                .tag("source", source.name())
                .register(registry)
                .increment();
    }
}
