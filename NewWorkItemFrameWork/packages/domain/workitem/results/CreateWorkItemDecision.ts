//import { WorkItem } from '../WorkItem';
import { WorkItemDraft } from '../WorkItemDraft';

export interface CreateWorkItemDecision {
    //readonly draft: WorkItemDraft;
    readonly  initialState : string;
    readonly assignmentDecision: {
     readonly offeredTo: string[];
      
    };
    readonly lifecycleName: string;
  }
