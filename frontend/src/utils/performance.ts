import React, { useEffect, useRef, useState } from 'react';
import Perfume from 'perfume.js';

// Define ThresholdTier enum directly since the types import is not available
enum ThresholdTier {
  instant = 0, // <= 100ms
  quick = 100, // <= 300ms
  moderate = 300, // <= 1000ms
  slow = 1000 // > 1000ms
}

// Global cache for entities
const entityCache = new Map<string, any>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes default expiry

/**
 * Cache an entity by key
 * 
 * @param key The cache key
 * @param data The data to cache
 * @param expiry Optional expiry time in milliseconds
 */
export function cacheEntity(key: string, data: any, expiry: number = CACHE_EXPIRY): void {
  entityCache.set(key, {
    data,
    timestamp: Date.now(),
    expiry: expiry
  });
}

/**
 * Get an entity from the cache
 * 
 * @param key The cache key
 * @returns The cached data or null if not found or expired
 */
export function getCachedEntity(key: string): any {
  const cached = entityCache.get(key);
  
  // Check if cache exists and is not expired
  if (cached && (Date.now() - cached.timestamp) < cached.expiry) {
    return cached.data;
  }
  
  // Remove expired entry
  if (cached) {
    entityCache.delete(key);
  }
  
  return null;
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
export const perfume = Perfume && typeof Perfume === 'function' 
  ? new (Perfume as any)({
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

// Auto-initialize web vitals tracking
captureWebVitals();