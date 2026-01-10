-- External Services Tables
-- Migration: 004_external_services.sql

-- DataPool: Store case-level data as key-value pairs
CREATE TABLE datapool (
  case_id VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AuditLog: Record workflow/case events
CREATE TABLE auditlog (
  id SERIAL PRIMARY KEY,
  case_id VARCHAR(255) NOT NULL,
  event VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- InboxConfig: Configuration for inbox states/types
CREATE TABLE inboxconfig (
  template_id VARCHAR(255) PRIMARY KEY,
  case_type VARCHAR(255) NOT NULL,
  inbox_name VARCHAR(255) NOT NULL,
  inbox_state VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
