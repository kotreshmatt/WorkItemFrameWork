# Demo UI for WorkItem Framework

Modern web application to demonstrate WorkItem Framework capabilities.

## Features

- ✅ **Simple Login** - Enter username, no password needed
- ✅ **Worklist View** - See all work items for logged-in user
- ✅ **Work Item Actions**:
  - Open (auto-claims work item)
  - Complete (with output parameters dialog)
  - Cancel (with reason)
- ✅ **Create Workflow** - One-click workflow creation with auto-generated case ID
- ✅ **Real-time Updates** - Refresh to see latest work items
- ✅ **Modern UI** - Clean design with animations and glassmorphism effects

## Quick Start

### Prerequisites

Make sure these are running:
1. PostgreSQL database
2. Temporal server (`temporal server start-dev`)
3. SDK gRPC server (`cd packages/sdk && npm run dev:server`)
4. Temporal worker (`cd packages/temporal-workflows && npm run worker`)
5. Gateway REST server (`cd packages/gateway && npm run dev`)

### Start Demo UI

```bash
# Terminal 1: Start workflow server (for creating workflows)
cd packages/demo-ui
npm install
npm start
# Runs on http://localhost:3001

# Terminal 2: Serve UI files
npm run serve
# Runs on http://localhost:8080
```

### Open in Browser

Navigate to: **http://localhost:8080**

## Usage

### 1. Login
- Enter any username (e.g., "manager1", "user1")
- Click "Enter Worklist"

### 2. Create Workflow
- Click "Create Workflow" button
- Workflow automatically created with unique case ID
- New work item appears in worklist after 2 seconds

### 3. Claim Work Item
- Find work item with state "OFFERED"
- Click "Open" button
- Work item claimed and state changes to "CLAIMED"

### 4. Complete Work Item
- Find claimed work item
- Click "Complete" button
- Fill in output parameters:
  - Retry: Yes/No
  - Comments: Free text
  - Skip Error: Yes/No
- Click "Complete"
- Work item disappears from list (state: COMPLETED)

### 5. Filter Work Items
- Click filter buttons: All / Offered / Claimed
- View filtered results

## Architecture

```
Demo UI (Port 8080)
    ↓ HTTP
Workflow Server (Port 3001)  ← Creates workflows
    ↓
Temporal Workflows
    ↓
Work Item Framework

Demo UI (Port 8080)
    ↓ HTTP
Gateway REST API (Port 3000)  ← Work item actions
    ↓
Temporal + SDK
    ↓
Work Item Framework
```

## API Endpoints Used

### Gateway (Port 3000)
- `GET /api/workitems/user/:userId` - Fetch work items
- `POST /api/workitems/:id/claim` - Claim work item
- `POST /api/workitems/:id/complete` - Complete work item
- `POST /api/workitems/:id/cancel` - Cancel work item

### Workflow Server (Port 3001)
- `POST /start-workflow` - Create new workflow

## File Structure

```
demo-ui/
├── index.html          # Main UI
├── styles.css          # Modern CSS styling
├── app.js             # Application logic
├── api.js             # API client
├── workflow-server.ts  # Workflow creation server
├── package.json       # Dependencies
└── README.md          # This file
```

## Troubleshooting

### "Failed to fetch work items"
- Check if Gateway is running on port 3000
- Check browser console for CORS errors
- Verify Gateway has CORS enabled

### "Failed to create workflow"
- Check if workflow server is running on port 3001
- Check if Temporal server is running
- Check if Temporal worker is running
- View workflow server console for errors

### "Work item doesn't appear after creation"
- Wait 2 seconds for auto-refresh
- Click "Refresh" button manually
- Check Temporal worker logs
- Verify work item was created in database

### Empty worklist
- Create a workflow first
- Check database for work items
- Verify username matches work item assignment

## Demo Script

**Perfect demo flow**:

1. Open UI → Login as "manager1"
2. Click "Create Workflow" → See success message
3. Wait 2 seconds → Work item appears (OFFERED)
4. Click "Open" → Work item claimed (CLAIMED)
5. Click "Complete" → Fill params → Submit
6. Work item disappears → Success!

**Total time**: ~30 seconds

## Customization

### Change Workflow Parameters

Edit `packages/temporal-workflows/src/workitem.workflow.ts`:
- Modify task name, priority, parameters
- Adds to `contextData` in `createWorkItemActivity()`

### Change UI Colors

Edit `packages/demo-ui/styles.css`:
- Update gradient background
- Modify button colors
- Change card styling

### Add More Actions

Edit `packages/demo-ui/app.js`:
- Add new action buttons in `getActionsForState()`
- Implement handler function
- Call appropriate Gateway endpoint

## Production Notes

⚠️ **This is a demo UI** - Not production-ready!

**For production**, add:
- Real authentication (OAuth, JWT)
- Authorization checks
- Input validation
- Error boundaries
- Loading states
- Retry logic
- WebSocket for real-time updates
- Pagination for large worklists
- Advanced filtering
- Work item search
- Audit logging

## Screenshots

### Login Screen
![Login](screenshots/login.png)

### Worklist
![Worklist](screenshots/worklist.png)

### Complete Dialog
![Complete](screenshots/complete.png)

---

**Enjoy the demo!** 🎉
