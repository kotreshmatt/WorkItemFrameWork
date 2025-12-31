import { WorkItem } from '../WorkItem';
import { ValidationResult } from './ValidationResult';
import { OrgModelRepository } from '../../Repository/OrgModelRepository';
import { Logger } from '../../common/logging';
import { JdbcOrgModelRepository } from '../../../persistence/repository/JdbcOrgModelRepository';  

export class AssignmentEligibilityValidator {


  constructor(
    private readonly orgRepo: OrgModelRepository,
    private readonly logger: Logger
  ) {}

  async validate(workItem: WorkItem, actorId: string): Promise<ValidationResult> {
    this.logger.info(`Starting assignment eligibility validation for actorId: ${actorId}`);

    const spec = workItem.assignmentSpec;
    this.logger.debug(`Assignment specification: ${JSON.stringify(spec)}`);

    // 1. No eligibility constraints → do not reject
    const noConstraints =
      !spec.candidateUsers &&
      !spec.candidateGroups &&
      !spec.candidateOrgUnits &&
      !spec.candidatePositions;

    if (noConstraints) {
      this.logger.info('No eligibility constraints found. Validation passed.');
      return ValidationResult.ok();
    }

    // 2. Direct user assignment
    if (spec.candidateUsers?.includes(actorId)) {
      this.logger.info(`ActorId: ${actorId} is directly listed in candidateUsers. Validation passed.`);
      return ValidationResult.ok();
    }

    // 3. Group-based eligibility
    if (spec.candidateGroups) {
      this.logger.debug(`Checking group-based eligibility for actorId: ${actorId}`);
      const userGroups = await this.orgRepo.getGroupsForUser(actorId);
      const userGroupIds = new Set(userGroups.map(g => g.id));
      this.logger.debug(`ActorId: ${actorId} belongs to groups: ${JSON.stringify([...userGroupIds])}`);

      for (const groupId of spec.candidateGroups) {
        if (userGroupIds.has(groupId)) {
          this.logger.info(`ActorId: ${actorId} is eligible based on groupId: ${groupId}. Validation passed.`);
          return ValidationResult.ok();
        }
      }
    }

    // 4. OrgUnit-based eligibility
    if (spec.candidateOrgUnits) {
      this.logger.debug(`Checking OrgUnit-based eligibility for actorId: ${actorId}`);
      for (const orgUnitId of spec.candidateOrgUnits) {
        const orgUnit = await this.orgRepo.getOrgUnit(orgUnitId);
        if (!orgUnit) {
          this.logger.warn(`OrgUnitId: ${orgUnitId} not found. Skipping.`);
          continue;
        }

        const positions = await this.orgRepo.getPositions(orgUnitId);
        this.logger.debug(`Positions in OrgUnitId: ${orgUnitId}: ${JSON.stringify(positions)}`);

        for (const pos of positions) {
          if (pos.id?.includes(actorId)) {
            this.logger.info(`ActorId: ${actorId} is eligible based on position in OrgUnitId: ${orgUnitId}. Validation passed.`);
            return ValidationResult.ok();
          }
        }
      }
    }

    // 5. Position-based eligibility
    if (spec.candidatePositions) {
      this.logger.debug(`Checking position-based eligibility for actorId: ${actorId}`);
      for (const orgUnitId of spec.candidateOrgUnits ?? []) {
        const positions = await this.orgRepo.getPositions(orgUnitId);
        this.logger.debug(`Positions in OrgUnitId: ${orgUnitId}: ${JSON.stringify(positions)}`);

        for (const pos of positions) {
          if (
            spec.candidatePositions.includes(pos.id) &&
            pos.id?.includes(actorId)
          ) {
            this.logger.info(`ActorId: ${actorId} is eligible based on positionId: ${pos.id}. Validation passed.`);
            return ValidationResult.ok();
          }
        }
      }
    }

    this.logger.error(`ActorId: ${actorId} is not eligible for this work item. Validation failed.`);
    return ValidationResult.fail('Actor not eligible for this work item');
  }
}