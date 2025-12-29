//import { WorkItem } from '../WorkItem';
import { WorkItemDraft } from '../WorkItemDraft';

export interface CreateWorkItemDecision {
    readonly draft: WorkItemDraft;
    readonly assignmentDecision: {
      offeredTo: string[];
      assignedTo?: string;
    };
    readonly lifecycleName: string;
  }
