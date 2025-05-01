import { useState, useEffect, useCallback, useRef } from 'react';
import { presenceService } from '../services/collaboration/PresenceService';
import { PresenceUser } from '../models/collaboration/PresenceUser';

interface CollaborationOptions {
  userId: string;
  documentId?: string;
  workspaceId?: string;
  sectionId?: string;
}

interface CursorPosition {
  start: number;
  end: number;
}

interface CollaborationState {
  participants: PresenceUser[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError: Error | null;
}

interface CollaborationService {
  participants: PresenceUser[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError: Error | null;
  sendCursorPosition: (position: CursorPosition) => void;
  sendContentChange: (content: string) => void;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * Custom hook for integrating with the collaboration service
 * Manages real-time presence and collaboration features
 */
export function useCollaborationService(options: CollaborationOptions): CollaborationService {
  const [state, setState] = useState<CollaborationState>({
    participants: [],
    connectionStatus: 'connecting',
    lastError: null
  });
  
  // Keep a reference to the options to avoid unnecessary effect triggers
  const optionsRef = useRef(options);
  optionsRef.current = options;
  
  // Websocket connection reference
  const connectionRef = useRef<WebSocket | null>(null);
  
  // Throttled cursor position updates
  const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Initialize the connection
   */
  useEffect(() => {
    const { userId, documentId, workspaceId, sectionId } = optionsRef.current;
    
    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));
    
    // In a real implementation, this would establish a WebSocket connection
    // For now, we'll use the presence service as a simulation
    
    // Listen for presence updates
    const unsubscribe = presenceService.subscribe((users) => {
      setState(prev => ({ 
        ...prev, 
        participants: users.filter(u => u.currentLocation?.documentId === documentId),
        connectionStatus: 'connected'
      }));
    });
    
    // Update our own presence
    presenceService.updateUserLocation(
      userId,
      workspaceId,
      sectionId,
      documentId
    );
    
    // Cleanup function
    return () => {
      unsubscribe();
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current);
      }
    };
  }, []);
  
  /**
   * Send cursor position to collaboration service
   */
  const sendCursorPosition = useCallback((position: CursorPosition) => {
    const { userId, documentId } = optionsRef.current;
    
    // Throttle cursor position updates to avoid excessive network traffic
    if (cursorUpdateTimeoutRef.current) {
      clearTimeout(cursorUpdateTimeoutRef.current);
    }
    
    cursorUpdateTimeoutRef.current = setTimeout(() => {
      // In a real implementation, this would send the position via WebSocket
      // For now, just update in the presence service
      presenceService.updateUserLocation(
        userId,
        undefined,
        undefined,
        documentId,
        position.start
      );
    }, 200); // 200ms throttle
  }, []);
  
  /**
   * Send content change to collaboration service
   */
  const sendContentChange = useCallback((content: string) => {
    const { documentId } = optionsRef.current;
    
    // In a real implementation, this would send the change via WebSocket
    console.log(`Content change for document ${documentId}:`, content.substring(0, 20) + '...');
  }, []);
  
  /**
   * Disconnect from the collaboration service
   */
  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
      setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
    }
  }, []);
  
  /**
   * Reconnect to the collaboration service
   */
  const reconnect = useCallback(() => {
    const { userId, documentId, workspaceId, sectionId } = optionsRef.current;
    
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    
    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));
    
    // In a real implementation, this would re-establish the WebSocket connection
    // For now, just update presence
    presenceService.updateUserStatus(userId, 'online');
    presenceService.updateUserLocation(
      userId,
      workspaceId,
      sectionId,
      documentId
    );
    
    setState(prev => ({ ...prev, connectionStatus: 'connected' }));
  }, []);
  
  return {
    participants: state.participants,
    connectionStatus: state.connectionStatus,
    lastError: state.lastError,
    sendCursorPosition,
    sendContentChange,
    disconnect,
    reconnect
  };
}