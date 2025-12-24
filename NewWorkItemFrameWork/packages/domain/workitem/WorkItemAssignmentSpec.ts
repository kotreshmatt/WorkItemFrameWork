import { DistributionStrategyType, DistributionMode, LoadBasedConfig } from './WorkItemDistribution';

export interface WorkItemAssignmentSpec {

    /* WHO is eligible */
    candidateUsers?: string[];
    candidateGroups?: string[];
    candidatePositions?: string[];
    candidateOrgUnits?: string[];      // ← MISSING, now added
  
    /* HOW distribution happens */
    strategy: DistributionStrategyType;
    mode: DistributionMode;
  
    /* Constraints */
    separationOfDutiesKey?: string;
    loadBasedConfig?: LoadBasedConfig;
  }
