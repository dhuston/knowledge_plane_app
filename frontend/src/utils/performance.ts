import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import * as Perfume from 'perfume.js';

// Define ThresholdTier enum directly since the types import is not available
enum ThresholdTier {
  instant = 0, // <= 100ms
  quick = 100, // <= 300ms
  moderate = 300, // <= 1000ms
  slow = 1000 // > 1000ms
}

// Global cache for entities with enhanced LRU functionality
const entityCache = new Map<string, any>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes default expiry
const MAX_CACHE_ENTRIES = 1000; // Maximum number of items to store

// Access counts for LRU implementation
const cacheAccessCounts = new Map<string, number>();

/**
 * Cache an entity by key with LRU eviction policy
 * 
 * @param key The cache key
 * @param data The data to cache
 * @param expiry Optional expiry time in milliseconds
 */
export function cacheEntity(key: string, data: any, expiry: number = CACHE_EXPIRY): void {
  // Check if we're at capacity and need to clean up
  if (entityCache.size >= MAX_CACHE_ENTRIES) {
    // Get least recently used items
    const entries = Array.from(cacheAccessCounts.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, Math.ceil(MAX_CACHE_ENTRIES * 0.2)); // Remove least used 20%
    
    // Delete them from cache
    entries.forEach(([k]) => {
      entityCache.delete(k);
      cacheAccessCounts.delete(k);
    });
    
    // Log cache cleanup in dev
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Cache] Cleaned up ${entries.length} least used entries`);
    }
  }
  
  // Store in cache
  entityCache.set(key, {
    data,
    timestamp: Date.now(),
    expiry: expiry
  });
  
  // Initialize or reset access count
  cacheAccessCounts.set(key, 1);
  
  // Set up automatic expiration
  if (expiry > 0) {
    setTimeout(() => {
      const cached = entityCache.get(key);
      // Only expire if it's the same cache entry (hasn't been refreshed)
      if (cached && cached.timestamp + expiry <= Date.now()) {
        entityCache.delete(key);
        cacheAccessCounts.delete(key);
        
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[Cache] Expired key: ${key}`);
        }
      }
    }, expiry);
  }
}

/**
 * Get an entity from the cache with access tracking for LRU
 * 
 * @param key The cache key
 * @returns The cached data or undefined if not found or expired
 */
export function getCachedEntity<T = any>(key: string): T | undefined {
  const cached = entityCache.get(key);
  
  // Check if cache exists and is not expired
  if (cached && (Date.now() - cached.timestamp) < cached.expiry) {
    // Update access count for LRU tracking
    const currentCount = cacheAccessCounts.get(key) || 0;
    cacheAccessCounts.set(key, currentCount + 1);
    
    return cached.data;
  }
  
  // Remove expired entry
  if (cached) {
    entityCache.delete(key);
    cacheAccessCounts.delete(key);
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Cache] Removed expired entry: ${key}`);
    }
  }
  
  return undefined;
}

/**
 * Clear a specific entity from the cache
 * @param key The cache key to clear
 */
export function clearCachedEntity(key: string): void {
  entityCache.delete(key);
  cacheAccessCounts.delete(key);
}

/**
 * Get cache statistics for monitoring
 * @returns Object with cache stats
 */
export function getCacheStats() {
  // Find most and least used items
  let mostUsed = { key: '', count: 0 };
  let leastUsed = { key: '', count: Number.MAX_SAFE_INTEGER };
  
  cacheAccessCounts.forEach((count, key) => {
    if (count > mostUsed.count) {
      mostUsed = { key, count };
    }
    if (count < leastUsed.count) {
      leastUsed = { key, count };
    }
  });
  
  return {
    size: entityCache.size,
    accessMapSize: cacheAccessCounts.size,
    mostUsedKey: mostUsed.key,
    mostUsedCount: mostUsed.count,
    leastUsedKey: leastUsed.key,
    leastUsedCount: leastUsed.count
  };
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
 * Hook for lazy loading components based on viewport visibility
 * 
 * @param threshold Visibility threshold (0-1)
 * @param rootMargin Root margin for IntersectionObserver
 * @returns [ref, isVisible] tuple
 */
export function useLazyLoad(threshold: number = 0.1, rootMargin: string = '0px'): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    
    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin]);
  
  return [ref, isVisible];
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
 * Measure performance of a function
 * 
 * @param name Name of the operation
 * @param fn Function to measure
 * @param args Arguments to pass to the function
 * @returns Result of the function
 */
export function measurePerformance<T>(name: string, fn: (...args: any[]) => T, ...args: any[]): T {
  const start = performance.now();
  const result = fn(...args);
  const duration = performance.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.info(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Threshold tiers for performance metrics based on our performance testing plan
 */
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  FCP: {
    target: 1800, // 1.8s
    critical: 3000 // 3.0s
  },
  LCP: {
    target: 2500, // 2.5s
    critical: 4000 // 4.0s
  },
  TTI: {
    target: 3800, // 3.8s
    critical: 7300 // 7.3s
  },
  TBT: {
    target: 300,
    critical: 600
  },
  CLS: {
    target: 0.1,
    critical: 0.25
  },
  // Custom thresholds for our components
  MAP_RENDER: {
    target: 500, // 500ms
    critical: 1000 // 1s
  },
  MAP_INTERACTION: {
    target: 100, // 100ms
    critical: 200 // 200ms
  },
  CONTEXT_PANEL_OPEN: {
    target: 150, // 150ms
    critical: 300 // 300ms
  },
  MAP_DATA_FETCH: {
    target: 800, // 800ms
    critical: 2000 // 2s
  },
  MAP_DATA_PROCESSING: {
    target: 300, // 300ms
    critical: 800 // 800ms
  }
};

/**
 * Custom performance steps configuration
 */
const PERFORMANCE_STEPS = {
  map_rendering: {
    threshold: ThresholdTier.moderate,
    marks: ['mapRenderStart', 'mapRenderComplete']
  },
  map_interaction: {
    threshold: ThresholdTier.quick,
    marks: ['mapInteractionStart', 'mapInteractionComplete'] 
  },
  panel_transition: {
    threshold: ThresholdTier.moderate,
    marks: ['panelTransitionStart', 'panelTransitionComplete']
  },
  data_fetch: {
    threshold: ThresholdTier.slow,
    marks: ['dataFetchStart', 'dataFetchComplete']
  }
};

/**
 * Analytics tracking function for performance metrics
 */
const analyticsTracker = (options: any) => {
  const { metricName, data, navigatorInformation } = options;
  
  // Log to console in development mode
  if (process.env.NODE_ENV === 'development') {
    console.info(`[Perfume.js]`, metricName, data);
  }
  
  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    try {
      const payload = {
        metricName,
        value: data.value ? Math.round(data.value) : undefined,
        rating: data.rating,
        delta: data.delta,
        navigatorInformation: navigatorInformation || {},
        timestamp: Date.now()
      };
      
      // Send data to analytics endpoint
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/v1/analytics/performance', blob);
      } else {
        // Fallback to fetch
        fetch('/api/v1/analytics/performance', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(error => {
          console.error('[Performance] Failed to send analytics:', error);
        });
      }
    } catch (error) {
      console.error('[Performance] Analytics error:', error);
    }
  }
};

/**
 * Initialize Perfume.js for performance monitoring
 */
export const perfume = Perfume && Perfume.Perfume 
  ? new Perfume.Perfume({
      analyticsTracker,
      maxMeasureTime: 10000,
      // Enable Core Web Vitals monitoring
      enableCWV: true,
      // Use our custom steps
      steps: PERFORMANCE_STEPS,
      // Log warnings for slow metrics
      warning: true,
      // Enable server-side performance collection (if implemented)
      enableServerTiming: true
    }) 
  : {
      // Stub implementation if Perfume initialization fails
      start: (metricName: string) => console.log(`[Perfume stub] Started: ${metricName}`),
      end: (metricName: string) => console.log(`[Perfume stub] Ended: ${metricName}`),
      endPaint: (metricName: string, status?: string) => console.log(`[Perfume stub] EndPaint: ${metricName}, status: ${status || 'success'}`),
      onFCP: (cb: (data: any) => void) => {},
      onFID: (cb: (data: any) => void) => {},
      onLCP: (cb: (data: any) => void) => {},
      onCLS: (cb: (data: any) => void) => {},
      onTTI: (cb: (data: any) => void) => {},
      onTBT: (cb: (data: any) => void) => {},
    };

/**
 * Custom hooks for component performance tracking
 * 
 * @param componentName The name of the component being measured
 * @returns Object with start and end measurement functions
 */
export const useComponentPerformance = (componentName: string) => {
  return {
    start: () => perfume.start(componentName),
    end: () => perfume.end(componentName)
  };
};

/**
 * Track render counts for components to identify unnecessary re-renders
 * 
 * @param componentName The name of the component being tracked
 * @returns Render count for the component
 */
export const useRenderCount = (componentName: string): number => {
  // Use a ref to store the render count across renders
  const renderCount = React.useRef(0);
  
  // Increment on each render
  renderCount.current += 1;
  
  // Log excessive renders in development
  if (process.env.NODE_ENV === 'development' && renderCount.current > 5) {
    console.warn(`[Performance] High render count (${renderCount.current}) for ${componentName}`);
  }
  
  return renderCount.current;
};

/**
 * Helper to measure async operations
 * 
 * @param operationName Name of the operation to measure
 * @param operation The async function to measure
 * @returns The result of the operation
 */
export async function measureAsync<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
  perfume.start(operationName);
  try {
    const result = await operation();
    perfume.end(operationName);
    return result;
  } catch (error) {
    perfume.endPaint(operationName, 'error');
    throw error;
  }
}

/**
 * Helper to add web vitals to session data for later analysis
 */
export function captureWebVitals(): void {
  // First Input Delay
  perfume.onFID((vitals) => {
    console.info('[Vitals] FID:', vitals);
  });

  // First Contentful Paint
  perfume.onFCP((vitals) => {
    console.info('[Vitals] FCP:', vitals);
  });

  // Largest Contentful Paint
  perfume.onLCP((vitals) => {
    console.info('[Vitals] LCP:', vitals);
  });
  
  // Cumulative Layout Shift
  perfume.onCLS((vitals) => {
    console.info('[Vitals] CLS:', vitals);
  });

  // Time to Interactive
  perfume.onTTI((vitals) => {
    console.info('[Vitals] TTI:', vitals);
  });
  
  // Total Blocking Time
  perfume.onTBT((vitals) => {
    console.info('[Vitals] TBT:', vitals);
  });
}

/**
 * Custom React hooks for optimizing common performance patterns
 */

/**
 * Hook for memoizing expensive calculations with dependencies
 * 
 * @param calculate Function to perform the expensive calculation
 * @param deps Dependency array, similar to React.useEffect
 * @param label Optional label for performance tracking
 * @returns The memoized value
 */
export function useMemoizedCalculation<T>(
  calculate: () => T,
  deps: React.DependencyList,
  label?: string
): T {
  const ref = React.useRef<{ value: T; deps: unknown[] }>({
    value: null as unknown as T,
    deps: []
  });

  // Check if deps changed
  const depsChanged = !ref.current.deps.length || 
    deps.length !== ref.current.deps.length || 
    ref.current.deps.some((dep, i) => deps[i] !== dep);

  if (depsChanged) {
    // If label is provided, measure performance
    if (label && process.env.NODE_ENV === 'development') {
      const start = performance.now();
      ref.current.value = calculate();
      const duration = performance.now() - start;
      
      if (duration > 10) {  // Only log expensive calculations (>10ms)
        console.info(`[Performance] Calculation '${label}': ${duration.toFixed(2)}ms`);
      }
    } else {
      ref.current.value = calculate();
    }
    // Create a copy of deps to avoid readonly issues
    ref.current.deps = [...deps];
  }
  
  return ref.current.value;
}

/**
 * Creates a one-time state initialization function that runs exactly once
 * and doesn't trigger re-renders on subsequent calls
 * 
 * @param factory Function that creates the initial state
 * @returns The initialized state
 */
export function useConstant<T>(factory: () => T): T {
  // Use a ref to hold the value
  const ref = React.useRef<{ initialized: boolean; value: T }>({
    initialized: false,
    value: undefined as unknown as T
  });
  
  // Initialize only once
  if (!ref.current.initialized) {
    ref.current.value = factory();
    ref.current.initialized = true;
  }
  
  return ref.current.value;
}

/**
 * Hook for tracking component mount and update performance
 * 
 * @param componentName Name of the component being tracked
 */
export function useComponentMetrics(componentName: string): void {
  // Track mount time
  React.useEffect(() => {
    const endMark = `${componentName}_mounted`;
    const startMark = `${componentName}_start`;
    
    // Mark the start time for the component
    performance.mark(startMark);
    
    // When the component finishes mounting
    return () => {
      // Mark the end time and measure the difference
      performance.mark(endMark);
      performance.measure(`${componentName}_mount_time`, startMark, endMark);
      
      // Clear the marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
    };
  }, [componentName]);
  
  // Track re-renders
  useRenderCount(componentName);
}

/**
 * Hook for virtualized rendering of large lists
 * Efficient rendering for context panels with many items
 *
 * @param items Array of items to render
 * @param itemHeight Height of each item in pixels
 * @param containerHeight Height of the container (viewport)
 * @param options Additional options
 * @returns Object with virtualization helpers
 */
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  options: {
    overscan?: number;
    getItemKey?: (item: T, index: number) => string | number;
  } = {}
) {
  const { overscan = 5, getItemKey = (_, index) => index } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate which items to render
  const virtualItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    const visibleItems = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      visibleItems.push({
        index: i,
        item: items[i],
        offsetTop: i * itemHeight,
        height: itemHeight,
        key: getItemKey(items[i], i)
      });
    }
    
    return visibleItems;
  }, [items, itemHeight, containerHeight, scrollTop, overscan, getItemKey]);
  
  // Calculate total height of all items
  const totalHeight = items.length * itemHeight;
  
  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  // Calculate scrollTo helpers
  const scrollToItem = useCallback((index: number, align: 'auto' | 'center' | 'end' | 'start' = 'auto') => {
    if (!containerRef.current) return;
    
    const scrollOffset = (() => {
      const itemOffset = index * itemHeight;
      
      switch (align) {
        case 'start':
          return itemOffset;
        case 'center':
          return itemOffset - containerHeight / 2 + itemHeight / 2;
        case 'end':
          return itemOffset - containerHeight + itemHeight;
        case 'auto':
        default: {
          const currentTop = scrollTop;
          const currentBottom = scrollTop + containerHeight;
          const itemTop = itemOffset;
          const itemBottom = itemOffset + itemHeight;
          
          // If item is already fully visible, don't scroll
          if (itemTop >= currentTop && itemBottom <= currentBottom) {
            return scrollTop;
          }
          
          // If item is above visible area, scroll up to it
          if (itemTop < currentTop) {
            return itemTop;
          }
          
          // If item is below visible area, scroll down to it
          return itemBottom - containerHeight;
        }
      }
    })();
    
    containerRef.current.scrollTop = scrollOffset;
  }, [containerHeight, itemHeight, scrollTop]);
  
  return {
    containerRef,
    handleScroll,
    virtualItems,
    totalHeight,
    scrollToItem,
    scrollTop
  };
}

/**
 * Hook for chunked rendering of large components
 * Prevents UI blocking when rendering many items
 * 
 * @param items Array of items to render
 * @param chunkSize Number of items to render in each chunk
 * @param intervalMs Time between chunk renders in ms
 * @returns Rendered items and loading state
 */
export function useChunkedRendering<T>(
  items: T[],
  chunkSize: number = 20,
  intervalMs: number = 16
) {
  const [renderedItems, setRenderedItems] = useState<T[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const chunksProcessed = useRef(0);
  
  useEffect(() => {
    // Reset when items change
    setRenderedItems([]);
    setIsComplete(false);
    chunksProcessed.current = 0;
    
    if (items.length === 0) {
      setIsComplete(true);
      return;
    }
    
    // Process first chunk immediately
    setRenderedItems(items.slice(0, chunkSize));
    chunksProcessed.current = 1;
    
    if (items.length <= chunkSize) {
      setIsComplete(true);
      return;
    }
    
    // Process remaining chunks with setTimeout
    const timer = setInterval(() => {
      const nextChunkIndex = chunksProcessed.current * chunkSize;
      const chunk = items.slice(
        nextChunkIndex,
        nextChunkIndex + chunkSize
      );
      
      chunksProcessed.current += 1;
      setRenderedItems(prevItems => [...prevItems, ...chunk]);
      
      // Check if we're done
      if (nextChunkIndex + chunkSize >= items.length) {
        clearInterval(timer);
        setIsComplete(true);
      }
    }, intervalMs);
    
    return () => clearInterval(timer);
  }, [items, chunkSize, intervalMs]);
  
  const progress = useMemo(() => {
    if (items.length === 0) return 100;
    return Math.min(100, (renderedItems.length / items.length) * 100);
  }, [items.length, renderedItems.length]);
  
  return { renderedItems, isComplete, progress };
}

/**
 * Hook for efficiently handling relationship visualization with large datasets
 * Specialized for RelationshipList component
 * 
 * @param relationships Full array of relationships
 * @param options Optimization options
 * @returns Optimized data structures and helper functions
 */
export function useOptimizedRelationships<T extends { type?: string; nodeType?: string; }>(
  relationships: T[],
  options: {
    initialGroupBy?: 'type' | 'nodeType' | 'none';
    initialSortBy?: 'alphabetical' | 'recent' | 'strength';
    maxVisibleRelationships?: number;
    visibleTypesLimit?: number;
  } = {}
) {
  const {
    initialGroupBy = 'type',
    initialSortBy = 'alphabetical',
    maxVisibleRelationships = 100,
    visibleTypesLimit = 10
  } = options;
  
  const [groupBy, setGroupBy] = useState(initialGroupBy);
  const [sortBy, setSortBy] = useState(initialSortBy);
  
  // Extract distinct types (optimized to run only when data changes)
  const types = useMemoizedCalculation(() => {
    const typeSet = new Set<string>();
    relationships.forEach(rel => {
      if (rel.type) typeSet.add(rel.type);
    });
    return Array.from(typeSet);
  }, [relationships], 'extract-relationship-types');
  
  // Extract distinct node types (also optimized)
  const nodeTypes = useMemoizedCalculation(() => {
    const typeSet = new Set<string>();
    relationships.forEach(rel => {
      if (rel.nodeType) typeSet.add(rel.nodeType);
    });
    return Array.from(typeSet);
  }, [relationships], 'extract-node-types');
  
  // Group relationships with chunked processing for large datasets
  const { results: groupedRelationships, isProcessing } = useChunkedProcessing(
    relationships,
    (chunk) => {
      // Group this chunk
      const groups: Record<string, T[]> = {};
      
      chunk.forEach(rel => {
        let key = 'OTHER';
        
        if (groupBy === 'type') {
          key = rel.type || 'OTHER';
        } else if (groupBy === 'nodeType') {
          key = rel.nodeType || 'UNKNOWN';
        } else {
          key = 'ALL';
        }
        
        if (!groups[key]) groups[key] = [];
        groups[key].push(rel);
      });
      
      // Return the group entries in a form that can be concatenated
      return Object.entries(groups).map(([key, items]) => ({ key, items }));
    },
    20 // Process 20 items per chunk
  );
  
  // Merge chunked results into cohesive groups
  const mergedGroups = useMemo(() => {
    const result: Record<string, T[]> = {};
    
    groupedRelationships.forEach(entry => {
      if (!result[entry.key]) result[entry.key] = [];
      result[entry.key] = [...result[entry.key], ...entry.items];
    });
    
    return result;
  }, [groupedRelationships]);
  
  // Create a windowed subset for better performance with large datasets
  const visibleRelationships = useMemo(() => {
    if (relationships.length <= maxVisibleRelationships) {
      return relationships;
    }
    
    // When we have too many relationships, create a representative sample
    // that includes some of each type to ensure diversity
    let result: T[] = [];
    
    // For type-based grouping, ensure we have some from each type
    if (groupBy === 'type' || groupBy === 'nodeType') {
      const groupingField = groupBy === 'type' ? 'type' : 'nodeType';
      const groups = new Map<string, T[]>();
      
      // Group by specified field
      relationships.forEach(rel => {
        const key = rel[groupingField as keyof T] as string || 'unknown';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(rel);
      });
      
      // Limit to most populated types if we have too many
      let typesToInclude = Array.from(groups.keys());
      if (typesToInclude.length > visibleTypesLimit) {
        typesToInclude = typesToInclude
          .sort((a, b) => (groups.get(b)?.length || 0) - (groups.get(a)?.length || 0))
          .slice(0, visibleTypesLimit);
      }
      
      // Calculate how many to include from each type
      const itemsPerType = Math.floor(maxVisibleRelationships / typesToInclude.length);
      
      // Take some items from each included type
      typesToInclude.forEach(type => {
        const typeItems = groups.get(type) || [];
        result = result.concat(typeItems.slice(0, itemsPerType));
      });
      
      // If we have room for more, add them until we hit the max
      if (result.length < maxVisibleRelationships) {
        // Collect all remaining items from all groups
        const remaining: T[] = [];
        typesToInclude.forEach(type => {
          const typeItems = groups.get(type) || [];
          remaining.push(...typeItems.slice(itemsPerType));
        });
        
        // Add as many as we can fit
        result = result.concat(
          remaining.slice(0, maxVisibleRelationships - result.length)
        );
      }
    } else {
      // Simple slicing for no grouping
      result = relationships.slice(0, maxVisibleRelationships);
    }
    
    return result;
  }, [relationships, maxVisibleRelationships, groupBy, visibleTypesLimit]);
  
  return {
    types,
    nodeTypes,
    groupedRelationships: mergedGroups,
    visibleRelationships,
    isProcessing,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
    hasMoreThanVisible: relationships.length > maxVisibleRelationships
  };
}

/**
 * Hook for managing panel expansion states with collapse tracking
 * Specializes in efficiently managing many collapsible sections
 */
export function useExpandableGroups(
  groups: string[],
  options: {
    defaultExpanded?: boolean;
    maxSimultaneousExpanded?: number;
  } = {}
) {
  const {
    defaultExpanded = false,
    maxSimultaneousExpanded = 5
  } = options;
  
  // Track expanded state for each group
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Initialize expanded state when groups change
  useEffect(() => {
    // If we have few groups, expand them all by default
    const shouldExpandAll = groups.length <= 3;
    
    const initialState = groups.reduce((acc, group, index) => {
      // Expand by default if few groups, or explicit default expanded
      acc[group] = shouldExpandAll || 
        (defaultExpanded && index < maxSimultaneousExpanded);
      return acc;
    }, {} as Record<string, boolean>);
    
    setExpandedGroups(initialState);
  }, [groups, defaultExpanded, maxSimultaneousExpanded]);
  
  // Toggle expansion of a group
  const toggleGroupExpansion = useCallback((group: string) => {
    setExpandedGroups(prev => {
      const isCurrentlyExpanded = !!prev[group];
      const next = { ...prev, [group]: !isCurrentlyExpanded };
      
      // If we're expanding and we'd exceed the max simultaneous limit,
      // collapse the oldest expanded group
      if (!isCurrentlyExpanded && maxSimultaneousExpanded > 0) {
        const currentlyExpanded = Object.entries(next)
          .filter(([_, isExpanded]) => isExpanded)
          .map(([key]) => key);
          
        if (currentlyExpanded.length > maxSimultaneousExpanded) {
          // Remove the first expanded group (that isn't the one we're toggling)
          for (const key of currentlyExpanded) {
            if (key !== group) {
              next[key] = false;
              break;
            }
          }
        }
      }
      
      return next;
    });
  }, [maxSimultaneousExpanded]);
  
  // Expand all groups
  const expandAllGroups = useCallback(() => {
    setExpandedGroups(
      groups.reduce((acc, group) => {
        acc[group] = true;
        return acc;
      }, {} as Record<string, boolean>)
    );
  }, [groups]);
  
  // Collapse all groups
  const collapseAllGroups = useCallback(() => {
    setExpandedGroups(
      groups.reduce((acc, group) => {
        acc[group] = false;
        return acc;
      }, {} as Record<string, boolean>)
    );
  }, [groups]);
  
  return {
    expandedGroups,
    toggleGroupExpansion,
    expandAllGroups,
    collapseAllGroups,
    setExpandedGroups
  };
}

/**
 * Specialized hook for optimized ContextPanel data loading
 * Addresses performance challenges in the ContextPanel component
 * 
 * @param nodeId Selected node ID
 * @param nodeType Selected node type
 * @param apiClient API client instance
 */
export function useOptimizedEntityData(
  nodeId: string | null,
  nodeType: string | null,
  apiClient: any
) {
  // Entity data and loading state
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache hits tracking for analytics
  const cacheHits = useRef({ hits: 0, misses: 0 });
  
  // Debounced logger
  const logStats = useDebounce(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[ContextPanel] Cache stats - Hits: ${cacheHits.current.hits}, Misses: ${cacheHits.current.misses}, ` +
        `Ratio: ${(cacheHits.current.hits / (cacheHits.current.hits + cacheHits.current.misses) * 100).toFixed(1)}%`
      );
    }
  }, 5000);
  
  // Keep track of previous node for transitions
  const prevNodeRef = useRef<{ id: string | null; type: string | null }>({
    id: null,
    type: null
  });
  
  // Check if component is mounted
  const isMounted = useIsMounted();
  
  // Load entity data with multi-level caching
  useEffect(() => {
    // Clear data when node is deselected
    if (!nodeId || !nodeType) {
      setData(null);
      setError(null);
      return;
    }
    
    // Skip if same node (avoid unnecessary loads)
    if (nodeId === prevNodeRef.current.id && nodeType === prevNodeRef.current.type) {
      return;
    }
    
    const loadEntityData = async () => {
      setIsLoading(true);
      prevNodeRef.current = { id: nodeId, type: nodeType };
      
      try {
        // Generate cache key
        const cacheKey = `${nodeType}:${nodeId}`;
        
        // Check cache first
        const cachedData = getCachedEntity(cacheKey);
        if (cachedData) {
          cacheHits.current.hits++;
          logStats();
          
          if (isMounted()) {
            setData(cachedData);
            setError(null);
            setIsLoading(false);
          }
          return;
        }
        
        cacheHits.current.misses++;
        logStats();
        
        // Determine API URL based on entity type
        let apiUrl: string;
        
        switch (nodeType) {
          case 'USER':
            apiUrl = `/users/${nodeId}`;
            break;
          case 'TEAM':
            apiUrl = `/teams/${nodeId}`;
            break;
          case 'PROJECT':
            apiUrl = `/projects/${nodeId}`;
            break;
          case 'GOAL':
            apiUrl = `/goals/${nodeId}`;
            break;
          case 'DEPARTMENT':
            apiUrl = `/departments/${nodeId}`;
            break;
          case 'KNOWLEDGE_ASSET':
            apiUrl = `/knowledge-assets/${nodeId}`;
            break;
          default:
            throw new Error(`No API endpoint for type: ${nodeType}`);
        }
        
        // Fetch from API with timeout for better UX
        const response = await Promise.race([
          apiClient.get(apiUrl),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]);
        
        if (!isMounted()) return;
        
        setData(response.data);
        setError(null);
        
        // Cache the result
        cacheEntity(cacheKey, response.data);
        
      } catch (err: any) {
        if (isMounted()) {
          console.error(`Error fetching ${nodeType} data:`, err);
          setError(err.message || `Failed to load ${nodeType} details`);
          setData(null);
        }
      } finally {
        if (isMounted()) {
          setIsLoading(false);
        }
      }
    };
    
    loadEntityData();
  }, [nodeId, nodeType, apiClient, isMounted]);
  
  return {
    data,
    isLoading,
    error,
    isNewEntity: nodeId !== prevNodeRef.current.id || nodeType !== prevNodeRef.current.type
  };
}

// Auto-initialize web vitals tracking
captureWebVitals();