/**
 * OperationHistory - Displays user operation history and audit logs
 */
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './OperationHistory.css';

interface Operation {
  operation_id: string;
  operation_type: 'Upload' | 'Download' | 'Delete' | 'Move' | 'Copy';
  source_id: string;
  source_path: string;
  destination_path?: string;
  file_size?: number;
  bytes_processed: number;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Failed' | 'Canceled';
  error?: string;
  user_id?: string;
  organization_id?: string;
  created_at?: string;
  completed_at?: string;
  last_updated_at?: string;
}

interface OperationHistoryProps {
  limit?: number;
}

export function OperationHistory({ limit = 100 }: OperationHistoryProps) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all');
  const [typeFilter, setTypeFilter] = useState<
    'all' | Operation['operation_type']
  >('all');

  useEffect(() => {
    loadHistory();
  }, [limit]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<Operation[]>('vfs_get_audit_history', {
        limit,
      });
      setOperations(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load operation history',
      );
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: Operation['status']): string => {
    switch (status) {
      case 'Completed':
        return 'var(--success, #10b981)';
      case 'Failed':
        return 'var(--error, #ef4444)';
      case 'InProgress':
        return 'var(--primary, #00d4ff)';
      case 'Pending':
        return 'var(--warning, #f59e0b)';
      case 'Canceled':
        return 'var(--text-muted, #6a6a7a)';
      default:
        return 'var(--text-secondary, #a0a0b0)';
    }
  };

  const getTypeIcon = (type: Operation['operation_type']): string => {
    switch (type) {
      case 'Upload':
        return '↑';
      case 'Download':
        return '↓';
      case 'Delete':
        return '🗑';
      case 'Move':
        return '→';
      case 'Copy':
        return '📋';
      default:
        return '•';
    }
  };

  const filteredOperations = operations.filter((op) => {
    if (filter === 'completed' && op.status !== 'Completed') return false;
    if (filter === 'failed' && op.status !== 'Failed') return false;
    if (typeFilter !== 'all' && op.operation_type !== typeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="operation-history">
        <div className="operation-history-loading">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="operation-history">
        <div className="operation-history-error">
          <p>Error loading history: {error}</p>
          <button onClick={loadHistory}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="operation-history">
      <div className="operation-history-header">
        <h2>Operation History</h2>
        <button onClick={loadHistory} className="refresh-btn" title="Refresh">
          ↻
        </button>
      </div>

      <div className="operation-history-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="Upload">Upload</option>
            <option value="Download">Download</option>
            <option value="Delete">Delete</option>
            <option value="Move">Move</option>
            <option value="Copy">Copy</option>
          </select>
        </div>
        <div className="operation-count">
          Showing {filteredOperations.length} of {operations.length} operations
        </div>
      </div>

      <div className="operation-history-list">
        {filteredOperations.length === 0 ? (
          <div className="operation-history-empty">
            <p>No operations found</p>
          </div>
        ) : (
          filteredOperations.map((op) => (
            <div key={op.operation_id} className="operation-item">
              <div className="operation-item-header">
                <div className="operation-type">
                  <span className="operation-icon">
                    {getTypeIcon(op.operation_type)}
                  </span>
                  <span className="operation-type-name">
                    {op.operation_type}
                  </span>
                </div>
                <div
                  className="operation-status"
                  style={{ color: getStatusColor(op.status) }}
                >
                  {op.status}
                </div>
              </div>
              <div className="operation-item-body">
                <div className="operation-path">
                  <strong>Source:</strong> {op.source_path}
                </div>
                {op.destination_path && (
                  <div className="operation-path">
                    <strong>Destination:</strong> {op.destination_path}
                  </div>
                )}
                <div className="operation-details">
                  {op.file_size && (
                    <span className="operation-detail">
                      Size: {formatBytes(op.file_size)}
                    </span>
                  )}
                  {op.bytes_processed > 0 && (
                    <span className="operation-detail">
                      Processed: {formatBytes(op.bytes_processed)}
                    </span>
                  )}
                  <span className="operation-detail">
                    Created: {formatDate(op.created_at)}
                  </span>
                  {op.completed_at && (
                    <span className="operation-detail">
                      Completed: {formatDate(op.completed_at)}
                    </span>
                  )}
                </div>
                {op.error && (
                  <div className="operation-error">
                    <strong>Error:</strong> {op.error}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
