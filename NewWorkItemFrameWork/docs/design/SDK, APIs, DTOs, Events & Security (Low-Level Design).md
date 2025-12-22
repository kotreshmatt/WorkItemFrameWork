PART 4 – SDK, APIs, DTOs, Events & Security (Low-Level Design)
1. Consumer-Facing SDK (Primary Integration Mechanism)
1.1 SDK Design Goals

Hide internal implementation details

Strong typing and validation

Minimal required inputs, no assumptions

Same contract for API and Event paths

No Temporal knowledge required

Backward compatible

1.2 SDK Package Structure
workitem-sdk/
 ├── client/
 │   ├── WorkItemClient.ts
 │   ├── InboxClient.ts
 ├── models/
 │   ├── commands/
 │   ├── responses/
 │   ├── events/
 │   └── common/
 ├── config/
 │   └── SdkConfig.ts
 └── errors/
     └── SdkError.ts

1.3 WorkItemClient
class WorkItemClient {

  create(cmd: CreateWorkItemCommand): Promise<CreateWorkItemResponse>

  claim(cmd: ClaimWorkItemCommand): Promise<WorkItemResponse>

  complete(cmd: CompleteWorkItemCommand): Promise<WorkItemResponse>

  cancel(cmd: CancelWorkItemCommand): Promise<WorkItemResponse>

  getById(id: number, view?: ViewProfile): Promise<WorkItemResponse>
}


SDK performs:

Schema validation

Correlation headers

Idempotency token injection

2. REST API Layer (SDK-Aligned)
2.1 API Design Rules

Thin controllers

Delegate to WorkItemCommandService

Same DTOs as SDK

Security enforced centrally

View-based response shaping

2.2 WorkItem APIs
POST   /api/work-items
POST   /api/work-items/{id}/claim
POST   /api/work-items/{id}/complete
POST   /api/work-items/{id}/cancel
GET    /api/work-items/{id}?view=BASIC|FULL|SECURE

2.3 Inbox APIs
GET /api/inbox/user/{userId}
GET /api/inbox/group/{groupId}
GET /api/inbox/orgunit/{orgUnitId}


Supports:

State filters

Priority

Due date

Custom JSON attributes

3. DTOs – Request / Response Models
3.1 Create WorkItem
interface CreateWorkItemRequest {
  workflowId: string
  runId: string
  taskName: string
  taskType?: string
  priority?: number
  assigneeSpec: AssignmentSpec
  contextData?: JsonObject
  dueDate?: string
  distributionStrategy?: DistributionStrategyType
}

interface CreateWorkItemResponse {
  workItemId: number
  state: string
  assignedTo?: Assignee
}

3.2 WorkItemResponse
interface WorkItemResponse {
  id: number
  taskName: string
  state: string
  priority: number
  assignee?: Assignee
  contextData?: JsonObject
  createdAt: string
  updatedAt: string
  completedAt?: string
}

4. View Profiles (Data Hiding)
enum ViewProfile {
  BASIC,
  FULL,
  SECURE
}

View	Fields
BASIC	id, state, assignee
FULL	includes contextData
SECURE	hides sensitive params

Controlled by:

Role

Privilege

Caller identity

5. Event Payload Schemas
5.1 Outbound WorkItem Events
{
  "eventId": "uuid",
  "type": "WORKITEM_COMPLETED",
  "workItemId": 123,
  "timestamp": "2025-01-01T10:00:00Z",
  "payload": {
    "outcome": "APPROVED"
  },
  "metadata": {
    "workflowId": "WF-1",
    "runId": "RUN-1",
    "actorId": "user-uuid"
  }
}

5.2 Inbound Events (Subscribed)

Inbound events map 1:1 to SDK commands.
Schema validation is mandatory.

6. Security Architecture
6.1 Authentication

JWT for APIs

mTLS or API key for event publishers

Internal service identity for gRPC

6.2 Authorization (RBAC)

Uses:

privileges

orgunit_privileges

group_privileges

position_privileges

Example:

CLAIM_WORKITEM privilege

COMPLETE_WORKITEM privilege

7. AD / LDAP Integration
7.1 Integration Pattern

External AD is source of truth

Framework syncs users & groups

No credentials stored

7.2 LDAP Sync Service
LdapSyncService
  ├── syncUsers()
  ├── syncGroups()
  ├── syncMemberships()


Configurable:

Cron schedule

On-demand sync

Read-only mode

7.3 Mapping
AD Attribute	users column
sAMAccountName	ldap_id
displayName	name
mail	email
8. Error Handling Model
8.1 Error Categories

VALIDATION_ERROR

AUTHORIZATION_ERROR

STATE_CONFLICT

DISTRIBUTION_ERROR

SYSTEM_ERROR

All returned with:

errorCode

message

correlationId

9. Observability

Correlation ID propagated from SDK

Metrics per operation

Structured logs

Audit trail mandatory

10. What Is COMPLETE After PART 4

✔ SDK design
✔ REST APIs
✔ DTOs
✔ Event payloads
✔ Security model
✔ AD integration
✔ View-based data hiding