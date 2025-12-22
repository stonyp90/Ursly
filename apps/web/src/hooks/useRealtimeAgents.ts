import { useEffect, useState, useCallback } from 'react';
import { useRealtime } from './useRealtime';
import type { RealtimeEvent, AgentRealtimeEvent } from '@ursly/shared/types';

interface AgentUpdate {
  agentId: string;
  name?: string;
  status?: string;
  previousStatus?: string;
  contextUsage?: {
    current: number;
    max: number;
    percentage: number;
  };
  eventType: string;
  timestamp: Date;
}

interface UseRealtimeAgentsReturn {
  updates: AgentUpdate[];
  latestUpdate: AgentUpdate | null;
  isConnected: boolean;
  subscribeToAgent: (agentId: string) => void;
  unsubscribeFromAgent: (agentId: string) => void;
  subscribeToAllAgents: () => void;
  clearUpdates: () => void;
}

/**
 * Hook for real-time agent updates
 */
export function useRealtimeAgents(agentId?: string): UseRealtimeAgentsReturn {
  const { isConnected, subscribe, unsubscribe, onEvent } = useRealtime();
  const [updates, setUpdates] = useState<AgentUpdate[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<AgentUpdate | null>(null);

  const handleEvent = useCallback((event: RealtimeEvent) => {
    if (event.entityType !== 'agent') return;

    const agentEvent = event as AgentRealtimeEvent;
    const update: AgentUpdate = {
      agentId: agentEvent.data.agentId,
      name: agentEvent.data.name,
      status: agentEvent.data.status,
      previousStatus: agentEvent.data.previousStatus,
      contextUsage: agentEvent.data.contextUsage,
      eventType: agentEvent.eventType,
      timestamp: new Date(agentEvent.timestamp),
    };

    setUpdates((prev) => [update, ...prev].slice(0, 100)); // Keep last 100 updates
    setLatestUpdate(update);
  }, []);

  useEffect(() => {
    const unsubscribeEvent = onEvent(handleEvent);
    return unsubscribeEvent;
  }, [onEvent, handleEvent]);

  useEffect(() => {
    if (isConnected) {
      if (agentId) {
        subscribe('agent', agentId);
      } else {
        subscribe('agent');
      }
    }

    return () => {
      if (agentId) {
        unsubscribe('agent', agentId);
      } else {
        unsubscribe('agent');
      }
    };
  }, [isConnected, agentId, subscribe, unsubscribe]);

  const subscribeToAgent = useCallback(
    (id: string) => subscribe('agent', id),
    [subscribe],
  );

  const unsubscribeFromAgent = useCallback(
    (id: string) => unsubscribe('agent', id),
    [unsubscribe],
  );

  const subscribeToAllAgents = useCallback(
    () => subscribe('agent'),
    [subscribe],
  );

  const clearUpdates = useCallback(() => {
    setUpdates([]);
    setLatestUpdate(null);
  }, []);

  return {
    updates,
    latestUpdate,
    isConnected,
    subscribeToAgent,
    unsubscribeFromAgent,
    subscribeToAllAgents,
    clearUpdates,
  };
}
