package com.crimelens.backend.pipeline;

import com.crimelens.backend.entity.SourceType;
import com.crimelens.backend.repository.ThreatRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

@Component
public class PipelineMetrics {

    private final MeterRegistry meterRegistry;
    private final Counter failedCounter;
    private final Counter persistedCounter;
    private final Counter broadcastCounter;
    private final Timer persistenceTimer;
    private final Timer broadcastTimer;

    public PipelineMetrics(MeterRegistry meterRegistry, ThreatRepository threatRepository) {
        this.meterRegistry = meterRegistry;
        this.failedCounter = meterRegistry.counter("pipeline.threats.failed");
        this.persistedCounter = meterRegistry.counter("pipeline.threats.persisted");
        this.broadcastCounter = meterRegistry.counter("pipeline.websocket.broadcasts");
        this.persistenceTimer = meterRegistry.timer("pipeline.persistence.duration");
        this.broadcastTimer = meterRegistry.timer("pipeline.broadcast.duration");

        Gauge.builder("pipeline.threats.total", threatRepository, ThreatRepository::count)
                .register(meterRegistry);
    }

    public void recordProcessed(SourceType sourceType) {
        meterRegistry.counter("pipeline.threats.processed", "source_type", sourceType.name()).increment();
    }

    public void recordFailed() {
        failedCounter.increment();
    }

    public void recordPersisted() {
        persistedCounter.increment();
    }

    public void recordBroadcast() {
        broadcastCounter.increment();
    }
}
