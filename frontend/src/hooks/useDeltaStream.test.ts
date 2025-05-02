import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import useDeltaStream from './useDeltaStream';

// Mock ReconnectingWebSocket
vi.mock('reconnecting-websocket', () => {
  return vi.fn().mockImplementation(() => {
    return {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      send: vi.fn(),
      close: vi.fn()
    };
  });
});

describe('useDeltaStream', () => {
  let mockUrl = 'wss://example.com/stream';
  let mockOnMessage = vi.fn();
  
  // Get the mock ReconnectingWebSocket constructor
  const MockReconnectingWebSocket = vi.mocked(await import('reconnecting-websocket')).default;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with isConnected set to false', () => {
    const { result } = renderHook(() => useDeltaStream(mockUrl, mockOnMessage));
    
    expect(result.current.isConnected).toBe(false);
  });

  it('should connect to WebSocket on mount', () => {
    renderHook(() => useDeltaStream(mockUrl, mockOnMessage));
    
    // ReconnectingWebSocket should be instantiated with correct URL
    expect(MockReconnectingWebSocket).toHaveBeenCalledWith(mockUrl, [], expect.any(Object));
  });

  it('should add event listeners on WebSocket', () => {
    renderHook(() => useDeltaStream(mockUrl, mockOnMessage));
    
    // Get the mock instance
    const mockWs = MockReconnectingWebSocket.mock.results[0].value;
    
    // Should add open, message, close, and error event listeners
    expect(mockWs.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
    expect(mockWs.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockWs.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
    expect(mockWs.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should clean up WebSocket on unmount', () => {
    const { unmount } = renderHook(() => useDeltaStream(mockUrl, mockOnMessage));
    
    // Get the mock instance
    const mockWs = MockReconnectingWebSocket.mock.results[0].value;
    
    // Unmount the hook
    unmount();
    
    // Should remove event listeners
    expect(mockWs.removeEventListener).toHaveBeenCalledWith('open', expect.any(Function));
    expect(mockWs.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockWs.removeEventListener).toHaveBeenCalledWith('close', expect.any(Function));
    expect(mockWs.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    
    // Should close the WebSocket
    expect(mockWs.close).toHaveBeenCalled();
  });

  it('should send data through WebSocket', () => {
    const { result } = renderHook(() => useDeltaStream(mockUrl, mockOnMessage));
    
    // Get the mock instance
    const mockWs = MockReconnectingWebSocket.mock.results[0].value;
    
    // Send a message
    const testData = { type: 'test', payload: { id: 123 } };
    result.current.sendMessage(testData);
    
    // Should send the data as JSON
    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(testData));
  });

  it('should handle WebSocket connection events', async () => {
    const { result } = renderHook(() => useDeltaStream(mockUrl, mockOnMessage));
    
    // Get the mock instance and the event handlers
    const mockWs = MockReconnectingWebSocket.mock.results[0].value;
    const openHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'open')[1];
    const closeHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'close')[1];
    
    // Simulate WebSocket open event
    openHandler();
    expect(result.current.isConnected).toBe(true);
    
    // Simulate WebSocket close event
    closeHandler();
    expect(result.current.isConnected).toBe(false);
  });

  it('should call onMessage callback when message is received', async () => {
    const { result } = renderHook(() => useDeltaStream(mockUrl, mockOnMessage));
    
    // Get the mock instance and the message handler
    const mockWs = MockReconnectingWebSocket.mock.results[0].value;
    const messageHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')[1];
    
    // Create a mock message event
    const testData = { type: 'update', payload: { id: 123, data: 'test' } };
    const messageEvent = { data: JSON.stringify(testData) };
    
    // Simulate WebSocket message event
    messageHandler(messageEvent);
    
    // Should call onMessage with the parsed data
    expect(mockOnMessage).toHaveBeenCalledWith(testData);
  });

  it('should handle JSON parse errors', () => {
    // Spy on console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useDeltaStream(mockUrl, mockOnMessage));
    
    // Get the mock instance and the message handler
    const mockWs = MockReconnectingWebSocket.mock.results[0].value;
    const messageHandler = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')[1];
    
    // Create an invalid JSON message event
    const messageEvent = { data: 'this is not valid JSON' };
    
    // Simulate WebSocket message event with invalid JSON
    messageHandler(messageEvent);
    
    // Should log error and not call onMessage
    expect(consoleSpy).toHaveBeenCalled();
    expect(mockOnMessage).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});