import { Pool } from 'pg';

export class WorkItemQueryService {
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

    async findById(workItemId: number) {
        const result = await this.pool.query(
            `SELECT id, workflow_id, run_id, state, version, parameters, context as contextData, created_at 
       FROM work_items WHERE id = $1`,
            [workItemId]
        );
        return result.rows[0];
    }

    async findByUser(userId: string) {
        const result = await this.pool.query(
            `SELECT id as workitem_id, workflow_id, run_id, state, version, task_type, task_name, priority,
                    parameters, context, created_at
       FROM work_items 
       WHERE assignee_id = $1 
       OR (offered_to IS NOT NULL AND offered_to ? $1)
       ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    async findByState(state: string) {
        const result = await this.pool.query(
            `SELECT id, workflow_id, run_id, state, version, parameters, context as contextData, created_at
       FROM work_items WHERE state = $1 ORDER BY created_at DESC`,
            [state]
        );
        return result.rows;
    }

    async findAll(filters?: {
        state?: string;
        userId?: string;
        contextData?: Record<string, any>;
        limit?: number;
        offset?: number
    }) {
        let query = `SELECT id, workflow_id, run_id, state, version, parameters, context as contextData, created_at
                 FROM work_items WHERE 1=1`;
        const params: any[] = [];
        let paramIndex = 1;

        if (filters?.state) {
            query += ` AND state = $${paramIndex}`;
            params.push(filters.state);
            paramIndex++;
        }

        if (filters?.userId) {
            query += ` AND (assignee_id = $${paramIndex} OR (offered_to IS NOT NULL AND offered_to ? $${paramIndex}))`;
            params.push(filters.userId);
            paramIndex++;
        }

        // JSONB contextData filtering
        if (filters?.contextData) {
            for (const [key, value] of Object.entries(filters.contextData)) {
                query += ` AND context @> $${paramIndex}`;
                params.push(JSON.stringify({ [key]: value }));
                paramIndex++;
            }
        }

        query += ' ORDER BY created_at DESC';

        if (filters?.limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(filters.limit);
            paramIndex++;
        }

        if (filters?.offset) {
            query += ` OFFSET $${paramIndex}`;
            params.push(filters.offset);
        }

        const result = await this.pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM work_items WHERE 1=1';
        const countParams: any[] = [];
        let countIndex = 1;

        if (filters?.state) {
            countQuery += ` AND state = $${countIndex}`;
            countParams.push(filters.state);
            countIndex++;
        }

        if (filters?.userId) {
            countQuery += ` AND (assignee_id = $${countIndex} OR (offered_to IS NOT NULL AND offered_to ? $${countIndex}))`;
            countParams.push(filters.userId);
            countIndex++;
        }

        if (filters?.contextData) {
            for (const [key, value] of Object.entries(filters.contextData)) {
                countQuery += ` AND context @> $${countIndex}`;
                countParams.push(JSON.stringify({ [key]: value }));
                countIndex++;
            }
        }

        const countResult = await this.pool.query(countQuery, countParams);

        return {
            workItems: result.rows,
            total: parseInt(countResult.rows[0].count)
        };
    }

    async close() {
        await this.pool.end();
    }
}
