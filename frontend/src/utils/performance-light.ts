/**
 * Simplified performance utilities to replace the full performance.ts module
 * Contains only the essential functions needed for the app to function
 */

import { useEffect, useState, useRef, DependencyList } from 'react';

// Simple in-memory cache
const entityCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

/**
 * Cache an entity with a key
 * 
 * @param key Cache key
 * @param data Data to cache
 * @param expiration Optional expiration time in ms (default: 5 minutes)
 */
export function cacheEntity(key: string, data: any, expiration: number = CACHE_EXPIRATION): void {
  entityCache[key] = {
    data,
    timestamp: Date.now()
  };
  
  // Cleanup old entries periodically
  if (Object.keys(entityCache).length > 100) {
    const now = Date.now();
    Object.keys(entityCache).forEach(cacheKey => {
      if (now - entityCache[cacheKey].timestamp > expiration) {
        delete entityCache[cacheKey];
      }
    });
  }
}

/**
 * Retrieve an entity from cache
 * 
 * @param key Cache key
 * @param maxAge Optional max age in ms
 * @returns Cached data or null if not found/expired
 */
export function getCachedEntity<T>(key: string, maxAge: number = CACHE_EXPIRATION): T | null {
  const cached = entityCache[key];
  if (!cached) return null;
  
  // Check if expired
  if (Date.now() - cached.timestamp > maxAge) {
    delete entityCache[key];
    return null;
  }
  
  return cached.data as T;
}

/**
 * Hook to check if a component is still mounted
 * Prevents state updates on unmounted components
 */
export function useIsMounted(): () => boolean {
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  return () => isMounted.current;
}

/**
 * Hook for lazy loading or delayed execution
 * Returns true after the specified delay
 * 
 * @param delay Delay in milliseconds
 * @returns Boolean indicating if the delay has passed
 */
export function useDelayedExecution(delay: number): boolean {
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [delay]);
  
  return ready;
}

/**
 * Hook for lazy loading components
 * 
 * @param dependencies Dependencies array to trigger loading
 * @param delayMs Optional delay before setting loaded to true
 */
export function useLazyLoad(dependencies: DependencyList = [], delayMs: number = 0): boolean {
  const [isLoaded, setIsLoaded] = useState(delayMs === 0);
  
  useEffect(() => {
    if (delayMs === 0) {
      setIsLoaded(true);
      return;
    }
    
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, delayMs);
    
    return () => clearTimeout(timer);
  }, dependencies);
  
  return isLoaded;
}

/**
 * Compare objects for deep equality
 * 
 * @param obj1 First object to compare
 * @param obj2 Second object to compare
 * @returns True if objects are equal
 */
export function areEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!obj2.hasOwnProperty(key)) return false;
    if (!areEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

/**
 * Measure performance of a function (simplified version)
 */
export function measurePerformance<T>(name: string, fn: (...args: any[]) => T, ...args: any[]): T {
  const start = performance.now();
  const result = fn(...args);
  const duration = performance.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Hooks for basic component performance tracking
 */
export const useComponentPerformance = (componentName: string) => {
  return {
    start: () => console.log(`[Performance] ${componentName} started`),
    end: () => console.log(`[Performance] ${componentName} completed`)
  };
};

/**
 * Measure async operations (simplified)
 */
export async function measureAsync<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - start;
    console.log(`[Performance] ${operationName}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    console.error(`[Performance] ${operationName} failed:`, error);
    throw error;
  }
}

// Simplified mock for perfume.js
export const perfume = {
  start: (metricName: string) => {
    console.log(`[Perfume stub] Started: ${metricName}`);
  },
  end: (metricName: string) => {
    console.log(`[Perfume stub] Ended: ${metricName}`);
  }
};

/**
 * Simplified implementation of useChunkedProcessing
 * Processes data in chunks to avoid UI freezing
 */
export function useChunkedProcessing<T, R>(items: T[], processFunction: (chunk: T[]) => R[], chunkSize: number = 50) {
  // Simple implementation that processes all at once but maintains the API
  const [results, setResults] = useState<R[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  
  useEffect(() => {
    setIsProcessing(true);
    // Just process everything at once in this simplified version
    const processed = processFunction(items);
    setResults(processed);
    setIsProcessing(false);
  }, [items, processFunction]);
  
  return {
    results,
    isProcessing
  };
}

/**
 * Simplified implementation of useChunkedRendering
 * Returns all items immediately rather than chunking the rendering
 */
export function useChunkedRendering<T>(items: T[], chunkSize: number = 10, delay: number = 16) {
  return {
    renderedItems: items,
    isComplete: true,
    progress: 100
  };
}

/**
 * Simplified implementation of useVirtualizedList
 * Returns all items for rendering rather than virtualizing
 */
export function useVirtualizedList<T>(items: T[], itemHeight: number, containerHeight: number) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const virtualItems = items.map((item, index) => ({
    index,
    item,
    key: (item as any).id || `item-${index}`,
    offsetTop: index * itemHeight,
    height: itemHeight
  }));
  
  return {
    containerRef,
    handleScroll: () => {},
    virtualItems,
    totalHeight: items.length * itemHeight
  };
}

/**
 * Simplified implementation of useExpandableGroups
 * Returns all groups as expanded
 */
export function useExpandableGroups(
  groupIds: string[], 
  options: { defaultExpanded?: boolean; maxSimultaneousExpanded?: number } = {}
) {
  const expandedGroups: Record<string, boolean> = {};
  
  // Default to all expanded in simplified implementation
  groupIds.forEach(id => {
    expandedGroups[id] = true;
  });
  
  return {
    expandedGroups,
    toggleGroupExpansion: (groupId: string) => {},
    expandAllGroups: () => {},
    collapseAllGroups: () => {}
  };
}