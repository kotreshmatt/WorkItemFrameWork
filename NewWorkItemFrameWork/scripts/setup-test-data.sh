#!/bin/bash

# Case Workflow Test Data Setup Script
# Run this before starting your tests

set -e  # Exit on error

echo "🚀 Setting up test data for Case Workflow..."
echo ""

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-bpmdb}"
DB_USER="${DB_USER:-bpmdb}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Database: $DB_HOST:$DB_PORT/$DB_NAME${NC}"
echo ""

# Step 1: Run migration if not already done
echo -e "${YELLOW}Step 1: Running migration (if needed)...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/004_external_services.sql 2>/dev/null || echo "Migration already applied or error (continuing...)"
echo ""

# Step 2: Insert test data
echo -e "${YELLOW}Step 2: Inserting test data...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/005_test_data.sql
echo ""

# Step 3: Verify
echo -e "${YELLOW}Step 3: Verifying test data...${NC}"
echo ""

echo -e "${GREEN}✓ Inbox Configurations:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    template_id, 
    case_type, 
    inbox_name, 
    inbox_state 
FROM inboxconfig 
ORDER BY template_id;
"
echo ""

echo -e "${GREEN}✓ Sample Datapools:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    case_id, 
    jsonb_pretty(data) as data 
FROM datapool 
ORDER BY case_id 
LIMIT 5;
"
echo ""

echo -e "${GREEN}✓ Sample Audit Logs:${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    case_id, 
    event, 
    created_at 
FROM auditlog 
ORDER BY created_at DESC 
LIMIT 10;
"
echo ""

# Step 4: Test API endpoints
echo -e "${YELLOW}Step 4: Testing API endpoints (if Gateway is running)...${NC}"

# Check if Gateway is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Gateway is running${NC}"
    
    echo ""
    echo -e "${BLUE}Testing InboxConfig API:${NC}"
    curl -s http://localhost:3000/api/inboxconfig/DEFAULT_TEMPLATE | jq '.'
    
    echo ""
    echo -e "${BLUE}All Inbox Configs:${NC}"
    curl -s http://localhost:3000/api/inboxconfig | jq '.[] | {template_id, case_type, inbox_name}'
    
else
    echo -e "${YELLOW}⚠ Gateway is not running on port 3000${NC}"
    echo -e "${YELLOW}  Start it with: cd packages/gateway && npm run dev${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Test data setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "You can now:"
echo "1. Start the SDK: cd packages/sdk && npm run dev"
echo "2. Start Gateway: cd packages/gateway && npm run dev"
echo "3. Start Worker: cd packages/temporal-workflows && npm run build && npm run worker"
echo "4. Run tests from: case_workflow_testing.md"
echo ""
