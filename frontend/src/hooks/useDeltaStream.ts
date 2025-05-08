import ReconnectingWebSocket from 'reconnecting-websocket';
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { useAuth } from '../auth/AuthContext';
import { tokenManager } from '../auth/TokenManager';

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
  const { isAuthenticated } = useAuth(); // Get auth state from context
  const [connectionError, setConnectionError] = useState<boolean>(false);
  
  // Feature flags removed, use a constant instead
  const enableDeltaStream = false; // Delta stream is disabled
  
  const debouncedOnMessage = useRef(
    debounce((data: DeltaData) => {
      if (onMessage) {
        onMessage(data);
      }
    }, 2000, { maxWait: 5000 })
  ).current;

  useEffect(() => {
    // Simplified implementation that doesn't attempt WebSocket connections
    // Log an informative message instead
    console.log('Delta stream functionality has been disabled');
    
    // Return cleanup function
    return () => {
      if (debouncedOnMessage) {
        debouncedOnMessage.flush();
      }
    };
  }, [debouncedOnMessage]);
  
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