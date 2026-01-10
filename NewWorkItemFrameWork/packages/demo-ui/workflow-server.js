const express = require('express');
const cors = require('cors');

// Import directly from the compiled client.js file  
const { WorkflowClient } = require('../temporal-workflows/dist/temporal-workflows/src/client.js');

const app = express();
app.use(cors());
app.use(express.json());

console.log('[Workflow Server] WorkflowClient:', WorkflowClient);

const workflowClient = new WorkflowClient();

// Start workflow endpoint for demo UI
app.post('/start-workflow', async (req, res) => {
    try {
        const { caseId } = req.body;

        if (!caseId) {
            return res.status(400).json({ error: 'caseId is required' });
        }

        console.log(`[Workflow Server] Starting workflow for case: ${caseId}`);

        const result = await workflowClient.startWorkflow(caseId);

        res.json({
            success: true,
            workflowId: result.workflowId,
            runId: result.runId,
            caseId
        });
    } catch (error) {
        console.error('[Workflow Server] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
});

const PORT = process.env.WORKFLOW_PORT || 3001;
app.listen(PORT, () => {
    console.log(`[Workflow Server] Listening on port ${PORT}`);
    console.log(`[Workflow Server] POST http://localhost:${PORT}/start-workflow`);
});
