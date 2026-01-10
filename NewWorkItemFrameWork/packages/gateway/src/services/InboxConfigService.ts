import { Pool } from 'pg';

export class InboxConfigService {
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
     * Create inbox configuration
     */
    async create(config: {
        templateId: string;
        caseType: string;
        inboxName: string;
        inboxState: string;
    }) {
        const result = await this.pool.query(
            `INSERT INTO inboxconfig (template_id, case_type, inbox_name, inbox_state, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             RETURNING *`,
            [config.templateId, config.caseType, config.inboxName, config.inboxState]
        );
        return result.rows[0];
    }

    /**
     * Get configuration by template ID
     */
    async getByTemplateId(templateId: string) {
        const result = await this.pool.query(
            'SELECT * FROM inboxconfig WHERE template_id = $1',
            [templateId]
        );
        return result.rows[0];
    }

    /**
     * Get all configurations
     */
    async getAll() {
        const result = await this.pool.query(
            'SELECT * FROM inboxconfig ORDER BY created_at DESC'
        );
        return result.rows;
    }

    /**
     * Get configurations by case type
     */
    async getByCaseType(caseType: string) {
        const result = await this.pool.query(
            'SELECT * FROM inboxconfig WHERE case_type = $1',
            [caseType]
        );
        return result.rows;
    }

    /**
     * Update configuration
     */
    async update(templateId: string, updates: {
        caseType?: string;
        inboxName?: string;
        inboxState?: string;
    }) {
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.caseType !== undefined) {
            setClauses.push(`case_type = $${paramIndex++}`);
            values.push(updates.caseType);
        }
        if (updates.inboxName !== undefined) {
            setClauses.push(`inbox_name = $${paramIndex++}`);
            values.push(updates.inboxName);
        }
        if (updates.inboxState !== undefined) {
            setClauses.push(`inbox_state = $${paramIndex++}`);
            values.push(updates.inboxState);
        }

        if (setClauses.length === 0) {
            return this.getByTemplateId(templateId);
        }

        setClauses.push(`updated_at = NOW()`);
        values.push(templateId);

        const result = await this.pool.query(
            `UPDATE inboxconfig 
             SET ${setClauses.join(', ')}
             WHERE template_id = $${paramIndex}
             RETURNING *`,
            values
        );
        return result.rows[0];
    }

    /**
     * Delete configuration
     */
    async delete(templateId: string) {
        await this.pool.query(
            'DELETE FROM inboxconfig WHERE template_id = $1',
            [templateId]
        );
    }

    async close() {
        await this.pool.end();
    }
}
