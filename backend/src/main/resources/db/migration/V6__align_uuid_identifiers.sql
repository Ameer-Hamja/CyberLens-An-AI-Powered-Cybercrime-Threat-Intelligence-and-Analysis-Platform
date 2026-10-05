-- Preserve existing numeric identifiers through a deterministic UUID mapping.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'threats'
                 AND column_name = 'id' AND data_type = 'bigint') THEN
        ALTER TABLE threat_locations DROP CONSTRAINT fk_threat;
        ALTER TABLE threats ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE threats ALTER COLUMN id TYPE uuid USING md5('crimelens-threat-' || id::text)::uuid;
        ALTER TABLE threat_locations ALTER COLUMN threat_id TYPE uuid
            USING md5('crimelens-threat-' || threat_id::text)::uuid;
        ALTER TABLE threat_locations ADD CONSTRAINT fk_threat FOREIGN KEY (threat_id)
            REFERENCES threats(id) ON DELETE CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'threat_locations'
                 AND column_name = 'id' AND data_type = 'bigint') THEN
        ALTER TABLE threat_locations ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE threat_locations ALTER COLUMN id TYPE uuid USING md5('crimelens-location-' || id::text)::uuid;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'scan_logs'
                 AND column_name = 'id' AND data_type = 'bigint') THEN
        ALTER TABLE scan_logs ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE scan_logs ALTER COLUMN id TYPE uuid USING md5('crimelens-scan-' || id::text)::uuid;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'subscriptions'
                 AND column_name = 'id' AND data_type = 'bigint') THEN
        ALTER TABLE subscriptions ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE subscriptions ALTER COLUMN id TYPE uuid USING md5('crimelens-subscription-' || id::text)::uuid;
    END IF;
END $$;
