import { WorkItem, WorkItemConfig, AssignmentConfig, WorkItemParameter } from '../types';
import { WorkItemRepository } from './repositories/WorkItemRepository';
import { UserRepository } from './repositories/UserRepository';
import { Connection, Client } from '@temporalio/client';
import logger from '../utils/logger';

export interface WorkItemView {
  id: number;
  taskName: string;
  taskType: string;
  description?: string;
  priority: string;
  state: string;
  dueDate?: Date | null;
  metadata: { workflowId?: string; runId?: string; createdAt: Date };
  parameters: { in: Record<string, any>; inOut: Record<string, any>; out: Record<string, any> };
}

export class WorkItemFramework {
  private workItemRepository: WorkItemRepository;
  private userRepository: UserRepository;
  private temporalClient: Client | null = null;

  constructor() {
    this.workItemRepository = new WorkItemRepository();
    this.userRepository = new UserRepository();
  }

  async initTemporal(): Promise<void> {
    try {
      const connection = await Connection.connect({ address: process.env.TEMPORAL_ADDRESS || 'localhost:7233' });
      this.temporalClient = new Client({ connection });
      logger.info('Temporal client connected');
    } catch (err) {
      logger.error('Temporal init failed', { err });
      throw err;
    }
  }

  async createWorkItem(config: WorkItemConfig): Promise<number> {
    try {
      const resolved = await this.resolveAssignment(config.assignment);
      const params = (config.parameters ?? []).map(p => ({
        name: p.name,
        direction: p.direction,
        type: p.type,
        mandatory: p.mandatory ?? false,
        value: p.direction === 'in' ? (p.value ?? null) : (p.value ?? null)
      })) as WorkItemParameter[];

      const base: Omit<WorkItem, 'id'> = {
        workflowId: config.workflowId,
        runId: config.runId,
        taskType: config.taskType,
        taskName: config.taskName,
        description: config.description,
        priority: config.priority ?? 'medium',
        state: 'offered',
        offeredTo: { userIds: resolved.userIds, roles: resolved.roles, groups: resolved.groups },
        contextData: config.contextData,
        parameters: params,
        createdAt: new Date(),
        dueDate: config.dueDate ?? null
      };

      const id = await this.workItemRepository.create(base);
      logger.info('WorkItem created', { id });
      return id;
    } catch (err) {
      logger.error('createWorkItem failed', { err });
      throw err;
    }
  }

  async claimWorkItem(workItemId: number, userId: string): Promise<void> {
    try {
      const wi = await this.workItemRepository.findById(workItemId);
      if (!wi) throw new Error('WorkItem not found');
      if (wi.state !== 'offered') throw new Error('WorkItem not available for claim');
      if (!this.canUserClaimWorkItem(wi, userId)) throw new Error('User cannot claim this WorkItem');

      await this.workItemRepository.update(workItemId, { state: 'opened', claimedBy: userId, claimedAt: new Date() });
      logger.info('WorkItem claimed', { workItemId, userId });
    } catch (err) {
      logger.error('claimWorkItem failed', { err });
      throw err;
    }
  }

  // Complete with auto-claim for testing purpose, real case will work only after claimed
  async completeWorkItem(workItemId: number, userId: string, resultData: Record<string, any>): Promise<void> {
    try {
      const wi = await this.workItemRepository.findById(workItemId);
      if (!wi) throw new Error('WorkItem not found');

      // auto-claim
      if (wi.state === 'offered') {
        logger.info('Auto-claiming workitem', { workItemId, userId, parameters: wi.parameters });
        await this.workItemRepository.update(workItemId, { state: 'opened', claimedBy: userId, claimedAt: new Date() });
        wi.state = 'opened';
        wi.claimedBy = userId;
      }

      if (wi.state !== 'opened') throw new Error('WorkItem is not opened');
      if (wi.claimedBy !== userId) throw new Error('User does not own this WorkItem');

      // validate & merge parameters
      const mergedParams = this.validateAndMergeParameters(wi.parameters ?? [], resultData);

      await this.workItemRepository.update(workItemId, {
        state: 'completed',
        completedBy: userId,
        completedAt: new Date(),
        resultData,
        parameters: mergedParams,
      });

      // signal the workflow
      if (wi.workflowId && wi.workflowId !== 'test-workflow') {
        if (!this.temporalClient) {
          logger.warn('Temporal client not initialized; skipping signal', { workItemId, workflowId: wi.workflowId });
        } else {
          try {
            const handle = this.temporalClient.workflow.getHandle(wi.workflowId, wi.runId ?? undefined);
            await handle.signal('workItemCompleted', workItemId, resultData);
            logger.info('Signaled workflow', { workflowId: wi.workflowId, workItemId });
          } catch (signalErr) {
            logger.error('Signal failed', { signalErr, workItemId, workflowId: wi.workflowId });
            
          }
        }
      }

      logger.info('WorkItem completed', { workItemId, userId });
    } catch (err) {
      logger.error('completeWorkItem failed', { err, workItemId });
      throw err;
    }
  }

  // Internals: validate and merge
  private validateAndMergeParameters(existing: WorkItemParameter[], updates: Record<string, any>): WorkItemParameter[] {
    const result: WorkItemParameter[] = [];
    console.log('Existing parameters:', existing);
    console.log('Updates:', updates);
    for (const p of existing) {
      const newVal = updates.hasOwnProperty(p.name) ? updates[p.name] : undefined;
      console.log('p.name: ', p.name, ' newVal: ', newVal);
      // Check for unexpected properties in updates
      const existingParamNames = new Set(existing.map(p => p.name));
      const unexpectedParams = Object.keys(updates).filter(key => !existingParamNames.has(key));
      if (unexpectedParams.length > 0) {
        throw new Error(`Unexpected parameters: ${unexpectedParams.join(', ')}`);
      }

      if (p.direction === 'in') {
        // Strict mode: if caller attempted to change input, throw
        if (newVal !== undefined && JSON.stringify(newVal) !== JSON.stringify(p.value)) {
          throw new Error(`Input parameter '${p.name}' is read-only and cannot be modified`);
        }
        result.push(p);
        continue;
      }

      if (p.direction === 'inOut') {
        if (p.mandatory && (newVal === undefined || newVal === null)) {
          throw new Error(`Mandatory parameter '${p.name}' is missing`);
        }
        result.push({ ...p, value: newVal !== undefined ? newVal : p.value });
        continue;
      }

      if (p.direction === 'out') {
        // enhancement to be done 
        result.push({ ...p, value: newVal !== undefined ? newVal : p.value ?? null });
      }
    }

    
    return result;
  }

  async getWorkItemView(workItemId: number): Promise<WorkItemView | null> {
    try {
      const wi = await this.workItemRepository.findById(workItemId);
      if (!wi) return null;

      const grouped = { in: {}, inOut: {}, out: {} } as Record<'in' | 'inOut' | 'out', Record<string, any>>;
      (wi.parameters || []).forEach(p => {
        grouped[p.direction][p.name] = p.value;
      });

      const view: WorkItemView = {
        id: wi.id,
        taskName: wi.taskName,
        taskType: wi.taskType,
        description: wi.description,
        priority: wi.priority,
        state: wi.state,
        dueDate: wi.dueDate ?? null,
        metadata: { workflowId: wi.workflowId, runId: wi.runId, createdAt: wi.createdAt },
        parameters: grouped,
      };

      return view;
    } catch (err) {
      logger.error('getWorkItemView failed', { err, workItemId });
      throw err;
    }
  }

  async getUserWorkItemsViews(userId: string): Promise<WorkItemView[]> {
    const items = await this.workItemRepository.findByUserAccess(userId);
    return Promise.all(
      items.map(async wi => {
        const grouped = { in: {}, inOut: {}, out: {} } as Record<'in' | 'inOut' | 'out', Record<string, any>>;
        (wi.parameters || []).forEach(p => {
          grouped[p.direction][p.name] = p.value;
        });
        return {
          id: wi.id,
          taskName: wi.taskName,
          description: wi.description,
          priority: wi.priority,
          state: wi.state,
          dueDate: wi.dueDate ?? null,
          metadata: { workflowId: wi.workflowId, runId: wi.runId, createdAt: wi.createdAt },
          parameters: grouped,
        } as WorkItemView;
      })
    );
  }

  private async resolveAssignment(assignment: AssignmentConfig) {
    // returns userIds, roles, groups
    const userIds: string[] = [];
    const roles: string[] = assignment.roles ?? [];
    const groups: string[] = assignment.groups ?? [];

    if (assignment.userIds && assignment.userIds.length) {
      const users = await this.userRepository.findByIds(assignment.userIds);
      users.forEach(u => userIds.push(u.id));
    }

    
    for (const r of roles) {
      const users = await this.userRepository.findByRole(r);
      users.forEach(u => userIds.push(u.id));
    }

    
    for (const g of groups) {
      const users = await this.userRepository.findByGroup(g);
      users.forEach(u => userIds.push(u.id));
    }

   
    const unique = Array.from(new Set(userIds));
    logger.info('Resolved assignment', { requested: assignment, resolvedUserIds: unique });
    return { userIds: unique, roles, groups };
  }

  private canUserClaimWorkItem(wi: WorkItem, userId: string): boolean {
    return (wi.offeredTo.userIds ?? []).includes(userId) || (wi.offeredTo.roles ?? []).includes(userId) || (wi.offeredTo.groups ?? []).includes(userId);
  }

  async cancelWorkItem(workItemId: number, reason?: string): Promise<void> {
    const wi = await this.workItemRepository.findById(workItemId);
    if (!wi) throw new Error('WorkItem not found');
    if (wi.state === 'completed') throw new Error('WorkItem already completed');

    await this.workItemRepository.update(workItemId, {
      state: 'cancelled',
      resultData: { ...wi.resultData, cancelled: true, cancellationReason: reason, cancelledAt: new Date().toISOString() }
    });

    logger.info('WorkItem cancelled', { workItemId, reason });
  }

   async cancelWorkflow(workflowId: string): Promise<void> {
    if (!this.temporalClient) throw new Error('Temporal client not initialized');

    try {
      const handle = this.temporalClient.workflow.getHandle(workflowId);
      await handle.cancel();
      logger.info(`Cancel requested for workflow ${workflowId}`);
    } catch (err: any) {
      logger.error(`Failed to cancel workflow ${workflowId}`, { err });
      throw err;
    }
  }
}


export const workItemFramework = new WorkItemFramework();
