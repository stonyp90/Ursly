import { useState, useEffect, Fragment } from 'react';
import { useUser } from '../contexts';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TaskIcon from '@mui/icons-material/Task';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import { auditService } from '../services';
import styles from './AuditLogs.module.css';

interface LocalAuditLog {
  id: string;
  eventType: string;
  agentId?: string;
  taskId?: string;
  userId?: string;
  details?: Record<string, unknown>;
  duration?: number;
  timestamp: Date | string;
}

interface AuditStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  avgDuration?: number;
}

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'agent_created', label: 'Agent Created' },
  { value: 'agent_started', label: 'Agent Started' },
  { value: 'agent_stopped', label: 'Agent Stopped' },
  { value: 'agent_suspended', label: 'Agent Suspended' },
  { value: 'agent_deleted', label: 'Agent Deleted' },
  { value: 'task_created', label: 'Task Created' },
  { value: 'task_completed', label: 'Task Completed' },
  { value: 'task_failed', label: 'Task Failed' },
  { value: 'model_pulled', label: 'Model Pulled' },
  { value: 'model_deleted', label: 'Model Deleted' },
];

const getEventIcon = (eventType: string) => {
  if (eventType.includes('created') || eventType.includes('pulled')) {
    return <AddIcon />;
  }
  if (eventType.includes('started')) {
    return <PlayArrowIcon />;
  }
  if (eventType.includes('stopped')) {
    return <StopIcon />;
  }
  if (eventType.includes('deleted')) {
    return <DeleteIcon />;
  }
  if (eventType.includes('completed')) {
    return <CheckCircleIcon />;
  }
  if (eventType.includes('failed') || eventType.includes('error')) {
    return <ErrorIcon />;
  }
  return <InfoIcon />;
};

const getEventIconClass = (eventType: string): string => {
  if (eventType.includes('created') || eventType.includes('completed') || eventType.includes('started')) {
    return styles.created;
  }
  if (eventType.includes('failed') || eventType.includes('error') || eventType.includes('deleted')) {
    return styles.deleted;
  }
  if (eventType.includes('stopped') || eventType.includes('suspended')) {
    return styles.warning;
  }
  return styles.info;
};

const formatDuration = (ms?: number): string => {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

const formatEventType = (eventType: string): string => {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function AuditLogs() {
  const { refreshKey } = useUser();
  const [logs, setLogs] = useState<LocalAuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Filters
  const [eventType, setEventType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        auditService.getLogs({
          eventType: (eventType || undefined) as unknown as undefined,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        }),
        auditService.getStats(),
      ]);
      setLogs((logsRes.logs || []) as LocalAuditLog[]);
      setTotal(logsRes.total || 0);
      setStats(statsRes);
      setError(null);
    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, eventType, refreshKey]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, page, rowsPerPage, eventType]);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.eventType.toLowerCase().includes(search) ||
      log.agentId?.toLowerCase().includes(search) ||
      log.taskId?.toLowerCase().includes(search) ||
      log.userId?.toLowerCase().includes(search)
    );
  });

  const startIndex = page * rowsPerPage;
  const endIndex = Math.min(startIndex + filteredLogs.length, total);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <HistoryIcon />
            </div>
            <div>
              <h1 className={styles.headerTitle}>Audit Logs</h1>
              <p className={styles.headerSubtitle}>Real-time activity monitoring and event tracking</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            {autoRefresh && (
              <div className={styles.liveIndicator}>
                <span className={styles.liveDot} />
                <span className={styles.liveText}>Live</span>
              </div>
            )}
            <button
              className={`${styles.toggleBtn} ${autoRefresh ? styles.active : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </button>
            <button className={styles.refreshBtn} onClick={fetchLogs}>
              <RefreshIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statCardContent}>
              <div className={`${styles.statIcon} ${styles.events}`}>
                <TrendingUpIcon />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Total Events</div>
                <div className={styles.statValue}>{stats.totalEvents.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardContent}>
              <div className={`${styles.statIcon} ${styles.success}`}>
                <CheckCircleIcon />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Successful</div>
                <div className={styles.statValue}>
                  {(stats.eventsByType['task_completed'] || 0) + (stats.eventsByType['agent_created'] || 0)}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardContent}>
              <div className={`${styles.statIcon} ${styles.error}`}>
                <ErrorIcon />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Errors</div>
                <div className={styles.statValue}>{stats.eventsByType['task_failed'] || 0}</div>
              </div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardContent}>
              <div className={`${styles.statIcon} ${styles.duration}`}>
                <AccessTimeIcon />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Avg Duration</div>
                <div className={styles.statValue}>{formatDuration(stats.avgDuration)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`${styles.glassCard} ${styles.filtersCard}`}>
        <div className={styles.filtersRow}>
          <div className={styles.searchInput}>
            <SearchIcon className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterSelect}>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              {EVENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className={styles.filterBtn}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterListIcon />
            {showFilters ? 'Hide Filters' : 'More Filters'}
          </button>
        </div>
        
        {showFilters && (
          <div className={styles.filtersExpanded}>
            <p className={styles.filtersNote}>
              Additional filters coming soon: Date range, Agent ID, User ID
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <span className={styles.errorText}>
            <ErrorIcon />
            {error}
          </span>
          <button className={styles.errorClose} onClick={() => setError(null)}>
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Events Table */}
      <div className={`${styles.glassCard} ${styles.tableCard}`}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th style={{ width: 50 }}></th>
              <th>Event</th>
              <th>Agent</th>
              <th>Task</th>
              <th>User</th>
              <th>Duration</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className={styles.skeletonRow}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j}>
                      <div className={`${styles.skeleton} ${styles.skeletonCell}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <InfoIcon />
                    </div>
                    <h3 className={styles.emptyTitle}>No audit logs found</h3>
                    <p className={styles.emptySubtitle}>Events will appear here as they occur</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <Fragment key={log.id}>
                  <tr className={styles.tableRow}>
                    <td>
                      <button 
                        className={styles.expandBtn}
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                      >
                        {expandedRow === log.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </button>
                    </td>
                    <td>
                      <div className={styles.eventBadge}>
                        <span className={`${styles.eventIcon} ${getEventIconClass(log.eventType)}`}>
                          {getEventIcon(log.eventType)}
                        </span>
                        <span className={styles.eventText}>{formatEventType(log.eventType)}</span>
                      </div>
                    </td>
                    <td>
                      {log.agentId ? (
                        <span className={`${styles.entityChip} ${styles.agent}`}>
                          <SmartToyIcon />
                          {log.agentId.slice(0, 8)}
                        </span>
                      ) : <span className={styles.emptyCell}>-</span>}
                    </td>
                    <td>
                      {log.taskId ? (
                        <span className={`${styles.entityChip} ${styles.task}`}>
                          <TaskIcon />
                          {log.taskId.slice(0, 8)}
                        </span>
                      ) : <span className={styles.emptyCell}>-</span>}
                    </td>
                    <td>
                      {log.userId ? (
                        <span className={`${styles.entityChip} ${styles.user}`}>
                          <PersonIcon />
                          {log.userId.slice(0, 8)}
                        </span>
                      ) : <span className={styles.emptyCell}>-</span>}
                    </td>
                    <td>
                      <span className={styles.duration}>{formatDuration(log.duration)}</span>
                    </td>
                    <td>
                      <span className={styles.timestamp} title={new Date(log.timestamp).toLocaleString()}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </td>
                  </tr>
                  {expandedRow === log.id && (
                    <tr className={styles.detailsRow}>
                      <td colSpan={7}>
                        <div className={styles.detailsContent}>
                          <h4 className={styles.detailsTitle}>Event Details</h4>
                          <div className={styles.detailsCode}>
                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
        
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Showing {startIndex + 1}-{endIndex} of {total} events
          </span>
          <div className={styles.paginationControls}>
            <div className={styles.rowsPerPage}>
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <button
              className={styles.pageBtn}
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button
              className={styles.pageBtn}
              disabled={endIndex >= total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
