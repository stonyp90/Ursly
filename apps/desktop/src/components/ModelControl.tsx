import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import type { ModelStatus, ProcessInfo, ModelConfig } from '../types';

interface ModelControlProps {
  runningModel: ModelStatus | null | undefined;
  modelProcesses: ProcessInfo[];
}

const POPULAR_MODELS = [
  { name: 'llama3.2', label: 'Llama 3.2', size: '3B' },
  { name: 'llama3.2:1b', label: 'Llama 3.2', size: '1B' },
  { name: 'mistral', label: 'Mistral', size: '7B' },
  { name: 'codellama', label: 'CodeLlama', size: '7B' },
  { name: 'phi3', label: 'Phi-3', size: '3.8B' },
  { name: 'gemma2:2b', label: 'Gemma 2', size: '2B' },
];

export function ModelControl({ runningModel, modelProcesses }: ModelControlProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [customModel, setCustomModel] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [error, setError] = useState<string | null>(null);

  const handleStartModel = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const config: ModelConfig = {
        name: customModel || selectedModel,
        ollama_url: ollamaUrl,
      };
      await invoke('start_model', { config });
    } catch (err) {
      setError(String(err));
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopModel = async () => {
    try {
      await invoke('stop_model');
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="model-control">
      <div className="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <h3>Model Control</h3>
      </div>

      <AnimatePresence mode="wait">
        {runningModel ? (
          <motion.div
            key="running"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="running-model"
          >
            <div className="model-status running">
              <div className="status-indicator">
                <span className="pulse-dot"></span>
                Running
              </div>
              <h4>{runningModel.name}</h4>
              <span className="duration">{formatDuration(runningModel.duration_seconds)}</span>
            </div>
            <button className="btn-stop" onClick={handleStopModel}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
              Stop Model
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="control"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="model-selector"
          >
            <div className="form-group">
              <label>Select Model</label>
              <div className="model-grid">
                {POPULAR_MODELS.map((model) => (
                  <button
                    key={model.name}
                    className={`model-chip ${selectedModel === model.name ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedModel(model.name);
                      setCustomModel('');
                    }}
                  >
                    <span className="model-name">{model.label}</span>
                    <span className="model-size">{model.size}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Or enter custom model</label>
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g., llama3.2:70b"
              />
            </div>

            <div className="form-group">
              <label>Ollama URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>

            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              className="btn-start"
              onClick={handleStartModel}
              disabled={isStarting}
            >
              {isStarting ? (
                <>
                  <span className="spinner"></span>
                  Starting...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Start Model
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Running Processes */}
      {modelProcesses.length > 0 && (
        <div className="processes-section">
          <h4>AI Processes</h4>
          <div className="process-list">
            {modelProcesses.map((proc) => (
              <div key={proc.pid} className="process-item">
                <div className="process-info">
                  <span className="process-name">{proc.name}</span>
                  <span className="process-pid">PID: {proc.pid}</span>
                </div>
                <div className="process-stats">
                  <span className="stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                    {proc.cpu_usage.toFixed(1)}%
                  </span>
                  <span className="stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="4" width="12" height="16" rx="2" />
                      <line x1="6" y1="8" x2="18" y2="8" />
                    </svg>
                    {proc.memory_mb} MB
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

