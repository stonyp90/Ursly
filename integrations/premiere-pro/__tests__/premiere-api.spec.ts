/**
 * Unit Tests for Premiere Pro API Helper
 * Following agents.md testing best practices
 */

import { PremiereAPI } from '../src/lib/premiere-api';
import type { TimeValue } from '../src/types';

// Mock UXP premierepro module
jest.mock(
  'premierepro',
  () => ({
    app: {
      getActiveProject: jest.fn().mockResolvedValue(null),
    },
  }),
  { virtual: true }
);

describe('PremiereAPI', () => {
  let api: PremiereAPI;

  beforeEach(() => {
    api = new PremiereAPI();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with false initialized state', () => {
      expect(api.isInitialized()).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should handle initialization errors gracefully', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await api.initialize();

      expect(typeof result).toBe('boolean');
    });
  });

  describe('getSequenceInfo', () => {
    it('should return null when no sequence is active', async () => {
      const result = await api.getSequenceInfo();

      expect(result).toBeNull();
    });
  });

  describe('getCurrentTime', () => {
    it('should return null when no sequence exists', async () => {
      const result = await api.getCurrentTime();

      expect(result).toBeNull();
    });
  });

  describe('getClipsAtTime', () => {
    it('should return empty array when no sequence exists', async () => {
      const time: TimeValue = { seconds: 0 };
      const result = await api.getClipsAtTime(time);

      expect(result).toEqual([]);
    });
  });

  describe('getAudioTracks', () => {
    it('should return empty array when no sequence exists', async () => {
      const result = await api.getAudioTracks();

      expect(result).toEqual([]);
    });
  });

  describe('getMarkers', () => {
    it('should return empty array when no sequence exists', async () => {
      const result = await api.getMarkers();

      expect(result).toEqual([]);
    });
  });

  describe('addCaptionsToSequence', () => {
    it('should handle empty captions array', async () => {
      await expect(api.addCaptionsToSequence([])).resolves.not.toThrow();
    });
  });

  describe('getClipInfo', () => {
    it('should return empty array for empty clips input', async () => {
      const result = await api.getClipInfo([]);

      expect(result).toEqual([]);
    });
  });

  describe('formatTimecode', () => {
    it('should format zero seconds correctly', () => {
      expect(api.formatTimecode(0)).toBe('00:00:00:00');
    });

    it('should format seconds with frames', () => {
      expect(api.formatTimecode(61.5)).toBe('00:01:01:15');
    });

    it('should format hours correctly', () => {
      expect(api.formatTimecode(3661)).toBe('01:01:01:00');
    });

    it('should handle frame rate parameter', () => {
      const result = api.formatTimecode(1, 30);
      expect(result).toBe('00:00:01:00');
    });
  });

  describe('parseTimecode', () => {
    it('should parse SRT timecode with comma separator', () => {
      expect(api.parseTimecode('00:00:01,000')).toBe(1);
    });

    it('should parse complex timecode', () => {
      expect(api.parseTimecode('00:01:30,500')).toBe(90.5);
    });

    it('should parse hour timecode', () => {
      expect(api.parseTimecode('01:00:00,000')).toBe(3600);
    });

    it('should handle invalid timecode format', () => {
      expect(api.parseTimecode('invalid')).toBe(0);
    });

    it('should handle empty string', () => {
      expect(api.parseTimecode('')).toBe(0);
    });
  });

  describe('getProjectDataForAI', () => {
    it('should return structured project data', async () => {
      const result = await api.getProjectDataForAI();

      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('sequence');
      expect(result).toHaveProperty('clips');
      expect(result).toHaveProperty('playheadPosition');
      expect(result).toHaveProperty('selectedClips');
      expect(result).toHaveProperty('timestamp');
    });
  });
});


