/* eslint-disable @typescript-eslint/no-explicit-any */
import ReconnectingWebSocket from 'reconnecting-websocket';
import { useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import { useAuth } from '../context/AuthContext';

// Minimal subset of delta message shape – extend as needed
interface DeltaData {
  addNodes?: any[];
  updateNodes?: any[];
  removeNodeIds?: string[];
  addEdges?: any[];
  updateEdges?: any[];
  removeEdgeIds?: string[];
  [key: string]: any;
}

type DeltaStreamSubscriber = {
  dataType: string;
  callback: (data: any, operation: string) => void;
  unsubscribe: () => void;
};

/**
 * Custom hook for connecting to the delta stream WebSocket
 * and handling real-time updates to the map data.
 * 
 * @param onMessage - Callback to handle incoming messages
 */
const useDeltaStream = (onMessage: (data: DeltaData) => void) => {
  // Get token from localStorage directly to ensure latest token
  const token = localStorage.getItem('knowledge_plane_token');
  // Store the WebSocket connection in a ref to persist across renders
  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  
  // Create a debounced version of the onMessage callback to prevent
  // excessive updates (2-second debounce)
  const debouncedOnMessage = useRef(
    debounce((data: DeltaData) => {
      onMessage(data);
    }, 2000, { maxWait: 5000 })
  ).current;

  useEffect(() => {
    // Configuration for the WebSocket with better reconnection parameters
    const wsOptions = {
      reconnectInterval: 2000, // Start with 2 second reconnect interval
      maxReconnectInterval: 10000, // Max reconnect interval of 10 seconds
      reconnectDecay: 1.5, // Increase retry interval by this factor each attempt
      maxRetries: 10, // Maximum number of reconnection attempts
    };

    // Build authenticated WebSocket URL (token query param)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8001' : window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/ws/delta?token=${encodeURIComponent(token || '')}`;
    
    console.log('Connecting to WebSocket:', wsUrl.replace(/token=.*/, 'token=REDACTED'));
    const ws = new ReconnectingWebSocket(wsUrl, [], wsOptions);
    wsRef.current = ws;

    // Set up event listeners
    ws.addEventListener('open', () => {
      console.log('Delta stream connected');
    });

    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        // Process messages through the debounced handler to prevent floods of updates
        debouncedOnMessage(data);
      } catch (err) {
        console.error('Failed to parse delta stream message:', err);
      }
    });

    ws.addEventListener('close', () => {
      console.log('Delta stream disconnected, attempting to reconnect...');
    });

    ws.addEventListener('error', () => {
      console.error('Delta stream connection error');
    });

    // Cleanup function to close the connection and remove event listeners
    return () => {
      // Flush any pending debounced calls
      debouncedOnMessage.flush();
      
      // Close the WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [debouncedOnMessage, token]); // Recreate connection when token changes
  
  // Add subscription functionality for notifications
  const subscribe = (dataType: string, callback: (data: any, operation: string) => void): DeltaStreamSubscriber => {
    // Create a subscriber object with unsubscribe method
    const subscriber: DeltaStreamSubscriber = {
      dataType,
      callback,
      unsubscribe: () => {
        // Unsubscribe function (empty for now as we don't track subscribers)
      }
    };
    
    return subscriber;
  };
  
  return { subscribe };
}; 

export default useDeltaStream;