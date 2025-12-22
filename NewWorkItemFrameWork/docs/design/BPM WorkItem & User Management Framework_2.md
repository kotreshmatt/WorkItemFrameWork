BPM WorkItem & User Management Framework
Comprehensive Design Document
PART 2 – SDK/API, Core Services, Repositories, Validation, Distribution, and Event Integration
1. SDK & API Layer
1.1 Purpose

Provide developer-friendly interfaces for WorkItem operations, hiding internal complexity.

SDK exposes high-level commands

REST APIs expose full operational surface

gRPC optionally supported for internal services

1.2 SDK Operations
Operation	Description
createWorkItem(request)	Create a WorkItem with workflow correlation, task type, parameters
claimWorkItem(request)	Claim a WorkItem (Pull mode)
completeWorkItem(request)	Complete a WorkItem, set outcome, update parameters
cancelWorkItem(request)	Cancel a WorkItem
getWorkItem(request)	Fetch WorkItem with flexible fields and filters
getWorkItems(request)	List WorkItems with rich filters (user/group/orgunit/state/priority/etc.)
SDK Request / Response DTOs (Example)
// Create WorkItem
interface CreateWorkItemRequest {
  workflowId: string;
  runId: string;
  taskName: string;
  taskType?: string;
  priority?: number;
  description?: string;
  contextData?: Record<string, any>;
  candidateIds?: UUID[];        // optional for Pull
  candidateGroups?: UUID[];
  dueDate?: Date;
}

interface CreateWorkItemResponse {
  success: boolean;
  workItemId: number;
  warnings?: string[];
  error?: ServiceError;
}

// Complete WorkItem
interface CompleteWorkItemRequest {
  workItemId: number;
  userId: UUID;
  outcome?: 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'CANCELLED';
  parameters?: Record<string, any>;
  comments?: string;
}

interface CompleteWorkItemResponse {
  success: boolean;
  workItem: WorkItemDTO;
  signalSent: boolean;
  warnings?: string[];
  error?: ServiceError;
}


Notes:

Flexible input/output parameter handling via JSON

Event-driven completion or synchronous acknowledgment

Field visibility controlled via configuration

1.3 REST API Endpoints
Method	Endpoint	Description
GET	/api/work-items	List work items with filters
GET	/api/work-items/:id	Get WorkItem details (configurable visibility)
POST	/api/work-items/:id/claim	Claim WorkItem
POST	/api/work-items/:id/complete	Complete WorkItem
POST	/api/work-items/:id/cancel	Cancel WorkItem
GET	/api/inbox	User inbox
GET	/api/inbox/group/:groupId	Group inbox
GET	/api/inbox/orgunit/:orgUnitId	OrgUnit inbox
GET	/api/org-model/users/:id	User details
GET	/api/org-model/groups/:id/members	Group members
GET	/api/org-model/positions/:id	Position details
2. Core Services
2.1 WorkItemService

Responsibilities:

Handle lifecycle commands (create, claim, complete, cancel)

Validate inputs and state transitions

Dispatch events (optional)

Persist audit and participant entries

Internal Collaborators:

WorkItemRepository

WorkItemAuditRepository

WorkItemParticipantsRepository

AssignmentStrategyRegistry

EventPublisher (toggleable)

Validator components

2.2 UserResolutionService

Responsibilities:

Determine eligible users for a task

Apply capabilities, positions, groups

Integrate with AD/LDAP for user lookup

Handle SoD and other configurable distribution rules

2.3 AssignmentStrategyRegistry

Holds all active strategies: DEFAULT, RANDOM, ROUND_ROBIN, LOAD_BASED, SoD, CAPABILITY

Each strategy implements a common interface: selectAssignee(workItem, candidates)

Strategies can be toggled ON/OFF

Disabled strategies fall back to DEFAULT

2.4 Validation Services

WorkItemStateValidator – Validates state transitions

ParameterValidator – Validates input/output parameters (mandatory/optional/in/out)

UserEligibilityValidator – Checks eligibility based on user/group/org/capabilities

AssignmentValidator – Checks rules for Push/Pull, SoD enforcement

3. Repository Layer
3.1 WorkItemRepository

CRUD for WorkItem

Optimistic locking for concurrency (SELECT FOR UPDATE SKIP LOCKED for claim)

3.2 WorkItemAuditRepository

Stores all audit events

Links via work_item_id

3.3 WorkItemParticipantsRepository

Tracks all participants (offered, claimed, completed, canceled)

Required for SoD enforcement and history

3.4 UserRepository

Fetch user by ID, LDAP ID, email

Fetch groups, positions, capabilities

Integrates with AD/LDAP

3.5 OrgModelRepository

OrgUnits, Positions, Groups

Privileges, Capabilities

Supports hierarchy traversal

4. Distribution Engine (Micro-Level)
4.1 Push vs Pull
Mode	Description	Implementation Notes
PULL	WorkItem is offered, candidates claim	WorkItem state=ACTIVE, participant entries added
PUSH	WorkItem assigned directly	WorkItem state=CLAIMED, participant entry updated

Configurable per workflow/task.

4.2 Strategies

Interface:

interface AssignmentStrategy {
  selectAssignee(workItem: WorkItem, candidates: User[]): User;
}


Strategies implemented:

DEFAULT – First eligible user

RANDOM – Random selection

ROUND_ROBIN – Sequential assignment per group

LOAD_BASED – User with fewest active WorkItems

SoD – Separation of Duties enforcement

CAPABILITY_MATCHED – Match required capabilities

Fallback: Disabled strategies automatically use DEFAULT.

4.3 Event Publishing (Reactive)

Event-driven optional (toggleable)

Publishes: WORKITEM_CREATED, CLAIMED, COMPLETED, CANCELLED

Consumed by:

Temporal/other workflow adapters

UI/WebSocket

Analytics or external systems

Event bus protocols: Kafka/RabbitMQ (configurable)

4.4 Event Payload (Example)
type WorkItemEvent = {
  type: 'WORKITEM_CREATED' | 'WORKITEM_CLAIMED' | 'WORKITEM_COMPLETED' | 'WORKITEM_CANCELLED';
  workItemId: number;
  timestamp: Date;
  payload: WorkItemDTO;
  metadata: {
    workflowId: string;
    runId: string;
    actorId?: string;
  };
};

5. Error Handling

Consistent error taxonomy:

VALIDATION_ERROR

ELIGIBILITY_ERROR

STATE_CONFLICT

DISTRIBUTION_ERROR

DATABASE_ERROR

INTEGRATION_ERROR

Idempotent commands

Optional retries for event dispatch

Full audit for failures

6. Unit Test Strategy (Per Component)
6.1 WorkItemService Tests

Create WorkItem happy path

Claim WorkItem (PULL, PUSH)

Complete WorkItem with/without parameters

Cancel WorkItem

Invalid state transitions

Eligibility failures

Event toggle ON/OFF

6.2 UserResolutionService Tests

Eligible user resolution by position/group/capabilities

SoD enforcement

AD/LDAP integration mock

6.3 Distribution Strategies Tests

Each strategy independently

Fallback behavior

Randomness checks

Round-robin rotation

Load-based selection correctness

6.4 Repository Tests

CRUD operations

Concurrency simulation (claim race)

Audit and participant insertion