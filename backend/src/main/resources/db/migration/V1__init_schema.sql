-- V1: Create PostGIS extension and threats table
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE threats (
    id BIGSERIAL PRIMARY KEY,
    source_url VARCHAR(2048),
    raw_text TEXT NOT NULL,
    threat_type VARCHAR(50),
    severity INT CHECK (severity >= 1 AND severity <= 5),
    confidence DOUBLE PRECISION,
    detected_language VARCHAR(10),
    geo_tags JSONB,
    citizen_explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_type VARCHAR(50)
);
