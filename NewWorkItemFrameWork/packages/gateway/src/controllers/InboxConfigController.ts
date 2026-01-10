import { Request, Response } from 'express';
import { InboxConfigService } from '../services/InboxConfigService';

export class InboxConfigController {
    private inboxConfigService: InboxConfigService;

    constructor() {
        this.inboxConfigService = new InboxConfigService();
    }

    /**
     * POST /api/inboxconfig
     * Create inbox configuration
     */
    async create(req: Request, res: Response) {
        try {
            const { templateId, caseType, inboxName, inboxState } = req.body;

            if (!templateId || !caseType || !inboxName || !inboxState) {
                return res.status(400).json({
                    error: 'templateId, caseType, inboxName, and inboxState are required'
                });
            }

            const result = await this.inboxConfigService.create({
                templateId,
                caseType,
                inboxName,
                inboxState
            });

            res.json({
                success: true,
                config: {
                    templateId: result.template_id,
                    caseType: result.case_type,
                    inboxName: result.inbox_name,
                    inboxState: result.inbox_state,
                    createdAt: result.created_at
                }
            });
        } catch (error) {
            console.error('Error creating inbox config:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ error: errorMessage });
        }
    }

    /**
     * GET /api/inboxconfig/:templateId
     * Get configuration by template ID
     */
    async getByTemplateId(req: Request, res: Response) {
        try {
            const { templateId } = req.params;

            const result = await this.inboxConfigService.getByTemplateId(templateId);

            if (!result) {
                return res.status(404).json({
                    error: 'Configuration not found'
                });
            }

            res.json({
                templateId: result.template_id,
                caseType: result.case_type,
                inboxName: result.inbox_name,
                inboxState: result.inbox_state,
                createdAt: result.created_at,
                updatedAt: result.updated_at
            });
        } catch (error) {
            console.error('Error getting inbox config:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ error: errorMessage });
        }
    }

    /**
     * GET /api/inboxconfig
     * Get all configurations
     */
    async getAll(req: Request, res: Response) {
        try {
            const { caseType } = req.query;

            let results;
            if (caseType) {
                results = await this.inboxConfigService.getByCaseType(caseType as string);
            } else {
                results = await this.inboxConfigService.getAll();
            }

            res.json({
                configs: results.map(r => ({
                    templateId: r.template_id,
                    caseType: r.case_type,
                    inboxName: r.inbox_name,
                    inboxState: r.inbox_state,
                    createdAt: r.created_at,
                    updatedAt: r.updated_at
                }))
            });
        } catch (error) {
            console.error('Error getting inbox configs:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ error: errorMessage });
        }
    }

    /**
     * PUT /api/inboxconfig/:templateId
     * Update configuration
     */
    async update(req: Request, res: Response) {
        try {
            const { templateId } = req.params;
            const { caseType, inboxName, inboxState } = req.body;

            const result = await this.inboxConfigService.update(templateId, {
                caseType,
                inboxName,
                inboxState
            });

            if (!result) {
                return res.status(404).json({
                    error: 'Configuration not found'
                });
            }

            res.json({
                success: true,
                config: {
                    templateId: result.template_id,
                    caseType: result.case_type,
                    inboxName: result.inbox_name,
                    inboxState: result.inbox_state,
                    updatedAt: result.updated_at
                }
            });
        } catch (error) {
            console.error('Error updating inbox config:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ error: errorMessage });
        }
    }

    /**
     * DELETE /api/inboxconfig/:templateId
     * Delete configuration
     */
    async delete(req: Request, res: Response) {
        try {
            const { templateId } = req.params;

            await this.inboxConfigService.delete(templateId);

            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting inbox config:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ error: errorMessage });
        }
    }
}
