import { Connection, Client, WorkflowHandle } from '@temporalio/client';

export interface TemporalConfig {
    address: string;
    defaultTimeoutMs: number;
}

export class TemporalClient {
    private client: Client | null = null;
    private config: TemporalConfig;

    constructor(config?: Partial<TemporalConfig>) {
        this.config = {
            address: config?.address || process.env.TEMPORAL_ADDRESS || 'localhost:7233',
            defaultTimeoutMs: config?.defaultTimeoutMs || parseInt(process.env.TEMPORAL_TIMEOUT_MS || '5000')
        };
    }

    async connect(): Promise<Client> {
        if (!this.client) {
            const connection = await Connection.connect({
                address: this.config.address
            });
            this.client = new Client({ connection });
        }
        return this.client;
    }

    async claimWithTimeout(
        workflowId: string,
        workItemId: number,
        userId: string,
        idempotencyKey: string,
        timeoutMs?: number
    ) {
        const client = await this.connect();
        const timeout = timeoutMs || this.config.defaultTimeoutMs;

        return this.withTimeout(async () => {
            const handle = client.workflow.getHandle(workflowId);

            // Detect workflow type from workflow ID
            const updateName = workflowId.startsWith('case-') ? 'claimTask' : 'claimWorkItem';

            return await handle.executeUpdate(updateName, {
                args: [{ workItemId, userId }],
                updateId: idempotencyKey
            });
        }, timeout);
    }

    async completeWithTimeout(
        workflowId: string,
        workItemId: number,
        userId: string,
        output: any[],
        idempotencyKey: string,
        timeoutMs?: number
    ) {
        const client = await this.connect();
        const timeout = timeoutMs || this.config.defaultTimeoutMs;

        return this.withTimeout(async () => {
            const handle = client.workflow.getHandle(workflowId);

            // Detect workflow type from workflow ID
            const updateName = workflowId.startsWith('case-') ? 'completeTask' : 'completeWorkItem';

            return await handle.executeUpdate(updateName, {
                args: [{ workItemId, userId, output }],
                updateId: idempotencyKey
            });
        }, timeout);
    }

    async cancelWithTimeout(
        workflowId: string,
        workItemId: number,
        userId: string,
        reason: string,
        idempotencyKey: string,
        timeoutMs?: number
    ) {
        const client = await this.connect();
        const timeout = timeoutMs || this.config.defaultTimeoutMs;

        return this.withTimeout(async () => {
            const handle = client.workflow.getHandle(workflowId);

            // Detect workflow type from workflow ID
            const updateName = workflowId.startsWith('case-') ? 'cancelTask' : 'cancelWorkItem';

            return await handle.executeUpdate(updateName, {
                args: [{ workItemId, userId, reason }],
                updateId: idempotencyKey
            });
        }, timeout);
    }

    private async withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
        return Promise.race([
            fn(),
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new TimeoutError()), timeoutMs)
            )
        ]);
    }
}

export class TimeoutError extends Error {
    constructor() {
        super('Operation timed out');
        this.name = 'TimeoutError';
    }
}
