/**
 * Ursly API Client for Premiere Pro UXP Plugin
 * Handles communication with the local Ursly API server
 * 
 * Implements the adapter pattern for the Ursly API infrastructure layer.
 */

class UrslyAPI {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.connected = false;
    this.models = [];
    this.currentModel = null;
    this.abortController = null;
  }

  /**
   * Update the API endpoint
   * @param {string} url - The API base URL
   */
  setEndpoint(url) {
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Set the current model to use for completions
   * @param {string} modelName - The model name
   */
  setCurrentModel(modelName) {
    this.currentModel = modelName;
  }

  /**
   * Check connection to the Ursly API
   * @returns {Promise<{connected: boolean, status: string, error?: string}>}
   */
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        this.connected = true;
        return { connected: true, status: 'healthy' };
      }
      
      this.connected = false;
      return { connected: false, status: 'unhealthy' };
    } catch (error) {
      this.connected = false;
      return { connected: false, status: 'unreachable', error: error.message };
    }
  }

  /**
   * List available models from Ollama via Ursly API
   * @returns {Promise<Array<{name: string, size?: string}>>}
   */
  async listModels() {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    this.models = data.models || data || [];
    return this.models;
  }

  /**
   * Generate a text completion (non-streaming)
   * @param {string} prompt - The prompt to complete
   * @param {Object} options - Generation options
   * @param {number} options.temperature - Temperature (0-1)
   * @param {number} options.maxTokens - Max tokens to generate
   * @returns {Promise<{text: string, model: string, totalDuration?: number}>}
   */
  async generateCompletion(prompt, options = {}) {
    if (!this.currentModel) {
      throw new Error('No model selected');
    }
    
    this.abortController = new AbortController();
    
    const response = await fetch(`${this.baseUrl}/models/${this.currentModel}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        stream: false,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2048,
        options: {
          num_predict: options.maxTokens ?? 2048,
        }
      }),
      signal: this.abortController.signal
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.response || data.text || data.message?.content || '',
      model: this.currentModel,
      totalDuration: data.total_duration
    };
  }

  /**
   * Generate a streaming completion
   * @param {string} prompt - The prompt to complete
   * @param {Object} options - Generation options
   * @param {Function} onChunk - Callback for each chunk
   * @returns {Promise<void>}
   */
  async streamCompletion(prompt, options = {}, onChunk) {
    if (!this.currentModel) {
      throw new Error('No model selected');
    }
    
    this.abortController = new AbortController();
    
    const response = await fetch(`${this.baseUrl}/models/${this.currentModel}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        stream: true,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 2048,
        options: {
          num_predict: options.maxTokens ?? 2048,
        }
      }),
      signal: this.abortController.signal
    });

    if (!response.ok) {
      throw new Error(`Streaming failed: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              onChunk(data.response);
            }
          } catch (e) {
            // Skip non-JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Chat completion with message history
   * @param {Array<{role: string, content: string}>} messages - Message history
   * @param {Object} options - Chat options
   * @returns {Promise<{text: string, model: string}>}
   */
  async chatCompletion(messages, options = {}) {
    const model = this.currentModel || 'llama3.2';
    
    this.abortController = new AbortController();
    
    const response = await fetch(`${this.baseUrl}/api/tasks/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'chat',
        model: model,
        messages: messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048
        }
      }),
      signal: this.abortController.signal
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.response || data.message?.content || '',
      model: model
    };
  }

  /**
   * Transcribe audio using Whisper model
   * @param {ArrayBuffer|string} audioData - Audio data (base64 or ArrayBuffer)
   * @param {Object} options - Transcription options
   * @returns {Promise<{text: string, segments?: Array}>}
   */
  async transcribeAudio(audioData, options = {}) {
    this.abortController = new AbortController();
    
    const audioBase64 = typeof audioData === 'string' 
      ? audioData 
      : this._arrayBufferToBase64(audioData);

    const response = await fetch(`${this.baseUrl}/api/tasks/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'transcribe',
        model: options.whisperModel || 'whisper:small',
        audio: audioBase64,
        options: {
          language: options.language || 'auto',
          task: options.task || 'transcribe',
          timestamps: options.timestamps !== false
        }
      }),
      signal: this.abortController.signal
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Analyze video frame using vision model
   * @param {ArrayBuffer|string} imageData - Image data
   * @param {Object} options - Analysis options
   * @returns {Promise<{description: string}>}
   */
  async analyzeFrame(imageData, options = {}) {
    this.abortController = new AbortController();
    
    const imageBase64 = typeof imageData === 'string'
      ? imageData
      : this._arrayBufferToBase64(imageData);

    const response = await fetch(`${this.baseUrl}/api/tasks/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'vision',
        model: options.model || 'llava',
        images: [imageBase64],
        prompt: options.prompt || 'Describe this video frame in detail. Include information about the scene, subjects, actions, and mood.',
        options: {
          temperature: 0.5
        }
      }),
      signal: this.abortController.signal
    });

    if (!response.ok) {
      throw new Error(`Frame analysis failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Abort the current request
   */
  abortRequest() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Helper to convert ArrayBuffer to base64
   * @private
   */
  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

// Export for CommonJS (UXP) and module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UrslyAPI;
}
