export enum DistributionStrategyType {
    DEFAULT = 'DEFAULT',
    ROUND_ROBIN = 'ROUND_ROBIN',
    RANDOM = 'RANDOM',
    LOAD_BASED = 'LOAD_BASED',
    SEPARATION_OF_DUTIES = 'SEPARATION_OF_DUTIES'
  }
  
  export enum DistributionMode {
    PUSH = 'PUSH',
    PULL = 'PULL'
  }

  export interface LoadBasedConfig {
    maxOpenItems?: number;
    strategy?: 'LEAST_LOADED' | 'THRESHOLD';
  }
  
  