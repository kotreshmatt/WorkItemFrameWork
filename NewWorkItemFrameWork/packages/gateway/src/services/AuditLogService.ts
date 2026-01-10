import { Pool } from 'pg';

export class AuditLogService {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'bpmdb',
            user: process.env.DB_USER || 'bpmdb',
            password: process.env.DB_PASSWORD || 'bpmdb'
        });
    }

    /**
     * Log an event for a case
     */
    async logEvent(caseId: string, event: string, data: Record<string, any>) {
        const result = await this.pool.query(
            `INSERT INTO auditlog (case_id, event, data, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING *`,
            [caseId, event, JSON.stringify(data)]
        );
        return result.rows[0];
    }

    /**
     * Get all events for a case
     */
    async getEventsByCaseId(caseId: string) {
        const result = await this.pool.query(
            `SELECT * FROM auditlog 
             WHERE case_id = $1 
             ORDER BY created_at DESC`,
            [caseId]
        );
        return result.rows;
    }

    /**
     * Get events by event type
     */
    async getEventsByType(event: string) {
        const result = await this.pool.query(
            `SELECT * FROM auditlog 
             WHERE event = $1 
             ORDER BY created_at DESC`,
            [event]
        );
        return result.rows;
    }

    async close() {
        await this.pool.end();
    }
}
