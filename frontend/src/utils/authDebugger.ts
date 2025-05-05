/**
 * Auth Debugger - Utility for detailed authentication flow logging
 * 
 * This utility provides structured logging specifically for auth-related events,
 * with optional persistence to localStorage for cross-session debugging
 */

// Configuration options
const CONFIG = {
  ENABLED: true,                   // Master toggle for auth debugging
  PERSIST_LOGS: true,              // Save logs to localStorage
  MAX_STORED_ENTRIES: 100,         // Maximum stored log entries
  LOCAL_STORAGE_KEY: 'auth_debug', // Key for localStorage
  FILE_LOGGING: true,              // Write logs to optional log file via backend - enabled during troubleshooting
  LOG_TO_CONSOLE: true,            // Output logs to console - enabled during troubleshooting
  CONSOLE_ONLY_MODE: true          // Skip backend logging, use console only - safer mode for development
};

// Log levels for different types of events
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Log entry type definition
export interface AuthLogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  event: string;
  details?: Record<string, any>;
  sessionId: string;
  location?: string;
}

// Track session ID to correlate logs
const SESSION_ID = Math.random().toString(36).substring(2, 10);

// In-memory log cache
let logCache: AuthLogEntry[] = [];

// Initialize by loading any existing logs and checking server connectivity
const initializeFromStorage = (): void => {
  if (CONFIG.PERSIST_LOGS) {
    try {
      const storedLogs = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY);
      if (storedLogs) {
        logCache = JSON.parse(storedLogs);
        // Enforce max size
        if (logCache.length > CONFIG.MAX_STORED_ENTRIES) {
          logCache = logCache.slice(-CONFIG.MAX_STORED_ENTRIES);
        }
      }
    } catch (e) {
      console.error('Error loading auth debug logs:', e);
    }
  }
  
  // Check if debug endpoint is available
  checkDebugEndpoint();
};

// Check if the debug endpoint is accessible to avoid connection errors
const checkDebugEndpoint = async (): Promise<void> => {
  // Skip check if we're already in console-only mode
  if (!CONFIG.FILE_LOGGING || CONFIG.CONSOLE_ONLY_MODE) return;
  
  try {
    // First check the health endpoint to see if the API is up at all
    const healthResponse = await fetch('/api/v1/health', { 
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!healthResponse.ok) {
      console.warn(`Auth logger: Backend API health check failed with status ${healthResponse.status} - using console only`);
      CONFIG.CONSOLE_ONLY_MODE = true;
      return;
    }
    
    // Now check if the debug endpoint specifically exists with an OPTIONS request
    // This is less intrusive than a POST and helps verify if the endpoint is available
    const debugResponse = await fetch('/api/v1/debug/auth-log', { 
      method: 'OPTIONS',
    });
    
    if (debugResponse.ok) {
      console.log('Auth logger: Debug endpoint available - server logging enabled');
      CONFIG.CONSOLE_ONLY_MODE = false;
      CONFIG.FILE_LOGGING = true;
    } else {
      console.warn(`Auth logger: Debug endpoint check failed with status ${debugResponse.status} - using console only`);
      CONFIG.CONSOLE_ONLY_MODE = true;
      CONFIG.FILE_LOGGING = false;
    }
  } catch (e) {
    console.warn('Auth logger: API connection failed - console-only mode enabled');
    CONFIG.CONSOLE_ONLY_MODE = true;
    CONFIG.FILE_LOGGING = false;
  }
};

// Save logs to localStorage
const persistLogs = (): void => {
  if (CONFIG.PERSIST_LOGS) {
    try {
      localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(logCache));
    } catch (e) {
      console.error('Error saving auth debug logs:', e);
    }
  }
};

// Create and store a new log entry
export const logAuthEvent = (
  level: LogLevel,
  component: string,
  event: string,
  details?: Record<string, any>
): void => {
  if (!CONFIG.ENABLED) return;

  // Get caller location if possible
  let location;
  try {
    throw new Error();
  } catch (e) {
    const stackLines = (e as Error).stack?.split('\n') || [];
    // Skip first two lines which are the Error constructor and this function
    location = stackLines[2]?.trim() || undefined;
  }

  const entry: AuthLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    event,
    details: sanitizeDetails(details),
    sessionId: SESSION_ID,
    location
  };

  // Add to in-memory cache
  logCache.push(entry);
  
  // Trim cache if it gets too large
  if (logCache.length > CONFIG.MAX_STORED_ENTRIES) {
    logCache = logCache.slice(-CONFIG.MAX_STORED_ENTRIES);
  }

  // Log to console with appropriate styling
  if (CONFIG.LOG_TO_CONSOLE) {
    const styles = getConsoleStyles(level);
    console.groupCollapsed(
      `%c${level}%c [AUTH:${component}] ${event}`,
      styles.levelStyle,
      styles.textStyle
    );
    console.log('Timestamp:', entry.timestamp);
    if (details) console.log('Details:', details);
    if (location) console.log('Location:', location);
    console.log('Session ID:', SESSION_ID);
    console.groupEnd();
  }

  // Persist logs if enabled
  persistLogs();

  // If file logging is enabled, send to backend
  if (CONFIG.FILE_LOGGING) {
    sendLogToBackend(entry).catch(err => {
      // Silently fail - we don't want to cause errors during debugging
      if (CONFIG.LOG_TO_CONSOLE) {
        console.error('Failed to send auth log to backend:', err);
      }
    });
  }
};

// Convenience methods for different log levels
export const logAuthDebug = (component: string, event: string, details?: Record<string, any>): void => {
  logAuthEvent(LogLevel.DEBUG, component, event, details);
};

export const logAuthInfo = (component: string, event: string, details?: Record<string, any>): void => {
  logAuthEvent(LogLevel.INFO, component, event, details);
};

export const logAuthWarning = (component: string, event: string, details?: Record<string, any>): void => {
  logAuthEvent(LogLevel.WARN, component, event, details);
};

export const logAuthError = (component: string, event: string, details?: Record<string, any>): void => {
  logAuthEvent(LogLevel.ERROR, component, event, details);
};

// Get all stored logs
export const getAuthLogs = (): AuthLogEntry[] => {
  return [...logCache];
};

// Clear all stored logs
export const clearAuthLogs = (): void => {
  logCache = [];
  if (CONFIG.PERSIST_LOGS) {
    localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEY);
  }
};

// Get pretty console styles for different log levels
const getConsoleStyles = (level: LogLevel): { levelStyle: string; textStyle: string } => {
  switch (level) {
    case LogLevel.DEBUG:
      return {
        levelStyle: 'background: #6B7280; color: white; padding: 2px 4px; border-radius: 2px; font-weight: bold;',
        textStyle: 'color: #6B7280; font-weight: normal;'
      };
    case LogLevel.INFO:
      return {
        levelStyle: 'background: #3B82F6; color: white; padding: 2px 4px; border-radius: 2px; font-weight: bold;',
        textStyle: 'color: #3B82F6; font-weight: normal;'
      };
    case LogLevel.WARN:
      return {
        levelStyle: 'background: #F59E0B; color: white; padding: 2px 4px; border-radius: 2px; font-weight: bold;',
        textStyle: 'color: #F59E0B; font-weight: normal;'
      };
    case LogLevel.ERROR:
      return {
        levelStyle: 'background: #EF4444; color: white; padding: 2px 4px; border-radius: 2px; font-weight: bold;',
        textStyle: 'color: #EF4444; font-weight: normal;'
      };
  }
};

// Send log to backend for file storage
const sendLogToBackend = async (entry: AuthLogEntry): Promise<void> => {
  // Skip entirely if file logging is disabled or console-only mode is enabled
  if (!CONFIG.FILE_LOGGING || CONFIG.CONSOLE_ONLY_MODE) return;

  try {
    // Use the correct URL that will work with the Vite proxy
    const response = await fetch('/api/v1/debug/auth-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entry),
      // No credentials/auth - this endpoint should be open for debugging
    });
    
    if (!response.ok) {
      // If we couldn't send to server, just log locally
      console.log(`Auth logger: Server logging failed with status ${response.status} - using console-only mode`);
      
      // Turn off file logging after repeated failures to avoid console spam
      if (response.status === 404) {
        CONFIG.CONSOLE_ONLY_MODE = true;
        CONFIG.FILE_LOGGING = false;
      }
    }
  } catch (e) {
    // Silently fail but disable future attempts if there's a connection error
    console.log('Auth logger: Network error - switching to console-only mode');
    
    // Set both flags to prevent future attempts
    CONFIG.CONSOLE_ONLY_MODE = true;
    CONFIG.FILE_LOGGING = false;
    return;
  }
};

// Sanitize sensitive data before logging
const sanitizeDetails = (details?: Record<string, any>): Record<string, any> | undefined => {
  if (!details) return undefined;
  
  const sanitized = { ...details };
  
  // List of sensitive fields to redact
  const sensitiveFields = [
    'password', 'token', 'accessToken', 'refreshToken', 'secret',
    'key', 'apiKey', 'jwt', 'credentials'
  ];
  
  // Redact any sensitive fields
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      if (typeof sanitized[key] === 'string') {
        // Keep first and last few characters but replace middle with asterisks
        const value = sanitized[key] as string;
        if (value.length > 8) {
          sanitized[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
        } else {
          sanitized[key] = '********';
        }
      } else {
        sanitized[key] = '[REDACTED]';
      }
    }
  });
  
  return sanitized;
};

// Analyze token details without exposing the token itself
export const analyzeJwtToken = (token?: string | null): Record<string, any> => {
  if (!token) return { valid: false, reason: 'No token provided' };
  
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Invalid token format' };
    }
    
    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Extract key information
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp ? payload.exp < now : true;
    const timeToExpire = payload.exp ? payload.exp - now : 0;
    
    return {
      valid: !isExpired,
      isExpired,
      timeToExpire,
      expiryDate: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
      userId: payload.sub,
      tenantId: payload.tenant_id,
      issueDate: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
      tokenPreview: `${parts[0].substring(0, 6)}...${parts[2].substring(parts[2].length - 6)}`
    };
  } catch (e) {
    return { 
      valid: false, 
      reason: `Token parsing error: ${(e as Error).message}`,
      tokenLength: token.length
    };
  }
};

// Initialize on import
initializeFromStorage();

export default {
  logAuthDebug,
  logAuthInfo,
  logAuthWarning,
  logAuthError,
  getAuthLogs,
  clearAuthLogs,
  analyzeJwtToken
};