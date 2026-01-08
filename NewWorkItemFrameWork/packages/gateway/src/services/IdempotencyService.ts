import { Pool } from 'pg';

export interface IdempotencyRecord {
    key: string;
    requestId: string;
    status: string;
    request: any;
}

export class IdempotencyService {
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

    async get(key: string) {
        const result = await this.pool.query(
            'SELECT * FROM idempotency_keys WHERE key = $1',
            [key]
        );
        return result.rows[0];
    }

    async create(data: IdempotencyRecord) {
        await this.pool.query(
            `INSERT INTO idempotency_keys 
       (key, request_id, status, request_payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (key) DO NOTHING`,
            [data.key, data.requestId, data.status, JSON.stringify(data.request)]
        );
    }

    async complete(key: string, response: any) {
        await this.pool.query(
            `UPDATE idempotency_keys 
       SET status = 'COMPLETED', 
           response_payload = $2,
           completed_at = NOW()
       WHERE key = $1`,
            [key, JSON.stringify(response)]
        );
    }

    async close() {
        await this.pool.end();
    }
}
