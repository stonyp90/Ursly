import { useState, useEffect, useCallback } from 'react';
import { useAuth } from 'react-oidc-context';
import { useUser } from '../../contexts';
import { env } from '../../config/env';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import ApiIcon from '@mui/icons-material/Api';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import { permissionsService, Permission } from '../../services/entitlements.service';
import styles from './Permissions.module.css';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <EditIcon style={{ fontSize: 14 }} />,
  read: <VisibilityIcon style={{ fontSize: 14 }} />,
  update: <EditIcon style={{ fontSize: 14 }} />,
  delete: <DeleteIcon style={{ fontSize: 14 }} />,
  execute: <PlayArrowIcon style={{ fontSize: 14 }} />,
  manage: <SettingsIcon style={{ fontSize: 14 }} />,
  assign: <GroupIcon style={{ fontSize: 14 }} />,
  export: <ApiIcon style={{ fontSize: 14 }} />,
  import: <ApiIcon style={{ fontSize: 14 }} />,
  approve: <LockIcon style={{ fontSize: 14 }} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  agents: '#60A5FA',
  models: '#A855F7',
  tasks: '#3B82F6',
  audit: '#818CF8',
  connectors: '#6366F1',
  settings: '#9ca3af',
  users: '#F472B6',
  groups: '#A855F7',
  permissions: '#60A5FA',
  organization: '#8B5CF6',
  billing: '#6366F1',
  api: '#60A5FA',
};

const AVAILABLE_ACTIONS = ['create', 'read', 'update', 'delete', 'execute', 'manage', 'assign', 'export', 'import', 'approve'];

export function Permissions() {
  const auth = useAuth();
  const [deleting, setDeleting] = useState<string | null>(null);
  const { refreshKey, currentOrg } = useUser();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Create Permission state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState({ code: '', name: '', description: '', category: '', action: 'read' });
  const [creating, setCreating] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const handleBootstrap = async () => {
    if (!auth.user?.access_token) {
      setSnackbar({ open: true, message: 'Please log in first', severity: 'error' });
      return;
    }
    
    try {
      setBootstrapping(true);
      const response = await fetch(env.api.endpoint('/entitlements/authorize/bootstrap'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user.access_token}`,
          'X-Organization-Id': currentOrg?.id || 'default',
        },
      });
      
      if (!response.ok) {
        throw new Error('Bootstrap failed');
      }
      
      const data = await response.json();
      console.log('Bootstrap successful:', data);
      setSnackbar({ open: true, message: 'Permissions initialized successfully! Refreshing...', severity: 'success' });
      setError(null);
      
      // Refresh after a short delay
      setTimeout(() => {
        fetchPermissions();
      }, 500);
    } catch (err) {
      console.error('Bootstrap failed:', err);
      setSnackbar({ open: true, message: 'Failed to initialize permissions', severity: 'error' });
    } finally {
      setBootstrapping(false);
    }
  };

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await permissionsService.list();
      setPermissions(data);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setError('Failed to load permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions, refreshKey]);

  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  const handleCreatePermission = async () => {
    if (!newPermission.code.trim() || !newPermission.name.trim() || !newPermission.category.trim()) {
      setSnackbar({ open: true, message: 'Code, name, and category are required', severity: 'error' });
      return;
    }
    try {
      setCreating(true);
      await permissionsService.create({
        code: newPermission.code.trim(),
        name: newPermission.name.trim(),
        description: newPermission.description.trim() || undefined,
        category: newPermission.category.trim().toLowerCase(),
        action: newPermission.action,
      });
      setSnackbar({ open: true, message: 'Permission created successfully', severity: 'success' });
      setCreateDialogOpen(false);
      setNewPermission({ code: '', name: '', description: '', category: '', action: 'read' });
      fetchPermissions();
    } catch (err) {
      console.error('Failed to create permission:', err);
      setSnackbar({ open: true, message: 'Failed to create permission', severity: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePermission = async (permission: Permission) => {
    if (permission.isSystem) {
      setSnackbar({ open: true, message: 'Cannot delete system permissions', severity: 'error' });
      return;
    }
    if (confirm(`Delete permission "${permission.name}"?`)) {
      try {
        setDeleting(permission.id);
        await permissionsService.delete(permission.id);
        setSnackbar({ open: true, message: 'Permission deleted successfully', severity: 'success' });
        fetchPermissions();
      } catch (err) {
        console.error('Failed to delete permission:', err);
        setSnackbar({ open: true, message: 'Failed to delete permission', severity: 'error' });
      } finally {
        setDeleting(null);
      }
    }
  };

  const categories = ['all', ...new Set(permissions.map((p) => p.category))];

  const filteredPermissions = permissions.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const groupedPermissions = filteredPermissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}><SecurityIcon /></div>
            <h1 className={styles.headerTitle}>Permissions</h1>
          </div>
          <button className={styles.createBtn} onClick={() => setCreateDialogOpen(true)}>
            <AddIcon />Create Permission
          </button>
        </div>
        <p className={styles.headerSubtitle}>View and manage granular permissions for your organization. Permissions are bundled into groups for easy assignment.</p>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          {error}
          <button 
            onClick={handleBootstrap}
            disabled={bootstrapping}
            style={{ marginLeft: '16px', padding: '6px 12px', borderRadius: '6px', background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {bootstrapping ? 'Initializing...' : 'Initialize Permissions'}
          </button>
        </div>
      )}

      <div className={`${styles.glassCard} ${styles.filtersCard}`}>
        <div className={styles.filtersContent}>
          <div className={styles.filtersRow}>
            <div className={styles.searchInput}>
              <SearchIcon className={styles.searchIcon} />
              <input type="text" placeholder="Search permissions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className={styles.categorySelect}>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                {categories.map((cat) => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}><div className={styles.statLabel}>Total Permissions</div><div className={styles.statValue}>{permissions.length}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>Categories</div><div className={styles.statValue}>{categories.length - 1}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>System Permissions</div><div className={styles.statValue}>{permissions.filter((p) => p.isSystem).length}</div></div>
      </div>

      {loading ? (
        <div className={styles.glassCard}>{[...Array(5)].map((_, i) => <div key={i} className={styles.skeleton} style={{ height: 60, margin: 16 }} />)}</div>
      ) : Object.keys(groupedPermissions).length === 0 ? (
        <div className={styles.infoAlert}><InfoIcon />No permissions found matching your criteria.</div>
      ) : (
        Object.entries(groupedPermissions).map(([category, perms]) => (
          <div key={category} className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <div className={styles.categoryIcon} style={{ backgroundColor: `${CATEGORY_COLORS[category] || '#60A5FA'}20`, color: CATEGORY_COLORS[category] || '#60A5FA' }}><LockIcon /></div>
              <div><div className={styles.categoryTitle}>{category}</div><div className={styles.categoryCount}>{perms.length} permission{perms.length !== 1 ? 's' : ''}</div></div>
            </div>
            <table className={styles.permissionsTable}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th style={{ width: '23%' }}>Code</th>
                  <th style={{ width: '18%' }}>Name</th>
                  <th style={{ width: '30%' }}>Description</th>
                  <th style={{ width: '10%' }}>Action</th>
                  <th style={{ width: '10%' }}>Type</th>
                  <th style={{ width: '9%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {perms.map((perm) => (
                  <tr key={perm.id} className={styles.tableRow}>
                    <td><span className={styles.permCode}>{perm.code}</span></td>
                    <td><span className={styles.permName}>{perm.name}</span></td>
                    <td><span className={styles.permDescription}>{perm.description}</span></td>
                    <td><span className={`${styles.actionChip} ${styles[perm.action] || ''}`}>{ACTION_ICONS[perm.action]}{perm.action}</span></td>
                    <td><span className={`${styles.typeChip} ${perm.isSystem ? styles.system : styles.custom}`}>{perm.isSystem ? 'System' : 'Custom'}</span></td>
                    <td>
                      <div className={styles.actions}>
                        {!perm.isSystem && (
                          <button
                            className={`${styles.iconBtn} ${styles.danger}`}
                            onClick={() => handleDeletePermission(perm)}
                            disabled={deleting === perm.id}
                            title="Delete Permission"
                          >
                            <DeleteIcon style={{ fontSize: 16 }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {createDialogOpen && (
        <div className={styles.dialog}>
          <div className={styles.dialogOverlay} onClick={() => setCreateDialogOpen(false)} />
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>
              <div className={styles.dialogHeaderTop}><div className={styles.dialogIcon}><SecurityIcon /></div><h2 className={styles.dialogTitle}>Create Permission</h2></div>
              <div className={styles.dialogSubtitle}>Add a new custom permission to your organization</div>
            </div>
            <div className={styles.dialogBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Permission Code *</label>
                <input type="text" className={styles.formInput} placeholder="e.g., agents:create" value={newPermission.code} onChange={(e) => setNewPermission({ ...newPermission, code: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name *</label>
                <input type="text" className={styles.formInput} placeholder="e.g., Create Agents" value={newPermission.name} onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category *</label>
                <input type="text" className={styles.formInput} placeholder="e.g., agents" value={newPermission.category} onChange={(e) => setNewPermission({ ...newPermission, category: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Action</label>
                <select className={styles.formSelect} value={newPermission.action} onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}>
                  {AVAILABLE_ACTIONS.map((action) => <option key={action} value={action}>{action.charAt(0).toUpperCase() + action.slice(1)}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea className={styles.formTextarea} placeholder="Describe what this permission allows..." rows={3} value={newPermission.description} onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })} />
              </div>
            </div>
            <div className={styles.dialogFooter}>
              <button className={styles.cancelBtn} onClick={() => { setCreateDialogOpen(false); setNewPermission({ code: '', name: '', description: '', category: '', action: 'read' }); }}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleCreatePermission} disabled={creating || !newPermission.code.trim() || !newPermission.name.trim() || !newPermission.category.trim()}>{creating ? 'Creating...' : 'Create Permission'}</button>
            </div>
          </div>
        </div>
      )}

      {snackbar.open && <div className={`${styles.snackbar} ${styles[snackbar.severity]}`}>{snackbar.message}</div>}
    </div>
  );
}

export default Permissions;
