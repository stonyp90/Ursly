/**
 * Unit Tests for Ursly Plugin Controller
 * Following agents.md testing best practices
 */

// Mock dependencies
jest.mock('../lib/ursly-api', () => {
  return jest.fn().mockImplementation(() => ({
    setEndpoint: jest.fn(),
    checkConnection: jest.fn().mockResolvedValue({ connected: true }),
    listModels: jest.fn().mockResolvedValue([{ name: 'llama3' }]),
    setCurrentModel: jest.fn(),
    generateCompletion: jest.fn().mockResolvedValue({ text: 'Response' }),
    streamCompletion: jest.fn(),
  }));
});

jest.mock('../lib/premiere-api', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    getSequenceInfo: jest.fn().mockResolvedValue({ name: 'Test', duration: '00:01:00' }),
    getAudioTracks: jest.fn().mockResolvedValue([]),
    getCurrentTime: jest.fn().mockResolvedValue({ seconds: 30 }),
    getClipsAtTime: jest.fn().mockResolvedValue([{ name: 'Clip1' }]),
    getClipInfo: jest.fn().mockResolvedValue([]),
    getMarkers: jest.fn().mockResolvedValue([]),
    addCaptionsToSequence: jest.fn().mockResolvedValue(),
  }));
});

// Mock DOM
const mockDOM = () => {
  document.body.innerHTML = `
    <div id="connectionStatus">
      <span class="status-dot disconnected"></span>
      <span class="status-text">Disconnected</span>
    </div>
    <input id="apiEndpoint" value="http://localhost:3000" />
    <button id="connectBtn">Connect</button>
    <select id="modelSelect"></select>
    <button id="generateCaptionsBtn">Generate Captions</button>
    <button id="analyzeSceneBtn">Analyze Scene</button>
    <button id="smartCutBtn">Smart Cut</button>
    <button id="sendBtn">Send</button>
    <textarea id="chatInput"></textarea>
    <div id="chatMessages"></div>
    <div id="notification"></div>
    <div id="settingsPanel">
      <div class="settings-content" style="display: none;"></div>
      <span class="settings-arrow">▾</span>
    </div>
    <button id="settingsToggle">Settings</button>
    <button id="saveSettingsBtn">Save</button>
  `;
};

// Mock UXP storage
jest.mock(
  'uxp',
  () => ({
    storage: {
      localFileSystem: {
        getDataFolder: jest.fn().mockResolvedValue({
          createFile: jest.fn().mockResolvedValue({
            write: jest.fn().mockResolvedValue(),
          }),
          getEntry: jest.fn().mockResolvedValue(null),
        }),
      },
    },
  }),
  { virtual: true }
);

describe('UrslyPluginController', () => {
  let UrslyPluginController;
  let controller;

  beforeEach(() => {
    mockDOM();
    jest.clearAllMocks();
    
    // Clear require cache and re-import
    jest.resetModules();
    const mainModule = require('../main');
    UrslyPluginController = mainModule.UrslyPluginController;
    controller = new UrslyPluginController();
  });

  describe('constructor', () => {
    it('should initialize with correct default state', () => {
      expect(controller.state.isConnected).toBe(false);
      expect(controller.state.currentModel).toBeNull();
      expect(controller.state.isProcessing).toBe(false);
      expect(controller.state.lastError).toBeNull();
    });

    it('should create API instances', () => {
      expect(controller.urslyApi).toBeDefined();
      expect(controller.premiereApi).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should initialize Premiere Pro API', async () => {
      await controller.initialize();

      expect(controller.premiereApi.initialize).toHaveBeenCalled();
    });

    it('should set up event listeners', async () => {
      const setupSpy = jest.spyOn(controller, 'setupEventListeners');

      await controller.initialize();

      expect(setupSpy).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      controller.premiereApi.initialize.mockRejectedValueOnce(new Error('Init failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await controller.initialize();

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('handleConnect', () => {
    beforeEach(async () => {
      await controller.initialize();
    });

    it('should connect successfully with valid endpoint', async () => {
      await controller.handleConnect();

      expect(controller.urslyApi.setEndpoint).toHaveBeenCalledWith('http://localhost:3000');
      expect(controller.urslyApi.checkConnection).toHaveBeenCalled();
      expect(controller.state.isConnected).toBe(true);
    });

    it('should load models after successful connection', async () => {
      await controller.handleConnect();

      expect(controller.urslyApi.listModels).toHaveBeenCalled();
    });

    it('should update connection status in UI', async () => {
      await controller.handleConnect();

      const statusDot = document.querySelector('.status-dot');
      expect(statusDot.classList.contains('connected')).toBe(true);
    });

    it('should show error when endpoint is empty', async () => {
      document.getElementById('apiEndpoint').value = '';
      const showErrorSpy = jest.spyOn(controller, 'showError');

      await controller.handleConnect();

      expect(showErrorSpy).toHaveBeenCalledWith('Please enter an API endpoint');
    });

    it('should handle connection failure', async () => {
      controller.urslyApi.checkConnection.mockRejectedValueOnce(new Error('Connection failed'));

      await controller.handleConnect();

      expect(controller.state.isConnected).toBe(false);
    });
  });

  describe('handleGenerateCaptions', () => {
    beforeEach(async () => {
      await controller.initialize();
      controller.state.isConnected = true;
    });

    it('should generate captions when connected', async () => {
      controller.urslyApi.generateCompletion.mockResolvedValueOnce({
        text: '1\n00:00:01,000 --> 00:00:05,000\nHello World',
      });

      await controller.handleGenerateCaptions();

      expect(controller.urslyApi.generateCompletion).toHaveBeenCalled();
      expect(controller.premiereApi.addCaptionsToSequence).toHaveBeenCalled();
    });

    it('should not proceed when not connected', async () => {
      controller.state.isConnected = false;
      const showErrorSpy = jest.spyOn(controller, 'showError');

      await controller.handleGenerateCaptions();

      expect(showErrorSpy).toHaveBeenCalledWith('Please connect to Ursly API first');
      expect(controller.urslyApi.generateCompletion).not.toHaveBeenCalled();
    });

    it('should not proceed when already processing', async () => {
      controller.state.isProcessing = true;

      await controller.handleGenerateCaptions();

      expect(controller.urslyApi.generateCompletion).not.toHaveBeenCalled();
    });

    it('should handle errors during generation', async () => {
      controller.urslyApi.generateCompletion.mockRejectedValueOnce(new Error('Generation failed'));
      const showErrorSpy = jest.spyOn(controller, 'showError');

      await controller.handleGenerateCaptions();

      expect(showErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Caption generation failed'));
    });
  });

  describe('handleAnalyzeScene', () => {
    beforeEach(async () => {
      await controller.initialize();
      controller.state.isConnected = true;
    });

    it('should analyze current scene', async () => {
      await controller.handleAnalyzeScene();

      expect(controller.premiereApi.getCurrentTime).toHaveBeenCalled();
      expect(controller.premiereApi.getClipsAtTime).toHaveBeenCalled();
      expect(controller.urslyApi.generateCompletion).toHaveBeenCalled();
    });

    it('should add analysis to chat', async () => {
      const addMessageSpy = jest.spyOn(controller, 'addChatMessage');

      await controller.handleAnalyzeScene();

      expect(addMessageSpy).toHaveBeenCalledWith('assistant', expect.any(String));
    });

    it('should show error when no clips at playhead', async () => {
      controller.premiereApi.getClipsAtTime.mockResolvedValueOnce([]);
      const showErrorSpy = jest.spyOn(controller, 'showError');

      await controller.handleAnalyzeScene();

      expect(showErrorSpy).toHaveBeenCalledWith(expect.stringContaining('No clips found'));
    });
  });

  describe('handleSmartCut', () => {
    beforeEach(async () => {
      await controller.initialize();
      controller.state.isConnected = true;
    });

    it('should provide smart cut suggestions', async () => {
      await controller.handleSmartCut();

      expect(controller.premiereApi.getSequenceInfo).toHaveBeenCalled();
      expect(controller.premiereApi.getMarkers).toHaveBeenCalled();
      expect(controller.urslyApi.generateCompletion).toHaveBeenCalled();
    });

    it('should display suggestions in chat', async () => {
      controller.urslyApi.generateCompletion.mockResolvedValueOnce({
        text: 'Cut at 00:00:30\nTransition: Cross dissolve\nRecommendation: Trim intro',
      });
      const displaySpy = jest.spyOn(controller, 'displaySmartCutSuggestions');

      await controller.handleSmartCut();

      expect(displaySpy).toHaveBeenCalled();
    });
  });

  describe('handleChat', () => {
    beforeEach(async () => {
      await controller.initialize();
      controller.state.isConnected = true;
    });

    it('should send message and receive response', async () => {
      document.getElementById('chatInput').value = 'Hello AI';
      controller.urslyApi.streamCompletion.mockImplementation((prompt, opts, callback) => {
        callback('Hello');
        callback(' World');
        return Promise.resolve();
      });

      await controller.handleChat();

      expect(controller.urslyApi.streamCompletion).toHaveBeenCalled();
    });

    it('should not send empty messages', async () => {
      document.getElementById('chatInput').value = '   ';

      await controller.handleChat();

      expect(controller.urslyApi.streamCompletion).not.toHaveBeenCalled();
    });

    it('should clear input after sending', async () => {
      document.getElementById('chatInput').value = 'Test message';
      controller.urslyApi.streamCompletion.mockResolvedValue();

      await controller.handleChat();

      expect(document.getElementById('chatInput').value).toBe('');
    });
  });

  describe('parseCaptions', () => {
    it('should parse SRT format correctly', () => {
      const srtText = `1
00:00:01,000 --> 00:00:05,000
Hello World

2
00:00:06,000 --> 00:00:10,000
Second caption`;

      const captions = controller.parseCaptions(srtText);

      expect(captions).toHaveLength(2);
      expect(captions[0].text).toBe('Hello World');
      expect(captions[1].text).toBe('Second caption');
    });

    it('should return empty array for invalid format', () => {
      const invalidText = 'This is not SRT format';

      const captions = controller.parseCaptions(invalidText);

      expect(captions).toEqual([]);
    });
  });

  describe('parseSmartCutSuggestions', () => {
    it('should categorize suggestions correctly', () => {
      const text = `Cut at 00:00:30
Transition: Cross dissolve
Recommendation: Trim intro`;

      const suggestions = controller.parseSmartCutSuggestions(text);

      expect(suggestions.cuts.length).toBeGreaterThan(0);
      expect(suggestions.transitions.length).toBeGreaterThan(0);
    });
  });

  describe('UI Helpers', () => {
    beforeEach(async () => {
      await controller.initialize();
    });

    describe('validateConnection', () => {
      it('should return false when not connected', () => {
        controller.state.isConnected = false;

        expect(controller.validateConnection()).toBe(false);
      });

      it('should return false when processing', () => {
        controller.state.isConnected = true;
        controller.state.isProcessing = true;

        expect(controller.validateConnection()).toBe(false);
      });

      it('should return true when connected and not processing', () => {
        controller.state.isConnected = true;
        controller.state.isProcessing = false;

        expect(controller.validateConnection()).toBe(true);
      });
    });

    describe('updateConnectionStatus', () => {
      it('should update status dot class', () => {
        controller.updateConnectionStatus(true);

        const statusDot = document.querySelector('.status-dot');
        expect(statusDot.classList.contains('connected')).toBe(true);
        expect(statusDot.classList.contains('disconnected')).toBe(false);
      });

      it('should update status text', () => {
        controller.updateConnectionStatus(true);

        const statusText = document.querySelector('.status-text');
        expect(statusText.textContent).toBe('Connected');
      });
    });

    describe('addChatMessage', () => {
      it('should add message to chat container', () => {
        controller.addChatMessage('user', 'Hello');

        const messages = document.querySelectorAll('.chat-message');
        expect(messages.length).toBe(1);
        expect(messages[0].classList.contains('user-message')).toBe(true);
      });

      it('should escape HTML in messages', () => {
        controller.addChatMessage('user', '<script>alert("xss")</script>');

        const content = document.querySelector('.message-content');
        expect(content.innerHTML).not.toContain('<script>');
      });
    });

    describe('showNotification', () => {
      it('should display notification with correct type', () => {
        controller.showNotification('Test message', 'success');

        const notification = document.getElementById('notification');
        expect(notification.textContent).toBe('Test message');
        expect(notification.classList.contains('success')).toBe(true);
      });

      it('should hide notification after timeout', async () => {
        jest.useFakeTimers();
        controller.showNotification('Test', 'info');

        jest.advanceTimersByTime(5000);

        const notification = document.getElementById('notification');
        expect(notification.style.display).toBe('none');
        jest.useRealTimers();
      });
    });

    describe('setButtonLoading', () => {
      it('should disable button and show spinner', () => {
        const btn = document.getElementById('connectBtn');

        controller.setButtonLoading(btn, true);

        expect(btn.disabled).toBe(true);
        expect(btn.innerHTML).toContain('spinner');
      });

      it('should restore button state when loading ends', () => {
        const btn = document.getElementById('connectBtn');
        btn.textContent = 'Connect';

        controller.setButtonLoading(btn, true);
        controller.setButtonLoading(btn, false);

        expect(btn.disabled).toBe(false);
        expect(btn.textContent).toBe('Connect');
      });
    });

    describe('toggleSettings', () => {
      it('should toggle settings panel visibility', () => {
        const content = document.querySelector('.settings-content');
        content.style.display = 'none';

        controller.toggleSettings();

        expect(content.style.display).toBe('block');
      });
    });
  });
});


