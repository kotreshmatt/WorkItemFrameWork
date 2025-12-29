export interface TransactionContext {
    query<T = any>(
      sql: string,
      params?: readonly any[]
    ): Promise<{ rows: T[]; rowCount: number }>;
  }
  