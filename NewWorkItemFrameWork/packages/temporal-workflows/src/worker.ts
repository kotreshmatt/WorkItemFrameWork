import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
    const worker = await Worker.create({
        workflowsPath: require.resolve('./workitem.workflow'),
        activities,
        taskQueue: 'workitem-queue',
    });

    console.log('🚀 Temporal Worker started');
    console.log('📋 Task Queue: workitem-queue');
    console.log('📁 Workflows: workitem.workflow');

    await worker.run();
}

run().catch((err) => {
    console.error('Worker failed:', err);
    process.exit(1);
});
