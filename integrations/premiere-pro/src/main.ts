/**
 * Ursly AI Assistant - Premiere Pro UXP Plugin
 * Main entry point that orchestrates the UI and API interactions
 *
 * Follows Clean Architecture principles:
 * - Presentation Layer: DOM manipulation and event handling
 * - Application Layer: Use case orchestration
 * - Infrastructure Layer: API adapters (UrslyAPI, PremiereAPI)
 */

import { UrslyAPI } from './lib/ursly-api';
import { PremiereAPI } from './lib/premiere-api';
import {
  PluginState,
  PluginStateSchema,
  PluginSettings,
  PluginSettingsSchema,
  Caption,
  SmartCutSuggestion,
} from './schemas';
import type { SequenceInfo, AudioTrackInfo, MarkerInfo } from './types';

/**
 * Application Controller
 * Orchestrates the plugin functionality following Clean Architecture
 */
export class UrslyPluginController {
  // Infrastructure layer - adapters
  private readonly urslyApi: UrslyAPI;
  private readonly premiereApi: PremiereAPI;

  // State management
  private state: PluginState;

  constructor() {
    this.urslyApi = new UrslyAPI();
    this.premiereApi = new PremiereAPI();

    this.state = PluginStateSchema.parse({
      isConnected: false,
      currentModel: null,
      isProcessing: false,
      lastError: null,
    });

    // Bind methods for event handlers
    this.handleConnect = this.handleConnect.bind(this);
    this.handleGenerateCaptions = this.handleGenerateCaptions.bind(this);
    this.handleAnalyzeScene = this.handleAnalyzeScene.bind(this);
    this.handleSmartCut = this.handleSmartCut.bind(this);
    this.handleChat = this.handleChat.bind(this);
    this.handleSettingsSave = this.handleSettingsSave.bind(this);
  }

  /**
   * Get current plugin state
   */
  getState(): PluginState {
    return { ...this.state };
  }

  /**
   * Initialize the plugin
   */
  async initialize(): Promise<void> {
    try {
      await this.premiereApi.initialize();
      this.setupEventListeners();
      await this.loadSettings();

      const endpoint = this.getElementValue('apiEndpoint');
      if (endpoint) {
        await this.handleConnect();
      }

      console.log('Ursly AI Plugin initialized successfully');
    } catch (error) {
      console.error('Plugin initialization failed:', error);
      this.showError(
        `Failed to initialize plugin: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Set up all UI event listeners
   */
  private setupEventListeners(): void {
    this.addClickListener('connectBtn', this.handleConnect);
    this.addClickListener('settingsToggle', () => this.toggleSettings());
    this.addClickListener('saveSettingsBtn', this.handleSettingsSave);
    this.addClickListener('generateCaptionsBtn', this.handleGenerateCaptions);
    this.addClickListener('analyzeSceneBtn', this.handleAnalyzeScene);
    this.addClickListener('smartCutBtn', this.handleSmartCut);
    this.addClickListener('sendBtn', this.handleChat);

    const chatInput = document.getElementById('chatInput') as HTMLTextAreaElement | null;
    chatInput?.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void this.handleChat();
      }
    });

    const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement | null;
    modelSelect?.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLSelectElement;
      this.state.currentModel = target.value;
      this.urslyApi.setCurrentModel(target.value);
    });
  }

  /**
   * Helper to add click listeners
   */
  private addClickListener(elementId: string, handler: () => void | Promise<void>): void {
    const element = document.getElementById(elementId);
    element?.addEventListener('click', () => void handler());
  }

  /**
   * Helper to get element value
   */
  private getElementValue(elementId: string): string {
    const element = document.getElementById(elementId) as HTMLInputElement | null;
    return element?.value ?? '';
  }

  /**
   * Toggle settings panel visibility
   */
  private toggleSettings(): void {
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsContent = settingsPanel?.querySelector('.settings-content') as HTMLElement | null;
    const arrow = settingsPanel?.querySelector('.settings-arrow') as HTMLElement | null;

    if (settingsContent) {
      const isExpanded = settingsContent.style.display !== 'none';
      settingsContent.style.display = isExpanded ? 'none' : 'block';
      if (arrow) {
        arrow.textContent = isExpanded ? '\u25BE' : '\u25B4';
      }
    }
  }

  /**
   * Handle connection to Ursly API
   */
  async handleConnect(): Promise<void> {
    const endpoint = this.getElementValue('apiEndpoint');
    const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement | null;

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
        await this.loadModels();
        this.showSuccess('Connected to Ursly API');
      } else {
        throw new Error('Connection check failed');
      }
    } catch (error) {
      this.state.isConnected = false;
      this.updateConnectionStatus(false);
      this.showError(
        `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.setButtonLoading(connectBtn, false);
    }
  }

  /**
   * Load available models from Ursly API
   */
  private async loadModels(): Promise<void> {
    try {
      const models = await this.urslyApi.listModels();
      const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement | null;

      if (modelSelect && models.length > 0) {
        modelSelect.innerHTML = models
          .map((model) => `<option value="${model.name}">${model.name}</option>`)
          .join('');

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
   */
  async handleGenerateCaptions(): Promise<void> {
    if (!this.validateConnection()) return;

    const btn = document.getElementById('generateCaptionsBtn') as HTMLButtonElement | null;

    try {
      this.setButtonLoading(btn, true);
      this.state.isProcessing = true;

      const sequenceInfo = await this.premiereApi.getSequenceInfo();

      if (!sequenceInfo) {
        throw new Error('No active sequence found. Please open a sequence first.');
      }

      const audioTracks = await this.premiereApi.getAudioTracks();
      const prompt = this.buildCaptionPrompt(sequenceInfo, audioTracks);

      const response = await this.urslyApi.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 4096,
      });

      const captions = this.parseCaptions(response.text);
      await this.premiereApi.addCaptionsToSequence(captions);

      this.showSuccess(`Generated ${captions.length} captions`);
      this.addChatMessage('assistant', `Generated ${captions.length} captions for your sequence.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.showError(`Caption generation failed: ${message}`);
      this.addChatMessage('assistant', `Error: ${message}`);
    } finally {
      this.setButtonLoading(btn, false);
      this.state.isProcessing = false;
    }
  }

  /**
   * Handle scene analysis
   */
  async handleAnalyzeScene(): Promise<void> {
    if (!this.validateConnection()) return;

    const btn = document.getElementById('analyzeSceneBtn') as HTMLButtonElement | null;

    try {
      this.setButtonLoading(btn, true);
      this.state.isProcessing = true;

      const currentTime = await this.premiereApi.getCurrentTime();
      const clips = await this.premiereApi.getClipsAtTime(currentTime ?? 0);

      if (!clips || clips.length === 0) {
        throw new Error('No clips found at current playhead position.');
      }

      const clipInfo = await this.premiereApi.getClipInfo(clips);
      const prompt = this.buildAnalysisPrompt(clipInfo);

      const response = await this.urslyApi.generateCompletion(prompt, {
        temperature: 0.5,
        maxTokens: 2048,
      });

      this.addChatMessage('assistant', response.text);
      this.showSuccess('Scene analysis complete');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.showError(`Scene analysis failed: ${message}`);
      this.addChatMessage('assistant', `Error: ${message}`);
    } finally {
      this.setButtonLoading(btn, false);
      this.state.isProcessing = false;
    }
  }

  /**
   * Handle smart cut suggestions
   */
  async handleSmartCut(): Promise<void> {
    if (!this.validateConnection()) return;

    const btn = document.getElementById('smartCutBtn') as HTMLButtonElement | null;

    try {
      this.setButtonLoading(btn, true);
      this.state.isProcessing = true;

      const sequenceInfo = await this.premiereApi.getSequenceInfo();
      const markers = await this.premiereApi.getMarkers();

      if (!sequenceInfo) {
        throw new Error('No active sequence found.');
      }

      const prompt = this.buildSmartCutPrompt(sequenceInfo, markers);

      const response = await this.urslyApi.generateCompletion(prompt, {
        temperature: 0.4,
        maxTokens: 2048,
      });

      const suggestions = this.parseSmartCutSuggestions(response.text);
      this.displaySmartCutSuggestions(suggestions);

      this.showSuccess('Smart cut analysis complete');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.showError(`Smart cut failed: ${message}`);
      this.addChatMessage('assistant', `Error: ${message}`);
    } finally {
      this.setButtonLoading(btn, false);
      this.state.isProcessing = false;
    }
  }

  /**
   * Handle chat message
   */
  async handleChat(): Promise<void> {
    if (!this.validateConnection()) return;

    const chatInput = document.getElementById('chatInput') as HTMLTextAreaElement | null;
    const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement | null;
    const message = chatInput?.value?.trim();

    if (!message) return;

    try {
      this.addChatMessage('user', message);
      if (chatInput) chatInput.value = '';

      this.setButtonLoading(sendBtn, true);

      const context = await this.buildChatContext();
      const prompt = `${context}\n\nUser: ${message}\n\nAssistant:`;

      let responseText = '';
      const messageEl = this.addChatMessage('assistant', '...');

      await this.urslyApi.streamCompletion(
        prompt,
        { temperature: 0.7, maxTokens: 1024 },
        (chunk: string) => {
          responseText += chunk;
          const contentEl = messageEl?.querySelector('.message-content');
          if (contentEl) {
            contentEl.textContent = responseText;
          }
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.addChatMessage('assistant', `Error: ${message}`);
    } finally {
      this.setButtonLoading(sendBtn, false);
    }
  }

  /**
   * Handle settings save
   */
  async handleSettingsSave(): Promise<void> {
    const endpoint = this.getElementValue('apiEndpoint');
    const model = this.getElementValue('modelSelect');

    const settings = PluginSettingsSchema.parse({ endpoint, model });

    try {
      // UXP storage API
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { storage } = require('uxp') as { storage: { localFileSystem: { getDataFolder: () => Promise<{ createFile: (name: string, opts: { overwrite: boolean }) => Promise<{ write: (content: string) => Promise<void> }> }> } } };
      const settingsFile = await storage.localFileSystem.getDataFolder();
      const file = await settingsFile.createFile('ursly-settings.json', { overwrite: true });
      await file.write(JSON.stringify(settings, null, 2));

      this.showSuccess('Settings saved');
    } catch {
      localStorage.setItem('ursly-settings', JSON.stringify(settings));
      this.showSuccess('Settings saved');
    }
  }

  /**
   * Load saved settings
   */
  private async loadSettings(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { storage } = require('uxp') as { storage: { localFileSystem: { getDataFolder: () => Promise<{ getEntry: (name: string) => Promise<{ read: () => Promise<string> } | null> }> } } };
      const settingsFolder = await storage.localFileSystem.getDataFolder();
      const file = await settingsFolder.getEntry('ursly-settings.json');

      if (file) {
        const content = await file.read();
        const settings = PluginSettingsSchema.safeParse(JSON.parse(content));

        if (settings.success) {
          const endpointInput = document.getElementById('apiEndpoint') as HTMLInputElement | null;
          if (endpointInput && settings.data.endpoint) {
            endpointInput.value = settings.data.endpoint;
          }

          if (settings.data.model) {
            this.state.currentModel = settings.data.model;
          }
        }
      }
    } catch {
      try {
        const settingsStr = localStorage.getItem('ursly-settings');
        if (settingsStr) {
          const settings = PluginSettingsSchema.safeParse(JSON.parse(settingsStr));
          if (settings.success) {
            const endpointInput = document.getElementById('apiEndpoint') as HTMLInputElement | null;
            if (endpointInput && settings.data.endpoint) {
              endpointInput.value = settings.data.endpoint;
            }
          }
        }
      } catch {
        console.log('No saved settings found');
      }
    }
  }

  // ============================================
  // Prompt Builders (Application Layer)
  // ============================================

  private buildCaptionPrompt(sequenceInfo: SequenceInfo, audioTracks: AudioTrackInfo[]): string {
    return `You are a video caption generator. Generate accurate, well-timed captions for this video sequence.

Sequence Information:
- Name: ${sequenceInfo.name}
- Duration: ${sequenceInfo.duration}
- Frame Rate: ${JSON.stringify(sequenceInfo.frameRate)}

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

  private buildAnalysisPrompt(clipInfo: { name: string; inPoint: number; outPoint: number; mediaPath: string | null }[]): string {
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

  private buildSmartCutPrompt(sequenceInfo: SequenceInfo, markers: MarkerInfo[]): string {
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

  private async buildChatContext(): Promise<string> {
    let context =
      'You are an AI assistant integrated into Adobe Premiere Pro via the Ursly AI plugin. ';
    context +=
      'You help video editors with tasks like caption generation, scene analysis, and editing suggestions. ';

    try {
      const sequenceInfo = await this.premiereApi.getSequenceInfo();
      if (sequenceInfo) {
        context += `\nCurrent Sequence: ${sequenceInfo.name} (${sequenceInfo.duration})`;
      }
    } catch {
      // No sequence context available
    }

    return context;
  }

  // ============================================
  // Response Parsers (Application Layer)
  // ============================================

  parseCaptions(responseText: string): Caption[] {
    const captions: Caption[] = [];
    const srtPattern =
      /(\d+)\s+(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})\s+(.+?)(?=\d+\s+\d{2}:|$)/gs;

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

  parseSmartCutSuggestions(responseText: string): SmartCutSuggestion {
    const suggestions: SmartCutSuggestion = {
      cuts: [],
      transitions: [],
      recommendations: [],
    };

    const lines = responseText.split('\n');
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.toLowerCase().includes('cut')) {
        suggestions.cuts.push(trimmedLine);
      } else if (trimmedLine.toLowerCase().includes('transition')) {
        suggestions.transitions.push(trimmedLine);
      } else if (trimmedLine) {
        suggestions.recommendations.push(trimmedLine);
      }
    });

    return suggestions;
  }

  private displaySmartCutSuggestions(suggestions: SmartCutSuggestion): void {
    let message = '**Smart Cut Suggestions:**\n\n';

    if (suggestions.cuts.length > 0) {
      message += '**Cut Points:**\n';
      suggestions.cuts.forEach((cut) => {
        message += `- ${cut}\n`;
      });
      message += '\n';
    }

    if (suggestions.transitions.length > 0) {
      message += '**Transitions:**\n';
      suggestions.transitions.forEach((t) => {
        message += `- ${t}\n`;
      });
      message += '\n';
    }

    if (suggestions.recommendations.length > 0) {
      message += '**Recommendations:**\n';
      suggestions.recommendations.slice(0, 5).forEach((r) => {
        message += `- ${r}\n`;
      });
    }

    this.addChatMessage('assistant', message);
  }

  // ============================================
  // UI Helpers (Presentation Layer)
  // ============================================

  private validateConnection(): boolean {
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

  private updateConnectionStatus(connected: boolean): void {
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

  private setButtonLoading(button: HTMLButtonElement | null, loading: boolean): void {
    if (!button) return;

    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent ?? '';
      button.innerHTML = '<span class="spinner"></span>';
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText ?? button.textContent;
    }
  }

  addChatMessage(role: 'user' | 'assistant', content: string): HTMLElement | null {
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

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  showError(message: string): void {
    this.showNotification(message, 'error');
    this.state.lastError = message;
  }

  private showNotification(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
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
  void pluginController.initialize();
});

// Export for testing and external use
export { pluginController };
export default UrslyPluginController;


