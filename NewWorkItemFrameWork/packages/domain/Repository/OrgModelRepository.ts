import { OrgUnit } from '../orgmodel/OrgUnit';
import { Position } from '../orgmodel/Position';
import { Group } from '../orgmodel/Group';

export interface OrgModelRepository {
  getOrgUnit(id: string): Promise<OrgUnit | null>;
  getPositions(orgUnitId: string): Promise<Position[]>;
  getGroupsForUser(userId: string): Promise<Group[]>;
}
