import { WorkItem } from '../WorkItem';

export interface AssignmentContext {
  workItem: WorkItem;
  candidateUsers: string[];
  candidateGroups: string[];
  candidateOrgUnits: string[];
  candidatePositions: string[];
  
}
