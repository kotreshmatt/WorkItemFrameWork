BPM WorkItem & User Management Framework
Comprehensive Design Document
PART 1 – Foundations, Scope, and Data Model
1. Purpose and Scope
1.1 Purpose

This framework provides WorkItem management and User/Org resolution capabilities that can be consumed by any workflow orchestrator or application (Temporal, custom Java apps, rule engines, etc.).

It is not a BPM engine.
It is a lightweight, scalable, microservice-oriented framework for:

Human task (WorkItem) lifecycle management

Advanced user resolution and distribution

Secure, auditable task execution

Reactive, event-driven or synchronous integration (configurable)

1.2 Explicit Non-Goals

No workflow modeling or execution

No embedded process engine

No UI framework

No hard dependency on Temporal or any other orchestrator

2. Core Design Principles (Final)

Single-Tenant System

No tenant_id anywhere

One logical client per deployment

Lite & Performance First

Sub-second WorkItem create/complete under load

No synchronous external calls in hot paths

One DB transaction per operation

SDK-First Consumption

Consumers interact via SDK or REST

Internal design fully hidden

Workflow-Engine Agnostic

Correlation handled via workflow_id and run_id

Integration via adapters

Configurable Features

Event-driven behavior ON/OFF

Distribution strategies ON/OFF

Escalation/SLA ON/OFF

Push vs Pull ON/OFF

Reactive, Not Polling

Long-running workflows supported

Completion is signal/event driven

3. Logical Architecture Overview (Textual)

SDK Layer (Consumer facing)

API Layer (REST / gRPC gateway)

Core Domain Services

Validation Layer

Distribution & Assignment Engine

Repository Layer

Optional Event Bus

Optional Integration Adapters

PostgreSQL (single source of truth)

Internal service-to-service communication favors gRPC for performance.

4. Data Model (Final & Approved)
4.1 Org Model – APPROVED AS-IS

The following schema is final and correct, supports BPMN patterns, and requires no changes.

org_units

Hierarchical departments

Supports inheritance via hierarchy_path

privileges

Authorization model

Used for access control, not assignment

capabilities

Eligibility / skill model

Used for WorkItem entry criteria

positions

Role abstraction within org units

groups

Logical user collections

users

LDAP-anchored identity

ldap_id used for AD integration

user_positions

User ↔ Position ↔ OrgUnit relationship

Supports primary/secondary positions

user_groups

Group membership

privilege assignments

group_privileges

position_privileges

orgunit_privileges (with inheritance scope)

capability assignments

position_capabilities

group_capabilities

user_capabilities (direct or inherited)

Assessment:
✔ Enterprise-grade
✔ BPMN-aligned
✔ Supports SoD, skills, and authorization
✔ AD/LDAP ready

4.2 WorkItem Model – APPROVED WITH ONE FIX

The WorkItem schema is locked, except for one mandatory correction.

work_items

Integer auto-increment ID

Workflow correlation via workflow_id, run_id

Assignment via assignee_type, assignee_id

Flexible payload via context_data

Lifecycle controlled by state + configuration (not DB)

work_item_participants

Tracks OFFERED_TO, CLAIMED_BY, COMPLETED_BY, etc.

Enables audit, SoD, and history

work_item_audit

Mandatory Fix (Required for correctness):

-- FIX REQUIRED
work_item_id INTEGER REFERENCES work_items(id)


Everything else remains unchanged.

5. Correlation & Identity Model
5.1 Correlation Strategy

workflow_id → logical process instance

run_id → execution instance (if applicable)

There is no tenant_id.
There is no business_key.

This is sufficient for:

SDK operations

Event correlation

Workflow callbacks

Audit and reporting

6. WorkItem Lifecycle Model (Configurable)

The framework does not hardcode lifecycle states.

Default lifecycle (example):

NEW

ACTIVE

CLAIMED

COMPLETED

CANCELLED

Lifecycle rules are:

Defined via configuration

Validated at runtime

Enforced by validators

This allows:

Custom states

Skipped claim

Auto-completion flows

7. Assignment Concepts (Foundation)
7.1 Assignment Mode

PULL

WorkItem offered to candidates

Users claim

PUSH

WorkItem directly assigned

No claim required

Both are:

Configurable

Strategy-agnostic

Feature-toggle aware

7.2 Distribution Strategies (Supported)

DEFAULT (fallback)

RANDOM

ROUND_ROBIN

LOAD_BASED

SEPARATION_OF_DUTIES

CAPABILITY_MATCHED

Strategies:

Are design-time configurable

Can be enabled/disabled

Automatically fall back to DEFAULT

No strategy logic is stored in WorkItem tables.

8. Feature Toggle Model (Foundation)

All optional behavior is controlled via configuration.

Examples:

Event publishing

Distribution strategies

Assignment modes

Escalation

SLA monitoring

When disabled:

Logic is bypassed

Core operations remain unaffected

9. Performance Guarantees (Baseline)

Single transaction per WorkItem command

No synchronous external calls

Optional async event dispatch

Indexed access on:

state

assignee_id

workflow_id

run_id