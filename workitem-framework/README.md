# BPM Framework on Temporal (Design & Usage)

## Overview
This project is a lightweight BPM framework that implements human tasks (WorkItems) backed by PostgreSQL and Temporal workflows. It supports input/inOut/out parameters, assignment resolution, auto-claiming, and safe workflow signalling.

## Components
- Express API (server.ts)
- WorkItemFramework (core logic) 
- Repositories (Postgres-backed)
- Temporal Worker (worker.ts) with activities
- Temporal Workflow example: ReimbursementWorkflow

## Key concepts
- WorkItem: a human task with parameters (in/inOut/out).
- Parameters:
  - in: read-only from workflow
  - inOut: editable by user; mandatory flag enforced
  - out: produced by user/system after completion
- Assignment resolution: supports userIds, roles, groups (requires users table)
- Lifecycle: offered -> opened -> completed | cancelled

## APIs
- POST /api/workitems
  - create work item. Body: WorkItemConfig (see types)
- GET /api/workitems/:id
  - returns WorkItemView: metadata + grouped params { in, inOut, out } (values only)
- GET /api/workitems/user/:userId
  - list WorkItemView assigned to user
- POST /api/workitems/:id/claim { userId }
- POST /api/workitems/:id/complete { userId, resultData }
- POST /api/workitems/:id/cancel { reason }
- GET /api/users/:id (minimal)

## Parameter validations
- in: cannot be changed (strict mode throws on change)
- inOut: mandatory must be present in resultData
- out: can be set by system or accepted if present

## Logging
- Winston logger with levels: debug, info, warn, error

## Run locally
1. Start Postgres with your schema (existing).
2. Start Temporal server (docker): `docker run --rm -d -p 7233:7233 temporalio/auto-setup`
3. Install deps: `npm i`
4. Start worker: `npm run start:worker` (node -r ts-node/register src/worker.ts)
5. Start server: `npm run start:server` (node -r ts-node/register src/server.ts)
6. Start client to create workflow: `npm run start:client`

## Sequence (workflow -> UI)
1. Workflow activity `createWorkItem()` inserts record with parameters.
2. UI calls GET /api/workitems/:id to render form (receives grouped in/inOut values).
3. User completes form -> POST /api/workitems/:id/complete.
4. Server auto-claims if necessary; validates in/out params; updates DB; signals Temporal workflow.
5. Workflow continues after receiving `workItemCompleted` signal.

## Extensibility
- Replace Postgres with another DB by swapping repo implementation.
- Add auth middleware (JWT) on Express.
- Expand UserRepository to sync with LDAP/IdP.

For full UML diagrams and detailed developer guide, see `docs/` (can be generated on request).
