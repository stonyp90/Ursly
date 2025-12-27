/**
 * AuditPage - Operations Audit Log Viewer
 * Displays user and organization operation history/audit logs
 */
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './AuditPage.css';

interface AuditPageProps {
  onClose?: () => void;
}

interface AuditLogEntry {
  operation_id: string;
  operation_type: 'Upload' | 'Download' | 'Delete' | 'Move' | 'Copy';
  source_id: string;
  source_path: string;
  destination_path?: string;
  file_size?: number;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Failed' | 'Canceled';
  error?: string;
  user_id?: string;
  organization_id?: string;
  created_at?: string;
  completed_at?: string;
}

type AuditTab = 'user' | 'organization';

export function AuditPage({ onClose }: AuditPageProps) {
  const [activeTab, setActiveTab] = useState<AuditTab>('user');
  const [userAuditLog, setUserAuditLog] = useState<AuditLogEntry[]>([]);
  const [orgAuditLog, setOrgAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load audit logs
  useEffect(() => {
    loadAuditLogs();
  }, [activeTab]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'user') {
        const entries = await invoke<AuditLogEntry[]>(
          'vfs_get_user_audit_log',
          {
            userId: null, // Get current user's operations
          },
        );
        setUserAuditLog(entries || []);
      } else {
        const entries = await invoke<AuditLogEntry[]>(
          'vfs_get_organization_audit_log',
          {
            organizationId: null, // Under development
          },
        );
        setOrgAuditLog(entries || []);
      }
    } catch (error) {
      console.error('Failed to load audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter entries
  const getFilteredEntries = () => {
    const entries = activeTab === 'user' ? userAuditLog : orgAuditLog;

    return entries.filter((entry) => {
      // Filter by type
      if (filterType !== 'all' && entry.operation_type !== filterType) {
        return false;
      }

      // Filter by status
      if (filterStatus !== 'all' && entry.status !== filterStatus) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          entry.source_path.toLowerCase().includes(query) ||
          entry.destination_path?.toLowerCase().includes(query) ||
          entry.operation_id.toLowerCase().includes(query) ||
          entry.source_id.toLowerCase().includes(query)
        );
      }

      return true;
    });
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed':
        return 'var(--success, #10b981)';
      case 'Failed':
        return 'var(--error, #ef4444)';
      case 'InProgress':
        return 'var(--primary, #00d4ff)';
      case 'Canceled':
        return 'var(--text-muted, #6a6a7a)';
      default:
        return 'var(--text-secondary, #a0a0b0)';
    }
  };

  const filteredEntries = getFilteredEntries();

  return (
    <div className="audit-page">
      <div className="audit-container">
        <div className="audit-header">
          <h1>Operations Audit</h1>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="audit-tabs">
          <button
            className={`audit-tab ${activeTab === 'user' ? 'active' : ''}`}
            onClick={() => setActiveTab('user')}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>User Ops Audit</span>
          </button>
          <button
            className={`audit-tab ${activeTab === 'organization' ? 'active' : ''}`}
            onClick={() => setActiveTab('organization')}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Organization Ops Audit</span>
            <span className="badge-under-dev">Under Development</span>
          </button>
        </div>

        {/* Filters */}
        <div className="audit-filters">
          <div className="filter-group">
            <label>Operation Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="Upload">Upload</option>
              <option value="Download">Download</option>
              <option value="Delete">Delete</option>
              <option value="Move">Move</option>
              <option value="Copy">Copy</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="InProgress">In Progress</option>
              <option value="Canceled">Canceled</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="filter-group search-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search by path, ID, or source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className="refresh-btn"
            onClick={loadAuditLogs}
            disabled={loading}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Audit Log Table */}
        <div className="audit-content">
          {loading ? (
            <div className="audit-loading">
              <div className="spinner" />
              <p>Loading audit log...</p>
            </div>
          ) : activeTab === 'organization' ? (
            <div className="audit-under-dev">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <h2>Organization Operations Audit</h2>
              <p>This feature is currently under development.</p>
              <p className="dev-note">
                Organization-level audit logging will allow administrators to
                track all operations across their organization, including user
                activity, storage usage, and compliance reporting.
              </p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="audit-empty">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 12h6m-3-3v6" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <p>No audit log entries found</p>
              <p className="empty-note">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Operations will appear here as you perform file operations'}
              </p>
            </div>
          ) : (
            <div className="audit-table-wrapper">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Path</th>
                    <th>Destination</th>
                    <th>Size</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.operation_id}>
                      <td className="time-cell">
                        {formatDate(entry.completed_at || entry.created_at)}
                      </td>
                      <td className="type-cell">
                        <span className="operation-type">
                          {entry.operation_type}
                        </span>
                      </td>
                      <td className="source-cell" title={entry.source_id}>
                        {entry.source_id.length > 20
                          ? `${entry.source_id.substring(0, 20)}...`
                          : entry.source_id}
                      </td>
                      <td className="path-cell" title={entry.source_path}>
                        {entry.source_path.length > 40
                          ? `...${entry.source_path.slice(-40)}`
                          : entry.source_path}
                      </td>
                      <td
                        className="dest-cell"
                        title={entry.destination_path || '-'}
                      >
                        {entry.destination_path
                          ? entry.destination_path.length > 40
                            ? `...${entry.destination_path.slice(-40)}`
                            : entry.destination_path
                          : '-'}
                      </td>
                      <td className="size-cell">
                        {formatFileSize(entry.file_size)}
                      </td>
                      <td className="status-cell">
                        <span
                          className="status-badge"
                          style={{ color: getStatusColor(entry.status) }}
                        >
                          {entry.status}
                        </span>
                        {entry.error && (
                          <span className="error-indicator" title={entry.error}>
                            ⚠
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="audit-footer">
                <p>
                  Showing {filteredEntries.length} of{' '}
                  {activeTab === 'user'
                    ? userAuditLog.length
                    : orgAuditLog.length}{' '}
                  entries
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
