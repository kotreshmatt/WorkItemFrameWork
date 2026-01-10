// API Client for Gateway
class GatewayClient {
    constructor(baseUrl = 'http://localhost:3000/api') {
        this.baseUrl = baseUrl;
    }

    async getWorkItemsByUser(userId) {
        try {
            const response = await fetch(`${this.baseUrl}/workitems/user/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch work items');
            return await response.json();
        } catch (error) {
            console.error('Error fetching work items:', error);
            throw error;
        }
    }

    async claimWorkItem(workItemId, userId, workflowId) {
        try {
            const response = await fetch(`${this.baseUrl}/workitems/${workItemId}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, workflowId })
            });
            if (!response.ok) throw new Error('Failed to claim work item');
            return await response.json();
        } catch (error) {
            console.error('Error claiming work item:', error);
            throw error;
        }
    }

    async completeWorkItem(workItemId, userId, workflowId, output) {
        try {
            const response = await fetch(`${this.baseUrl}/workitems/${workItemId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, workflowId, output })
            });
            if (!response.ok) throw new Error('Failed to complete work item');
            return await response.json();
        } catch (error) {
            console.error('Error completing work item:', error);
            throw error;
        }
    }

    async cancelWorkItem(workItemId, userId, workflowId, reason) {
        try {
            const response = await fetch(`${this.baseUrl}/workitems/${workItemId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, workflowId, reason })
            });
            if (!response.ok) throw new Error('Failed to cancel work item');
            return await response.json();
        } catch (error) {
            console.error('Error canceling work item:', error);
            throw error;
        }
    }
}

// Workflow Client for creating workflows
class WorkflowClient {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
    }

    async createWorkflow() {
        try {
            // Generate unique case ID
            const caseId = `CASE-${Date.now()}`;

            // Call workflow start script endpoint
            // Note: You'll need to add this endpoint to Gateway or call Temporal client directly
            const response = await fetch(`${this.baseUrl}/api/workflows/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caseId })
            });

            if (!response.ok) {
                throw new Error('Failed to create workflow');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating workflow:', error);
            throw error;
        }
    }
}
