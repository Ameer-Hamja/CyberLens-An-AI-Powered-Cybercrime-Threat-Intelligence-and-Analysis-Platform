-- V2: Create threat_locations table with PostGIS point
CREATE TABLE threat_locations (
    id BIGSERIAL PRIMARY KEY,
    threat_id BIGINT NOT NULL,
    state_name VARCHAR(100),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    geom GEOMETRY(POINT, 4326),
    CONSTRAINT fk_threat
      FOREIGN KEY(threat_id) 
      REFERENCES threats(id)
      ON DELETE CASCADE
);
