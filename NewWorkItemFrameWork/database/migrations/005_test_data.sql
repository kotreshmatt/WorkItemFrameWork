-- ==========================================
-- Test Data for External Services
-- ==========================================

-- Clear existing test data (optional)
-- DELETE FROM auditlog WHERE case_id LIKE 'TEST-%';
-- DELETE FROM datapool WHERE case_id LIKE 'TEST-%';
-- DELETE FROM inboxconfig;

-- ==========================================
-- 1. INBOX CONFIGURATIONS
-- ==========================================

INSERT INTO inboxconfig (template_id, case_type, inbox_name, inbox_state, created_at, updated_at)
VALUES 
    ('DEFAULT_TEMPLATE', 'ORDER', 'Default Orders Inbox', 'ACTIVE', NOW(), NOW()),
    ('CLAIMS_TEMPLATE', 'CLAIM', 'Insurance Claims Inbox', 'ACTIVE', NOW(), NOW()),
    ('APPROVAL_TEMPLATE', 'APPROVAL', 'Approvals Inbox', 'ACTIVE', NOW(), NOW()),
    ('REVIEW_TEMPLATE', 'REVIEW', 'Review Tasks Inbox', 'ACTIVE', NOW(), NOW()),
    ('EXCEPTION_TEMPLATE', 'EXCEPTION', 'Exception Handling Inbox', 'PENDING', NOW(), NOW())
ON CONFLICT (template_id) DO UPDATE 
SET 
    case_type = EXCLUDED.case_type,
    inbox_name = EXCLUDED.inbox_name,
    inbox_state = EXCLUDED.inbox_state,
    updated_at = NOW();

-- ==========================================
-- 2. SAMPLE DATAPOOLS (Optional - for reference)
-- ==========================================

-- These will be created dynamically by workflows, but here are samples

INSERT INTO datapool (case_id, data, created_at, updated_at)
VALUES 
    ('SAMPLE-001', '{"customerName": "John Doe", "orderAmount": 1500, "priority": "high", "status": "pending"}'::jsonb, NOW(), NOW()),
    ('SAMPLE-002', '{"customerName": "Jane Smith", "claimAmount": 5000, "claimType": "medical", "status": "under_review"}'::jsonb, NOW(), NOW()),
    ('SAMPLE-003', '{"approver": "manager1", "requestAmount": 25000, "department": "IT", "status": "pending_approval"}'::jsonb, NOW(), NOW())
ON CONFLICT (case_id) DO UPDATE 
SET 
    data = datapool.data || EXCLUDED.data,
    updated_at = NOW();

-- ==========================================
-- 3. SAMPLE AUDIT LOGS (Optional - for reference)
-- ==========================================

-- These will be created dynamically by workflows, but here are samples

INSERT INTO auditlog (case_id, event, data, created_at)
VALUES 
    ('SAMPLE-001', 'CASE_CREATED', '{"createdBy": "system", "timestamp": "2026-01-10T00:00:00Z"}'::jsonb, NOW()),
    ('SAMPLE-001', 'WORK_ITEM_CREATED', '{"workItemId": 1, "taskName": "Review Order"}'::jsonb, NOW()),
    ('SAMPLE-002', 'CASE_CREATED', '{"createdBy": "user1", "timestamp": "2026-01-10T01:00:00Z"}'::jsonb, NOW()),
    ('SAMPLE-002', 'CLAIM_SUBMITTED', '{"amount": 5000, "submittedBy": "user1"}'::jsonb, NOW());

-- ==========================================
-- 4. VERIFICATION QUERIES
-- ==========================================

-- Check inbox configs
SELECT 'Inbox Configs:' as info;
SELECT template_id, case_type, inbox_name, inbox_state 
FROM inboxconfig 
ORDER BY template_id;

-- Check datapools
SELECT 'Datapools:' as info;
SELECT case_id, data 
FROM datapool 
ORDER BY case_id;

-- Check audit logs
SELECT 'Audit Logs:' as info;
SELECT case_id, event, created_at 
FROM auditlog 
ORDER BY case_id, created_at;

-- ==========================================
-- EXPECTED OUTPUT
-- ==========================================

/*
Inbox Configs:
template_id          | case_type  | inbox_name                    | inbox_state
---------------------|------------|-------------------------------|------------
DEFAULT_TEMPLATE     | ORDER      | Default Orders Inbox          | ACTIVE
CLAIMS_TEMPLATE      | CLAIM      | Insurance Claims Inbox        | ACTIVE
APPROVAL_TEMPLATE    | APPROVAL   | Approvals Inbox               | ACTIVE
REVIEW_TEMPLATE      | REVIEW     | Review Tasks Inbox            | ACTIVE
EXCEPTION_TEMPLATE   | EXCEPTION  | Exception Handling Inbox      | PENDING

5 rows inserted successfully!
*/
