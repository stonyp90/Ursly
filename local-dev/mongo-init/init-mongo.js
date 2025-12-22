// MongoDB initialization script
// This script runs automatically when MongoDB container starts for the first time
// Database: ursly

db = db.getSiblingDB('ursly');

// Create collections with validation
db.createCollection('agents', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'model', 'systemPrompt', 'status', 'createdBy'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Agent name - required'
        },
        model: {
          bsonType: 'string',
          description: 'Ollama model - required'
        },
        systemPrompt: {
          bsonType: 'string',
          description: 'System prompt - required'
        },
        status: {
          enum: ['active', 'suspended', 'stopped'],
          description: 'Agent status - required'
        },
        createdBy: {
          bsonType: 'string',
          description: 'Creator user ID - required'
        },
        capabilities: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          }
        },
        metadata: {
          bsonType: 'object'
        }
      }
    }
  }
});

db.createCollection('tasks');
db.createCollection('auditlogs');
db.createCollection('agenttokens');

// Entitlements collections
db.createCollection('permissions');
db.createCollection('permission_groups');
db.createCollection('user_entitlements');
db.createCollection('default_group_assignments');
db.createCollection('entitlement_audit_logs');

// Create indexes for performance
db.agents.createIndex({ name: 1, createdBy: 1 });
db.agents.createIndex({ status: 1 });
db.agents.createIndex({ createdAt: -1 });

db.tasks.createIndex({ agentId: 1, status: 1 });
db.tasks.createIndex({ createdBy: 1, status: 1 });
db.tasks.createIndex({ createdAt: -1 });
db.tasks.createIndex({ agentId: 1, createdAt: -1 });

db.auditlogs.createIndex({ eventType: 1, timestamp: -1 });
db.auditlogs.createIndex({ agentId: 1, timestamp: -1 });
db.auditlogs.createIndex({ taskId: 1, timestamp: -1 });
db.auditlogs.createIndex({ userId: 1, timestamp: -1 });
db.auditlogs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

db.agenttokens.createIndex({ token: 1 }, { unique: true });
db.agenttokens.createIndex({ agentId: 1 });
db.agenttokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Entitlements indexes
db.permissions.createIndex({ code: 1 }, { unique: true });
db.permissions.createIndex({ category: 1 });
db.permissions.createIndex({ isActive: 1 });

db.permission_groups.createIndex({ organizationId: 1, name: 1 }, { unique: true });
db.permission_groups.createIndex({ type: 1 });
db.permission_groups.createIndex({ isDefault: 1 });

db.user_entitlements.createIndex({ userId: 1, organizationId: 1 }, { unique: true });
db.user_entitlements.createIndex({ email: 1, organizationId: 1 });
db.user_entitlements.createIndex({ status: 1 });

db.default_group_assignments.createIndex({ organizationId: 1, groupId: 1 });

db.entitlement_audit_logs.createIndex({ organizationId: 1, createdAt: -1 });
db.entitlement_audit_logs.createIndex({ actorId: 1, createdAt: -1 });
db.entitlement_audit_logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// =============================================================================
// Seed System Permissions
// =============================================================================

const now = new Date();

const SYSTEM_PERMISSIONS = [
  // Agents
  { code: 'agents:create', name: 'Create Agents', category: 'agents', action: 'create', description: 'Create new AI agents' },
  { code: 'agents:read', name: 'View Agents', category: 'agents', action: 'read', description: 'View agent details' },
  { code: 'agents:update', name: 'Update Agents', category: 'agents', action: 'update', description: 'Modify agent settings' },
  { code: 'agents:delete', name: 'Delete Agents', category: 'agents', action: 'delete', description: 'Delete agents' },
  { code: 'agents:execute', name: 'Execute Agents', category: 'agents', action: 'execute', description: 'Start/stop/interact with agents' },
  
  // Models
  { code: 'models:create', name: 'Pull Models', category: 'models', action: 'create', description: 'Pull new models from Ollama' },
  { code: 'models:read', name: 'View Models', category: 'models', action: 'read', description: 'View available models' },
  { code: 'models:delete', name: 'Delete Models', category: 'models', action: 'delete', description: 'Remove models' },
  
  // Tasks
  { code: 'tasks:create', name: 'Create Tasks', category: 'tasks', action: 'create', description: 'Create new tasks' },
  { code: 'tasks:read', name: 'View Tasks', category: 'tasks', action: 'read', description: 'View task details' },
  { code: 'tasks:update', name: 'Update Tasks', category: 'tasks', action: 'update', description: 'Modify tasks' },
  { code: 'tasks:delete', name: 'Delete Tasks', category: 'tasks', action: 'delete', description: 'Delete tasks' },
  
  // Audit Logs
  { code: 'audit:read', name: 'View Audit Logs', category: 'audit', action: 'read', description: 'View audit logs' },
  { code: 'audit:export', name: 'Export Audit Logs', category: 'audit', action: 'export', description: 'Export audit data' },
  
  // Connectors
  { code: 'connectors:create', name: 'Create Connectors', category: 'connectors', action: 'create', description: 'Create new connectors' },
  { code: 'connectors:read', name: 'View Connectors', category: 'connectors', action: 'read', description: 'View connectors' },
  { code: 'connectors:update', name: 'Update Connectors', category: 'connectors', action: 'update', description: 'Modify connectors' },
  { code: 'connectors:delete', name: 'Delete Connectors', category: 'connectors', action: 'delete', description: 'Delete connectors' },
  
  // Settings
  { code: 'settings:read', name: 'View Settings', category: 'settings', action: 'read', description: 'View organization settings' },
  { code: 'settings:update', name: 'Update Settings', category: 'settings', action: 'update', description: 'Modify settings' },
  
  // Users (Entitlements)
  { code: 'users:read', name: 'View Users', category: 'users', action: 'read', description: 'View user list and details' },
  { code: 'users:manage', name: 'Manage Users', category: 'users', action: 'manage', description: 'Manage user entitlements' },
  
  // Groups
  { code: 'groups:create', name: 'Create Groups', category: 'groups', action: 'create', description: 'Create permission groups' },
  { code: 'groups:read', name: 'View Groups', category: 'groups', action: 'read', description: 'View permission groups' },
  { code: 'groups:update', name: 'Update Groups', category: 'groups', action: 'update', description: 'Modify permission groups' },
  { code: 'groups:delete', name: 'Delete Groups', category: 'groups', action: 'delete', description: 'Delete permission groups' },
  { code: 'groups:assign', name: 'Assign Groups', category: 'groups', action: 'assign', description: 'Assign users to groups' },
  
  // Permissions
  { code: 'permissions:read', name: 'View Permissions', category: 'permissions', action: 'read', description: 'View available permissions' },
  { code: 'permissions:manage', name: 'Manage Permissions', category: 'permissions', action: 'manage', description: 'Create/modify custom permissions' },
  
  // Organization
  { code: 'organization:read', name: 'View Organization', category: 'organization', action: 'read', description: 'View organization details' },
  { code: 'organization:update', name: 'Update Organization', category: 'organization', action: 'update', description: 'Modify organization settings' },
  { code: 'organization:manage', name: 'Manage Organization', category: 'organization', action: 'manage', description: 'Full organization management' },
  
  // API
  { code: 'api:read', name: 'API Read Access', category: 'api', action: 'read', description: 'Read-only API access' },
  { code: 'api:manage', name: 'API Management', category: 'api', action: 'manage', description: 'Manage API keys and webhooks' },
];

// Insert permissions
const permissionIds = {};
SYSTEM_PERMISSIONS.forEach(function(perm) {
  const existing = db.permissions.findOne({ code: perm.code });
  if (!existing) {
    const result = db.permissions.insertOne({
      ...perm,
      isSystem: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    permissionIds[perm.code] = result.insertedId;
    print('Created permission: ' + perm.code);
  } else {
    permissionIds[perm.code] = existing._id;
    print('Permission already exists: ' + perm.code);
  }
});

// =============================================================================
// Seed System Groups for Default Organization
// =============================================================================

const DEFAULT_ORG_ID = 'default';

const SYSTEM_GROUPS = [
  {
    name: 'Admin',
    type: 'system',
    description: 'Full administrative access to all features',
    permissions: SYSTEM_PERMISSIONS.map(function(p) { return p.code; }),
    isDefault: false,
    color: '#ef4444',
    priority: 100,
  },
  {
    name: 'Developer',
    type: 'system',
    description: 'Create and manage agents, models, and tasks',
    permissions: [
      'agents:create', 'agents:read', 'agents:update', 'agents:delete', 'agents:execute',
      'models:create', 'models:read', 'models:delete',
      'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
      'connectors:create', 'connectors:read', 'connectors:update', 'connectors:delete',
      'audit:read',
      'settings:read',
    ],
    isDefault: false,
    color: '#6366f1',
    priority: 50,
  },
  {
    name: 'Operator',
    type: 'system',
    description: 'Execute agents and view system status',
    permissions: [
      'agents:read', 'agents:execute',
      'models:read',
      'tasks:read', 'tasks:update',
      'connectors:read',
      'audit:read',
    ],
    isDefault: false,
    color: '#10b981',
    priority: 25,
  },
  {
    name: 'Viewer',
    type: 'system',
    description: 'Read-only access to view resources',
    permissions: [
      'agents:read',
      'models:read',
      'tasks:read',
      'connectors:read',
      'audit:read',
    ],
    isDefault: true,
    color: '#6b7280',
    priority: 10,
  },
];

// Insert groups for default organization
SYSTEM_GROUPS.forEach(function(group) {
  const existing = db.permission_groups.findOne({ 
    organizationId: DEFAULT_ORG_ID, 
    name: group.name,
    type: 'system'
  });
  
  if (!existing) {
    const groupPermissionIds = group.permissions.map(function(code) {
      return permissionIds[code];
    }).filter(function(id) { return id != null; });
    
    db.permission_groups.insertOne({
      organizationId: DEFAULT_ORG_ID,
      name: group.name,
      description: group.description,
      type: group.type,
      permissions: groupPermissionIds,
      isDefault: group.isDefault,
      priority: group.priority,
      color: group.color,
      createdAt: now,
      updatedAt: now,
    });
    print('Created group: ' + group.name + ' for organization: ' + DEFAULT_ORG_ID);
  } else {
    print('Group already exists: ' + group.name);
  }
});

// =============================================================================
// Seed Default Group Assignment (Viewer group auto-assigned to new users)
// =============================================================================

const viewerGroup = db.permission_groups.findOne({
  organizationId: DEFAULT_ORG_ID,
  name: 'Viewer',
  type: 'system'
});

if (viewerGroup) {
  const existingAssignment = db.default_group_assignments.findOne({
    organizationId: DEFAULT_ORG_ID,
    groupId: viewerGroup._id,
    conditionType: 'always'
  });

  if (!existingAssignment) {
    db.default_group_assignments.insertOne({
      organizationId: DEFAULT_ORG_ID,
      groupId: viewerGroup._id,
      conditionType: 'always',
      priority: 10,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    print('Created default group assignment: Viewer (always)');
  } else {
    print('Default group assignment for Viewer already exists');
  }
}

print('MongoDB initialization completed');
print('Seeded ' + SYSTEM_PERMISSIONS.length + ' permissions');
print('Seeded ' + SYSTEM_GROUPS.length + ' system groups');
print('Default group assignment configured for Viewer group');
