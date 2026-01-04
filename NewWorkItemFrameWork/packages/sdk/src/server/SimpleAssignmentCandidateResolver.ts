import { AssignmentCandidateResolver } from '../../../domain/workitem/assignment/AssignmentcandidateResolver';
import { WorkItemAssignmentSpec } from '../../../domain/workitem/WorkItemAssignmentSpec';

export class SimpleAssignmentCandidateResolver implements AssignmentCandidateResolver {
    async resolve(spec: WorkItemAssignmentSpec): Promise<string[]> {
        // Simple implementation for SDK testing: return all candidates as potential users
        const users = new Set<string>();

        if (spec.candidateUsers) {
            spec.candidateUsers.forEach(u => users.add(u));
        }

        // For testing: treat groups and positions as user IDs
        // In production, these would be resolved from org model database
        if (spec.candidateGroups) {
            spec.candidateGroups.forEach(g => users.add(`group:${g}`));
        }

        if (spec.candidatePositions) {
            spec.candidatePositions.forEach(p => users.add(`position:${p}`));
        }

        if (spec.candidateOrgUnits) {
            spec.candidateOrgUnits.forEach(ou => users.add(`orgunit:${ou}`));
        }

        return Array.from(users);
    }
}
