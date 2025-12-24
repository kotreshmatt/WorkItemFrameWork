import { WorkItemAudit } from '../workitem/WorkItemAudit';

export interface WorkItemAuditRepository {
  record(audit: WorkItemAudit): Promise<void>;
}
