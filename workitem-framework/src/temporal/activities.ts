import { workItemFramework } from '../framework/WorkItemFramework';
import { WorkItemConfig } from '../types';
import logger from '../utils/logger';

export async function createWorkItem(config: WorkItemConfig): Promise<number> {
  logger.info('Activity: createWorkItem', { taskName: config.taskName });
  return await workItemFramework.createWorkItem(config);
}

export async function sendNotification(payload: { userIds: string[]; message: string }): Promise<void> {
  logger.info('Activity: sendNotification', { payload });
  
}

export async function updateSystemRecord(payload: any): Promise<void> {
  logger.info('Activity: updateSystemRecord', { payload });
 
}
export async function cancelWorkItem(workItemId: number): Promise<void> {
  logger.info('Activity: cancelWorkItem', { workItemId });
  return await workItemFramework.cancelWorkItem(workItemId,'canceled by workflow cancellation');
}
