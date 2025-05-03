import React from 'react';
import Perfume from 'perfume.js';
import { ThresholdTier } from 'perfume.js/types/types';

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
export const perfume = new Perfume({
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
});

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
    ref.current.deps = deps;
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