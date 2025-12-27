import { OrgModelRepository } from './OrgModelRepository';
import { OrgUnit } from '../orgmodel/OrgUnit';
import { Position } from '../orgmodel/Position';
import { Group } from '../orgmodel/Group';

export class InMemoryOrgModelRepository implements OrgModelRepository {

  constructor(
    private readonly orgUnits: Record<string, OrgUnit>,
    private readonly positionsByOrgUnit: Record<string, Position[]>,
    private readonly groupsByUser: Record<string, Group[]>
  ) {}

  async getOrgUnit(id: string): Promise<OrgUnit | null> {
    return this.orgUnits[id] ?? null;
  }

  async getPositions(orgUnitId: string): Promise<Position[]> {
    return this.positionsByOrgUnit[orgUnitId] ?? [];
  }

  async getGroupsForUser(userId: string): Promise<Group[]> {
    return this.groupsByUser[userId] ?? [];
  }
}
