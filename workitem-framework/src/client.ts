import { Connection, Client } from '@temporalio/client';
import logger from './utils/logger';

async function start() {
  const connection = await Connection.connect({ address: process.env.TEMPORAL_ADDRESS || 'localhost:7233' });
  const client = new Client({ connection });
  const handle = await client.workflow.start('ExceptionWorkFlow', {
    args: [{ errorCode: 400, errorMessage: 'contract id is missing' }],
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'workitem-task-queue',
    workflowId: 'ExceptionWorkFlow-' + Date.now(),
  });

  logger.info('Workflow started', { workflowId: handle.workflowId });
}

start().catch(err => {
  logger.error('Client start failed', { err });
});
