// src/framework/repositories/WorkItemRepository.ts
import { Pool } from 'pg';
import { WorkItem } from '../../types';
import logger from '../../utils/logger';

export class WorkItemRepository {
  private pool: Pool;

  constructor() {
    const dbUser = process.env.DB_USER || 'myuser';
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'myapp',
      user: dbUser,
      password: process.env.DB_PASSWORD || '',
    });

    logger.info(' WorkItemRepository initialized', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'myapp',
    });
  }

  /**
   * Create new WorkItem record
   */
  async create(workItemData: Omit<WorkItem, 'id'>): Promise<number> {
    try {
      const query = `
        INSERT INTO work_items (
          workflow_id, run_id, task_type, task_name, description,
          state, offered_user_ids, offered_roles, offered_groups,
          context_data, parameters, created_at, due_date, priority
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING id
      `;

      const offeredUserIds = this.toPgArray(workItemData.offeredTo?.userIds);
      const offeredRoles = this.toPgArray(workItemData.offeredTo?.roles);
      const offeredGroups = this.toPgArray(workItemData.offeredTo?.groups);

      const paramsJson =
        typeof workItemData.parameters === 'string'
          ? workItemData.parameters
          : JSON.stringify(workItemData.parameters ?? []);

      const contextJson =
        typeof workItemData.contextData === 'string'
          ? workItemData.contextData
          : JSON.stringify(workItemData.contextData ?? {});

      const values = [
        workItemData.workflowId ?? null,
        workItemData.runId ?? null,
        workItemData.taskType,
        workItemData.taskName,
        workItemData.description ?? null,
        workItemData.state,
        offeredUserIds,
        offeredRoles,
        offeredGroups,
        contextJson,
        paramsJson,
        workItemData.createdAt,
        workItemData.dueDate ?? null,
        workItemData.priority ?? 'medium',
      ];

      const result = await this.pool.query(query, values);
      const id = result.rows[0].id;
      logger.info(`WorkItem created (ID: ${id})`, { workflowId: workItemData.workflowId });
      return id;
    } catch (err) {
      logger.error(' DB create error', { err });
      throw err;
    }
  }

  /**
   * Get WorkItem by ID
   */
  async findById(id: number): Promise<WorkItem | null> {
    try {
      const res = await this.pool.query('SELECT * FROM work_items WHERE id = $1', [id]);
      if (!res.rows.length) return null;

      return this.mapRowToWorkItem(res.rows[0]);
    } catch (err) {
      logger.error('DB findById error', { err, id });
      throw err;
    }
  }

  /**
   * Get all work items available to user
   */
  async findByUserAccess(userId: string): Promise<WorkItem[]> {
    try {
      const res = await this.pool.query(
        `SELECT * FROM work_items
         WHERE state IN ('offered','opened')
         AND (
           $1 = ANY(offered_user_ids) OR
           $1 = ANY(offered_roles) OR
           $1 = ANY(offered_groups) OR
           claimed_by = $1
         )
         ORDER BY id DESC`,
        [userId]
      );

      return res.rows.map(row => this.mapRowToWorkItem(row));
    } catch (err) {
      logger.error(' DB findByUserAccess error', { err, userId });
      throw err;
    }
  }

  /**
   * Update specific fields of a WorkItem
   */
  async update(id: number, updates: Partial<WorkItem>): Promise<void> {
    try {
      const dbUpdates: any = {};
      const values: any[] = [];

      if (updates.state !== undefined) dbUpdates.state = updates.state;
      if (updates.claimedBy !== undefined) dbUpdates.claimed_by = updates.claimedBy;
      if (updates.completedBy !== undefined) dbUpdates.completed_by = updates.completedBy;
      if (updates.claimedAt !== undefined) dbUpdates.claimed_at = updates.claimedAt;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
      if (updates.resultData !== undefined)
        dbUpdates.result_data =
          typeof updates.resultData === 'string'
            ? updates.resultData
            : JSON.stringify(updates.resultData ?? {});
      if (updates.contextData !== undefined)
        dbUpdates.context_data =
          typeof updates.contextData === 'string'
            ? updates.contextData
            : JSON.stringify(updates.contextData ?? {});
      if (updates.parameters !== undefined)
        dbUpdates.parameters =
          typeof updates.parameters === 'string'
            ? updates.parameters
            : JSON.stringify(updates.parameters ?? []);
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;

      if (Object.keys(dbUpdates).length === 0) return;

      const setClauses = Object.keys(dbUpdates).map((k, idx) => `${k} = $${idx + 2}`);
      Object.values(dbUpdates).forEach(v => values.push(v));

      const sql = `UPDATE work_items SET ${setClauses.join(', ')} WHERE id = $1`;
      await this.pool.query(sql, [id, ...values]);
      logger.debug(` WorkItem updated`, { id, updates: dbUpdates });
    } catch (err) {
      logger.error('DB update error', { err, id, updates });
      throw err;
    }
  }

  /**
   * Convert database row into WorkItem domain model
   */
  private mapRowToWorkItem(row: any): WorkItem {
    let contextData = {};
    let parameters: any[] = [];

    try {
      contextData =
        typeof row.context_data === 'string'
          ? JSON.parse(row.context_data)
          : row.context_data ?? {};
    } catch (e) {
      logger.warn(' Failed to parse context_data', { id: row.id, error: e });
    }

    try {
      parameters =
        typeof row.parameters === 'string'
          ? JSON.parse(row.parameters)
          : row.parameters ?? [];
    } catch (e) {
      logger.warn(' Failed to parse parameters', { id: row.id, error: e });
    }

    return {
      id: row.id,
      workflowId: row.workflow_id,
      runId: row.run_id,
      taskType: row.task_type,
      taskName: row.task_name,
      description: row.description,
      priority: row.priority ?? 'medium',
      state: row.state,
      offeredTo: {
        userIds: row.offered_user_ids || [],
        roles: row.offered_roles || [],
        groups: row.offered_groups || []
      },
      claimedBy: row.claimed_by,
      claimedAt: row.claimed_at,
      completedBy: row.completed_by,
      completedAt: row.completed_at,
      contextData,
      resultData: row.result_data,
      parameters: row.parameters,
      createdAt: row.created_at,
      dueDate: row.due_date,
    };
  }

  private toPgArray(arr?: string[] | null): string | null {
    if (!arr || !arr.length) return null;
    return `{${arr.join(',')}}`;
  }
}

export default WorkItemRepository;
