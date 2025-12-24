// packages/domain/index.ts

// Common utilities and value objects
export * from './common/Identifier';
export * from './common/DomainEvent';
export * from './common/ValueObject';

// WorkItem domain
export * from './workitem/WorkItem';
export * from './workitem/WorkItemId';
export * from './workitem/WorkItemState';
export * from './workitem/WorkItemLifecycle';
export * from './workitem/WorkItemErrors';
export * from './workitem/WorkItemParticipant';
export * from './workitem/WorkItemDistribution';
export * from './workitem/WorkItemAssignmentSpec';

// Org model / User domain
export * from './orgmodel/User';
export * from './orgmodel/Group';
export * from './orgmodel/OrgUnit';
export * from './orgmodel/Position';

// Repository interfaces (Phase 0)
export * from './Repository/WorkItemRepository';
//export * from './Repository/WorkItemAuditRepository';
export * from './Repository/WorkItemParticipantRepository';
export * from './Repository/UserRepository';
export * from './Repository/OrgModelRepository';
export * from './Repository/WorkItemAuditRepository';

