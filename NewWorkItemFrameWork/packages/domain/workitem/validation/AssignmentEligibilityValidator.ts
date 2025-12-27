import { WorkItem } from '../WorkItem';
import { ValidationResult } from './ValidationResult';
import { OrgModelRepository } from '../../Repository/OrgModelRepository';

export class AssignmentEligibilityValidator {

  constructor(private readonly orgRepo: OrgModelRepository) {}

  async validate(workItem: WorkItem, actorId: string): Promise<ValidationResult> {
    const spec = workItem.assignmentSpec;

    // 1. No eligibility constraints → do not reject
    const noConstraints =
      !spec.candidateUsers &&
      !spec.candidateGroups &&
      !spec.candidateOrgUnits &&
      !spec.candidatePositions;

    if (noConstraints) {
      return ValidationResult.ok();
    }

    // 2. Direct user assignment
    if (spec.candidateUsers?.includes(actorId)) {
      return ValidationResult.ok();
    }

    // 3. Group-based eligibility
    if (spec.candidateGroups) {
      const userGroups = await this.orgRepo.getGroupsForUser(actorId);
      const userGroupIds = new Set(userGroups.map(g => g.id));

      for (const groupId of spec.candidateGroups) {
        if (userGroupIds.has(groupId)) {
          return ValidationResult.ok();
        }
      }
    }

    // 4. OrgUnit-based eligibility
    if (spec.candidateOrgUnits) {
      for (const orgUnitId of spec.candidateOrgUnits) {
        const orgUnit = await this.orgRepo.getOrgUnit(orgUnitId);
        if (!orgUnit) continue;

        const positions = await this.orgRepo.getPositions(orgUnitId);
        for (const pos of positions) {
          if (pos.id?.includes(actorId)) {
            return ValidationResult.ok();
          }
        }
      }
    }

    // 5. Position-based eligibility
    if (spec.candidatePositions) {
      for (const orgUnitId of spec.candidateOrgUnits ?? []) {
        const positions = await this.orgRepo.getPositions(orgUnitId);
        for (const pos of positions) {
          if (
            spec.candidatePositions.includes(pos.id) &&
            pos.id?.includes(actorId)
          ) {
            return ValidationResult.ok();
          }
        }
      }
    }

    return ValidationResult.fail('Actor not eligible for this work item');
  }
}
