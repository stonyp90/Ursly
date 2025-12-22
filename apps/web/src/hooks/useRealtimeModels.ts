import { useEffect, useState, useCallback } from 'react';
import { useRealtime } from './useRealtime';
import type { RealtimeEvent, ModelRealtimeEvent } from '@ursly/shared/types';

interface ModelUpdate {
  modelName: string;
  status?: 'pulling' | 'ready' | 'error' | 'deleted';
  progress?: number;
  size?: number;
  error?: string;
  eventType: string;
  timestamp: Date;
}

interface UseRealtimeModelsReturn {
  updates: ModelUpdate[];
  latestUpdate: ModelUpdate | null;
  isConnected: boolean;
  modelProgress: Map<string, number>;
  subscribeToModel: (modelName: string) => void;
  unsubscribeFromModel: (modelName: string) => void;
  subscribeToAllModels: () => void;
  clearUpdates: () => void;
}

/**
 * Hook for real-time model updates (pulling, ready, etc.)
 */
export function useRealtimeModels(modelName?: string): UseRealtimeModelsReturn {
  const { isConnected, subscribe, unsubscribe, onEvent } = useRealtime();
  const [updates, setUpdates] = useState<ModelUpdate[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<ModelUpdate | null>(null);
  const [modelProgress, setModelProgress] = useState<Map<string, number>>(
    new Map(),
  );

  const handleEvent = useCallback((event: RealtimeEvent) => {
    if (event.entityType !== 'model') return;

    const modelEvent = event as ModelRealtimeEvent;
    const update: ModelUpdate = {
      modelName: modelEvent.data.modelName,
      status: modelEvent.data.status,
      progress: modelEvent.data.progress,
      size: modelEvent.data.size,
      error: modelEvent.data.error,
      eventType: modelEvent.eventType,
      timestamp: new Date(modelEvent.timestamp),
    };

    setUpdates((prev) => [update, ...prev].slice(0, 100));
    setLatestUpdate(update);

    // Track progress for pulling models
    if (update.progress !== undefined) {
      setModelProgress((prev) => {
        const next = new Map(prev);
        next.set(update.modelName, update.progress!);
        return next;
      });
    }

    // Clear progress when complete or error
    if (update.status === 'ready' || update.status === 'error') {
      setModelProgress((prev) => {
        const next = new Map(prev);
        next.delete(update.modelName);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribeEvent = onEvent(handleEvent);
    return unsubscribeEvent;
  }, [onEvent, handleEvent]);

  useEffect(() => {
    if (isConnected) {
      if (modelName) {
        subscribe('model', modelName);
      } else {
        subscribe('model');
      }
    }

    return () => {
      if (modelName) {
        unsubscribe('model', modelName);
      } else {
        unsubscribe('model');
      }
    };
  }, [isConnected, modelName, subscribe, unsubscribe]);

  const subscribeToModel = useCallback(
    (name: string) => subscribe('model', name),
    [subscribe],
  );

  const unsubscribeFromModel = useCallback(
    (name: string) => unsubscribe('model', name),
    [unsubscribe],
  );

  const subscribeToAllModels = useCallback(
    () => subscribe('model'),
    [subscribe],
  );

  const clearUpdates = useCallback(() => {
    setUpdates([]);
    setLatestUpdate(null);
    setModelProgress(new Map());
  }, []);

  return {
    updates,
    latestUpdate,
    isConnected,
    modelProgress,
    subscribeToModel,
    unsubscribeFromModel,
    subscribeToAllModels,
    clearUpdates,
  };
}
