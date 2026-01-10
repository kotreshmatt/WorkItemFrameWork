import { Pool } from 'pg';

export class DataPoolService {
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
     * Upsert data for a case
     * Merges new key-value pairs with existing data
     */
    async upsertData(caseId: string, data: Record<string, any>) {
        const result = await this.pool.query(
            `INSERT INTO datapool (case_id, data, created_at, updated_at)
             VALUES ($1, $2, NOW(), NOW())
             ON CONFLICT (case_id) 
             DO UPDATE SET 
               data = datapool.data || $2,
               updated_at = NOW()
             RETURNING *`,
            [caseId, JSON.stringify(data)]
        );
        return result.rows[0];
    }

    /**
     * Get data for a case
     */
    async getData(caseId: string) {
        const result = await this.pool.query(
            'SELECT * FROM datapool WHERE case_id = $1',
            [caseId]
        );
        return result.rows[0];
    }

    /**
     * Delete data for a case
     */
    async deleteData(caseId: string) {
        await this.pool.query(
            'DELETE FROM datapool WHERE case_id = $1',
            [caseId]
        );
    }

    async close() {
        await this.pool.end();
    }
}
