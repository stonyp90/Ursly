import { z } from 'zod';

/**
 * ReBAC - Relationship-Based Access Control Types
 */

/**
 * Relationship between subjects and objects
 */
export const RelationshipSchema = z.object({
  subject: z.object({
    type: z.string(),
    id: z.string(),
  }),
  relation: z.string(),
  object: z.object({
    type: z.string(),
    id: z.string(),
  }),
  createdAt: z.date().optional(),
  createdBy: z.string().optional(),
});

export type Relationship = z.infer<typeof RelationshipSchema>;

/**
 * ReBAC Policy - maps relations to allowed actions
 */
export interface ReBACPolicy {
  resourceType: string;
  relation: string;
  allowedActions: string[];
  transitive?: boolean; // Allow transitive relationship traversal
}

/**
 * Relationship types for the platform
 */
export const RELATIONSHIP_TYPES = {
  // Ownership
  OWNER: 'owner',
  CREATOR: 'creator',

  // Membership
  MEMBER: 'member',
  ADMIN: 'admin',
  MODERATOR: 'moderator',

  // Sharing
  SHARED_VIEWER: 'shared_viewer',
  SHARED_EDITOR: 'shared_editor',
  SHARED_COMMENTER: 'shared_commenter',

  // Organization relationships
  BELONGS_TO: 'belongs_to',
  MANAGES: 'manages',
  REPORTS_TO: 'reports_to',

  // Agent relationships
  ASSIGNED_TO: 'assigned_to',
  CAN_EXECUTE: 'can_execute',
  CAN_CONFIGURE: 'can_configure',
} as const;

/**
 * Default ReBAC policies for the platform
 */
export const DEFAULT_REBAC_POLICIES: ReBACPolicy[] = [
  // Agent policies
  {
    resourceType: 'agent',
    relation: 'owner',
    allowedActions: ['create', 'read', 'update', 'delete', 'execute', 'share'],
  },
  {
    resourceType: 'agent',
    relation: 'admin',
    allowedActions: ['read', 'update', 'execute', 'share'],
  },
  {
    resourceType: 'agent',
    relation: 'shared_editor',
    allowedActions: ['read', 'update', 'execute'],
  },
  {
    resourceType: 'agent',
    relation: 'shared_viewer',
    allowedActions: ['read'],
  },
  {
    resourceType: 'agent',
    relation: 'can_execute',
    allowedActions: ['read', 'execute'],
  },

  // Conversation policies
  {
    resourceType: 'conversation',
    relation: 'owner',
    allowedActions: ['create', 'read', 'update', 'delete'],
  },
  {
    resourceType: 'conversation',
    relation: 'member',
    allowedActions: ['read', 'update'],
  },

  // Organization policies
  {
    resourceType: 'organization',
    relation: 'owner',
    allowedActions: ['read', 'update', 'delete', 'admin'],
  },
  {
    resourceType: 'organization',
    relation: 'admin',
    allowedActions: ['read', 'update', 'admin'],
  },
  {
    resourceType: 'organization',
    relation: 'member',
    allowedActions: ['read'],
  },

  // Document policies
  {
    resourceType: 'document',
    relation: 'owner',
    allowedActions: ['create', 'read', 'update', 'delete', 'share'],
  },
  {
    resourceType: 'document',
    relation: 'shared_editor',
    allowedActions: ['read', 'update'],
  },
  {
    resourceType: 'document',
    relation: 'shared_viewer',
    allowedActions: ['read'],
  },
];

