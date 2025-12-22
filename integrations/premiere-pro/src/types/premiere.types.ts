/**
 * Type definitions for Adobe Premiere Pro UXP API
 * These types represent the UXP API surface used by the plugin
 */

// Premiere Pro Application Types
export interface PremiereApp {
  getActiveProject(): Promise<PremiereProject | null>;
}

export interface PremiereProject {
  name: string;
  path: string;
  getActiveSequence(): Promise<PremiereSequence | null>;
  exportWithPreset(options: ExportOptions): Promise<void>;
}

export interface PremiereSequence {
  name: string;
  end: number;
  getSettings(): Promise<SequenceSettings>;
  getVideoTracks(): Promise<PremiereTrack[]>;
  getAudioTracks(): Promise<PremiereTrack[]>;
  getCaptionTracks(): Promise<CaptionTrack[]>;
  getMarkers(): Promise<PremiereMarker[]>;
  getSelection(): Promise<PremiereClip[]>;
  getPlayerPosition(): Promise<TimeValue>;
  setPlayerPosition(time: TimeValue): Promise<void>;
  createMarker(options: CreateMarkerOptions): Promise<PremiereMarker>;
  createCaptionTrack(options: CreateCaptionTrackOptions): Promise<CaptionTrack>;
  exportFrame(options: ExportFrameOptions): Promise<void>;
}

export interface SequenceSettings {
  videoFrameRate: FrameRate;
}

export interface FrameRate {
  seconds: number;
  ticks: number;
}

export interface TimeValue {
  seconds: number;
  ticks?: number;
}

export interface PremiereTrack {
  name?: string;
  getClips(): Promise<PremiereClip[]>;
  razor(time: TimeValue | number): Promise<void>;
}

export interface PremiereClip {
  name: string;
  start: number;
  end: number;
  duration: number;
  inPoint?: TimeValue;
  outPoint?: TimeValue;
  projectItem?: PremiereProjectItem;
  remove(): Promise<void>;
}

export interface PremiereProjectItem {
  getMediaPath(): Promise<string>;
}

export interface PremiereMarker {
  name: string;
  start: number;
  comments: string;
  color?: string;
}

export interface CaptionTrack {
  addCaption(options: AddCaptionOptions): Promise<void>;
}

// Options interfaces
export interface CreateMarkerOptions {
  start: TimeValue | number;
  name: string;
  comments: string;
  color?: string;
}

export interface CreateCaptionTrackOptions {
  format?: 'SRT' | 'CEA-608' | 'CEA-708';
  name?: string;
}

export interface AddCaptionOptions {
  text: string;
  startTime: number;
  endTime: number;
  style?: Record<string, unknown>;
}

export interface ExportOptions {
  sequence: PremiereSequence;
  outputPath: string;
  presetPath?: string | null;
  workArea?: 'entireSequence' | 'inToOut';
  exportType?: 'audioOnly' | 'videoOnly' | 'both';
  format?: string;
}

export interface ExportFrameOptions {
  time: TimeValue | number;
  outputPath: string;
  format?: 'JPEG' | 'PNG' | 'TIFF';
  quality?: number;
}

// UXP Storage Types
export interface UXPStorage {
  localFileSystem: LocalFileSystem;
}

export interface LocalFileSystem {
  getDataFolder(): Promise<UXPFolder>;
  getTemporaryFolder(): Promise<UXPFolder>;
}

export interface UXPFolder {
  createFile(name: string, options?: { overwrite?: boolean }): Promise<UXPFile>;
  getEntry(name: string): Promise<UXPFile | null>;
}

export interface UXPFile {
  nativePath: string;
  read(options?: { format?: unknown }): Promise<string | ArrayBuffer>;
  write(content: string): Promise<void>;
  delete(): Promise<void>;
}

// Plugin-specific types
export interface SequenceInfo {
  name: string;
  duration: string | number;
  frameRate?: FrameRate;
  videoTrackCount?: number;
  audioTrackCount?: number;
}

export interface ClipInfo {
  name: string;
  inPoint: number;
  outPoint: number;
  mediaPath: string | null;
}

export interface AudioTrackInfo {
  index: number;
  name: string;
  clips: Array<{
    name: string;
    start: number;
    end: number;
  }>;
}

export interface MarkerInfo {
  name: string;
  start: number;
  comments: string;
}

export interface ProjectDataForAI {
  project: {
    name: string;
    path: string;
    hasSequence: boolean;
  } | null;
  sequence: SequenceInfo | null;
  clips: PremiereClip[];
  playheadPosition: TimeValue | number;
  selectedClips: PremiereClip[];
  timestamp: string;
}


