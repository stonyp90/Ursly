import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts';
import { Skeleton, Chip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RefreshIcon from '@mui/icons-material/Refresh';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MemoryIcon from '@mui/icons-material/Memory';
import TaskIcon from '@mui/icons-material/Task';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TokenIcon from '@mui/icons-material/Token';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { agentsService, modelsService, auditService } from '../../services';
import styles from './Dashboard.module.css';

interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalModels: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  icon: 'success' | 'error' | 'info' | 'warning';
}

interface LocalModel {
  name: string;
  size: number;
  details?: {
    parameterSize?: string;
  };
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Infer parameter size from model name when API doesn't provide it
const inferParameterSize = (modelName: string): string | null => {
  const name = modelName.toLowerCase();
  
  // Check for explicit size in name
  const sizeMatch = name.match(/[:\-_](\d+\.?\d*)b/);
  if (sizeMatch) return `${sizeMatch[1]}B`;
  
  // Known model defaults
  if (name.includes('llama3.2')) return '3B';
  if (name.includes('llama3.1')) return '8B';
  if (name.includes('llama3')) return '8B';
  if (name.includes('llama2')) return '7B';
  if (name.includes('mistral')) return '7B';
  if (name.includes('mixtral')) return '8x7B';
  if (name.includes('phi3')) return '3.8B';
  if (name.includes('codellama')) return '7B';
  if (name.includes('gemma2')) return '9B';
  if (name.includes('gemma')) return '2B';
  if (name.includes('qwen')) return '7B';
  if (name.includes('deepseek')) return '7B';
  
  return null;
};

export function Dashboard() {
  const navigate = useNavigate();
  const { refreshKey } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [models, setModels] = useState<LocalModel[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextUsage] = useState({ used: 3200, total: 8192 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agentsRes, modelsRes, auditRes] = await Promise.all([
        agentsService.list().catch(() => ({ agents: [], total: 0 })),
        modelsService.list().catch(() => ({ models: [] })),
        auditService.getStats().catch(() => ({ totalEvents: 0, eventsByType: {} })),
      ]);

      const agents = agentsRes.agents || [];
      const modelList = modelsRes.models || [];

      setStats({
        totalAgents: agents.length,
        activeAgents: agents.filter((a: { status: string }) => a.status === 'running').length,
        totalModels: modelList.length,
        totalTasks: auditRes.totalEvents || 0,
        completedTasks: (auditRes.eventsByType as Record<string, number>)?.['task_completed'] || 0,
        failedTasks: (auditRes.eventsByType as Record<string, number>)?.['task_failed'] || 0,
      });

      setModels(modelList.slice(0, 5) as LocalModel[]);

      setActivities([
        { id: '1', type: 'agent_started', description: 'Agent "Assistant" started', timestamp: new Date(), icon: 'success' },
        { id: '2', type: 'model_pulled', description: 'Model "llama3.2" downloaded', timestamp: new Date(Date.now() - 3600000), icon: 'info' },
        { id: '3', type: 'task_completed', description: 'Task completed successfully', timestamp: new Date(Date.now() - 7200000), icon: 'success' },
      ]);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'success': return <CheckCircleIcon style={{ color: '#fff', fontSize: 18 }} />;
      case 'error': return <ErrorIcon style={{ color: '#fff', fontSize: 18 }} />;
      default: return <HistoryIcon style={{ color: '#fff', fontSize: 18 }} />;
    }
  };

  const getActivityIconClass = (icon: string) => {
    switch (icon) {
      case 'success': return styles.activityIconSuccess;
      case 'error': return styles.activityIconError;
      case 'warning': return styles.activityIconWarning;
      default: return styles.activityIconInfo;
    }
  };

  const contextPercentage = (contextUsage.used / contextUsage.total) * 100;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <DashboardIcon />
            </div>
            <h1 className={styles.headerTitle}>Dashboard</h1>
          </div>
          <button
            className={styles.refreshBtn}
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshIcon style={{ fontSize: 18 }} />
            Refresh
          </button>
        </div>
        <p className={styles.headerSubtitle}>
          Welcome back! Here's what's happening with your agents.
        </p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div 
          className={`${styles.statCard} ${styles.statCardClickable}`} 
          onClick={() => navigate('/agents')}
        >
          <div className={`${styles.statBorder} ${styles.borderBlue}`} />
          <div className={styles.statContent}>
            <div className={`${styles.statIcon} ${styles.iconBlue}`}>
              <SmartToyIcon style={{ color: '#000', fontSize: 20 }} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>TOTAL AGENTS</div>
              {loading ? (
                <Skeleton width={60} height={40} />
              ) : (
                <div className={styles.statValue}>{stats?.totalAgents || 0}</div>
              )}
            </div>
          </div>
          <div className={styles.statFooter}>
            <div className={`${styles.statChange} ${styles.changePositive}`}>
              <TrendingUpIcon style={{ fontSize: 14 }} />
              <span>{stats?.activeAgents || 0} active</span>
            </div>
            <div className={styles.statCta}>
              <span>Manage</span>
              <ArrowForwardIcon style={{ fontSize: 14 }} />
            </div>
          </div>
        </div>

        <div 
          className={`${styles.statCard} ${styles.statCardClickable}`} 
          onClick={() => navigate('/models')}
        >
          <div className={`${styles.statBorder} ${styles.borderPurple}`} />
          <div className={styles.statContent}>
            <div className={`${styles.statIcon} ${styles.iconPurple}`}>
              <MemoryIcon style={{ color: '#000', fontSize: 20 }} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>MODELS AVAILABLE</div>
              {loading ? (
                <Skeleton width={60} height={40} />
              ) : (
                <div className={styles.statValue}>{stats?.totalModels || 0}</div>
              )}
            </div>
          </div>
          <div className={styles.statFooter}>
            <div className={`${styles.statChange} ${styles.changePositive}`}>
              <TrendingUpIcon style={{ fontSize: 14 }} />
              <span>Ready to use</span>
            </div>
            <div className={styles.statCta}>
              <span>Browse</span>
              <ArrowForwardIcon style={{ fontSize: 14 }} />
            </div>
          </div>
        </div>

        <div 
          className={`${styles.statCard} ${styles.statCardClickable}`} 
          onClick={() => navigate('/audit')}
        >
          <div className={`${styles.statBorder} ${styles.borderPink}`} />
          <div className={styles.statContent}>
            <div className={`${styles.statIcon} ${styles.iconPink}`}>
              <TaskIcon style={{ color: '#000', fontSize: 20 }} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>TOTAL EVENTS</div>
              {loading ? (
                <Skeleton width={60} height={40} />
              ) : (
                <div className={styles.statValue}>{stats?.totalTasks || 0}</div>
              )}
            </div>
          </div>
          <div className={styles.statFooter}>
            <div className={`${styles.statChange} ${styles.changePositive}`}>
              <TrendingUpIcon style={{ fontSize: 14 }} />
              <span>{stats?.completedTasks || 0} completed</span>
            </div>
            <div className={styles.statCta}>
              <span>View logs</span>
              <ArrowForwardIcon style={{ fontSize: 14 }} />
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statBorder} ${styles.borderCyan}`} />
          <div className={styles.statContent}>
            <div className={`${styles.statIcon} ${styles.iconCyan}`}>
              <TokenIcon style={{ color: '#000', fontSize: 20 }} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>CONTEXT USAGE</div>
              <div className={styles.statValue}>{contextPercentage.toFixed(0)}%</div>
            </div>
          </div>
          <div className={styles.statFooter}>
            <div className={`${styles.statChange} ${contextPercentage > 80 ? styles.changeNegative : styles.changePositive}`}>
              {contextPercentage > 80 ? <TrendingDownIcon style={{ fontSize: 14 }} /> : <TrendingUpIcon style={{ fontSize: 14 }} />}
              <span>{contextUsage.used.toLocaleString()} / {contextUsage.total.toLocaleString()}</span>
            </div>
            <div className={styles.contextMeter}>
              <div className={styles.contextMeterFill} style={{ width: `${contextPercentage}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className={styles.gridSection}>
        {/* Recent Activity */}
        <div className={styles.glassCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              <HistoryIcon style={{ fontSize: 18 }} /> Recent Activity
            </span>
            <Link to="/audit">
              <Chip label="View All" size="small" clickable sx={{ 
                background: 'rgba(0, 245, 255, 0.1)', 
                color: '#00f5ff',
                border: '1px solid rgba(0, 245, 255, 0.3)',
                '&:hover': { background: 'rgba(0, 245, 255, 0.2)' }
              }} />
            </Link>
          </div>
          <div className={styles.activityList}>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))
            ) : activities.length === 0 ? (
              <div className={styles.emptyState}>No recent activity</div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={`${styles.activityIcon} ${getActivityIconClass(activity.icon)}`}>
                    {getActivityIcon(activity.icon)}
                  </div>
                  <div className={styles.activityInfo}>
                    <div className={styles.activityTitle}>{activity.description}</div>
                    <div className={styles.activityTime}>
                      {activity.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Models */}
        <div className={styles.glassCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              <MemoryIcon style={{ fontSize: 18 }} /> Models
            </span>
            <Link to="/models">
              <Chip label="Manage" size="small" clickable sx={{ 
                background: 'rgba(168, 85, 247, 0.1)', 
                color: '#a855f7',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                '&:hover': { background: 'rgba(168, 85, 247, 0.2)' }
              }} />
            </Link>
          </div>
          <div className={styles.modelList}>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))
            ) : models.length === 0 ? (
              <div className={styles.emptyState}>No models installed</div>
            ) : (
              models.map((model) => (
                <div key={model.name} className={styles.modelItem}>
                  <div className={styles.modelIcon}>
                    <MemoryIcon style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                  <div className={styles.modelInfo}>
                    <div className={styles.modelName}>{model.name}</div>
                    <div className={styles.modelSize}>
                      {formatBytes(model.size)} • {model.details?.parameterSize || inferParameterSize(model.name) || '—'}
                    </div>
                  </div>
                  <div className={styles.modelStatus}>
                    <span className={styles.statusDot} />
                    <span className={styles.statusText}>Ready</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.glassCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Quick Actions</span>
        </div>
        <div className={styles.quickActions}>
          <Link to="/agents" className={styles.actionButton}>
            <div className={`${styles.actionIcon} ${styles.actionIconBlue}`}>
              <AddIcon style={{ color: '#fff' }} />
            </div>
            <div className={styles.actionText}>
              <div className={styles.actionTitle}>Create Agent</div>
              <div className={styles.actionDesc}>Build a new AI agent</div>
            </div>
          </Link>
          <Link to="/models" className={styles.actionButton}>
            <div className={`${styles.actionIcon} ${styles.actionIconPurple}`}>
              <CloudDownloadIcon style={{ color: '#fff' }} />
            </div>
            <div className={styles.actionText}>
              <div className={styles.actionTitle}>Pull Model</div>
              <div className={styles.actionDesc}>Download from Ollama</div>
            </div>
          </Link>
          <Link to="/agents" className={styles.actionButton}>
            <div className={`${styles.actionIcon} ${styles.actionIconPink}`}>
              <PlayArrowIcon style={{ color: '#fff' }} />
            </div>
            <div className={styles.actionText}>
              <div className={styles.actionTitle}>Start Chat</div>
              <div className={styles.actionDesc}>Talk with your agent</div>
            </div>
          </Link>
          <Link to="/audit" className={styles.actionButton}>
            <div className={`${styles.actionIcon} ${styles.actionIconCyan}`}>
              <HistoryIcon style={{ color: '#fff' }} />
            </div>
            <div className={styles.actionText}>
              <div className={styles.actionTitle}>View Logs</div>
              <div className={styles.actionDesc}>Monitor activity</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
