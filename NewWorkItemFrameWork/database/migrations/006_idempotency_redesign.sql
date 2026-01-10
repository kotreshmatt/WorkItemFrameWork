-- ==========================================
-- Idempotency Redesign Migration
-- ==========================================
-- Adds business_key and created_at columns to support two-layer idempotency checking
-- 
-- Layer 1: Unique idempotency_key (includes timestamp) - Prevents Temporal caching
-- Layer 2: Business key (workItemId-userId-action) - Prevents duplicate business operations

-- Add new columns
ALTER TABLE idempotency_keys 
ADD COLUMN IF NOT EXISTS business_key VARCHAR(255);

ALTER TABLE idempotency_keys 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Backfill business_key from existing key column
-- Extract business key by removing timestamp suffix (if present)
UPDATE idempotency_keys 
SET business_key = CASE
    -- If key contains timestamp (ends with -<number>), remove it
    WHEN key ~ '-[0-9]{13,}$' THEN 
        SUBSTRING(key FROM 1 FOR LENGTH(key) - POSITION('-' IN REVERSE(key)))
    -- Otherwise, use the full key as business key
    ELSE key
END
WHERE business_key IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_business_key 
ON idempotency_keys(business_key);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_status 
ON idempotency_keys(status);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at 
ON idempotency_keys(created_at DESC);

-- Composite index for efficient business key + status queries
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_business_status 
ON idempotency_keys(business_key, status, created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN idempotency_keys.business_key IS 
'Business deduplication key format: ${workItemId}-${userId}-${action}. Used to detect duplicate business operations across retries.';

COMMENT ON COLUMN idempotency_keys.created_at IS 
'Timestamp when the idempotency record was created. Used to find the latest attempt for a business key.';

-- Verify migration
SELECT 
    'Migration Complete' as status,
    COUNT(*) as total_records,
    COUNT(business_key) as records_with_business_key,
    COUNT(created_at) as records_with_created_at
FROM idempotency_keys;
