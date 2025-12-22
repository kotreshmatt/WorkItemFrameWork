PART 3 – Core WorkItem Processing, Distribution & Lifecycle (Low-Level Design)
1. Core Architectural Principle (Reconfirmed)

Single-tenant

Lite, high-performance

SDK + API + Event driven

Reactive (no polling)

Configurable features (on/off)

Temporal-agnostic

Microservice + internal gRPC

Strong validation, audit, security

All paths (SDK / REST / Event) converge into the same internal command handlers.

2. Core WorkItem Service Layer
2.1 WorkItemCommandService (PRIMARY ENTRY)

Responsibility

Central orchestration of WorkItem operations

Enforces lifecycle, validation, audit, distribution

Used by SDK, REST, Event subscribers

Operations

createWorkItem

claimWorkItem

completeWorkItem

cancelWorkItem

reassignWorkItem

transitionWorkItem (generic lifecycle extension)

2.2 Command Interfaces
interface CreateWorkItemCommand {
  workflowId: string
  runId: string                // correlation to workflow/process instance
  taskName: string
  taskType?: string
  priority?: number
  assigneeSpec: AssignmentSpec
  contextData?: JsonObject
  dueDate?: Date
  distributionStrategy?: DistributionStrategyType
}

interface ClaimWorkItemCommand {
  workItemId: number
  userId: UUID
  force?: boolean
}

interface CompleteWorkItemCommand {
  workItemId: number
  userId: UUID
  outcome?: string
  outputParameters?: JsonObject
  comments?: string
}

interface CancelWorkItemCommand {
  workItemId: number
  cancelledBy?: UUID
  reason?: string
}

3. WorkItem Lifecycle Engine (Configurable)
3.1 Lifecycle Model

Lifecycle is NOT hardcoded.

interface WorkItemLifecycle {
  states: string[]
  transitions: {
    from: string
    to: string
    action: WorkItemAction
    allowedRoles: string[]
  }[]
}


Default lifecycle (can be replaced):

NEW → ACTIVE

ACTIVE → CLAIMED

CLAIMED → COMPLETED

ANY → CANCELLED

Lifecycle definition is loaded at startup from configuration.

3.2 Lifecycle Validation

Before any operation:

Validate current state

Validate allowed transition

Validate user privilege

Validate input/output parameter rules

Failures throw typed domain exceptions.

4. Distribution Engine (Design-Time Configurable)
4.1 Distribution Strategy Registry
interface DistributionStrategy {
  type: DistributionStrategyType
  selectAssignee(candidates: User[]): User | User[]
}

4.2 Supported Strategies (ALL CONFIGURABLE)
Strategy	Description
DEFAULT	First eligible
ROUND_ROBIN	Cycles through users
RANDOM	Random eligible user
LOAD_BASED	Least active WIs
SKILL_BASED	Capability match
SEPARATION_OF_DUTIES	Prevent same user
MANUAL	No auto-selection

If configured strategy is disabled, framework falls back to DEFAULT.

4.3 Strategy Configuration
distribution:
  enabled: true
  strategies:
    roundRobin: true
    random: true
    separationOfDuties: true
  defaultStrategy: DEFAULT

5. Push vs Pull Assignment Model
5.1 Push Model (Direct Assignment)

Strategy returns single user

WI state → ACTIVE

assignee_type = USER

assignee_id = userId

5.2 Pull Model (Offered / Pooled)

Strategy returns multiple users

WI state → ACTIVE

assignee_type = GROUP / POSITION / ORGUNIT

All eligible users recorded in:

work_item_participants (role = OFFERED_TO)

Claiming is mandatory.

5.3 Claim Enforcement

Optimistic locking

First valid claimant wins

Others receive conflict response

Audit + participant update enforced

6. Repository Layer (Explicit Coverage)
6.1 WorkItemRepository

Responsibilities

CRUD operations

Locking

State transitions

interface WorkItemRepository {
  create(workItem: WorkItem): number
  findById(id: number): WorkItem
  updateState(id: number, state: string): void
  assign(id: number, assignee: Assignee): void
}

6.2 WorkItemAuditRepository

Append-only

Every state change recorded

6.3 WorkItemParticipantRepository

Roles:

OFFERED_TO

CLAIMED_BY

COMPLETED_BY

CANCELLED_BY

7. Validation Layer (Mandatory)
7.1 Validation Types
Validator	Responsibility
StateValidator	Valid transitions
AuthorizationValidator	Privileges
ParameterValidator	In / Out rules
AssignmentValidator	Eligibility
LifecycleValidator	Custom lifecycle
IdempotencyValidator	Event/command dedup

Validators are composable and ordered.

8. Event Integration (Recap, Locked)
8.1 Publish (Optional)

WORKITEM_CREATED

WORKITEM_CLAIMED

WORKITEM_COMPLETED

WORKITEM_CANCELLED

8.2 Subscribe (Optional)

Inbound events are translated to internal commands:

CREATE → createWorkItem

CLAIM → claimWorkItem

COMPLETE → completeWorkItem

CANCEL → cancelWorkItem

Same validation path, same audit path.

9. Performance Guarantees

No blocking calls in command path

Internal gRPC for service calls

DB operations < 2 writes per command

Event publish async

No polling anywhere

Target:

Create WI < 1s

Complete + next WI creation < 1s

10. Feature Toggles (Centralized)
features:
  lifecycle:
    customEnabled: true
  distribution:
    enabled: true
  pushPull:
    pushEnabled: true
    pullEnabled: true
  events:
    publish: true
    subscribe: true
  escalation:
    enabled: false

11. Unit Test Coverage (MANDATORY)
Create

Valid create

Invalid assignment

Disabled strategy fallback

Push vs Pull

Claim

Eligible claim

Concurrent claim

Unauthorized user

Complete

Valid completion

Invalid state

Output param validation

Cancel

Any-state cancel

Audit correctness

Event Driven

Create via event

Dedup event

Unauthorized event

12. What Is Now COMPLETE

✔ Distribution strategies (incl RANDOM)
✔ Push & Pull models
✔ Lifecycle flexibility
✔ Event subscribe & publish
✔ Repository coverage
✔ Validation micro-details
✔ Performance constraints
✔ Feature toggles