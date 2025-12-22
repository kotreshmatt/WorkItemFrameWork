import { Worker } from '@temporalio/worker';
import path from 'path';
import logger from './utils/logger';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./temporal/workflows/exceptionflow'),
    activities: require('./temporal/activities'),
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'workitem-task-queue',
  });

  logger.info('Temporal worker started');
  await worker.run();
}

run().catch(err => {
  logger.error('Worker failed', { err });
  process.exit(1);
});
