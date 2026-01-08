#!/usr/bin/env ts-node

/**
 * Example script to start a workflow
 * 
 * Usage: npm run start-workflow CASE-001
 */

import { WorkflowClient } from './client';

async function main() {
    const caseId = process.argv[2] || 'CASE-001';

    console.log('=== Starting Workflow ===');
    console.log(`Case ID: ${caseId}`);
    console.log('');

    const client = new WorkflowClient({
        temporalAddress: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
        taskQueue: 'workitem-queue'
    });

    try {
        const { workflowId, runId } = await client.startWorkflow(caseId);

        console.log('');
        console.log('✅ Workflow started successfully!');
        console.log('');
        console.log(`Workflow ID: ${workflowId}`);
        console.log(`Run ID: ${runId}`);
        console.log('');
        console.log('Next steps:');
        console.log('1. Query work item:');
        console.log(`   curl "http://localhost:3000/api/workitems?contextData.caseId=${caseId}"`);
        console.log('');
        console.log('2. Claim work item (replace {workItemId}):');
        console.log(`   curl -X POST http://localhost:3000/api/workitems/{workItemId}/claim \\`);
        console.log(`     -H "Content-Type: application/json" \\`);
        console.log(`     -d '{"userId":"manager1","workflowId":"${workflowId}"}'`);
        console.log('');

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Failed to start workflow:', error.message);
        process.exit(1);
    }
}

main();
