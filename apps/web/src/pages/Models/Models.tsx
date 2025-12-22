import { useState, useEffect } from 'react';
import { useUser } from '../../contexts';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import SearchIcon from '@mui/icons-material/Search';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import { modelsService } from '../../services';
import styles from './Models.module.css';

interface LocalModel {
  name: string;
  size: number;
  digest: string;
  modifiedAt?: Date | string;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameterSize?: string;
    quantizationLevel?: string;
  };
}

const POPULAR_MODELS = [
  { name: 'llama3.2', description: 'Latest Llama model with 128K context' },
  { name: 'mistral', description: 'Fast and efficient 7B model' },
  { name: 'codellama', description: 'Code-specialized Llama' },
  { name: 'phi3', description: "Microsoft's efficient model" },
  { name: 'gemma2', description: "Google's open model" },
  { name: 'qwen2.5', description: "Alibaba's multilingual model" },
];

const getContextWindow = (modelName: string): number => {
  const name = modelName.toLowerCase();
  if (name.includes('llama3.1') || name.includes('llama3.2')) return 131072;
  if (name.includes('llama3')) return 8192;
  if (name.includes('mistral') || name.includes('mixtral')) return 32768;
  if (name.includes('phi3')) return 128000;
  if (name.includes('codellama')) return 16384;
  if (name.includes('qwen')) return 32768;
  if (name.includes('gemma')) return 8192;
  return 4096;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatContextWindow = (tokens: number): string => {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
  return tokens.toString();
};

export function Models() {
  const { refreshKey } = useUser();
  const [models, setModels] = useState<LocalModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pullDialogOpen, setPullDialogOpen] = useState(false);
  const [modelToPull, setModelToPull] = useState('');
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await modelsService.list();
      setModels((response.models || []) as LocalModel[]);
      setError(null);
    } catch (err) {
      setError('Failed to fetch models');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModels(); }, [refreshKey]);

  const handlePullModel = async () => {
    if (!modelToPull.trim()) return;
    
    setPulling(true);
    setPullProgress(0);
    
    const interval = setInterval(() => {
      setPullProgress(prev => {
        if (prev >= 95) { clearInterval(interval); return prev; }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      await modelsService.pull({ name: modelToPull.trim() });
      setPullProgress(100);
      setTimeout(() => {
        setPullDialogOpen(false);
        setModelToPull('');
        setPulling(false);
        setPullProgress(0);
        fetchModels();
      }, 1000);
    } catch (err) {
      setError('Failed to pull model');
      setPulling(false);
      clearInterval(interval);
    }
  };

  const handleDeleteModel = async (name: string) => {
    try {
      await modelsService.delete(name);
      setDeleteConfirm(null);
      fetchModels();
    } catch (err) {
      setError('Failed to delete model');
    }
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>AI Models</h1>
          <p>Manage your Ollama models for neural inference</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshBtn} onClick={fetchModels} title="Refresh">
            <RefreshIcon style={{ fontSize: 20 }} />
          </button>
          <button className={styles.pullBtn} onClick={() => setPullDialogOpen(true)}>
            <AddIcon style={{ fontSize: 18 }} /> Pull Model
          </button>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchContainer}>
        <SearchIcon className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className={`${styles.alert} ${styles.error}`}>
          <ErrorIcon />
          <span>{error}</span>
          <button className={styles.alertClose} onClick={() => setError(null)}>
            <CloseIcon style={{ fontSize: 16 }} />
          </button>
        </div>
      )}

      {/* Models Grid */}
      <div className={styles.modelsGrid}>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonHeader}>
                <div className={`${styles.skeleton} ${styles.skeletonIcon}`} />
                <div className={styles.skeletonText}>
                  <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
                  <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '60%' }} />
                </div>
              </div>
              <div className={styles.skeletonStats}>
                <div className={`${styles.skeleton} ${styles.skeletonChip}`} />
                <div className={`${styles.skeleton} ${styles.skeletonChip}`} />
                <div className={`${styles.skeleton} ${styles.skeletonChip}`} />
              </div>
            </div>
          ))
        ) : filteredModels.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <MemoryIcon />
            </div>
            <h3>No models found</h3>
            <p>Pull your first model to get started with AI inference</p>
            <button className={styles.emptyBtn} onClick={() => setPullDialogOpen(true)}>
              <CloudDownloadIcon /> Pull Model
            </button>
          </div>
        ) : (
          filteredModels.map((model) => {
            const contextWindow = getContextWindow(model.name);
            return (
              <div key={model.digest} className={styles.modelCard}>
                <div className={styles.modelCardHeader}>
                  <div className={styles.modelIcon}>
                    <MemoryIcon />
                  </div>
                  <div className={styles.modelInfo}>
                    <div className={styles.modelName}>{model.name}</div>
                    <div className={styles.modelFamily}>
                      {model.details?.family || 'Unknown'} • <span>{model.details?.parameterSize || 'N/A'}</span>
                    </div>
                  </div>
                  <button className={styles.deleteBtn} onClick={() => setDeleteConfirm(model.name)} title="Delete model">
                    <DeleteIcon />
                  </button>
                </div>

                <div className={styles.modelStats}>
                  <span className={styles.statChip}>
                    <StorageIcon /> {formatBytes(model.size)}
                  </span>
                  <span className={styles.statChip}>
                    <SpeedIcon /> {formatContextWindow(contextWindow)} ctx
                  </span>
                  <span className={`${styles.statChip} ${styles.quantization}`}>
                    {model.details?.quantizationLevel || 'N/A'}
                  </span>
                </div>

                <div className={styles.modelFooter}>
                  <span className={styles.modelDate}>
                    {model.modifiedAt ? new Date(model.modifiedAt).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className={styles.statusBadge}>
                    <CheckCircleIcon /> Ready
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pull Dialog */}
      {pullDialogOpen && (
        <div className={styles.dialog} onClick={() => !pulling && setPullDialogOpen(false)}>
          <div className={styles.dialogContent} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <CloudDownloadIcon />
              <h3>Pull New Model</h3>
            </div>
            <div className={styles.dialogBody}>
              <p>Enter a model name from Ollama registry (e.g., llama3.2, mistral, codellama)</p>
              
              <input
                className={styles.inputField}
                type="text"
                placeholder="llama3.2"
                value={modelToPull}
                onChange={(e) => setModelToPull(e.target.value)}
                disabled={pulling}
                autoFocus
              />

              {pulling && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressHeader}>
                    <span>Downloading {modelToPull}...</span>
                    <span>{Math.round(pullProgress)}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pullProgress}%` }} />
                  </div>
                </div>
              )}

              <div className={styles.popularModels}>
                <span>Popular models:</span>
                <div className={styles.popularGrid}>
                  {POPULAR_MODELS.map((m) => (
                    <button
                      key={m.name}
                      className={styles.popularChip}
                      onClick={() => setModelToPull(m.name)}
                      disabled={pulling}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.dialogFooter}>
              <button className={styles.cancelBtn} onClick={() => setPullDialogOpen(false)} disabled={pulling}>
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handlePullModel}
                disabled={!modelToPull.trim() || pulling}
              >
                {pulling ? 'Pulling...' : <><CloudDownloadIcon /> Pull Model</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className={styles.dialog} onClick={() => setDeleteConfirm(null)}>
          <div className={`${styles.dialogContent} ${styles.deleteDialog}`} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <DeleteIcon style={{ color: '#ef4444' }} />
              <h3>Delete Model</h3>
            </div>
            <div className={styles.dialogBody}>
              <p>Are you sure you want to delete <strong>{deleteConfirm}</strong>? This action cannot be undone.</p>
            </div>
            <div className={styles.dialogFooter}>
              <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className={`${styles.submitBtn} ${styles.deleteBtn} ${styles.confirm}`}
                onClick={() => deleteConfirm && handleDeleteModel(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

