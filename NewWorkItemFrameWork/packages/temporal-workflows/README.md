# Temporal Workflows for WorkItem Framework

This package contains Temporal workflows for the WorkItem Framework.

## Overview

The workflow acts as a business process definition that creates work items and waits for external applications to interact with them via the Gateway.

## Architecture

```
Workflow (Design Time)     Gateway (Runtime)          External App
      │                          │                         │
      ├─ createWorkItem()        │                         │
      │  (hardcoded definition)  │                         │
      │                          │                         │
      ├─ wait for updates ───────┤                         │
      │                          │                         │
      │                    ┌─────┴──────┐                  │
      │                    │ GET /workitems                 │
      │                    │ POST /claim    ◄───────────────┤
      │                    │ POST /complete                 │
      │                    └────────────┘                  │
```

## Quick Start

### 1. Start Temporal Server
```bash
temporal server start-dev
```

### 2. Start the Worker
```bash
cd packages/temporal-workflows
npm run worker
```

### 3. Start a Workflow
```bash
npm run start-workflow CASE-001
```

This will:
- Create a workflow instance `exception-handling-wf-CASE-001`
- Create a work item with predefined structure
- Print the work item query command

### 4. Query the Work Item
```bash
curl "http://localhost:3000/api/workitems?contextData.caseId=CASE-001"
```

### 5. External App Claims Work Item
```bash
curl -X POST http://localhost:3000/api/workitems/1/claim \
  -H "Content-Type: application/json" \
  -d '{"userId":"manager1","workflowId":"exception-handling-wf-CASE-001"}'
```

### 6. External App Completes Work Item
```bash
curl -X POST http://localhost:3000/api/workitems/1/complete \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"manager1",
    "workflowId":"exception-handling-wf-CASE-001",
    "output":[
      {"name":"retry","value":true},
      {"name":"comments","value":"Resolved the issue"},
      {"name":"skipError","value":false}
    ]
  }'
```

## Programmatic Usage

```typescript
import { WorkflowClient } from '@workitem/temporal-workflows';

// Start a workflow
const client = new WorkflowClient();
const { workflowId } = await client.startWorkflow('CASE-001');

console.log(`Workflow started: ${workflowId}`);
// Output: Workflow started: exception-handling-wf-CASE-001
```

## Workflow Structure

The workflow defines work items at **design time** (like BPMN):

```typescript
// packages/temporal-workflows/src/workitem.workflow.ts

export async function workItemWorkflow(input: { caseId: string }) {
  // Hardcoded work item definition
  const { workItemId } = await createWorkItemActivity({
    workflowId: `exception-handling-wf-${input.caseId}`,
    parameters: [
      { name: 'request', direction: 'IN', value: {...} },
      { name: 'retry', direction: 'INOUT', value: null },
      // ...
    ],
    contextData: {
      taskType: 'Technical-Exception',
      taskName: 'Handle Exception',
      // ...
    }
  });
  
  // Wait for external apps to claim/complete/cancel
  await condition(() => false);
}
```

## Update Handlers

The workflow exposes three update handlers for external operations:

1. **claimWorkItem** - Claims a work item for a user
2. **completeWorkItem** - Completes a work item with output parameters
3. **cancelWorkItem** - Cancels a work item with a reason

These are called by the Gateway when external apps make HTTP requests.

## Complete End-to-End Flow

```
1. Start workflow → creates work item
   └─ npm run start-workflow CASE-001

2. Query work item
   └─ GET /api/workitems?contextData.caseId=CASE-001

3. External app claims
   └─ POST /api/workitems/1/claim

4. External app completes
   └─ POST /api/workitems/1/complete

5. Workflow receives update signal
   └─ Calls SDK → Framework → Database
```

## Environment Variables

- `TEMPORAL_ADDRESS` - Temporal server address (default: localhost:7233)
- `SDK_SERVER_ADDRESS` - SDK gRPC server address (default: localhost:50051)

## Development

Build:
```bash
npm run build
```

Watch mode:
```bash
npm run build.watch
```

Start worker:
```bash
npm run worker
```
