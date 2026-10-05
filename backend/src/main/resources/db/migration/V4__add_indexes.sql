-- V4: Add indexes for performance
CREATE INDEX idx_threats_created_at ON threats(created_at);
CREATE INDEX idx_threats_threat_type ON threats(threat_type);
CREATE INDEX idx_threats_geo_tags ON threats USING GIN (geo_tags);

CREATE INDEX idx_threat_locations_state_name ON threat_locations(state_name);
CREATE INDEX idx_threat_locations_geom ON threat_locations USING GIST (geom);

CREATE INDEX idx_scan_logs_input_hash ON scan_logs(input_hash);
CREATE INDEX idx_scan_logs_created_at ON scan_logs(created_at);

CREATE INDEX idx_subscriptions_states ON subscriptions USING GIN (states);
CREATE INDEX idx_subscriptions_threat_types ON subscriptions USING GIN (threat_types);
