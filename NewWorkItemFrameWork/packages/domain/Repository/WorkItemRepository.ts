import { WorkItem } from '../workitem/WorkItem';
import { WorkItemId } from '../workitem/WorkItemId';

export interface WorkItemRepository {
  save(workItem: WorkItem): Promise<void>;
  findById(id: WorkItemId): Promise<WorkItem | null>;
}
WorkItemId