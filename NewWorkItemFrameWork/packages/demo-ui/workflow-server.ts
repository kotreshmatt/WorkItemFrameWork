import express, { Request, Response } from 'express';
import cors from 'cors';
import { WorkflowClient } from '../temporal-workflows/src/client';

const app = express();
app.use(cors());
app.use(express.json());

const workflowClient = new WorkflowClient();

// Start workflow endpoint for demo UI
app.post('/start-workflow', async (req: Request, res: Response) => {
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
