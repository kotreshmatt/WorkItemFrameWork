import { Pool } from 'pg';
import { AssignmentCandidateResolver } from '../../domain/workitem/assignment/AssignmentcandidateResolver';
import { WorkItemAssignmentSpec } from '../../domain/workitem/WorkItemAssignmentSpec';
import { Logger } from '../../domain/common/logging';


export class JdbcAssignmentCandidateResolver
  implements AssignmentCandidateResolver {

  constructor(
    private readonly pool: Pool,
    private readonly logger: Logger
  ) {}

  async resolve(spec: WorkItemAssignmentSpec): Promise<string[]> {
    const userIds = new Set<string>();

    // 1️⃣ Direct users
    if (spec.candidateUsers?.length) {
      spec.candidateUsers.forEach(u => userIds.add(u));
    }

    // 2️⃣ Groups → users
    if (spec.candidateGroups?.length) {
      const r = await this.pool.query(
        `
        SELECT DISTINCT gm.user_id
        FROM group_members gm
        WHERE gm.group_id = ANY($1)
        `,
        [spec.candidateGroups]
      );
      r.rows.forEach(row => userIds.add(row.user_id));
    }

    // 3️⃣ Positions → users
    if (spec.candidatePositions?.length) {
      const r = await this.pool.query(
        `
        SELECT DISTINCT up.user_id
        FROM user_positions up
        WHERE up.position_id = ANY($1)
        `,
        [spec.candidatePositions]
      );
      r.rows.forEach(row => userIds.add(row.user_id));
    }

    // 4️⃣ OrgUnits → positions → users
    if (spec.candidateOrgUnits?.length) {
      const r = await this.pool.query(
        `
        SELECT DISTINCT up.user_id
        FROM positions p
        JOIN user_positions up ON up.position_id = p.id
        WHERE p.org_unit_id = ANY($1)
        `,
        [spec.candidateOrgUnits]
      );
      r.rows.forEach(row => userIds.add(row.user_id));
    }

    const resolved = Array.from(userIds);

    this.logger.info('Assignment candidates resolved', {
      spec,
      resolvedUsers: resolved.length
    });

    return resolved;
  }
}
