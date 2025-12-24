import { WorkItemParticipant } from '../workitem/WorkItemParticipant';

export interface WorkItemParticipantRepository {
  add(participant: WorkItemParticipant): Promise<void>;
}
