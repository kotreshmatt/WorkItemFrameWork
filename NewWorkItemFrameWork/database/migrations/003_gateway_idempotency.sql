-- Migration: Create or update idempotency_keys table for gateway
-- Run this SQL in your PostgreSQL database

-- Option 1: If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    request_id VARCHAR(255),
    status VARCHAR(50),
    request_payload JSONB,
    response_payload JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Option 2: If table exists, add missing columns
ALTER TABLE idempotency_keys ADD COLUMN IF NOT EXISTS request_id VARCHAR(255);
ALTER TABLE idempotency_keys ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE idempotency_keys ADD COLUMN IF NOT EXISTS request_payload JSONB;
ALTER TABLE idempotency_keys ADD COLUMN IF NOT EXISTS response_payload JSONB;
ALTER TABLE idempotency_keys ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_idempotency_request_id ON idempotency_keys(request_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_status ON idempotency_keys(status);
CREATE INDEX IF NOT EXISTS idx_idempotency_created_at ON idempotency_keys(created_at);

-- Add comment
COMMENT ON TABLE idempotency_keys IS 'Stores idempotency keys for REST API Gateway requests';
