import { Request, Response } from 'express';
import { DataPoolService } from '../services/DataPoolService';

export class DataPoolController {
    private dataPoolService: DataPoolService;

    constructor() {
        this.dataPoolService = new DataPoolService();
    }

    /**
     * POST /api/datapool
     * Upsert case data
     */
    async upsertData(req: Request, res: Response) {
        try {
            const { caseId, data } = req.body;

            if (!caseId || !data) {
                return res.status(400).json({
                    error: 'caseId and data are required'
                });
            }

            const result = await this.dataPoolService.upsertData(caseId, data);

            res.json({
                success: true,
                caseId: result.case_id,
                data: result.data,
                updatedAt: result.updated_at
            });
        } catch (error) {
            console.error('Error upserting datapool:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ error: errorMessage });
        }
    }

    /**
     * GET /api/datapool/:caseId
     * Get case data
     */
    async getData(req: Request, res: Response) {
        try {
            const { caseId } = req.params;

            const result = await this.dataPoolService.getData(caseId);

            if (!result) {
                return res.status(404).json({
                    error: 'Case not found'
                });
            }

            res.json({
                caseId: result.case_id,
                data: result.data,
                createdAt: result.created_at,
                updatedAt: result.updated_at
            });
        } catch (error) {
            console.error('Error getting datapool:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ error: errorMessage });
        }
    }

    /**
     * DELETE /api/datapool/:caseId
     * Delete case data
     */
    async deleteData(req: Request, res: Response) {
        try {
            const { caseId } = req.params;

            await this.dataPoolService.deleteData(caseId);

            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting datapool:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ error: errorMessage });
        }
    }
}
