/**
 * Premiere Pro API Helper for UXP Plugin
 * Handles interaction with the Premiere Pro application via UXP APIs
 *
 * Implements the adapter pattern for Premiere Pro infrastructure layer.
 */

import type {
  PremiereApp,
  PremiereProject,
  PremiereSequence,
  PremiereClip,
  SequenceInfo,
  ClipInfo,
  AudioTrackInfo,
  MarkerInfo,
  ProjectDataForAI,
  TimeValue,
} from '../types';
import { Caption } from '../schemas';

/**
 * Premiere Pro API Adapter
 * Provides typed methods for interacting with Premiere Pro via UXP
 */
export class PremiereAPI {
  private app: PremiereApp | null;
  private project: PremiereProject | null;
  private sequence: PremiereSequence | null;
  private initialized: boolean;

  constructor() {
    this.app = null;
    this.project = null;
    this.sequence = null;
    this.initialized = false;
  }

  /**
   * Initialize the Premiere Pro API connection
   */
  async initialize(): Promise<boolean> {
    try {
      // UXP modules for Premiere Pro
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { app } = require('premierepro') as { app: PremiereApp };
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
   * Check if API is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Refresh project and sequence references
   */
  async refreshProject(): Promise<boolean> {
    try {
      if (!this.app) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { app } = require('premierepro') as { app: PremiereApp };
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
  async getProjectInfo(): Promise<{
    name: string;
    path: string;
    hasSequence: boolean;
  } | null> {
    if (!this.project) {
      await this.refreshProject();
    }

    if (!this.project) {
      return null;
    }

    try {
      return {
        name: this.project.name,
        path: this.project.path,
        hasSequence: !!this.sequence,
      };
    } catch (error) {
      console.error('Failed to get project info:', error);
      return null;
    }
  }

  /**
   * Get current sequence information
   */
  async getSequenceInfo(): Promise<SequenceInfo | null> {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return null;
    }

    try {
      const settings = await this.sequence.getSettings();
      const videoTracks = await this.sequence.getVideoTracks();
      const audioTracks = await this.sequence.getAudioTracks();

      return {
        name: this.sequence.name,
        duration: this.sequence.end,
        frameRate: settings.videoFrameRate,
        videoTrackCount: videoTracks?.length ?? 0,
        audioTrackCount: audioTracks?.length ?? 0,
      };
    } catch (error) {
      console.error('Failed to get sequence info:', error);
      return null;
    }
  }

  /**
   * Get current playhead time
   */
  async getCurrentTime(): Promise<TimeValue | null> {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return null;
    }

    try {
      return await this.sequence.getPlayerPosition();
    } catch (error) {
      console.error('Failed to get current time:', error);
      return null;
    }
  }

  /**
   * Get clips at a specific time position
   */
  async getClipsAtTime(time: TimeValue | number): Promise<PremiereClip[]> {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return [];
    }

    try {
      const clips: PremiereClip[] = [];
      const timeSeconds = typeof time === 'number' ? time : time.seconds;

      const videoTracks = await this.sequence.getVideoTracks();
      for (const track of videoTracks) {
        const trackClips = await track.getClips();
        for (const clip of trackClips) {
          if (clip.start <= timeSeconds && clip.end >= timeSeconds) {
            clips.push(clip);
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
   */
  async getClipInfo(clips: PremiereClip[]): Promise<ClipInfo[]> {
    try {
      const info: ClipInfo[] = [];
      for (const clip of clips) {
        const clipInfo: ClipInfo = {
          name: clip.name,
          inPoint: clip.inPoint?.seconds ?? clip.start,
          outPoint: clip.outPoint?.seconds ?? clip.end,
          mediaPath: null,
        };

        if (clip.projectItem) {
          try {
            clipInfo.mediaPath = await clip.projectItem.getMediaPath();
          } catch {
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
   */
  async getAudioTracks(): Promise<AudioTrackInfo[]> {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return [];
    }

    try {
      const tracks: AudioTrackInfo[] = [];
      const audioTracks = await this.sequence.getAudioTracks();

      for (let i = 0; i < audioTracks.length; i++) {
        const track = audioTracks[i];
        const clips = await track.getClips();

        tracks.push({
          index: i,
          name: `Audio ${i + 1}`,
          clips: clips.map((clip) => ({
            name: clip.name,
            start: clip.start,
            end: clip.end,
          })),
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
   */
  async getMarkers(): Promise<MarkerInfo[]> {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return [];
    }

    try {
      const markers = await this.sequence.getMarkers();
      return (
        markers?.map((m) => ({
          name: m.name,
          start: m.start,
          comments: m.comments,
        })) ?? []
      );
    } catch (error) {
      console.error('Failed to get markers:', error);
      return [];
    }
  }

  /**
   * Add captions to sequence from parsed SRT data
   */
  async addCaptionsToSequence(captions: Caption[]): Promise<void> {
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
   * Add a single caption to the sequence
   */
  async addCaption(
    text: string,
    startTime: number,
    endTime: number,
    options: { format?: string; trackName?: string; style?: Record<string, unknown> } = {}
  ): Promise<boolean> {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return false;
    }

    try {
      const captionTracks = await this.sequence.getCaptionTracks();
      let captionTrack = captionTracks[0];

      if (!captionTrack) {
        captionTrack = await this.sequence.createCaptionTrack({
          format: (options.format as 'SRT' | 'CEA-608' | 'CEA-708') ?? 'SRT',
          name: options.trackName ?? 'AI Generated Captions',
        });
      }

      await captionTrack.addCaption({
        text,
        startTime,
        endTime,
        style: options.style ?? {},
      });

      return true;
    } catch (error) {
      console.error('Failed to add caption:', error);
      return false;
    }
  }

  /**
   * Add a marker at the specified position
   */
  async addMarker(
    name: string,
    comment: string,
    time: TimeValue | number | null = null
  ): Promise<boolean> {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return false;
    }

    try {
      const position = time ?? (await this.getCurrentTime());

      await this.sequence.createMarker({
        start: position ?? 0,
        name,
        comments: comment,
        color: 'green',
      });

      return true;
    } catch (error) {
      console.error('Failed to add marker:', error);
      return false;
    }
  }

  /**
   * Get comprehensive project data for AI analysis
   */
  async getProjectDataForAI(): Promise<ProjectDataForAI> {
    const projectInfo = await this.getProjectInfo();
    const sequenceInfo = await this.getSequenceInfo();
    const clips = await this.getSequenceClips();
    const playhead = await this.getCurrentTime();
    const selectedClips = await this.getSelectedClips();

    return {
      project: projectInfo,
      sequence: sequenceInfo,
      clips,
      playheadPosition: playhead ?? 0,
      selectedClips,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get all clips in the sequence
   */
  async getSequenceClips(): Promise<PremiereClip[]> {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return [];
    }

    try {
      const clips: PremiereClip[] = [];
      const videoTracks = await this.sequence.getVideoTracks();

      for (const track of videoTracks) {
        const trackClips = await track.getClips();
        clips.push(...trackClips);
      }

      return clips;
    } catch (error) {
      console.error('Failed to get sequence clips:', error);
      return [];
    }
  }

  /**
   * Get selected clips
   */
  async getSelectedClips(): Promise<PremiereClip[]> {
    if (!this.sequence) {
      await this.refreshProject();
    }

    if (!this.sequence) {
      return [];
    }

    try {
      return await this.sequence.getSelection();
    } catch (error) {
      console.error('Failed to get selected clips:', error);
      return [];
    }
  }

  /**
   * Format seconds to timecode string (HH:MM:SS:FF)
   */
  formatTimecode(seconds: number, frameRate = 30): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * frameRate);

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
      frames.toString().padStart(2, '0'),
    ].join(':');
  }

  /**
   * Parse SRT timecode string to seconds
   */
  parseTimecode(timecode: string): number {
    if (!timecode || typeof timecode !== 'string') {
      return 0;
    }

    const match = timecode.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!match) {
      return 0;
    }

    const [, hours, minutes, seconds, ms] = match;
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(seconds) +
      parseInt(ms) / 1000
    );
  }
}

export default PremiereAPI;


