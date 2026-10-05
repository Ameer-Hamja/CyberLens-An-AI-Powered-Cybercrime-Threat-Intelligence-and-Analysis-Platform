-- V3: Create scan_logs and subscriptions tables
CREATE TABLE scan_logs (
    id BIGSERIAL PRIMARY KEY,
    input_hash VARCHAR(256) NOT NULL,
    risk_score INT CHECK (risk_score >= 0 AND risk_score <= 100),
    threat_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    states JSONB,
    threat_types JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
