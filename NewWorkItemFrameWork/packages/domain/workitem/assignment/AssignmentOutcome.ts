import { DistributionMode } from '../WorkItemDistribution';

export interface AssignmentOutcome {
  mode: DistributionMode;
  assigneeId?: string;
  offeredTo: string[];
}
