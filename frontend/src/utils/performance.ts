/**
 * performance.ts
 * Utility functions for performance optimization and caching
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Global cache for entities to prevent duplicate API calls
 * Maps entity IDs to their data with expiration times
 */
const entityCache = new Map<string, {
  data: any;
  timestamp: number;
  expiresAt: number;
}>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Maximum cache size to prevent memory leaks
const MAX_CACHE_SIZE = 100;

/**
 * Store data in the entity cache
 */
export const cacheEntity = (
  id: string,
  data: any,
  expirationMs: number = CACHE_EXPIRATION
) => {
  // If cache is at maximum size, remove oldest entry
  if (entityCache.size >= MAX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    entityCache.forEach((value, key) => {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      entityCache.delete(oldestKey);
    }
  }

  // Add new entry to cache
  entityCache.set(id, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + expirationMs
  });
};

/**
 * Get data from the entity cache
 * Returns null if entry doesn't exist or is expired
 */
export const getCachedEntity = (id: string): any | null => {
  const entry = entityCache.get(id);
  
  // Return null if entry doesn't exist or is expired
  if (!entry || Date.now() > entry.expiresAt) {
    if (entry) {
      // Clean up expired entry
      entityCache.delete(id);
    }
    return null;
  }
  
  return entry.data;
};

/**
 * Clear specific entity from cache
 */
export const clearEntityCache = (id: string) => {
  entityCache.delete(id);
};

/**
 * Clear all entities from cache
 */
export const clearAllEntityCache = () => {
  entityCache.clear();
};

/**
 * Hook for lazy loading components only when they're visible
 */
export const useLazyLoad = (shouldLoad: boolean = false) => {
  const [isLoaded, setIsLoaded] = useState(shouldLoad);
  const wasLoadedOnceRef = useRef(false);
  
  useEffect(() => {
    // If component should be loaded, mark it as loaded
    if (shouldLoad && !isLoaded && !wasLoadedOnceRef.current) {
      setIsLoaded(true);
      wasLoadedOnceRef.current = true;
    }
  }, [shouldLoad, isLoaded]);
  
  return isLoaded;
};

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Hook to check if a component is visible in the viewport
 */
export const useIsVisible = (threshold = 0) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );
    
    observer.observe(ref.current);
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);
  
  return { ref, isVisible };
};

/**
 * Hook to measure and memoize rendering performance
 */
export const useMeasureRenders = (componentName: string) => {
  // Only measure in development
  if (process.env.NODE_ENV !== 'development') {
    return { renderCount: 0 };
  }
  
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered: ${renderCount.current} times`);
  });
  
  return { renderCount: renderCount.current };
};

/**
 * Hook to delay execution until after main content is loaded
 */
export const useDelayedExecution = (delay: number = 500) => {
  const [shouldExecute, setShouldExecute] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldExecute(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return shouldExecute;
};

/**
 * Hook to track component mounted state
 */
export const useIsMounted = () => {
  const isMounted = useRef(false);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  return useCallback(() => isMounted.current, []);
};

/**
 * Optimized equality comparison for objects
 * Used for React.memo optimizations
 */
export const areEqual = (prevProps: any, nextProps: any): boolean => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  return prevKeys.every(key => {
    const prevVal = prevProps[key];
    const nextVal = nextProps[key];
    
    // If both values are objects or arrays, shallow compare
    if (
      typeof prevVal === 'object' && prevVal !== null &&
      typeof nextVal === 'object' && nextVal !== null
    ) {
      // Special handling for arrays
      if (Array.isArray(prevVal) && Array.isArray(nextVal)) {
        if (prevVal.length !== nextVal.length) return false;
        return prevVal.every((val, i) => val === nextVal[i]);
      }
      
      // Simple object comparison (only check top-level keys)
      const prevObjKeys = Object.keys(prevVal);
      const nextObjKeys = Object.keys(nextVal);
      if (prevObjKeys.length !== nextObjKeys.length) return false;
      
      return prevObjKeys.every(k => 
        prevVal[k] === nextVal[k] || 
        (prevVal[k] === null && nextVal[k] === null) ||
        (typeof prevVal[k] === 'number' && isNaN(prevVal[k]) && 
         typeof nextVal[k] === 'number' && isNaN(nextVal[k]))
      );
    }
    
    // Direct comparison for primitive values
    return prevVal === nextVal;
  });
};

/**
 * Creates a deferred promise that resolves after the specified time
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};