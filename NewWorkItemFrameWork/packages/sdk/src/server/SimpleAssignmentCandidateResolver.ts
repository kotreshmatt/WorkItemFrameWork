import { AssignmentCandidateResolver } from '../../../domain/workitem/assignment/AssignmentcandidateResolver';
import { WorkItemAssignmentSpec } from '../../../domain/workitem/WorkItemAssignmentSpec';

export class SimpleAssignmentCandidateResolver implements AssignmentCandidateResolver {
    async resolve(spec: WorkItemAssignmentSpec): Promise<string[]> {
        // Simple implementation: just return candidate users from spec
        const users = new Set<string>();

        if (spec.candidateUsers) {
            spec.candidateUsers.forEach(u => users.add(u));
        }

        return Array.from(users);
    }
}
