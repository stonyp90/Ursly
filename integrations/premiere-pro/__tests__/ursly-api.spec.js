/**
 * Unit Tests for Ursly API Client
 * Following agents.md testing best practices
 */

// Mock fetch globally
global.fetch = jest.fn();

// Import the module
const UrslyAPI = require('../lib/ursly-api');

describe('UrslyAPI', () => {
  let api;

  beforeEach(() => {
    api = new UrslyAPI();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default endpoint', () => {
      expect(api.baseUrl).toBe('http://localhost:3000');
      expect(api.connected).toBe(false);
      expect(api.models).toEqual([]);
    });

    it('should accept custom endpoint', () => {
      const customApi = new UrslyAPI('http://custom-api:8080');
      expect(customApi.baseUrl).toBe('http://custom-api:8080');
    });
  });

  describe('setEndpoint', () => {
    it('should update the base URL', () => {
      api.setEndpoint('http://new-endpoint:3001');
      expect(api.baseUrl).toBe('http://new-endpoint:3001');
    });

    it('should remove trailing slash from URL', () => {
      api.setEndpoint('http://api.example.com/');
      expect(api.baseUrl).toBe('http://api.example.com');
    });
  });

  describe('checkConnection', () => {
    it('should return connected true when health check succeeds', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const result = await api.checkConnection();

      expect(result.connected).toBe(true);
      expect(result.status).toBe('healthy');
      expect(api.connected).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/health',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return connected false when health check fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await api.checkConnection();

      expect(result.connected).toBe(false);
      expect(api.connected).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.checkConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('listModels', () => {
    it('should return list of available models', async () => {
      const mockModels = [
        { name: 'llama3', size: '4.7GB' },
        { name: 'mistral', size: '4.1GB' },
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: mockModels }),
      });

      const models = await api.listModels();

      expect(models).toEqual(mockModels);
      expect(api.models).toEqual(mockModels);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/models',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should throw error when API request fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(api.listModels()).rejects.toThrow();
    });

    it('should return empty array when no models available', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      const models = await api.listModels();

      expect(models).toEqual([]);
    });
  });

  describe('setCurrentModel', () => {
    it('should set the current model', () => {
      api.setCurrentModel('llama3');
      expect(api.currentModel).toBe('llama3');
    });
  });

  describe('generateCompletion', () => {
    it('should generate completion with default options', async () => {
      const mockResponse = {
        text: 'Generated response',
        model: 'llama3',
        totalDuration: 1000,
      };

      api.currentModel = 'llama3';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.generateCompletion('Test prompt');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/models/llama3/generate',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test prompt'),
        })
      );
    });

    it('should include custom options in request', async () => {
      api.currentModel = 'llama3';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'Response' }),
      });

      await api.generateCompletion('Prompt', {
        temperature: 0.5,
        maxTokens: 1000,
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.temperature).toBe(0.5);
      expect(callBody.maxTokens).toBe(1000);
    });

    it('should throw error when no model is selected', async () => {
      api.currentModel = null;

      await expect(api.generateCompletion('Test')).rejects.toThrow(
        'No model selected'
      );
    });

    it('should throw error when API request fails', async () => {
      api.currentModel = 'llama3';
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad request' }),
      });

      await expect(api.generateCompletion('Test')).rejects.toThrow();
    });
  });

  describe('streamCompletion', () => {
    it('should call onChunk callback for each stream chunk', async () => {
      api.currentModel = 'llama3';
      const chunks = ['Hello', ' ', 'World'];
      const onChunk = jest.fn();

      // Mock ReadableStream
      const mockReader = {
        read: jest
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(JSON.stringify({ response: 'Hello' }) + '\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(JSON.stringify({ response: ' ' }) + '\n'),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(JSON.stringify({ response: 'World' }) + '\n'),
          })
          .mockResolvedValueOnce({ done: true }),
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      await api.streamCompletion('Test prompt', {}, onChunk);

      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, 'Hello');
      expect(onChunk).toHaveBeenNthCalledWith(2, ' ');
      expect(onChunk).toHaveBeenNthCalledWith(3, 'World');
    });

    it('should throw error when no model is selected', async () => {
      api.currentModel = null;

      await expect(
        api.streamCompletion('Test', {}, jest.fn())
      ).rejects.toThrow('No model selected');
    });
  });

  describe('abortRequest', () => {
    it('should abort the current request', () => {
      api.abortController = {
        abort: jest.fn(),
      };

      api.abortRequest();

      expect(api.abortController.abort).toHaveBeenCalled();
    });

    it('should not throw when no request is in progress', () => {
      api.abortController = null;

      expect(() => api.abortRequest()).not.toThrow();
    });
  });
});


