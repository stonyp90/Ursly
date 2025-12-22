import { z } from 'zod';

/**
 * ABAC - Attribute-Based Access Control Types
 */

/**
 * ABAC condition types for policy evaluation
 */
export type ABACCondition =
  | { type: 'equals'; field: string; value: unknown }
  | { type: 'not-equals'; field: string; value: unknown }
  | { type: 'contains'; field: string; value: unknown }
  | { type: 'in'; field: string; values: unknown[] }
  | { type: 'range'; field: string; min?: number; max?: number }
  | { type: 'exists'; field: string }
  | { type: 'regex'; field: string; pattern: string }
  | { type: 'and'; conditions: ABACCondition[] }
  | { type: 'or'; conditions: ABACCondition[] }
  | { type: 'not'; condition: ABACCondition };

/**
 * ABAC Policy definition
 */
export interface ABACPolicy {
  id: string;
  name: string;
  description: string;
  priority: number;
  condition: ABACCondition;
  effect: 'allow' | 'deny';
  resourceType?: string;
  actionType?: string;
}

/**
 * Example ABAC policies
 */
export const EXAMPLE_ABAC_POLICIES: ABACPolicy[] = [
  {
    id: 'department-access',
    name: 'Department Access',
    description: 'Users can access resources in their department',
    priority: 10,
    effect: 'allow',
    condition: {
      type: 'equals',
      field: 'subject.attributes.department',
      value: { $ref: 'resource.attributes.department' },
    },
  },
  {
    id: 'business-hours-only',
    name: 'Business Hours Only',
    description: 'Access only allowed during business hours (9 AM - 6 PM)',
    priority: 5,
    effect: 'allow',
    condition: {
      type: 'range',
      field: 'environment.timestamp.hour',
      min: 9,
      max: 18,
    },
  },
  {
    id: 'geo-restriction',
    name: 'Geographic Restriction',
    description: 'Block access from restricted countries',
    priority: 1,
    effect: 'deny',
    condition: {
      type: 'in',
      field: 'environment.geoLocation.country',
      values: ['BLOCKED_COUNTRY_1', 'BLOCKED_COUNTRY_2'],
    },
  },
  {
    id: 'high-risk-action-mfa',
    name: 'High Risk Action MFA Required',
    description: 'Delete actions require MFA verification',
    priority: 2,
    effect: 'deny',
    actionType: 'delete',
    condition: {
      type: 'not',
      condition: {
        type: 'equals',
        field: 'subject.attributes.mfaVerified',
        value: true,
      },
    },
  },
];

