-- Phase 6: Pipeline Performance Indexes

-- Index on createdAt for recent queries and trends
CREATE INDEX IF NOT EXISTS idx_threats_created_at ON threats(created_at DESC);

-- Index on threatType for aggregating top threats
CREATE INDEX IF NOT EXISTS idx_threats_threat_type ON threats(threat_type);

-- Index on stateName for heatmap groupings
CREATE INDEX IF NOT EXISTS idx_threat_locations_state_name ON threat_locations(state_name);

-- Index on inputHash for scan deduplication and metrics
CREATE INDEX IF NOT EXISTS idx_scan_logs_input_hash ON scan_logs(input_hash);
