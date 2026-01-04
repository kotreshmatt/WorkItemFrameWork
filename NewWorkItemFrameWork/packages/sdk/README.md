# WorkItem Framework SDK

gRPC-based SDK for the WorkItem Framework.

## Installation

```bash
npm install @workitem-framework/sdk
```

## Usage

### Client (Consumer)

```typescript
import { WorkItemClient } from '@workitem-framework/sdk/client';

const client = new WorkItemClient({
  address: 'localhost:50051'
});

// Create WorkItem
const result = await client.createWorkItem({
  workflowId: 'order-processing-wf-123',
  taskName: 'ApproveOrder',
  parameters: { orderId: 'ORD-456', amount: 1000 },
  assignment: {
    candidateUsers: ['user1', 'user2'],
    candidateGroups: ['approvers']
  },
  distribution: {
    mode: 'PULL',
    strategy: 'ROUND_ROBIN'
  },
  actorId: 'system'
});

console.log('WorkItem ID:', result.workItemId);

// Claim WorkItem
await client.claimWorkItem({
  workItemId: result.workItemId,
  actorId: 'user1'
});

// Complete WorkItem
await client.completeWorkItem({
  workItemId: result.workItemId,
  output: { approved: true, comments: 'LGTM' },
  actorId: 'user1'
});
```

### Server (Provider)

```bash
# Set environment variables
export DB_HOST=localhost
export DB_NAME=workitem_db
export GRPC_PORT=50051

# Start server
npm run start:server
```

## Development

```bash
# Generate Proto types
npm run proto:generate

# Build
npm run build

# Run in development
npm run dev:server
```

## gRPC Methods

- `CreateWorkItem`: Create new WorkItem
- `ClaimWorkItem`: Assign WorkItem to user
- `CompleteWorkItem`: Mark as completed with output
- `CancelWorkItem`: Cancel with reason
