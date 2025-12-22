export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type WorkItemState = 'offered' | 'opened' | 'completed' | 'cancelled';

export interface AssignmentConfig {
  userIds?: string[];
  roles?: string[];
  groups?: string[];
  reportsTo?: string;
}

export interface WorkItemParameter {
  name: string;
  direction: 'in' | 'inOut' | 'out';
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'class';
  value?: any;
  mandatory?: boolean;
}

export interface WorkItem {
  id: number;
  workflowId?: string;
  runId?: string;
  taskType: string;
  taskName: string;
  description?: string;
  priority: Priority;
  state: WorkItemState;
  offeredTo: {
    userIds?: string[];
    roles?: string[];
    groups?: string[];
  };
  claimedBy?: string;
  claimedAt?: Date;
  completedBy?: string;
  completedAt?: Date;
  contextData?: Record<string, any>;
  resultData?: Record<string, any>;
  parameters?: WorkItemParameter[];
  createdAt: Date;
  dueDate?: Date | null;
}

export interface WorkItemConfig {
  workflowId?: string;
  runId?: string;
  taskType: string;
  taskName: string;
  description?: string;
  priority?: Priority;
  assignment: AssignmentConfig;
  contextData?: Record<string, any>;
  parameters?: WorkItemParameter[];
  dueDate?: Date | null;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  roles?: string[];
  groups?: string[];
  isActive?: boolean;
}
