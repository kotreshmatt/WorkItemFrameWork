import { WorkItemParticipant, ParticipantRole } from '../../../../packages/domain/workitem/WorkItemParticipant';

describe('WorkItemParticipant', () => {
  it('should create participant with correct role', () => {
    const participant: WorkItemParticipant = {
        userId: 'user1',
        role: ParticipantRole.ASSIGNEE,
        timestamp: new Date(),
        workItemId: ''
    };
    expect(participant.role).toBe('ASSIGNEE');
  });
});
