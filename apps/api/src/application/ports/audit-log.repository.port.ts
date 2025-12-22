import {
  AuditLog,
  CreateAuditLogDto,
  QueryAuditLogDto,
  AuditLogListResponse,
} from '@ursly/shared/types';

/**
 * Port (interface) for Audit Log Repository
 * This defines the contract that any adapter must implement
 */
export interface IAuditLogRepository {
  /**
   * Create a new audit log entry
   */
  create(dto: CreateAuditLogDto): Promise<AuditLog>;

  /**
   * Find an audit log by ID
   */
  findById(id: string): Promise<AuditLog | null>;

  /**
   * Query audit logs with filtering and pagination
   */
  query(query: QueryAuditLogDto): Promise<AuditLogListResponse>;

  /**
   * Get audit logs by agent ID
   */
  findByAgentId(agentId: string, limit?: number): Promise<AuditLog[]>;

  /**
   * Get audit logs by task ID
   */
  findByTaskId(taskId: string): Promise<AuditLog[]>;

  /**
   * Get audit logs by user ID
   */
  findByUserId(userId: string, limit?: number): Promise<AuditLog[]>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('IAuditLogRepository');
