
import { Connection, Client } from '@temporalio/client';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';
const ITERATIONS = 100;
const CONCURRENCY = 10;
const TIMEOUT_MS = 30000;

interface PerfResult {
    duration?: number;
    error?: any;
}

async function runTest() {
    console.log(`Connecting to Temporal...`);
    const connection = await Connection.connect(); // Connects to localhost:7233
    const client = new Client({ connection });

    console.log(`Starting Performance Test`);
    console.log(`Target: ${ITERATIONS} workflows`);
    console.log(`Concurrency: ${CONCURRENCY}`);
    console.log(`Gateway: ${GATEWAY_URL}`);
    console.log('--------------------------------------------------');

    const results: number[] = [];
    const errors: any[] = [];
    const startTime = Date.now();

    for (let i = 0; i < ITERATIONS; i += CONCURRENCY) {
        const batchSize = Math.min(CONCURRENCY, ITERATIONS - i);
        const batchPromises: Promise<PerfResult>[] = [];

        console.log(`Processing batch ${i + 1}-${i + batchSize}...`);

        for (let j = 0; j < batchSize; j++) {
            batchPromises.push(runWorkflowCycle(client, i + j));
        }

        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach((res) => {
            if (res.error) {
                errors.push(res.error);
            } else if (res.duration !== undefined) {
                results.push(res.duration);
            }
        });
    }

    const totalTime = Date.now() - startTime;

    // Print Stats
    console.log('\n========== PERFORMANCE RESULTS ==========');
    console.log(`Total Wall Time:  ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`Successful Runs:  ${results.length}/${ITERATIONS}`);
    console.log(`Failed Runs:      ${errors.length}/${ITERATIONS}`);

    if (results.length > 0) {
        const avg = results.reduce((a, b) => a + b, 0) / results.length;
        const min = Math.min(...results);
        const max = Math.max(...results);
        const sorted = [...results].sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)];

        console.log(`\nTime to Create Subprocess WI (after Task 1 completion):`);
        console.log(`  Average: ${avg.toFixed(2)} ms`);
        console.log(`  Min:     ${min.toFixed(2)} ms`);
        console.log(`  Max:     ${max.toFixed(2)} ms`);
        console.log(`  P95:     ${p95.toFixed(2)} ms`);
    }

    if (errors.length > 0) {
        console.log('\nSample Errors:');
        errors.slice(0, 3).forEach((e, idx) => console.log(`  ${idx + 1}. ${e.message || e}`));
    }
    console.log('=========================================');
}

async function runWorkflowCycle(client: Client, index: number): Promise<PerfResult> {
    const caseId = `PERF-${Date.now()}-${index}`;
    const workflowId = `case-${caseId}`;

    try {
        // 1. Start Workflow
        await client.workflow.start('caseWorkflow', {
            taskQueue: 'workitem-queue',
            workflowId,
            args: [{ caseId, caseType: 'PERF' }]
        });

        // 2. Poll for Task 1 (Expected: IK10100P1)
        let task1Id: number | null = null;
        let pollStart = Date.now();

        while (!task1Id && (Date.now() - pollStart) < TIMEOUT_MS) {
            const res = await fetch(`${GATEWAY_URL}/api/workitems?caseId=${caseId}`);
            if (res.ok) {
                const items = await res.json();
                const t1 = items.find((ti: any) => ti.taskName === 'IK10100P1' && ti.state === 'OFFERED');
                if (t1) task1Id = t1.workItemId;
            }
            if (!task1Id) await new Promise(r => setTimeout(r, 100)); // 100ms poll
        }

        if (!task1Id) throw new Error(`Timeout waiting for Task 1 (Case: ${caseId})`);

        // 3. Complete Task 1 -> triggers Subprocess
        const tStart = Date.now();
        const completeRes = await fetch(`${GATEWAY_URL}/api/workitems/${task1Id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'perf-user',
                workflowId,
                output: [
                    { name: 'decision', value: 'approved', direction: 'INOUT' },
                    { name: 'subprocess', value: 'true', direction: 'INOUT' }
                ]
            })
        });

        if (!completeRes.ok) {
            throw new Error(`Complete failed: ${await completeRes.text()}`);
        }

        // 4. Poll for Subprocess Work Item
        let subprocessId: number | null = null;
        pollStart = Date.now();

        while (!subprocessId && (Date.now() - pollStart) < TIMEOUT_MS) {
            const res = await fetch(`${GATEWAY_URL}/api/workitems?caseId=${caseId}`);
            if (res.ok) {
                const items = await res.json();
                // Find work item with ID > task1Id (simple heuristic) 
                // OR taskName != IK10100P1
                const sub = items.find((ti: any) => ti.workItemId !== task1Id && ti.state === 'OFFERED');
                if (sub) {
                    const tEnd = Date.now();
                    return { duration: tEnd - tStart };
                }
            }
            if (!subprocessId) await new Promise(r => setTimeout(r, 50)); // 50ms poll
        }

        throw new Error(`Timeout waiting for Subprocess WI (Case: ${caseId})`);

    } catch (error) {
        return { error };
    }
}

runTest().catch(console.error);
