// packages/domain/workitem/assignment/AssignmentCandidateResolver.ts

import { WorkItemAssignmentSpec } from '../WorkItemAssignmentSpec';

export interface AssignmentCandidateResolver {
  resolve(spec: WorkItemAssignmentSpec): Promise<string[]>;
}
