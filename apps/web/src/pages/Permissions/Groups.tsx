import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../contexts';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import SecurityIcon from '@mui/icons-material/Security';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InfoIcon from '@mui/icons-material/Info';
import { useAuth } from 'react-oidc-context';
import {
  groupsService,
  permissionsService,
  PermissionGroup,
  Permission,
} from '../../services/entitlements.service';
import { env } from '../../config/env';
import styles from './Groups.module.css';

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#6b7280',
];

export function Groups() {
  const auth = useAuth();
  const { refreshKey, currentOrg } = useUser();
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<PermissionGroup | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

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
        fetchGroups();
      }, 500);
    } catch (err) {
      console.error('Bootstrap failed:', err);
      setSnackbar({ open: true, message: 'Failed to initialize permissions', severity: 'error' });
    } finally {
      setBootstrapping(false);
    }
  };

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#6366f1');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [permissionSearchQuery, setPermissionSearchQuery] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [groupsData, permissionsData] = await Promise.all([
        groupsService.list(),
        permissionsService.list(),
      ]);
      setGroups(groupsData);
      setAllPermissions(permissionsData);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups, refreshKey]);

  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         g.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || g.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const toggleExpand = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleOpenCreate = () => {
    setFormName('');
    setFormDescription('');
    setFormColor('#6366f1');
    setFormIsDefault(false);
    setFormPermissions([]);
    setOriginalPermissions([]);
    setPermissionSearchQuery('');
    setEditGroup(null);
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (group: PermissionGroup) => {
    setFormName(group.name);
    setFormDescription(group.description || '');
    setFormColor(group.color || '#6366f1');
    setFormIsDefault(group.isDefault);
    setFormPermissions(group.permissions || []);
    setOriginalPermissions(group.permissions || []);
    setPermissionSearchQuery('');
    setEditGroup(group);
    setCreateDialogOpen(true);
  };

  const togglePermission = (permId: string) => {
    setFormPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const filteredDialogPermissions = allPermissions.filter((p) => {
    const query = permissionSearchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  });

  const groupedDialogPermissions = filteredDialogPermissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editGroup) {
        // Update group metadata
        await groupsService.update(editGroup.id, {
          name: formName,
          description: formDescription,
          color: formColor,
          isDefault: formIsDefault,
        });

        // Calculate permissions to add and remove
        const permissionsToAdd = formPermissions.filter((p) => !originalPermissions.includes(p));
        const permissionsToRemove = originalPermissions.filter((p) => !formPermissions.includes(p));

        // Add new permissions
        if (permissionsToAdd.length > 0) {
          await groupsService.addPermissions(editGroup.id, permissionsToAdd);
        }

        // Remove permissions
        if (permissionsToRemove.length > 0) {
          await groupsService.removePermissions(editGroup.id, permissionsToRemove);
        }

        setSnackbar({ open: true, message: 'Group updated successfully', severity: 'success' });
      } else {
        await groupsService.create({
          name: formName,
          description: formDescription,
          permissionIds: formPermissions,
          isDefault: formIsDefault,
          color: formColor,
        });
        setSnackbar({ open: true, message: 'Group created successfully', severity: 'success' });
      }
      setCreateDialogOpen(false);
      fetchGroups();
    } catch (err) {
      console.error('Failed to save group:', err);
      setSnackbar({ open: true, message: 'Failed to save group', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group?.type === 'system') {
      setSnackbar({ open: true, message: 'Cannot delete system groups', severity: 'error' });
      return;
    }
    if (confirm(`Delete group "${group?.name}"?`)) {
      try {
        await groupsService.delete(groupId);
        setSnackbar({ open: true, message: 'Group deleted successfully', severity: 'success' });
        fetchGroups();
      } catch (err) {
        console.error('Failed to delete group:', err);
        setSnackbar({ open: true, message: 'Failed to delete group', severity: 'error' });
      }
    }
  };

  const getPermissionCode = (permId: string) => {
    const perm = allPermissions.find((p) => p.id === permId);
    return perm?.code || permId;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}><GroupIcon /></div>
            <h1 className={styles.headerTitle}>Permission Groups</h1>
          </div>
          <button className={styles.createBtn} onClick={handleOpenCreate}>
            <AddIcon />Create Group
          </button>
        </div>
        <p className={styles.headerSubtitle}>Groups bundle permissions together. Assign users to groups to grant them multiple permissions at once.</p>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          {error}
          <button 
            className={styles.bootstrapBtn} 
            onClick={handleBootstrap}
            disabled={bootstrapping}
            style={{ marginLeft: '16px', padding: '6px 12px', borderRadius: '6px', background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {bootstrapping ? 'Initializing...' : 'Initialize Permissions'}
          </button>
        </div>
      )}

      <div className={styles.filtersCard}>
        <div className={styles.filtersRow}>
          <div className={styles.searchInput}>
            <SearchIcon className={styles.searchIcon} />
            <input type="text" placeholder="Search groups..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className={styles.typeSelect}>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="system">System</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}><div className={styles.statLabel}>Total Groups</div><div className={styles.statValue}>{groups.length}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>System Groups</div><div className={styles.statValue}>{groups.filter((g) => g.type === 'system').length}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>Custom Groups</div><div className={styles.statValue}>{groups.filter((g) => g.type === 'custom').length}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>Default Groups</div><div className={styles.statValue}>{groups.filter((g) => g.isDefault).length}</div></div>
      </div>

      {loading ? (
        <div className={styles.groupsList}>
          {[...Array(4)].map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className={styles.infoAlert}><InfoIcon />No groups found matching your criteria.</div>
      ) : (
        <div className={styles.groupsList}>
          {filteredGroups.map((group) => (
            <div key={group.id} className={styles.groupCard} style={{ borderLeftColor: group.color || '#6366f1' }}>
              <div className={styles.groupCardContent}>
                <div className={styles.groupCardHeader}>
                  <div className={styles.groupCardLeft}>
                    <div className={styles.groupIcon} style={{ backgroundColor: `${group.color || '#6366f1'}20`, color: group.color || '#6366f1' }}>
                      <GroupIcon />
                    </div>
                    <div className={styles.groupInfo}>
                      <h3>
                        {group.name}
                        {group.type === 'system' && <span className={`${styles.chip} ${styles.systemChip}`}><LockIcon />System</span>}
                        {group.isDefault && <span className={`${styles.chip} ${styles.defaultChip}`}><StarIcon />Default</span>}
                      </h3>
                      <p className={styles.groupDescription}>{group.description}</p>
                    </div>
                  </div>
                  <div className={styles.groupCardRight}>
                    <span className={`${styles.chip} ${styles.permissionsChip}`}><SecurityIcon />{group.permissions?.length || 0} permissions</span>
                    {group.type !== 'system' && (
                      <>
                        <button className={styles.iconBtn} onClick={() => handleOpenEdit(group)} title="Edit Group"><EditIcon style={{ fontSize: 16 }} /></button>
                        <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(group.id)} title="Delete Group"><DeleteIcon style={{ fontSize: 16 }} /></button>
                      </>
                    )}
                    <button className={styles.iconBtn} onClick={() => toggleExpand(group.id)} title="Toggle Permissions">
                      {expandedGroups.has(group.id) ? <ExpandLessIcon style={{ fontSize: 16 }} /> : <ExpandMoreIcon style={{ fontSize: 16 }} />}
                    </button>
                  </div>
                </div>

                {expandedGroups.has(group.id) && (
                  <div className={styles.groupExpanded}>
                    <div className={styles.expandedTitle}>Permissions ({group.permissions?.length || 0})</div>
                    <div className={styles.permissionsList}>
                      {group.permissions?.map((permId) => (
                        <span key={permId} className={styles.permissionChip}><CheckCircleIcon />{getPermissionCode(permId)}</span>
                      ))}
                      {(!group.permissions || group.permissions.length === 0) && <span className={styles.noPermissions}>No permissions assigned</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {createDialogOpen && (
        <div className={styles.dialog}>
          <div className={styles.dialogOverlay} onClick={() => setCreateDialogOpen(false)} />
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>
              <div className={styles.dialogHeaderTop}><div className={styles.dialogIcon}><GroupIcon /></div><h2 className={styles.dialogTitle}>{editGroup ? 'Edit Group' : 'Create Group'}</h2></div>
              <div className={styles.dialogSubtitle}>{editGroup ? 'Modify group settings' : 'Add a new permission group to your organization'}</div>
            </div>
            <div className={styles.dialogBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Group Name *</label>
                <input type="text" className={styles.formInput} placeholder="e.g., Administrators" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea className={styles.formTextarea} placeholder="Describe what this group is for..." rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Color</label>
                <div className={styles.colorPicker}>
                  {COLOR_OPTIONS.map((color) => (
                    <div
                      key={color}
                      className={`${styles.colorDot} ${formColor === color ? styles.selected : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormColor(color)}
                    />
                  ))}
                </div>
              </div>
              <label className={styles.checkboxGroup}>
                <input type="checkbox" checked={formIsDefault} onChange={(e) => setFormIsDefault(e.target.checked)} />
                <span>Automatically assign to new users (Default Group)</span>
              </label>

              <div className={styles.permissionsSection}>
                <div className={styles.permissionsSectionHeader}>
                  <label className={styles.formLabel}>Permissions ({formPermissions.length} selected)</label>
                  <div className={styles.permissionSearchInput}>
                    <SearchIcon className={styles.permSearchIcon} />
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      value={permissionSearchQuery}
                      onChange={(e) => setPermissionSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.permissionsGrid}>
                  {Object.entries(groupedDialogPermissions).map(([category, perms]) => (
                    <div key={category} className={styles.permCategoryGroup}>
                      <div className={styles.permCategoryTitle}>{category}</div>
                      <div className={styles.permItemsList}>
                        {perms.map((perm) => {
                          const isSelected = formPermissions.includes(perm.id);
                          return (
                            <div
                              key={perm.id}
                              className={`${styles.permItem} ${isSelected ? styles.selected : ''}`}
                              onClick={() => togglePermission(perm.id)}
                            >
                              <div className={styles.permItemContent}>
                                <span className={styles.permItemCode}>{perm.code}</span>
                                <span className={styles.permItemName}>{perm.name}</span>
                              </div>
                              {isSelected ? (
                                <RemoveCircleOutlineIcon className={styles.permItemIconRemove} />
                              ) : (
                                <AddCircleOutlineIcon className={styles.permItemIconAdd} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {Object.keys(groupedDialogPermissions).length === 0 && (
                    <div className={styles.noPermissionsFound}>No permissions found</div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.dialogFooter}>
              <button className={styles.cancelBtn} onClick={() => setCreateDialogOpen(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={!formName || saving}>{saving ? 'Saving...' : editGroup ? 'Save Changes' : 'Create Group'}</button>
            </div>
          </div>
        </div>
      )}

      {snackbar.open && <div className={`${styles.snackbar} ${styles[snackbar.severity]}`}>{snackbar.message}</div>}
    </div>
  );
}

export default Groups;
