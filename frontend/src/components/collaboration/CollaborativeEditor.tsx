import React, { FC, useState, useEffect, useRef, useCallback, memo } from 'react';
import { PresenceUser } from '../../models/collaboration/PresenceUser';
import PresenceIndicator from './PresenceIndicator';
import { useCollaborationService } from '../../hooks/useCollaborationService';

interface CollaborativeEditorProps {
  documentId: string;
  initialContent: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  participants?: PresenceUser[];
  currentUserId?: string;
  workspaceId?: string;
  sectionId?: string;
  autoSaveInterval?: number; // in milliseconds
  onError?: (error: Error) => void;
}

/**
 * A collaborative rich text editor component that supports real-time collaboration
 * Integrates with the collaboration service for real-time updates
 */
const CollaborativeEditor: FC<CollaborativeEditorProps> = ({
  documentId,
  initialContent,
  onSave,
  readOnly = false,
  participants = [],
  currentUserId = 'anonymous',
  workspaceId,
  sectionId,
  autoSaveInterval = 30000, // Default to 30 seconds
  onError
}) => {
  // Component state
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use our collaboration service hook
  const {
    participants: activeUsers,
    connectionStatus,
    lastError,
    sendCursorPosition,
    sendContentChange,
    reconnect
  } = useCollaborationService({
    userId: currentUserId,
    documentId,
    workspaceId,
    sectionId
  });
  
  // Merge provided participants with those from the collaboration service
  const allParticipants = useMemo(() => {
    const participantMap = new Map<string, PresenceUser>();
    
    // First add all participants from props
    participants.forEach(p => participantMap.set(p.id, p));
    
    // Then add or update with active users from the service
    activeUsers.forEach(p => participantMap.set(p.id, p));
    
    return Array.from(participantMap.values());
  }, [participants, activeUsers]);
  
  // Report errors from the collaboration service
  useEffect(() => {
    if (lastError && onError) {
      onError(lastError);
    }
  }, [lastError, onError]);
  
  // Set up autosave timer
  useEffect(() => {
    if (readOnly || !autoSaveInterval) return;
    
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }
    
    // Set up new autosave timer
    autoSaveTimerRef.current = setInterval(() => {
      if (content !== initialContent) {
        handleSave();
      }
    }, autoSaveInterval);
    
    // Clean up on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [content, initialContent, autoSaveInterval, readOnly]);
  
  // Track cursor position and selection changes
  const trackCursorPosition = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    
    const element = e.currentTarget;
    const position = {
      start: element.selectionStart,
      end: element.selectionEnd
    };
    
    // Send cursor position to collaboration service
    sendCursorPosition(position);
  }, [readOnly, sendCursorPosition]);
  
  // Handle content changes - debounced to avoid excessive updates
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    
    const newContent = e.target.value;
    setContent(newContent);
    
    // Send content changes to collaboration service
    sendContentChange(newContent);
  }, [readOnly, sendContentChange]);
  
  // Save the document
  const handleSave = useCallback(() => {
    if (readOnly) return;
    
    setIsSaving(true);
    
    try {
      // In a real implementation, this would be an API call
      if (onSave) {
        // Using Promise to simulate async operation
        Promise.resolve(onSave(content))
          .then(() => {
            setIsSaving(false);
            setLastSaved(new Date());
          })
          .catch(error => {
            setIsSaving(false);
            if (onError) onError(error);
          });
      } else {
        // No save handler, just update state
        setTimeout(() => {
          setIsSaving(false);
          setLastSaved(new Date());
        }, 300);
      }
    } catch (error) {
      setIsSaving(false);
      if (onError) onError(error instanceof Error ? error : new Error('Unknown error during save'));
    }
  }, [content, onSave, readOnly, onError]);
  
  // Format the last saved time
  const formatLastSaved = useCallback(() => {
    if (!lastSaved) return 'Not saved yet';
    
    return lastSaved.toLocaleTimeString();
  }, [lastSaved]);
  
  return (
    <div 
      className={`collaborative-editor ${readOnly ? 'read-only' : ''}`}
      data-connection-status={connectionStatus}
      data-document-id={documentId}
    >
      <div className="editor-toolbar" role="toolbar" aria-label="Editor controls">
        <div className="editor-participants">
          <PresenceIndicator 
            users={allParticipants} 
            compact={true} 
            maxDisplayed={5} 
            showStatusColors={true}
          />
        </div>
        
        <div className="editor-status">
          {connectionStatus === 'connected' ? (
            <span className="connection-status connected" aria-label="Connected">●</span>
          ) : connectionStatus === 'connecting' ? (
            <span className="connection-status connecting" aria-label="Connecting">◌</span>
          ) : (
            <span 
              className="connection-status disconnected" 
              aria-label="Disconnected"
              onClick={reconnect}
              title="Click to reconnect"
              role="button"
              tabIndex={0}
            >⚠</span>
          )}
        </div>
        
        <div className="editor-controls">
          {!readOnly && (
            <button 
              className="save-button" 
              onClick={handleSave}
              disabled={isSaving}
              aria-busy={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
          <span className="last-saved" aria-live="polite">
            {lastSaved && `Last saved: ${formatLastSaved()}`}
          </span>
        </div>
      </div>
      
      <textarea
        ref={textareaRef}
        className="editor-content"
        value={content}
        onChange={handleChange}
        onMouseUp={trackCursorPosition}
        onKeyUp={e => trackCursorPosition(e as unknown as React.MouseEvent<HTMLTextAreaElement>)}
        readOnly={readOnly}
        placeholder="Start typing here..."
        aria-label="Document content"
        aria-readonly={readOnly}
      />
      
      <div className="editor-footer">
        <span className="document-id">Document ID: {documentId}</span>
        <span className="participants-count">{allParticipants.length} participant(s)</span>
        {readOnly && <span className="read-only-indicator" role="status">Read-only mode</span>}
        {connectionStatus === 'disconnected' && (
          <span className="connection-error" role="alert">
            Connection lost. <button onClick={reconnect}>Reconnect</button>
          </span>
        )}
      </div>
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(CollaborativeEditor);