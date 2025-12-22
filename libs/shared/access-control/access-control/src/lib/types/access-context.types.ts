import { z } from 'zod';

/**
 * Security classification levels for MAC (Mandatory Access Control)
 */
export enum SecurityLevel {
  PUBLIC = 0,
  INTERNAL = 1,
  CONFIDENTIAL = 2,
  SECRET = 3,
  TOP_SECRET = 4,
}

/**
 * Subject types that can request access
 */
export type SubjectType = 'user' | 'agent' | 'service';

/**
 * Resource types that can be accessed
 */
export type ResourceType =
  | 'agent'
  | 'model'
  | 'task'
  | 'conversation'
  | 'document'
  | 'organization'
  | 'audit-log';

/**
 * Action types that can be performed
 */
export type ActionType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'execute'
  | 'share'
  | 'admin';

/**
 * Geographic location for environment context
 */
export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Subject (who is requesting access)
 */
export const SubjectSchema = z.object({
  id: z.string(),
  type: z.enum(['user', 'agent', 'service']),
  roles: z.array(z.string()),
  attributes: z.record(z.unknown()),
  organizationId: z.string(),
  clearanceLevel: z.nativeEnum(SecurityLevel).optional(),
});

export type Subject = z.infer<typeof SubjectSchema>;

/**
 * Resource (what is being accessed)
 */
export const ResourceSchema = z.object({
  id: z.string(),
  type: z.enum([
    'agent',
    'model',
    'task',
    'conversation',
    'document',
    'organization',
    'audit-log',
  ]),
  ownerId: z.string(),
  organizationId: z.string(),
  attributes: z.record(z.unknown()),
  classification: z.nativeEnum(SecurityLevel).optional(),
});

export type Resource = z.infer<typeof ResourceSchema>;

/**
 * Action (what operation is being performed)
 */
export const ActionSchema = z.object({
  type: z.enum(['create', 'read', 'update', 'delete', 'execute', 'share', 'admin']),
  scope: z.string().optional(),
});

export type Action = z.infer<typeof ActionSchema>;

/**
 * Environment context (where/when access is requested)
 */
export const EnvironmentSchema = z.object({
  timestamp: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  geoLocation: z
    .object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

/**
 * Complete access context for authorization decisions
 */
export const AccessContextSchema = z.object({
  subject: SubjectSchema,
  resource: ResourceSchema,
  action: ActionSchema,
  environment: EnvironmentSchema,
});

export type AccessContext = z.infer<typeof AccessContextSchema>;

/**
 * Decision from an access control engine
 */
export interface AccessDecision {
  allowed: boolean;
  reason: string;
  metadata?: Record<string, unknown>;
}

/**
 * Decision with engine identification
 */
export interface EngineDecision extends AccessDecision {
  engine: string;
}

/**
 * Final authorization result
 */
export interface AuthorizationResult {
  allowed: boolean;
  decisions: EngineDecision[];
  duration?: number;
}

