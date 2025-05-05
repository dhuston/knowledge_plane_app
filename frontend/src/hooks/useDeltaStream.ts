import ReconnectingWebSocket from 'reconnecting-websocket';
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { useAuth } from '../context/AuthContext';
import { useFeatureFlags } from '../utils/featureFlags';

interface DeltaNode {
  id: string;
  label: string;
  type: string;
  position?: { x: number; y: number };
  data?: Record<string, unknown>;
}

interface DeltaEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, unknown>;
}

interface DeltaData {
  addNodes?: DeltaNode[];
  updateNodes?: DeltaNode[];
  removeNodeIds?: string[];
  addEdges?: DeltaEdge[];
  updateEdges?: DeltaEdge[];
  removeEdgeIds?: string[];
  [key: string]: unknown;
}

type DeltaStreamSubscriber = {
  dataType: string;
  callback: (data: unknown, operation: string) => void;
  unsubscribe: () => void;
};

/**
 * Custom hook for connecting to the delta stream WebSocket
 * and handling real-time updates to the map data.
 * 
 * @param onMessage - Callback to handle incoming messages
 */
const useDeltaStream = (onMessage?: (data: DeltaData) => void) => {
  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  const { flags } = useFeatureFlags();
  const { isAuthenticated, token } = useAuth(); // Get token from auth context
  const [connectionError, setConnectionError] = useState<boolean>(false);
  
  const debouncedOnMessage = useRef(
    debounce((data: DeltaData) => {
      if (onMessage) {
        onMessage(data);
      }
    }, 2000, { maxWait: 5000 })
  ).current;

  useEffect(() => {
    // Reset connection error when auth changes
    setConnectionError(false);
    
    // Only try to connect if authenticated and feature is enabled
    if (!isAuthenticated || !flags.enableDeltaStream) {
      return;
    }
    
    if (!token) {
      console.log('Delta stream not connecting: No token available');
      setConnectionError(true);
      return;
    }
    
    const wsOptions = {
      reconnectInterval: 2000,
      maxReconnectInterval: 10000,
      reconnectDecay: 1.5,
      maxRetries: 5, // Reduced max retries
    };

    // Calculate WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8001' : window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/ws/delta?token=${encodeURIComponent(token || '')}`;
    
    // Avoid logging token information, even if redacted
    const redactedUrl = wsUrl.replace(/token=.*/, 'token=REDACTED');
    const ws = new ReconnectingWebSocket(wsUrl, [], wsOptions);
    wsRef.current = ws;

    ws.addEventListener('open', () => {
      console.log('Delta stream connected');
      setConnectionError(false); // Reset error state on successful connection
    });

    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        debouncedOnMessage(data);
      } catch (err) {
        console.error('Failed to parse delta stream message:', err);
      }
    });

    ws.addEventListener('close', () => {
      console.log('Delta stream disconnected, attempting to reconnect...');
    });

    ws.addEventListener('error', (error) => {
      console.error('Delta stream connection error', error);
      setConnectionError(true);
      
      // Don't keep trying forever if server doesn't support the feature
      if (wsRef.current && wsRef.current._retryCount > 3) {
        console.log('Multiple connection failures - disabling reconnect attempts');
        console.log('This is expected during development if the WebSocket endpoint is not configured.');
        console.log('The map will still work with polling instead of WebSockets.');
        wsRef.current.close();
      }
    });

    return () => {
      debouncedOnMessage.flush();
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [debouncedOnMessage, token, flags.enableDeltaStream, isAuthenticated]);
  
  const subscribe = (dataType: string, callback: (data: unknown, operation: string) => void): DeltaStreamSubscriber => {
    // Simpler implementation that just provides the subscription interface
    // without actually trying to connect to WebSocket when the backend service is not available
    return {
      dataType,
      callback,
      unsubscribe: () => {
        // No-op unsubscribe as we're not actually setting up real listeners
        // in this implementation
      }
    };
  };
  
  return { 
    subscribe,
    connectionError
  };
}; 

export default useDeltaStream;