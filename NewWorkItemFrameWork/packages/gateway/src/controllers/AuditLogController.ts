import { Request, Response } from 'express';
import { AuditLogService } from '../services/AuditLogService';

export class AuditLogController {
    private auditLogService: AuditLogService;

    constructor() {
        this.auditLogService = new AuditLogService();
    }

    /**
     * POST /api/auditlog
     * Log an event
     */
    async logEvent(req: Request, res: Response) {
        try {
            const { caseId, event, data } = req.body;

            if (!caseId || !event || !data) {
                return res.status(400).json({
                    error: 'caseId, event, and data are required'
                });
            }

            const result = await this.auditLogService.logEvent(caseId, event, data);

            res.json({
                success: true,
                id: result.id,
                caseId: result.case_id,
                event: result.event,
                createdAt: result.created_at
            });
        } catch (error) {
            console.error('Error logging event:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ error: errorMessage });
        }
    }

    /**
     * GET /api/auditlog/:caseId
     * Get events for a case
     */
    async getEventsByCaseId(req: Request, res: Response) {
        try {
            const { caseId } = req.params;

            const events = await this.auditLogService.getEventsByCaseId(caseId);

            res.json({
                caseId,
                events: events.map(e => ({
                    id: e.id,
                    event: e.event,
                    data: e.data,
                    createdAt: e.created_at
                }))
            });
        } catch (error) {
            console.error('Error getting audit logs:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ error: errorMessage });
        }
    }

    /**
     * GET /api/auditlog/event/:eventType
     * Get events by type
     */
    async getEventsByType(req: Request, res: Response) {
        try {
            const { eventType } = req.params;

            const events = await this.auditLogService.getEventsByType(eventType);

            res.json({
                eventType,
                events: events.map(e => ({
                    id: e.id,
                    caseId: e.case_id,
                    data: e.data,
                    createdAt: e.created_at
                }))
            });
        } catch (error) {
            console.error('Error getting audit logs by type:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ error: errorMessage });
        }
    }
}
