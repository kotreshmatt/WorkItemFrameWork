import { Pool } from 'pg';
import { User } from '../../types';
import logger from '../../utils/logger';

export class UserRepository {
  private pool: Pool;
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'myapp',
      user: process.env.DB_USER || 'myuser',
      password: process.env.DB_PASSWORD || '',
    });
  }

  async findByIds(userIds: string[]): Promise<User[]> {
    if (!userIds.length) return [];
    const res = await this.pool.query(`SELECT id, name, email, roles, groups, is_active FROM users WHERE ldap_id = ANY($1)`, [userIds]);
    return res.rows.map((r: any) => ({ id: r.id, name: r.name, email: r.email, roles: r.roles, groups: r.groups, isActive: r.is_active }));
  }

  async findByRole(role: string): Promise<User[]> {
    console.log('Finding users by role:', role);
    const res = await this.pool.query(`SELECT id, name FROM users WHERE roles = $1`, [role]);
    return res.rows.map((r: any) => ({ id: r.id, name: r.name }));
  }

  async findByGroup(group: string): Promise<User[]> {
    const res = await this.pool.query(`SELECT id, name FROM users WHERE $1 = ANY(groups)`, [group]);
    return res.rows.map((r: any) => ({ id: r.id, name: r.name }));
  }
}
