// packages/persistence/repository/JdbcOrgModelRepository.ts

import { Pool } from 'pg';
import { OrgModelRepository } from '../../domain/Repository/OrgModelRepository';
import { OrgUnit } from '../../domain/orgmodel/OrgUnit';
import { Position } from '../../domain/orgmodel/Position';
import { Group } from '../../domain/orgmodel/Group';
import { Logger } from '../../domain/common/logging';

export class JdbcOrgModelRepository implements OrgModelRepository {

  constructor(
    private readonly pool: Pool,
    private readonly logger: Logger
  ) {}

  async getOrgUnit(id: string): Promise<OrgUnit | null> {
    const res = await this.pool.query(
      `SELECT id, name, parent_id
         FROM org_units
        WHERE id = $1`,
      [id]
    );

    if (res.rowCount === 0) {
      return null;
    }

    return {
      id: res.rows[0].id,
      name: res.rows[0].name,
      parentId: res.rows[0].parent_id
    };
  }

  async getPositions(orgUnitId: string): Promise<Position[]> {
    const res = await this.pool.query(
      `SELECT id, name, org_unit_id
         FROM positions
        WHERE org_unit_id = $1`,
      [orgUnitId]
    );

    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      orgUnitId: r.org_unit_id
    }));
  }

  async getGroupsForUser(userId: string): Promise<Group[]> {
    const res = await this.pool.query(
      `SELECT g.id, g.name
         FROM groups g
         JOIN group_members gm ON gm.group_id = g.id
        WHERE gm.user_id = $1`,
      [userId]
    );

    return res.rows.map(r => ({
      id: r.id,
      name: r.name
    }));
  }

  /**
   * Helper used by AssignmentEligibilityValidator
   * (called indirectly via getPositions + user_positions)
   */
  async userHasPosition(
    userId: string,
    positionId: string
  ): Promise<boolean> {

    const res = await this.pool.query(
      `SELECT 1
         FROM user_positions
        WHERE user_id = $1
          AND position_id = $2`,
      [userId, positionId]
    );

    return (res.rowCount ?? 0) > 0;
  }
}
