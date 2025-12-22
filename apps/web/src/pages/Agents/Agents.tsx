import { useState, useEffect, useRef } from 'react';
import { useUser } from '../../contexts';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MemoryIcon from '@mui/icons-material/Memory';
import TokenIcon from '@mui/icons-material/Token';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PauseIcon from '@mui/icons-material/Pause';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import SettingsIcon from '@mui/icons-material/Settings';
import WarningIcon from '@mui/icons-material/Warning';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { agentsService, modelsService } from '../../services';
import styles from './Agents.module.css';

interface LocalAgent {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  status: string;
  capabilities: string[];
  createdAt: Date | string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  timestamp: Date;
}

interface LocalModel {
  name: string;
  details?: { parameterSize?: string };
}

const getContextWindow = (modelName: string): number => {
  const name = modelName.toLowerCase();
  if (name.includes('llama3.1') || name.includes('llama3.2')) return 131072;
  if (name.includes('llama3') || name.includes('llama2')) return 8192;
  if (name.includes('mistral') || name.includes('mixtral')) return 32768;
  if (name.includes('phi3')) return 128000;
  if (name.includes('codellama')) return 16384;
  if (name.includes('qwen')) return 32768;
  return 4096;
};

const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

export function Agents() {
  const { refreshKey } = useUser();
  const [agents, setAgents] = useState<LocalAgent[]>([]);
  const [models, setModels] = useState<LocalModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<LocalAgent | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'context' | 'settings'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [newAgent, setNewAgent] = useState({ name: '', model: '', systemPrompt: 'You are a helpful AI assistant.' });
  const [editedSettings, setEditedSettings] = useState<{
    name: string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const [agentsRes, modelsRes] = await Promise.all([
        agentsService.list(),
        modelsService.list(),
      ]);
      setAgents((agentsRes.agents || []) as LocalAgent[]);
      setModels((modelsRes.models || []) as LocalModel[]);
    } catch (err) {
      console.error('Failed to fetch agents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, [refreshKey]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  
  useEffect(() => {
    if (selectedAgent) {
      setEditedSettings({
        name: selectedAgent.name,
        systemPrompt: selectedAgent.systemPrompt || 'You are a helpful AI assistant.',
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
      });
    }
  }, [selectedAgent]);

  const handleCreateAgent = async () => {
    try {
      await agentsService.create(newAgent);
      setCreateDialogOpen(false);
      setNewAgent({ name: '', model: '', systemPrompt: 'You are a helpful AI assistant.' });
      fetchAgents();
    } catch (err) {
      console.error('Failed to create agent', err);
    }
  };

  const handleStatusChange = async (agentId: string, action: 'start' | 'stop' | 'suspend') => {
    try {
      await agentsService.changeStatus(agentId, action);
      fetchAgents();
    } catch (err) {
      console.error(`Failed to ${action} agent`, err);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedAgent) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      tokens: estimateTokens(inputMessage),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const response = `I understand your query about "${inputMessage.slice(0, 40)}...". As ${selectedAgent.name} powered by ${selectedAgent.model}, I'm processing your request. This is a simulated response demonstrating the AI agent interaction.`;
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        tokens: estimateTokens(response),
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSaveSettings = async () => {
    if (!selectedAgent || !editedSettings) return;
    setIsSaving(true);
    try {
      await agentsService.update(selectedAgent.id, {
        name: editedSettings.name,
        systemPrompt: editedSettings.systemPrompt,
      });
      fetchAgents();
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;
    if (!window.confirm(`Are you sure you want to delete "${selectedAgent.name}"?`)) return;
    try {
      await agentsService.delete(selectedAgent.id);
      setSelectedAgent(null);
      fetchAgents();
    } catch (err) {
      console.error('Failed to delete agent', err);
    }
  };

  const totalTokens = messages.reduce((sum, m) => sum + (m.tokens || 0), 0) + 
    (selectedAgent ? estimateTokens(selectedAgent.systemPrompt) : 0);
  const maxTokens = selectedAgent ? getContextWindow(selectedAgent.model) : 4096;
  const tokenPercentage = (totalTokens / maxTokens) * 100;

  const getTokenColor = (p: number) => p < 50 ? '#10b981' : p < 80 ? '#f59e0b' : '#ef4444';

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            <h2>AI Agents</h2>
            <div className={styles.sidebarActions}>
              <button className={styles.iconBtn} onClick={fetchAgents} title="Refresh">
                <RefreshIcon style={{ fontSize: 18 }} />
              </button>
              <button className={`${styles.iconBtn} ${styles.primary}`} onClick={() => setCreateDialogOpen(true)} title="Create Agent">
                <AddIcon style={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.agentList}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className={styles.agentItem} style={{ opacity: 0.5 }}>
                <div className={styles.agentAvatar}><SmartToyIcon /></div>
                <div className={styles.agentInfo}>
                  <div className={styles.agentName}><span>Loading...</span></div>
                </div>
              </div>
            ))
          ) : agents.length === 0 ? (
            <div className={styles.emptyState}>
              <SmartToyIcon />
              <p>No agents yet</p>
              <button className={styles.createAgentBtn} onClick={() => setCreateDialogOpen(true)}>
                <AddIcon style={{ fontSize: 18 }} /> Create Agent
              </button>
            </div>
          ) : (
            agents.map(agent => (
              <div
                key={agent.id}
                className={`${styles.agentItem} ${selectedAgent?.id === agent.id ? styles.active : ''}`}
                onClick={() => setSelectedAgent(agent)}
              >
                <div className={styles.agentAvatar}><SmartToyIcon /></div>
                <div className={styles.agentInfo}>
                  <div className={styles.agentName}>
                    <span>{agent.name}</span>
                    <span className={`${styles.statusDot} ${styles[agent.status]}`} />
                  </div>
                  <div className={styles.agentModel}>
                    <MemoryIcon /> {agent.model}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {selectedAgent ? (
          <>
            {/* Agent Header */}
            <div className={styles.agentHeader}>
              <div className={styles.agentHeaderInfo}>
                <div className={styles.agentAvatar}><SmartToyIcon /></div>
                <div className={styles.agentHeaderDetails}>
                  <h2>{selectedAgent.name}</h2>
                  <div className={styles.agentChips}>
                    <span className={styles.chip}><MemoryIcon /> {selectedAgent.model}</span>
                    <span className={`${styles.chip} ${styles.status} ${selectedAgent.status === 'stopped' ? styles.stopped : ''}`}>
                      {selectedAgent.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.agentActions}>
                {selectedAgent.status !== 'running' ? (
                  <button className={`${styles.actionBtn} ${styles.start}`} onClick={() => handleStatusChange(selectedAgent.id, 'start')}>
                    <PlayArrowIcon style={{ fontSize: 18 }} /> Start
                  </button>
                ) : (
                  <>
                    <button className={styles.actionBtn} onClick={() => handleStatusChange(selectedAgent.id, 'suspend')}>
                      <PauseIcon style={{ fontSize: 18 }} /> Pause
                    </button>
                    <button className={`${styles.actionBtn} ${styles.stop}`} onClick={() => handleStatusChange(selectedAgent.id, 'stop')}>
                      <StopIcon style={{ fontSize: 18 }} /> Stop
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Token Bar */}
            <div className={styles.tokenBar}>
              <div className={styles.tokenHeader}>
                <div className={styles.tokenLabel}><TokenIcon /> Context Window</div>
                <span className={styles.tokenValue} style={{ color: getTokenColor(tokenPercentage) }}>
                  {totalTokens.toLocaleString()} / {maxTokens.toLocaleString()} tokens ({tokenPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className={styles.tokenProgress}>
                <div 
                  className={styles.tokenProgressBar} 
                  style={{ 
                    width: `${Math.min(tokenPercentage, 100)}%`,
                    backgroundPosition: `${100 - tokenPercentage}% 0`,
                  }} 
                />
              </div>
              {tokenPercentage > 80 && (
                <div className={styles.tokenWarning}>
                  <WarningIcon style={{ fontSize: 14 }} /> Context approaching limit. Consider starting a new conversation.
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${activeTab === 'chat' ? styles.active : ''}`} onClick={() => setActiveTab('chat')}>
                <SendIcon /> Chat
              </button>
              <button className={`${styles.tab} ${activeTab === 'context' ? styles.active : ''}`} onClick={() => setActiveTab('context')}>
                <DataUsageIcon /> Context
              </button>
              <button className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`} onClick={() => setActiveTab('settings')}>
                <SettingsIcon /> Settings
              </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === 'chat' && (
                <div className={styles.chatContainer}>
                  <div className={styles.chatMessages}>
                    {messages.length === 0 ? (
                      <div className={styles.chatEmpty}>
                        <div className={styles.chatEmptyIcon}><SmartToyIcon /></div>
                        <h3>Start a conversation with {selectedAgent.name}</h3>
                        <p>{selectedAgent.systemPrompt}</p>
                      </div>
                    ) : (
                      <div className={styles.messageList}>
                        {messages.map((msg, i) => (
                          <div key={i} className={`${styles.messageRow} ${msg.role === 'user' ? styles.user : ''}`}>
                            <div className={`${styles.messageAvatar} ${styles[msg.role]}`}>
                              {msg.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                            </div>
                            <div className={`${styles.messageBubble} ${styles[msg.role]}`}>
                              <div className={styles.messageContent}>{msg.content}</div>
                              <div className={styles.messageMeta}>
                                <span>{msg.timestamp.toLocaleTimeString()}</span>
                                <span>{msg.tokens} tokens</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className={styles.messageRow}>
                            <div className={`${styles.messageAvatar} ${styles.assistant}`}><SmartToyIcon /></div>
                            <div className={`${styles.messageBubble} ${styles.assistant}`}>
                              <div className={styles.typingIndicator}>
                                <span className={styles.typingDot} />
                                <span className={styles.typingDot} />
                                <span className={styles.typingDot} />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </div>
                  <div className={styles.chatInput}>
                    <div className={styles.chatInputRow}>
                      <textarea
                        className={styles.chatInputField}
                        placeholder="Type your message..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                        rows={1}
                      />
                      <button className={styles.sendBtn} onClick={handleSendMessage} disabled={!inputMessage.trim() || isTyping}>
                        <SendIcon />
                      </button>
                    </div>
                    <div className={styles.chatInputHint}>Estimated tokens: {estimateTokens(inputMessage)}</div>
                  </div>
                </div>
              )}

              {activeTab === 'context' && (
                <div className={styles.contextTab}>
                  <div className={styles.contextGrid}>
                    <div className={styles.contextCard}>
                      <div className={styles.contextCardLabel}>Model</div>
                      <div className={styles.contextCardValue}>{selectedAgent.model}</div>
                    </div>
                    <div className={styles.contextCard}>
                      <div className={styles.contextCardLabel}>Max Context</div>
                      <div className={styles.contextCardValue}>{maxTokens.toLocaleString()}</div>
                      <div className={styles.contextCardUnit}>tokens</div>
                    </div>
                    <div className={styles.contextCard}>
                      <div className={styles.contextCardLabel}>Used</div>
                      <div className={styles.contextCardValue} style={{ color: getTokenColor(tokenPercentage) }}>
                        {totalTokens.toLocaleString()}
                      </div>
                      <div className={styles.contextCardUnit}>tokens ({tokenPercentage.toFixed(1)}%)</div>
                    </div>
                  </div>

                  <div className={styles.contextSection}>
                    <h4 className={styles.contextSectionTitle}>System Prompt</h4>
                    <div className={styles.systemPromptBox}>
                      <pre>{selectedAgent.systemPrompt}</pre>
                      <div className={styles.systemPromptMeta}>{estimateTokens(selectedAgent.systemPrompt)} tokens</div>
                    </div>
                  </div>

                  <div className={styles.contextSection}>
                    <h4 className={styles.contextSectionTitle}>Message History ({messages.length} messages)</h4>
                    <div className={styles.messageHistory}>
                      {messages.map((msg, i) => (
                        <div key={i} className={styles.historyItem}>
                          <span className={`${styles.historyRole} ${styles[msg.role]}`}>{msg.role}</span>
                          <span className={styles.historyContent}>{msg.content}</span>
                          <span className={styles.historyTokens}>{msg.tokens} tokens</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && editedSettings && (
                <div className={styles.settingsTab}>
                  {/* Settings Header */}
                  <div className={styles.settingsHeader}>
                    <div className={styles.settingsHeaderInfo}>
                      <SettingsIcon />
                      <div>
                        <h3>Agent Configuration</h3>
                        <p>Customize behavior and parameters</p>
                      </div>
                    </div>
                    <div className={styles.settingsActions}>
                      <button 
                        className={styles.deleteBtn} 
                        onClick={handleDeleteAgent}
                        title="Delete Agent"
                      >
                        <DeleteIcon /> Delete
                      </button>
                      <button 
                        className={styles.saveBtn} 
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                      >
                        <SaveIcon /> {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>

                  {/* Settings Grid */}
                  <div className={styles.settingsGrid}>
                    {/* Basic Info Card */}
                    <div className={styles.settingsCard}>
                      <div className={styles.settingsCardHeader}>
                        <SmartToyIcon />
                        <h4>Basic Information</h4>
                      </div>
                      <div className={styles.settingsCardBody}>
                        <div className={styles.settingsField}>
                          <label>Agent Name</label>
                          <input
                            type="text"
                            value={editedSettings.name}
                            onChange={(e) => setEditedSettings(prev => prev ? {...prev, name: e.target.value} : null)}
                            placeholder="Enter agent name"
                          />
                        </div>
                        <div className={styles.settingsField}>
                          <label>Model</label>
                          <div className={styles.modelDisplay}>
                            <MemoryIcon />
                            <span>{selectedAgent.model}</span>
                            <span className={styles.modelBadge}>Active</span>
                          </div>
                        </div>
                        <div className={styles.settingsField}>
                          <label>Status</label>
                          <div className={`${styles.statusDisplay} ${styles[selectedAgent.status]}`}>
                            <span className={styles.statusIndicator} />
                            <span>{selectedAgent.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Prompt Card */}
                    <div className={styles.settingsCard}>
                      <div className={styles.settingsCardHeader}>
                        <AutoFixHighIcon />
                        <h4>System Prompt</h4>
                      </div>
                      <div className={styles.settingsCardBody}>
                        <div className={styles.settingsField}>
                          <label>Instructions for the AI</label>
                          <textarea
                            value={editedSettings.systemPrompt}
                            onChange={(e) => setEditedSettings(prev => prev ? {...prev, systemPrompt: e.target.value} : null)}
                            placeholder="Define the AI's behavior and personality..."
                            rows={6}
                          />
                          <span className={styles.fieldHint}>
                            {estimateTokens(editedSettings.systemPrompt)} tokens
                          </span>
                        </div>
                      </div>
                    </div>


                    {/* Capabilities Card */}
                    <div className={styles.settingsCard}>
                      <div className={styles.settingsCardHeader}>
                        <SecurityIcon />
                        <h4>Capabilities</h4>
                      </div>
                      <div className={styles.settingsCardBody}>
                        <div className={styles.capabilityList}>
                          {(selectedAgent.capabilities || ['text-generation', 'conversation']).map((cap, i) => (
                            <div key={i} className={styles.capabilityItem}>
                              <span className={styles.capabilityDot} />
                              <span>{cap}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.noAgent}>
            <div className={styles.noAgentIcon}><SmartToyIcon /></div>
            <h2>Select an agent to get started</h2>
            <p>Or create a new agent to begin</p>
            <button className={styles.createAgentBtn} onClick={() => setCreateDialogOpen(true)}>
              <AddIcon style={{ fontSize: 18 }} /> Create Agent
            </button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      {createDialogOpen && (
        <div className={styles.dialog} onClick={() => setCreateDialogOpen(false)}>
          <div className={styles.dialogContent} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <SmartToyIcon />
              <h3>Create New Agent</h3>
            </div>
            <div className={styles.dialogBody}>
              <div className={styles.formGroup}>
                <label>Agent Name</label>
                <input 
                  type="text" 
                  placeholder="My Assistant" 
                  value={newAgent.name}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Model</label>
                <div className={styles.customDropdown} ref={dropdownRef}>
                  <button 
                    type="button"
                    className={`${styles.dropdownTrigger} ${modelDropdownOpen ? styles.open : ''}`}
                    onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  >
                    <span className={styles.dropdownValue}>
                      {newAgent.model ? (
                        <>
                          <MemoryIcon style={{ fontSize: 16 }} />
                          {newAgent.model}
                          <span className={styles.dropdownMeta}>
                            {models.find(m => m.name === newAgent.model)?.details?.parameterSize || 'N/A'}
                          </span>
                        </>
                      ) : (
                        <span className={styles.dropdownPlaceholder}>Select a model</span>
                      )}
                    </span>
                    <span className={`${styles.dropdownArrow} ${modelDropdownOpen ? styles.open : ''}`}>
                      ▼
                    </span>
                  </button>
                  {modelDropdownOpen && (
                    <div className={styles.dropdownMenu}>
                      <div className={styles.dropdownHeader}>
                        <MemoryIcon style={{ fontSize: 14 }} />
                        <span>Available Models</span>
                      </div>
                      <div className={styles.dropdownList}>
                        {models.map(m => (
                          <button
                            key={m.name}
                            type="button"
                            className={`${styles.dropdownItem} ${newAgent.model === m.name ? styles.selected : ''}`}
                            onClick={() => {
                              setNewAgent(prev => ({ ...prev, model: m.name }));
                              setModelDropdownOpen(false);
                            }}
                          >
                            <div className={styles.dropdownItemIcon}>
                              <MemoryIcon style={{ fontSize: 18 }} />
                            </div>
                            <div className={styles.dropdownItemContent}>
                              <span className={styles.dropdownItemName}>{m.name}</span>
                              <span className={styles.dropdownItemSize}>{m.details?.parameterSize || 'N/A'}</span>
                            </div>
                            {newAgent.model === m.name && (
                              <span className={styles.dropdownItemCheck}>✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>System Prompt</label>
                <textarea 
                  placeholder="You are a helpful AI assistant..."
                  value={newAgent.systemPrompt}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
            <div className={styles.dialogFooter}>
              <button className={styles.cancelBtn} onClick={() => setCreateDialogOpen(false)}>Cancel</button>
              <button 
                className={styles.submitBtn} 
                onClick={handleCreateAgent}
                disabled={!newAgent.name || !newAgent.model}
              >
                Create Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

