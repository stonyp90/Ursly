/**
 * Ursly AI Assistant - Premiere Pro UXP Plugin
 * Main entry point that orchestrates the UI and API interactions
 * 
 * Follows Clean Architecture principles:
 * - Presentation Layer: DOM manipulation and event handling
 * - Application Layer: Use case orchestration
 * - Infrastructure Layer: API adapters (UrslyAPI, PremiereAPI)
 */

// Import API modules
const UrslyAPI = require('./lib/ursly-api');
const PremiereAPI = require('./lib/premiere-api');

/**
 * Application Controller
 * Orchestrates the plugin functionality following Clean Architecture
 */
class UrslyPluginController {
  constructor() {
    // Infrastructure layer - adapters
    this.urslyApi = new UrslyAPI();
    this.premiereApi = new PremiereAPI();
    
    // State management
    this.state = {
      isConnected: false,
      currentModel: null,
      isProcessing: false,
      lastError: null,
    };
    
    // Bind methods for event handlers
    this.handleConnect = this.handleConnect.bind(this);
    this.handleGenerateCaptions = this.handleGenerateCaptions.bind(this);
    this.handleAnalyzeScene = this.handleAnalyzeScene.bind(this);
    this.handleSmartCut = this.handleSmartCut.bind(this);
    this.handleChat = this.handleChat.bind(this);
    this.handleSettingsSave = this.handleSettingsSave.bind(this);
  }

  /**
   * Initialize the plugin
   * Entry point called when DOM is ready
   */
  async initialize() {
    try {
      // Initialize Premiere Pro API
      await this.premiereApi.initialize();
      
      // Set up UI event listeners
      this.setupEventListeners();
      
      // Load saved settings
      await this.loadSettings();
      
      // Auto-connect if settings exist
      const endpoint = document.getElementById('apiEndpoint')?.value;
      if (endpoint) {
        await this.handleConnect();
      }
      
      console.log('Ursly AI Plugin initialized successfully');
    } catch (error) {
      console.error('Plugin initialization failed:', error);
      this.showError('Failed to initialize plugin: ' + error.message);
    }
  }

  /**
   * Set up all UI event listeners
   * Presentation layer - handles user interactions
   */
  setupEventListeners() {
    // Connection
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
      connectBtn.addEventListener('click', this.handleConnect);
    }

    // Settings toggle
    const settingsToggle = document.getElementById('settingsToggle');
    if (settingsToggle) {
      settingsToggle.addEventListener('click', () => this.toggleSettings());
    }

    // Save settings
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', this.handleSettingsSave);
    }

    // Action buttons
    const captionsBtn = document.getElementById('generateCaptionsBtn');
    if (captionsBtn) {
      captionsBtn.addEventListener('click', this.handleGenerateCaptions);
    }

    const analyzeBtn = document.getElementById('analyzeSceneBtn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', this.handleAnalyzeScene);
    }

    const smartCutBtn = document.getElementById('smartCutBtn');
    if (smartCutBtn) {
      smartCutBtn.addEventListener('click', this.handleSmartCut);
    }

    // Chat
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', this.handleChat);
    }

    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleChat();
        }
      });
    }

    // Model selector
    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect) {
      modelSelect.addEventListener('change', (e) => {
        this.state.currentModel = e.target.value;
        this.urslyApi.setCurrentModel(e.target.value);
      });
    }
  }

  /**
   * Toggle settings panel visibility
   */
  toggleSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsContent = settingsPanel?.querySelector('.settings-content');
    const arrow = settingsPanel?.querySelector('.settings-arrow');
    
    if (settingsContent) {
      const isExpanded = settingsContent.style.display !== 'none';
      settingsContent.style.display = isExpanded ? 'none' : 'block';
      if (arrow) {
        arrow.textContent = isExpanded ? '▾' : '▴';
      }
    }
  }

  /**
   * Handle connection to Ursly API
   * Application layer - orchestrates connection use case
   */
  async handleConnect() {
    const endpoint = document.getElementById('apiEndpoint')?.value;
    const connectBtn = document.getElementById('connectBtn');
    
    if (!endpoint) {
      this.showError('Please enter an API endpoint');
      return;
    }

    try {
      this.setButtonLoading(connectBtn, true);
      this.urslyApi.setEndpoint(endpoint);
      
      const result = await this.urslyApi.checkConnection();
      
      if (result.connected) {
        this.state.isConnected = true;
        this.updateConnectionStatus(true);
        
        // Load available models
        await this.loadModels();
        
        this.showSuccess('Connected to Ursly API');
      } else {
        throw new Error('Connection check failed');
      }
    } catch (error) {
      this.state.isConnected = false;
      this.updateConnectionStatus(false);
      this.showError('Failed to connect: ' + error.message);
    } finally {
      this.setButtonLoading(connectBtn, false);
    }
  }

  /**
   * Load available models from Ursly API
   */
  async loadModels() {
    try {
      const models = await this.urslyApi.listModels();
      const modelSelect = document.getElementById('modelSelect');
      
      if (modelSelect && models.length > 0) {
        modelSelect.innerHTML = models.map(model => 
          `<option value="${model.name}">${model.name}</option>`
        ).join('');
        
        this.state.currentModel = models[0].name;
        this.urslyApi.setCurrentModel(models[0].name);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      this.showError('Failed to load models');
    }
  }

  /**
   * Handle caption generation
   * Application layer - orchestrates caption generation use case
   */
  async handleGenerateCaptions() {
    if (!this.validateConnection()) return;
    
    const btn = document.getElementById('generateCaptionsBtn');
    
    try {
      this.setButtonLoading(btn, true);
      this.state.isProcessing = true;
      
      // Get current sequence info from Premiere
      const sequenceInfo = await this.premiereApi.getSequenceInfo();
      
      if (!sequenceInfo) {
        throw new Error('No active sequence found. Please open a sequence first.');
      }

      // Get audio transcription context
      const audioTracks = await this.premiereApi.getAudioTracks();
      
      // Create prompt for caption generation
      const prompt = this.buildCaptionPrompt(sequenceInfo, audioTracks);
      
      // Generate captions using local AI
      const response = await this.urslyApi.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 4096,
      });

      // Parse and apply captions
      const captions = this.parseCaptions(response.text);
      await this.premiereApi.addCaptionsToSequence(captions);
      
      this.showSuccess(`Generated ${captions.length} captions`);
      this.addChatMessage('assistant', `Generated ${captions.length} captions for your sequence.`);
      
    } catch (error) {
      this.showError('Caption generation failed: ' + error.message);
      this.addChatMessage('assistant', `Error: ${error.message}`);
    } finally {
      this.setButtonLoading(btn, false);
      this.state.isProcessing = false;
    }
  }

  /**
   * Handle scene analysis
   * Application layer - orchestrates scene analysis use case
   */
  async handleAnalyzeScene() {
    if (!this.validateConnection()) return;
    
    const btn = document.getElementById('analyzeSceneBtn');
    
    try {
      this.setButtonLoading(btn, true);
      this.state.isProcessing = true;
      
      // Get current playhead position and surrounding clips
      const currentTime = await this.premiereApi.getCurrentTime();
      const clips = await this.premiereApi.getClipsAtTime(currentTime);
      
      if (!clips || clips.length === 0) {
        throw new Error('No clips found at current playhead position.');
      }

      // Get clip metadata for analysis context
      const clipInfo = await this.premiereApi.getClipInfo(clips);
      
      // Build analysis prompt
      const prompt = this.buildAnalysisPrompt(clipInfo);
      
      // Analyze using local AI
      const response = await this.urslyApi.generateCompletion(prompt, {
        temperature: 0.5,
        maxTokens: 2048,
      });

      // Display analysis in chat
      this.addChatMessage('assistant', response.text);
      this.showSuccess('Scene analysis complete');
      
    } catch (error) {
      this.showError('Scene analysis failed: ' + error.message);
      this.addChatMessage('assistant', `Error: ${error.message}`);
    } finally {
      this.setButtonLoading(btn, false);
      this.state.isProcessing = false;
    }
  }

  /**
   * Handle smart cut suggestions
   * Application layer - orchestrates smart cut use case
   */
  async handleSmartCut() {
    if (!this.validateConnection()) return;
    
    const btn = document.getElementById('smartCutBtn');
    
    try {
      this.setButtonLoading(btn, true);
      this.state.isProcessing = true;
      
      // Get sequence and marker info
      const sequenceInfo = await this.premiereApi.getSequenceInfo();
      const markers = await this.premiereApi.getMarkers();
      
      if (!sequenceInfo) {
        throw new Error('No active sequence found.');
      }

      // Build smart cut prompt
      const prompt = this.buildSmartCutPrompt(sequenceInfo, markers);
      
      // Get AI suggestions
      const response = await this.urslyApi.generateCompletion(prompt, {
        temperature: 0.4,
        maxTokens: 2048,
      });

      // Parse and display suggestions
      const suggestions = this.parseSmartCutSuggestions(response.text);
      this.displaySmartCutSuggestions(suggestions);
      
      this.showSuccess('Smart cut analysis complete');
      
    } catch (error) {
      this.showError('Smart cut failed: ' + error.message);
      this.addChatMessage('assistant', `Error: ${error.message}`);
    } finally {
      this.setButtonLoading(btn, false);
      this.state.isProcessing = false;
    }
  }

  /**
   * Handle chat message
   * Application layer - orchestrates chat use case
   */
  async handleChat() {
    if (!this.validateConnection()) return;
    
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const message = chatInput?.value?.trim();
    
    if (!message) return;
    
    try {
      // Add user message to chat
      this.addChatMessage('user', message);
      chatInput.value = '';
      
      this.setButtonLoading(sendBtn, true);
      
      // Build context-aware prompt
      const context = await this.buildChatContext();
      const prompt = `${context}\n\nUser: ${message}\n\nAssistant:`;
      
      // Generate response with streaming
      let responseText = '';
      const messageEl = this.addChatMessage('assistant', '...');
      
      await this.urslyApi.streamCompletion(prompt, {
        temperature: 0.7,
        maxTokens: 1024,
      }, (chunk) => {
        responseText += chunk;
        if (messageEl) {
          messageEl.querySelector('.message-content').textContent = responseText;
        }
      });
      
    } catch (error) {
      this.addChatMessage('assistant', `Error: ${error.message}`);
    } finally {
      this.setButtonLoading(sendBtn, false);
    }
  }

  /**
   * Handle settings save
   */
  async handleSettingsSave() {
    const endpoint = document.getElementById('apiEndpoint')?.value;
    const model = document.getElementById('modelSelect')?.value;
    
    const settings = { endpoint, model };
    
    try {
      // UXP storage API
      const { storage } = require('uxp');
      const settingsFile = await storage.localFileSystem.getDataFolder();
      const file = await settingsFile.createFile('ursly-settings.json', { overwrite: true });
      await file.write(JSON.stringify(settings, null, 2));
      
      this.showSuccess('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Fallback to localStorage-like storage
      localStorage.setItem('ursly-settings', JSON.stringify(settings));
      this.showSuccess('Settings saved');
    }
  }

  /**
   * Load saved settings
   */
  async loadSettings() {
    try {
      const { storage } = require('uxp');
      const settingsFile = await storage.localFileSystem.getDataFolder();
      const file = await settingsFile.getEntry('ursly-settings.json');
      
      if (file) {
        const content = await file.read();
        const settings = JSON.parse(content);
        
        const endpointInput = document.getElementById('apiEndpoint');
        if (endpointInput && settings.endpoint) {
          endpointInput.value = settings.endpoint;
        }
        
        if (settings.model) {
          this.state.currentModel = settings.model;
        }
      }
    } catch (error) {
      // Try localStorage fallback
      try {
        const settings = JSON.parse(localStorage.getItem('ursly-settings') || '{}');
        const endpointInput = document.getElementById('apiEndpoint');
        if (endpointInput && settings.endpoint) {
          endpointInput.value = settings.endpoint;
        }
      } catch (e) {
        console.log('No saved settings found');
      }
    }
  }

  // ============================================
  // Prompt Builders (Application Layer)
  // ============================================

  buildCaptionPrompt(sequenceInfo, audioTracks) {
    return `You are a video caption generator. Generate accurate, well-timed captions for this video sequence.

Sequence Information:
- Name: ${sequenceInfo.name}
- Duration: ${sequenceInfo.duration}
- Frame Rate: ${sequenceInfo.frameRate}

Audio Tracks:
${JSON.stringify(audioTracks, null, 2)}

Instructions:
1. Generate captions in SRT format
2. Keep captions under 42 characters per line
3. Maximum 2 lines per caption
4. Duration should be between 1-7 seconds
5. Include speaker identification if multiple speakers

Generate captions:`;
  }

  buildAnalysisPrompt(clipInfo) {
    return `You are a video editor assistant. Analyze this scene and provide editing suggestions.

Clip Information:
${JSON.stringify(clipInfo, null, 2)}

Provide:
1. Scene description
2. Mood and tone
3. Technical observations (exposure, color, framing)
4. Editing suggestions
5. Potential b-roll opportunities`;
  }

  buildSmartCutPrompt(sequenceInfo, markers) {
    return `You are a video editing assistant. Analyze this sequence and suggest optimal cut points.

Sequence: ${sequenceInfo.name}
Duration: ${sequenceInfo.duration}
Existing Markers: ${JSON.stringify(markers, null, 2)}

Suggest:
1. Recommended cut points with timecodes
2. Transitions between cuts
3. Pacing recommendations
4. Sections that could be trimmed
5. Areas needing additional footage`;
  }

  async buildChatContext() {
    let context = 'You are an AI assistant integrated into Adobe Premiere Pro via the Ursly AI plugin. ';
    context += 'You help video editors with tasks like caption generation, scene analysis, and editing suggestions. ';
    
    try {
      const sequenceInfo = await this.premiereApi.getSequenceInfo();
      if (sequenceInfo) {
        context += `\nCurrent Sequence: ${sequenceInfo.name} (${sequenceInfo.duration})`;
      }
    } catch (e) {
      // No sequence context available
    }
    
    return context;
  }

  // ============================================
  // Response Parsers (Application Layer)
  // ============================================

  parseCaptions(responseText) {
    const captions = [];
    const srtPattern = /(\d+)\s+(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})\s+(.+?)(?=\d+\s+\d{2}:|$)/gs;
    
    let match;
    while ((match = srtPattern.exec(responseText)) !== null) {
      captions.push({
        index: parseInt(match[1]),
        startTime: match[2],
        endTime: match[3],
        text: match[4].trim(),
      });
    }
    
    return captions;
  }

  parseSmartCutSuggestions(responseText) {
    // Extract suggested cut points and transitions
    const suggestions = {
      cuts: [],
      transitions: [],
      recommendations: [],
    };
    
    // Simple parsing - could be enhanced with structured output
    const lines = responseText.split('\n');
    lines.forEach(line => {
      if (line.includes('cut') || line.includes('Cut')) {
        suggestions.cuts.push(line.trim());
      } else if (line.includes('transition') || line.includes('Transition')) {
        suggestions.transitions.push(line.trim());
      } else if (line.trim()) {
        suggestions.recommendations.push(line.trim());
      }
    });
    
    return suggestions;
  }

  displaySmartCutSuggestions(suggestions) {
    let message = '**Smart Cut Suggestions:**\n\n';
    
    if (suggestions.cuts.length > 0) {
      message += '**Cut Points:**\n';
      suggestions.cuts.forEach(cut => {
        message += `- ${cut}\n`;
      });
      message += '\n';
    }
    
    if (suggestions.transitions.length > 0) {
      message += '**Transitions:**\n';
      suggestions.transitions.forEach(t => {
        message += `- ${t}\n`;
      });
      message += '\n';
    }
    
    if (suggestions.recommendations.length > 0) {
      message += '**Recommendations:**\n';
      suggestions.recommendations.slice(0, 5).forEach(r => {
        message += `- ${r}\n`;
      });
    }
    
    this.addChatMessage('assistant', message);
  }

  // ============================================
  // UI Helpers (Presentation Layer)
  // ============================================

  validateConnection() {
    if (!this.state.isConnected) {
      this.showError('Please connect to Ursly API first');
      return false;
    }
    if (this.state.isProcessing) {
      this.showError('Please wait for current operation to complete');
      return false;
    }
    return true;
  }

  updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (statusDot) {
      statusDot.classList.remove('connected', 'disconnected');
      statusDot.classList.add(connected ? 'connected' : 'disconnected');
    }
    
    if (statusText) {
      statusText.textContent = connected ? 'Connected' : 'Disconnected';
    }
  }

  setButtonLoading(button, loading) {
    if (!button) return;
    
    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.innerHTML = '<span class="spinner"></span>';
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  addChatMessage(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return null;
    
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${role}-message`;
    messageEl.innerHTML = `
      <div class="message-avatar">${role === 'user' ? 'U' : 'AI'}</div>
      <div class="message-content">${this.escapeHtml(content)}</div>
    `;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageEl;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
    this.state.lastError = message;
  }

  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
      notification.style.display = 'none';
    }, 4000);
  }
}

// ============================================
// Plugin Initialization
// ============================================

// Create singleton instance
const pluginController = new UrslyPluginController();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  pluginController.initialize();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UrslyPluginController };
}


