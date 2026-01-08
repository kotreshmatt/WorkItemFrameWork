import { Request, Response } from 'express';
import { WorkItemGateway } from '../services/WorkItemGateway';

export class WorkItemController {
    private gateway = new WorkItemGateway();

    claim = async (req: Request, res: Response) => {
        try {
            const { workItemId } = req.params;
            const { userId, workflowId } = req.body;

            if (!userId || !workflowId) {
                return res.status(400).json({
                    error: 'userId and workflowId are required'
                });
            }

            const result = await this.gateway.claim(
                Number(workItemId),
                userId,
                workflowId
            );

           return  res.json(result);
        } catch (error: any) {
           return res.status(500).json({
                error: error.message
            });
        }
    };

    complete = async (req: Request, res: Response) => {
        try {
            const { workItemId } = req.params;
            const { userId, workflowId, output } = req.body;

            if (!userId || !workflowId) {
                return res.status(400).json({
                    error: 'userId and workflowId are required'
                });
            }

            const result = await this.gateway.complete(
                Number(workItemId),
                userId,
                workflowId,
                output || []
            );

            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                error: error.message
            });
        }
    };

    cancel = async (req: Request, res: Response) => {
        try {
            const { workItemId } = req.params;
            const { userId, workflowId, reason } = req.body;

            if (!userId || !workflowId) {
                return res.status(400).json({
                    error: 'userId and workflowId are required'
                });
            }

            const result = await this.gateway.cancel(
                Number(workItemId),
                userId,
                workflowId,
                reason || ''
            );

            res.json(result);
        } catch (error: any) {
            res.status(500).json({
                error: error.message
            });
        }
    };

    getWorkItem = async (req: Request, res: Response) => {
        try {
            const { workItemId } = req.params;
            const result = await this.gateway.getWorkItem(Number(workItemId));

            if (!result) {
                return res.status(404).json({ error: 'Work item not found' });
            }

            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getWorkItemsByUser = async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }
            const workItems = await this.gateway.getWorkItemsByUser(userId);
            res.json({ userId, workItems, total: workItems.length });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getWorkItemsByState = async (req: Request, res: Response) => {
        try {
            const { state } = req.params;
            if (!state) {
                return res.status(400).json({ error: 'state is required' });
            }
            const workItems = await this.gateway.getWorkItemsByState(state);
            res.json({ state, workItems, total: workItems.length });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };

    getAllWorkItems = async (req: Request, res: Response) => {
        try {
            const { state, userId, limit, offset, ...contextDataFilters } = req.query;

            // Extract contextData filters
            const contextData: Record<string, any> = {};
            Object.keys(contextDataFilters).forEach(key => {
                if (key.startsWith('contextData.')) {
                    const field = key.replace('contextData.', '');
                    contextData[field] = contextDataFilters[key];
                }
            });

            const args: {
                state?: string;
                userId?: string;
                contextData?: Record<string, any>;
                limit?: number;
                offset?: number;
            } = {
                limit: limit ? Number(limit) : 20,
                offset: offset ? Number(offset) : 0
            };

            if (typeof state === 'string' && state.length > 0) args.state = state;
            if (typeof userId === 'string' && userId.length > 0) args.userId = userId;
            if (Object.keys(contextData).length > 0) args.contextData = contextData;

            const result = await this.gateway.getAllWorkItems(args);


           return  res.json({
                ...result,
                limit: limit ? Number(limit) : 20,
                offset: offset ? Number(offset) : 0,
                filters: { state, userId, contextData }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    };
}
