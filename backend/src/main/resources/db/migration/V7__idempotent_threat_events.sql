ALTER TABLE threats ADD COLUMN content_hash VARCHAR(64);
CREATE UNIQUE INDEX idx_threats_content_hash ON threats(content_hash);
