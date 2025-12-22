/**
 * Premiere Pro API Helper for UXP Plugin
 * Handles interaction with the Premiere Pro application via UXP APIs
 */

class PremiereAPI {
  constructor() {
    this.app = null;
    this.project = null;
    this.sequence = null;
    this.initialized = false;
  }

  /**
   * Initialize the Premiere Pro API connection
   */
  async initialize() {
    try {
      // UXP modules for Premiere Pro
      const { app } = require('premierepro');
      this.app = app;
      
      await this.refreshProject();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Premiere Pro API:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Refresh project and sequence references
   */
  async refreshProject() {
    try {
      if (!this.app) {
        const { app } = require('premierepro');
        this.app = app;
      }
      
      this.project = await this.app.getActiveProject();
      if (this.project) {
        this.sequence = await this.project.getActiveSequence();
      }
      return true;
    } catch (error) {
      console.error('Failed to refresh project:', error);
      return false;
    }
  }

  /**
   * Get current project information
   */
  async getProjectInfo() {
    if (!this.project) {
      await this.refreshProject();
    }

    if (!this.project) {
      return null;
    }

    try {
      const projectPath = await this.project.path;
      const projectName = await this.project.name;
      
      return {
        name: projectName,
        path: projectPath,
        hasSequence: !!this.sequence
      };
    } catch (error) {
      console.error('Failed to get project info:', error);
      return null;
    }
  }

  /**
   * Get current sequence information
   */
  async getSequenceInfo() {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return null;
    }

    try {
      const name = await this.sequence.name;
      const duration = await this.sequence.end;
      const frameRate = await this.sequence.getSettings().then(s => s.videoFrameRate);
      
      const videoTracks = await this.sequence.getVideoTracks();
      const audioTracks = await this.sequence.getAudioTracks();

      return {
        name: name,
        duration: duration,
        frameRate: frameRate,
        videoTrackCount: videoTracks ? videoTracks.length : 0,
        audioTrackCount: audioTracks ? audioTracks.length : 0
      };
    } catch (error) {
      console.error('Failed to get sequence info:', error);
      return null;
    }
  }

  /**
   * Get clips in the current sequence
   */
  async getSequenceClips() {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return [];
    }

    try {
      const clips = [];
      const videoTracks = await this.sequence.getVideoTracks();
      
      for (let trackIndex = 0; trackIndex < videoTracks.length; trackIndex++) {
        const track = videoTracks[trackIndex];
        const trackClips = await track.getClips();
        
        for (const clip of trackClips) {
          clips.push({
            name: await clip.name,
            startTime: await clip.start,
            endTime: await clip.end,
            duration: await clip.duration,
            trackIndex: trackIndex,
            type: 'video'
          });
        }
      }

      const audioTracks = await this.sequence.getAudioTracks();
      for (let trackIndex = 0; trackIndex < audioTracks.length; trackIndex++) {
        const track = audioTracks[trackIndex];
        const trackClips = await track.getClips();
        
        for (const clip of trackClips) {
          clips.push({
            name: await clip.name,
            startTime: await clip.start,
            endTime: await clip.end,
            duration: await clip.duration,
            trackIndex: trackIndex,
            type: 'audio'
          });
        }
      }

      return clips;
    } catch (error) {
      console.error('Failed to get sequence clips:', error);
      return [];
    }
  }

  /**
   * Get the currently selected clips
   */
  async getSelectedClips() {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return [];
    }

    try {
      const selection = await this.sequence.getSelection();
      const clips = [];
      
      for (const item of selection) {
        clips.push({
          name: await item.name,
          startTime: await item.start,
          endTime: await item.end,
          duration: await item.duration
        });
      }
      
      return clips;
    } catch (error) {
      console.error('Failed to get selected clips:', error);
      return [];
    }
  }

  /**
   * Get current playhead position
   */
  async getPlayheadPosition() {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return 0;
    }

    try {
      return await this.sequence.getPlayerPosition();
    } catch (error) {
      console.error('Failed to get playhead position:', error);
      return 0;
    }
  }

  /**
   * Set playhead position
   */
  async setPlayheadPosition(time) {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return false;
    }

    try {
      await this.sequence.setPlayerPosition(time);
      return true;
    } catch (error) {
      console.error('Failed to set playhead position:', error);
      return false;
    }
  }

  /**
   * Add a caption/subtitle track item
   */
  async addCaption(text, startTime, endTime, options = {}) {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return false;
    }

    try {
      // Get or create captions track
      const captionTracks = await this.sequence.getCaptionTracks();
      let captionTrack = captionTracks[0];
      
      if (!captionTrack) {
        // Create new caption track if none exists
        captionTrack = await this.sequence.createCaptionTrack({
          format: options.format || 'SRT',
          name: options.trackName || 'AI Generated Captions'
        });
      }

      // Add caption segment
      await captionTrack.addCaption({
        text: text,
        startTime: startTime,
        endTime: endTime,
        style: options.style || {}
      });

      return true;
    } catch (error) {
      console.error('Failed to add caption:', error);
      return false;
    }
  }

  /**
   * Add multiple captions from transcription data
   */
  async addCaptions(transcriptionData, options = {}) {
    if (!Array.isArray(transcriptionData.segments)) {
      console.error('Invalid transcription data format');
      return false;
    }

    let successCount = 0;
    for (const segment of transcriptionData.segments) {
      const success = await this.addCaption(
        segment.text,
        segment.start,
        segment.end,
        options
      );
      if (success) successCount++;
    }

    return {
      total: transcriptionData.segments.length,
      added: successCount
    };
  }

  /**
   * Add a marker at the current or specified position
   */
  async addMarker(name, comment, time = null) {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return false;
    }

    try {
      const position = time !== null ? time : await this.getPlayheadPosition();
      
      await this.sequence.createMarker({
        start: position,
        name: name,
        comments: comment,
        color: 'green' // AI-generated marker color
      });

      return true;
    } catch (error) {
      console.error('Failed to add marker:', error);
      return false;
    }
  }

  /**
   * Export audio from the sequence for transcription
   */
  async exportAudioForTranscription(options = {}) {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return null;
    }

    try {
      const { fs, path } = require('uxp').storage;
      const tempFolder = await fs.getTemporaryFolder();
      const audioFile = await tempFolder.createFile('temp_audio.wav', { overwrite: true });
      
      // Export audio-only render
      await this.project.exportWithPreset({
        sequence: this.sequence,
        outputPath: audioFile.nativePath,
        presetPath: options.presetPath || null,
        workArea: options.workArea || 'entireSequence',
        exportType: 'audioOnly',
        format: 'WAV'
      });

      // Read the exported file
      const audioData = await audioFile.read({ format: require('uxp').storage.formats.binary });
      
      // Clean up temp file
      await audioFile.delete();

      return audioData;
    } catch (error) {
      console.error('Failed to export audio:', error);
      return null;
    }
  }

  /**
   * Get a frame at the specified time for vision analysis
   */
  async getFrameAt(time = null) {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return null;
    }

    try {
      const position = time !== null ? time : await this.getPlayheadPosition();
      
      // Export single frame
      const { fs } = require('uxp').storage;
      const tempFolder = await fs.getTemporaryFolder();
      const frameFile = await tempFolder.createFile('temp_frame.jpg', { overwrite: true });

      await this.sequence.exportFrame({
        time: position,
        outputPath: frameFile.nativePath,
        format: 'JPEG',
        quality: 85
      });

      // Read the frame
      const frameData = await frameFile.read({ format: require('uxp').storage.formats.binary });
      
      // Clean up
      await frameFile.delete();

      return frameData;
    } catch (error) {
      console.error('Failed to get frame:', error);
      return null;
    }
  }

  /**
   * Apply a cut at the specified time
   */
  async cutAtTime(time = null) {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return false;
    }

    try {
      const position = time !== null ? time : await this.getPlayheadPosition();
      
      // Razor tool at position
      const videoTracks = await this.sequence.getVideoTracks();
      for (const track of videoTracks) {
        await track.razor(position);
      }

      const audioTracks = await this.sequence.getAudioTracks();
      for (const track of audioTracks) {
        await track.razor(position);
      }

      return true;
    } catch (error) {
      console.error('Failed to cut at time:', error);
      return false;
    }
  }

  /**
   * Delete selected clips
   */
  async deleteSelectedClips() {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return false;
    }

    try {
      const selection = await this.sequence.getSelection();
      for (const item of selection) {
        await item.remove();
      }
      return true;
    } catch (error) {
      console.error('Failed to delete selected clips:', error);
      return false;
    }
  }

  /**
   * Get comprehensive project data for AI analysis
   */
  async getProjectDataForAI() {
    const projectInfo = await this.getProjectInfo();
    const sequenceInfo = await this.getSequenceInfo();
    const clips = await this.getSequenceClips();
    const playhead = await this.getPlayheadPosition();
    const selectedClips = await this.getSelectedClips();

    return {
      project: projectInfo,
      sequence: sequenceInfo,
      clips: clips,
      playheadPosition: playhead,
      selectedClips: selectedClips,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get current playhead time (alias for getPlayheadPosition)
   */
  async getCurrentTime() {
    return this.getPlayheadPosition();
  }

  /**
   * Get clips at a specific time position
   * @param {Object} time - Time object with seconds property
   * @returns {Promise<Array>}
   */
  async getClipsAtTime(time) {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return [];
    }

    try {
      const clips = [];
      const timeSeconds = time?.seconds ?? time ?? 0;
      
      const videoTracks = await this.sequence.getVideoTracks();
      for (const track of videoTracks) {
        const trackClips = await track.getClips();
        for (const clip of trackClips) {
          const start = await clip.start;
          const end = await clip.end;
          if (start <= timeSeconds && end >= timeSeconds) {
            clips.push({
              name: await clip.name,
              start: start,
              end: end,
              projectItem: clip.projectItem
            });
          }
        }
      }
      
      return clips;
    } catch (error) {
      console.error('Failed to get clips at time:', error);
      return [];
    }
  }

  /**
   * Get detailed information about clips
   * @param {Array} clips - Array of clip objects
   * @returns {Promise<Array>}
   */
  async getClipInfo(clips) {
    try {
      const info = [];
      for (const clip of clips) {
        const clipInfo = {
          name: clip.name,
          inPoint: clip.inPoint?.seconds ?? clip.start,
          outPoint: clip.outPoint?.seconds ?? clip.end,
          mediaPath: null
        };
        
        if (clip.projectItem && typeof clip.projectItem.getMediaPath === 'function') {
          try {
            clipInfo.mediaPath = await clip.projectItem.getMediaPath();
          } catch (e) {
            // Media path not available
          }
        }
        
        info.push(clipInfo);
      }
      return info;
    } catch (error) {
      console.error('Failed to get clip info:', error);
      return [];
    }
  }

  /**
   * Get audio tracks with detailed information
   * @returns {Promise<Array>}
   */
  async getAudioTracks() {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return [];
    }

    try {
      const tracks = [];
      const audioTracks = await this.sequence.getAudioTracks();
      
      for (let i = 0; i < audioTracks.length; i++) {
        const track = audioTracks[i];
        const clips = await track.getClips();
        
        tracks.push({
          index: i,
          name: `Audio ${i + 1}`,
          clips: clips.map(clip => ({
            name: clip.name,
            start: clip.start,
            end: clip.end
          }))
        });
      }
      
      return tracks;
    } catch (error) {
      console.error('Failed to get audio tracks:', error);
      return [];
    }
  }

  /**
   * Get sequence markers
   * @returns {Promise<Array>}
   */
  async getMarkers() {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return [];
    }

    try {
      const markers = await this.sequence.getMarkers();
      return markers?.map(m => ({
        name: m.name,
        start: m.start,
        comments: m.comments
      })) || [];
    } catch (error) {
      console.error('Failed to get markers:', error);
      return [];
    }
  }

  /**
   * Add captions to sequence from parsed SRT data
   * @param {Array} captions - Array of caption objects with startTime, endTime, text
   * @returns {Promise<void>}
   */
  async addCaptionsToSequence(captions) {
    if (!Array.isArray(captions) || captions.length === 0) {
      return;
    }

    for (const caption of captions) {
      const startSeconds = this.parseTimecode(caption.startTime);
      const endSeconds = this.parseTimecode(caption.endTime);
      
      await this.addCaption(caption.text, startSeconds, endSeconds);
    }
  }

  /**
   * Format seconds to timecode string (HH:MM:SS:FF)
   * @param {number} seconds - Time in seconds
   * @param {number} frameRate - Frame rate (default 30)
   * @returns {string}
   */
  formatTimecode(seconds, frameRate = 30) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * frameRate);
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
      frames.toString().padStart(2, '0')
    ].join(':');
  }

  /**
   * Parse SRT timecode string to seconds
   * @param {string} timecode - SRT format timecode (HH:MM:SS,mmm)
   * @returns {number}
   */
  parseTimecode(timecode) {
    if (!timecode || typeof timecode !== 'string') {
      return 0;
    }
    
    const match = timecode.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!match) {
      return 0;
    }
    
    const [, hours, minutes, seconds, ms] = match;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(ms) / 1000;
  }
}

// Export for CommonJS (UXP) and module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PremiereAPI;
}

