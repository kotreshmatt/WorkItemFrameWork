import { CommandDecision } from './CommandDecision';

export interface ExecutionResult {
    decision: CommandDecision;
    workItemId?: number;
}
