export interface DistributionContext {
    eligibleUsers: string[];
  
    /** Optional historical assignments (for RR / SoD) */
    historicalAssignments?: string[];
  
    /** Strategy-specific config */
    config?: {
      seed?: number;
      maxLoad?: number;
    };
  }
  