Component Build Priority (Implementation Roadmap)
PHASE 0 – Foundations (Must Exist Before Anything Else)

These are pure domain + infra components, zero integration risk, 100% unit testable.

1. Core Domain Models (HIGHEST PRIORITY)

Why first

Every other component depends on these

Changes later cause cascading refactors

Easy to unit test, no infra

Components

WorkItem

WorkItemState

WorkItemLifecycle

AssignmentSpec

DistributionStrategyType

ParticipantRole

Domain Exceptions

Unit Tests

State transitions

Equality / immutability

JSON serialization/deserialization

2. Repository Interfaces (NOT implementations)

Why

Enables service development without DB

Allows mocking in all unit tests

Components

WorkItemRepository

WorkItemAuditRepository

WorkItemParticipantRepository

UserRepository

OrgModelRepository

Unit Tests

Interface contract tests (mock-based)

Transaction boundary expectations

PHASE 1 – Deterministic Business Logic (Core Value)

These components contain your actual business rules.

3. Validation Layer (CRITICAL)

Why

Highest logic density

Most defect-prone

Completely unit testable

Components

StateTransitionValidator

AuthorizationValidator

AssignmentEligibilityValidator

ParameterValidator (IN / OUT / REQUIRED)

LifecycleValidator

IdempotencyValidator

Unit Tests

Valid vs invalid transitions

Privilege enforcement

Parameter schema enforcement

Duplicate command detection

⚠️ Do NOT touch DB or events yet

4. Lifecycle Engine

Why

Governs correctness of every operation

Required before command handlers

Components

LifecycleDefinitionLoader

LifecycleEngine

TransitionResolver

Unit Tests

Custom lifecycle loading

Invalid transitions

Disabled lifecycle fallback

PHASE 2 – Distribution & Assignment (High Risk, High Value)
5. Distribution Strategy Engine

Why

Complex logic

Needs correctness before persistence

Independent of infrastructure

Components

DistributionStrategyRegistry

DefaultStrategy

RoundRobinStrategy

RandomStrategy

SeparationOfDutiesStrategy

LoadCalculator (mocked)

Unit Tests

Strategy selection

Disabled strategy fallback

Push vs Pull behavior

Deterministic randomness (seeded)

6. Push / Pull Resolution Engine

Why

Directly affects inbox behavior

Must be correct before APIs/events

Components

AssignmentResolver

OfferResolver

ClaimPolicyEnforcer

Unit Tests

Offered-to list correctness

Claim eligibility

Conflict scenarios (mocked locking)

PHASE 3 – Core Command Services (Heart of the System)
7. WorkItemCommandService (MOST IMPORTANT SERVICE)

Why

Central orchestration point

All integration paths converge here

Components

CreateWorkItemHandler

ClaimWorkItemHandler

CompleteWorkItemHandler

CancelWorkItemHandler

TransitionWorkItemHandler

Unit Tests

End-to-end command execution (mock repos)

Validation order

Audit creation

Participant updates

Performance assertions (no blocking)

PHASE 4 – Persistence (Replace Mocks with Reality)
8. Repository Implementations (PostgreSQL)

Why now

Business logic is stable

SQL can be tuned based on usage patterns

Components

JdbcWorkItemRepository

JdbcAuditRepository

JdbcParticipantRepository

Locking & optimistic concurrency

Unit Tests

Integration tests (Testcontainers)

Concurrent claim tests

Sequence integrity tests (ID jumps tolerated)

PHASE 5 – SDK (Consumer Contract)
9. SDK Layer

Why

SDK is just a façade

Depends on stable command contracts

Components

WorkItemClient

DTO mappers

Error mapping

Idempotency token injection

Unit Tests

Request validation

Response mapping

Error propagation

PHASE 6 – API Layer (Thin Wrapper)
10. REST Controllers

Why

Lowest business value

Easy once core is done

Components

WorkItemController

InboxController

ViewProfileResolver

Unit Tests

Controller → service delegation

Security enforcement

PHASE 7 – Eventing (Optional, Toggleable)
11. Event Publishing

Why

Non-blocking

Can be added late safely

Components

EventPublisher

EventPayloadMapper

Unit Tests

Correct payload

Async behavior

12. Event Subscription

Why last

External dependency

Should reuse existing logic

Components

InboundEventAdapter

CommandTranslator

DeduplicationStore

Unit Tests

Event → command mapping

Idempotency

Unauthorized event rejection

PHASE 8 – Directory & AD Integration
13. LDAP Sync Service

Why

Orthogonal to WorkItem logic

Can evolve independently

Components

LdapSyncService

Mapping adapters

Unit Tests

Attribute mapping

Deactivation handling

Final Priority Summary (One-Page)

Domain Models

Repository Interfaces

Validators

Lifecycle Engine

Distribution Strategies

Push/Pull Resolver

WorkItemCommandService

Repository Implementations

SDK

REST API

Event Publishing

Event Subscription

AD/LDAP Integration