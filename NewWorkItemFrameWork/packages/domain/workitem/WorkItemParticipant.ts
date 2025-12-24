export enum ParticipantRole {
    OFFERED = 'OFFERED',
    ASSIGNEE = 'ASSIGNEE',
    COMPLETER = 'COMPLETER',
    CANCELLER = 'CANCELLER'
  }
  
  export interface WorkItemParticipant {
    workItemId: string;
    userId: string;
    role: ParticipantRole;
    timestamp: Date;
  }
  