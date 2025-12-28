import { DistributionMode } from '../WorkItemDistribution';

export interface OfferResolutionResult {
  offeredTo: string[];
  assignedTo?: string; // optional, but if present must be string
}

export class OfferResolver {

  resolve(
    eligibleUsers: string[],
    mode: DistributionMode
  ): OfferResolutionResult {

    if (eligibleUsers.length === 0) {
      return { offeredTo: [] };
    }

    // PUSH = framework assigns immediately
    if (mode === DistributionMode.PUSH) {
      return {
        assignedTo: eligibleUsers[0]!, // safe after length check
        offeredTo: []
      };
    }

    // PULL = framework offers, user claims later
    return {
      offeredTo: eligibleUsers
    };
  }
}
