import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from 'react-oidc-context';
import { useUser } from '../contexts';
import { env } from '../config';
import type {
  RealtimeEvent,
  RealtimeEntityType,
  SubscriptionRequest,
  SubscriptionResponse,
} from '@ursly/shared/types';

interface UseRealtimeOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface UseRealtimeReturn {
  isConnected: boolean;
  subscribe: (entityType: RealtimeEntityType, entityId?: string) => void;
  unsubscribe: (entityType: RealtimeEntityType, entityId?: string) => void;
  onEvent: (callback: (event: RealtimeEvent) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Hook for managing WebSocket connection and subscriptions
 */
export function useRealtime(
  options: UseRealtimeOptions = {},
): UseRealtimeReturn {
  const {
    autoConnect = true,
    reconnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
  } = options;

  const auth = useAuth();
  const { currentOrg } = useUser();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventCallbacks = useRef<Set<(event: RealtimeEvent) => void>>(new Set());

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    socketRef.current = io(`${env.ws.url}/realtime`, {
      transports: ['websocket'],
      reconnection: reconnect,
      reconnectionAttempts: reconnectAttempts,
      reconnectionDelay: reconnectDelay,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('[Realtime] Connected');

      // Authenticate with user context
      if (auth.user && currentOrg) {
        socketRef.current?.emit('authenticate', {
          userId: auth.user.profile.sub,
          organizationId: currentOrg.id,
        });
      }
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Realtime] Disconnected');
    });

    socketRef.current.on('entityUpdate', (event: RealtimeEvent) => {
      eventCallbacks.current.forEach((callback) => callback(event));
    });

    socketRef.current.on('notification', (event: RealtimeEvent) => {
      eventCallbacks.current.forEach((callback) => callback(event));
    });

    socketRef.current.on('broadcast', (event: RealtimeEvent) => {
      eventCallbacks.current.forEach((callback) => callback(event));
    });
  }, [auth.user, currentOrg, reconnect, reconnectAttempts, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const subscribe = useCallback(
    (entityType: RealtimeEntityType, entityId?: string) => {
      if (!socketRef.current?.connected) {
        console.warn('[Realtime] Cannot subscribe: not connected');
        return;
      }

      const request: SubscriptionRequest = {
        entityType,
        entityId,
        organizationId: currentOrg?.id || '',
      };

      socketRef.current.emit(
        'subscribe',
        request,
        (response: SubscriptionResponse) => {
          if (response.success) {
            console.log(`[Realtime] Subscribed to ${response.room}`);
          } else {
            console.error(`[Realtime] Subscription failed: ${response.error}`);
          }
        },
      );
    },
    [currentOrg],
  );

  const unsubscribe = useCallback(
    (entityType: RealtimeEntityType, entityId?: string) => {
      if (!socketRef.current?.connected) return;

      const request: SubscriptionRequest = {
        entityType,
        entityId,
        organizationId: currentOrg?.id || '',
      };

      socketRef.current.emit('unsubscribe', request);
      console.log(
        `[Realtime] Unsubscribed from ${entityType}:${entityId || 'all'}`,
      );
    },
    [currentOrg],
  );

  const onEvent = useCallback((callback: (event: RealtimeEvent) => void) => {
    eventCallbacks.current.add(callback);
    return () => {
      eventCallbacks.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    if (autoConnect && auth.user && currentOrg) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, auth.user, currentOrg, connect, disconnect]);

  return {
    isConnected,
    subscribe,
    unsubscribe,
    onEvent,
    connect,
    disconnect,
  };
}
