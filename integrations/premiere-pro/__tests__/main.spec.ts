/**
 * Unit Tests for Ursly Plugin Controller
 * Following agents.md testing best practices
 */

import { UrslyPluginController } from '../src/main';

// Mock dependencies
jest.mock('../src/lib/ursly-api', () => ({
  UrslyAPI: jest.fn().mockImplementation(() => ({
    setEndpoint: jest.fn(),
    getEndpoint: jest.fn().mockReturnValue('http://localhost:3000'),
    checkConnection: jest.fn().mockResolvedValue({ connected: true, status: 'healthy' }),
    listModels: jest.fn().mockResolvedValue([{ name: 'llama3' }]),
    setCurrentModel: jest.fn(),
    getCurrentModel: jest.fn().mockReturnValue('llama3'),
    isConnected: jest.fn().mockReturnValue(false),
    generateCompletion: jest.fn().mockResolvedValue({ text: 'Response', model: 'llama3' }),
    streamCompletion: jest.fn().mockImplementation((_prompt, _opts, callback) => {
      callback('Hello');
      return Promise.resolve();
    }),
    abortRequest: jest.fn(),
  })),
}));

jest.mock('../src/lib/premiere-api', () => ({
  PremiereAPI: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    isInitialized: jest.fn().mockReturnValue(true),
    getSequenceInfo: jest.fn().mockResolvedValue({
      name: 'Test Sequence',
      duration: 3600,
      frameRate: { seconds: 1, ticks: 254016000000 },
    }),
    getAudioTracks: jest.fn().mockResolvedValue([]),
    getCurrentTime: jest.fn().mockResolvedValue({ seconds: 30 }),
    getClipsAtTime: jest.fn().mockResolvedValue([{ name: 'Clip1', start: 0, end: 60 }]),
    getClipInfo: jest.fn().mockResolvedValue([{ name: 'Clip1', inPoint: 0, outPoint: 60, mediaPath: null }]),
    getMarkers: jest.fn().mockResolvedValue([]),
    addCaptionsToSequence: jest.fn().mockResolvedValue(undefined),
    formatTimecode: jest.fn().mockReturnValue('00:00:00:00'),
    parseTimecode: jest.fn().mockReturnValue(0),
  })),
}));

// Mock UXP storage
jest.mock(
  'uxp',
  () => ({
    storage: {
      localFileSystem: {
        getDataFolder: jest.fn().mockResolvedValue({
          createFile: jest.fn().mockResolvedValue({
            write: jest.fn().mockResolvedValue(undefined),
          }),
          getEntry: jest.fn().mockResolvedValue(null),
        }),
      },
    },
  }),
  { virtual: true }
);

// Mock DOM
const mockDOM = (): void => {
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
      <span class="settings-arrow">&#9662;</span>
    </div>
    <button id="settingsToggle">Settings</button>
    <button id="saveSettingsBtn">Save</button>
  `;
};

describe('UrslyPluginController', () => {
  let controller: UrslyPluginController;

  beforeEach(() => {
    mockDOM();
    jest.clearAllMocks();
    controller = new UrslyPluginController();
  });

  describe('constructor', () => {
    it('should initialize with correct default state', () => {
      const state = controller.getState();
      expect(state.isConnected).toBe(false);
      expect(state.currentModel).toBeNull();
      expect(state.isProcessing).toBe(false);
      expect(state.lastError).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should initialize without throwing', async () => {
      await expect(controller.initialize()).resolves.not.toThrow();
    });
  });

  describe('handleConnect', () => {
    it('should connect successfully with valid endpoint', async () => {
      await controller.handleConnect();

      const state = controller.getState();
      expect(state.isConnected).toBe(true);
    });

    it('should update connection status in UI', async () => {
      await controller.handleConnect();

      const statusDot = document.querySelector('.status-dot');
      expect(statusDot?.classList.contains('connected')).toBe(true);
    });

    it('should show error when endpoint is empty', async () => {
      const input = document.getElementById('apiEndpoint') as HTMLInputElement;
      input.value = '';

      const showErrorSpy = jest.spyOn(controller, 'showError');
      await controller.handleConnect();

      expect(showErrorSpy).toHaveBeenCalledWith('Please enter an API endpoint');
    });
  });

  describe('handleGenerateCaptions', () => {
    beforeEach(async () => {
      await controller.handleConnect();
    });

    it('should not proceed when not connected', async () => {
      const newController = new UrslyPluginController();
      const showErrorSpy = jest.spyOn(newController, 'showError');

      await newController.handleGenerateCaptions();

      expect(showErrorSpy).toHaveBeenCalledWith('Please connect to Ursly API first');
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
      expect(content?.innerHTML).not.toContain('<script>');
    });
  });

  describe('showSuccess', () => {
    it('should display success notification', () => {
      controller.showSuccess('Test success');

      const notification = document.getElementById('notification');
      expect(notification?.textContent).toBe('Test success');
      expect(notification?.classList.contains('success')).toBe(true);
    });
  });

  describe('showError', () => {
    it('should display error notification and update state', () => {
      controller.showError('Test error');

      const notification = document.getElementById('notification');
      expect(notification?.textContent).toBe('Test error');
      expect(notification?.classList.contains('error')).toBe(true);
      expect(controller.getState().lastError).toBe('Test error');
    });
  });
});


