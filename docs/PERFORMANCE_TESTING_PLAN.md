# Performance Testing Strategy & Implementation Plan

## Overview

This document outlines the comprehensive approach to performance testing for the Biosphere platform. The strategy covers both frontend and backend components, with special emphasis on the map visualization components which are critical for the application's performance profile.

## Goals and Objectives

1. **Establish performance baselines** for all critical components
2. **Automate performance testing** within the CI/CD pipeline
3. **Identify bottlenecks** in both frontend and backend components
4. **Monitor performance trends** over time to detect regressions
5. **Optimize** key performance metrics to meet or exceed industry standards

## Performance Bottlenecks Identified

### Frontend
1. **Map Visualization Components**
   - Complex graph rendering in `LivingMap.tsx` and `SigmaGraphLoader.tsx`
   - Inefficient React rendering patterns causing unnecessary re-renders
   - Calculations performed on main thread blocking UI

2. **Animation & Transition Performance**
   - Multiple concurrent animations causing jank
   - Unoptimized transitions in `useAnimatedTab.ts` and panel components

3. **React Component Optimization**
   - Missing memoization in callbacks and computed values
   - Large object literals being recreated between renders
   - Context providers triggering unnecessary cascading renders

4. **Worker Communication**
   - Data serialization overhead in worker communication
   - Large graph data transfers between threads

### Backend
1. **Map Endpoint Operations**
   - Complex database queries with multiple joins in `/map/data`
   - Inefficient neighbor traversal algorithm
   - Missing cache for repeated operations

2. **Database Query Optimization**
   - Missing indexes on frequently queried columns
   - N+1 query issues when fetching related entities
   - Tenant filtering adding overhead to every query

3. **External Services**
   - Synchronous calls to integrations like Microsoft Outlook
   - Missing circuit breakers and retry logic

4. **Redis Cache Management**
   - Inefficient cache key structure
   - Missing TTL for cached neighbor data

## Performance Metrics & Thresholds

### Frontend Metrics

| Metric | Description | Target | Critical Threshold |
|--------|-------------|--------|-------------------|
| FCP (First Contentful Paint) | Time to first rendering of content | < 1.8s | < 3.0s |
| LCP (Largest Contentful Paint) | Time to render largest content element | < 2.5s | < 4.0s |
| TTI (Time to Interactive) | Time until page becomes fully interactive | < 3.8s | < 7.3s |
| TBT (Total Blocking Time) | Sum of blocking time after FCP | < 300ms | < 600ms |
| CLS (Cumulative Layout Shift) | Measure of visual stability | < 0.1 | < 0.25 |
| FPS (Frames Per Second) | Frame rate during map interactions | > 45fps | > 30fps |

### Custom Frontend Component Metrics

| Component | Metric | Target | Critical Threshold |
|-----------|--------|--------|-------------------|
| Map Rendering | Initial render time | < 500ms | < 1000ms |
| Map Interaction | Response time to pan/zoom | < 100ms | < 200ms |
| Context Panel | Open/close transition | < 150ms | < 300ms |
| Map Data Fetching | API response time | < 800ms | < 2000ms |
| Map Data Processing | Client-side processing | < 300ms | < 800ms |

### Backend API Metrics

| Endpoint | Target Avg Response | Target 90th Percentile | Target RPS |
|----------|---------------------|------------------------|------------|
| Map Data (default) | < 250ms | < 500ms | > 50 |
| Map Data (filtered) | < 300ms | < 600ms | > 40 |
| Map Data (centered) | < 350ms | < 700ms | > 30 |
| Map Data (spatial) | < 400ms | < 800ms | > 25 |
| Entity Detail APIs | < 150ms | < 300ms | > 100 |
| Authentication APIs | < 200ms | < 400ms | > 80 |

## Testing Tools & Infrastructure

### Frontend Testing

1. **Lighthouse CI** - Automated performance auditing integrated with CI/CD
   - Core Web Vitals measurement
   - Performance scoring and trending
   - Config: `.lighthouserc.js`

2. **Perfume.js** - Runtime performance monitoring
   - Real user metrics collection
   - Custom component performance tracking
   - Implementation: `frontend/src/utils/performance.ts`

3. **React DevTools Profiler** - Component profiling
   - Render counts and timing
   - Component optimization opportunities

4. **Custom Performance Testing** - End-to-end performance tests
   - Map component benchmarking
   - Interaction simulation
   - Implementation: Custom Puppeteer tests

### Backend Testing

1. **Locust** - Load and performance testing for APIs
   - Simulated user behavior
   - Concurrent load testing
   - Implementation: `backend/locustfile.py`

2. **Database Query Analysis** - SQL performance optimization
   - Query timing and execution plans
   - Index optimization

3. **Redis Cache Performance** - Cache effectiveness monitoring
   - Hit/miss ratio tracking
   - Cache warm-up time analysis

## Implementation Details

### Frontend Performance Monitoring

The `performance.ts` utility provides:

1. **Core Web Vitals tracking** - Reports FCP, LCP, CLS, TTI and other metrics
2. **Component-specific tracking** - Hooks for measuring specific component performance:
   - `useComponentPerformance` - Start/end timing for components
   - `useRenderCount` - Track unnecessary re-renders
   - `measureAsync` - Time async operations
   - `useComponentMetrics` - Component mount and update tracking

Example usage:

```typescript
// In a complex component
import { useComponentPerformance, measureAsync } from '../utils/performance';

function ComplexComponent() {
  // Track entire component render cycle
  const performance = useComponentPerformance('ComplexComponent');
  
  useEffect(() => {
    performance.start();
    
    return () => performance.end();
  }, []);
  
  // Measure async data loading
  const loadData = async () => {
    return await measureAsync('dataLoading', async () => {
      const result = await fetchData();
      return processData(result);
    });
  };
  
  // Rest of component
}
```

### Map Component Performance Optimization

The `LivingMap` component includes several performance optimizations:

1. **Render count monitoring** - Warning when components re-render excessively
2. **Memoized calculations** - Use `useMemo` and custom performance hooks
3. **Level of Detail (LOD) rendering** - Adjusts detail based on viewport settings
4. **Web worker processing** - Offloads layout calculations to web workers
5. **Batched updates** - Groups state updates to minimize render cycles

### Backend Performance Optimization

The map endpoint includes several optimizations:

1. **Redis caching** - Caches neighbor calculations and spatial data
2. **Spatial indexing** - Using grid-based spatial partitioning for queries
3. **Query optimization** - Eager loading with `selectinload` for relationships
4. **Pagination** - Cursor-based pagination for large result sets
5. **Connection pooling** - Database connection management

### CI/CD Integration

Performance testing is fully integrated into the CI/CD pipeline via GitHub Actions:

1. **On every PR**: Basic performance tests are run
2. **On main branch**: Full suite including load tests
3. **Scheduled**: Weekly comprehensive performance benchmarks
4. **Manual trigger**: On-demand performance testing with custom parameters

Implementation: `.github/workflows/performance.yml`

## Implementation Plan

### Phase 1: Setup & Baseline Measurement (Week 1-2)

1. **Frontend Performance Monitoring**
   - ✅ Install and configure Perfume.js
   - ✅ Set up Lighthouse CI in GitHub Actions
   - ✅ Create custom React profiling hooks

2. **Backend Performance Testing**
   - ✅ Configure Locust for API testing
   - Set up pytest-benchmark for function testing
   - Implement Redis monitoring

3. **Baseline Measurements**
   - ✅ Collect performance data for current application
   - Document metrics in baseline report
   - ✅ Identify critical paths for optimization

### Phase 2: Critical Path Optimization (Week 3-4)

1. **Map Visualization Performance**
   - ✅ Implement virtualization for large datasets
   - ✅ Move heavy calculations to worker threads
   - ✅ Optimize render cycles with memoization

2. **API Endpoint Optimization**
   - ✅ Implement query caching for map data
   - Add database indexes for frequent queries
   - Optimize tenant filtering implementation

3. **Resource Loading**
   - Implement code splitting for large components
   - Lazy-load non-critical resources
   - Optimize bundle size with tree-shaking

### Phase 3: Advanced Optimizations (Week 5-6)

1. **Spatial Query Optimization**
   - ✅ Implement spatial indexing for map queries
   - ✅ Create viewport-aware loading strategies
   - Add level-of-detail rendering based on zoom

2. **Animation & Transition Refinement**
   - Use `requestAnimationFrame` for animations
   - ✅ Optimize CSS transitions
   - ✅ Implement debounced viewport updates

3. **Data Structure Optimization**
   - Implement custom immutable data structures
   - Minimize object creation during renders
   - Normalize state for efficient updates

### Phase 4: CI/CD Integration & Documentation (Week 7-8)

1. **Automated Testing**
   - ✅ Integrate performance tests in CI/CD pipeline
   - ✅ Implement performance budgets and alerts
   - Create regression testing workflows

2. **Monitoring Dashboard**
   - Build real-time performance monitoring dashboard
   - Set up alerts for performance regressions
   - Implement user experience monitoring

3. **Documentation & Knowledge Transfer**
   - ✅ Create performance best practices guide
   - ✅ Document optimization patterns used
   - Train team on performance monitoring tools

## Test Scenarios

### Frontend Test Scenarios

1. **Map Initial Load**
   - Measure time from navigation to interactive map
   - Verify FCP, LCP and TTI meet thresholds

2. **Map Interaction**
   - Measure response time to pan/zoom operations
   - Verify smooth frame rates during interactions (>30fps)

3. **Entity Selection**
   - Measure time from click to context panel display
   - Verify smooth animation and transitions

4. **Filter Application**
   - Measure time to apply/change map filters
   - Verify no blocking of UI thread during filtering

### Backend Test Scenarios

1. **Default Map Load** 
   - Measure response time for default map view
   - Test with increasing concurrent users

2. **Filtered Map Load**
   - Measure response time with various filter combinations
   - Test effect of filter complexity on performance

3. **Centered Map View**
   - Test performance impact of depth=1 vs depth=2
   - Measure entity relationship traversal performance

4. **Spatial Queries**
   - Test viewport queries at different zoom levels
   - Compare spatial vs. relational query performance

5. **Cache Effectiveness**
   - Measure cold vs. warm cache performance
   - Test cache eviction strategies under load

## Monitoring & Reporting

### Performance Dashboard

The automated performance testing generates a comprehensive dashboard:

1. **Frontend Performance**
   - Lighthouse scores trending
   - Custom component metrics history
   - Core Web Vitals visualization

2. **Backend Performance**
   - API response time trending
   - Throughput metrics visualization
   - Error rates and failure thresholds

3. **Pull Request Integration**
   - Automated PR comments with performance impact
   - Pass/fail checks based on performance budgets
   - History comparison with main branch

## Best Practices

### Frontend Performance

1. **Component Optimization**
   - Use memoization (`React.memo`, `useMemo`, `useCallback`)
   - Implement virtualization for long lists
   - Minimize state updates and prop changes

2. **Asset Optimization**
   - Code splitting and lazy loading
   - Image optimization and proper sizing
   - Font loading optimization

3. **Render Performance**
   - Avoid layout thrashing
   - Use CSS transforms and animations
   - Debounce and throttle event handlers

### Backend Performance

1. **Query Optimization**
   - Use appropriate indexes
   - Select only needed columns
   - Use efficient join strategies

2. **Caching Strategy**
   - Multi-level caching (Redis, in-memory)
   - Cache invalidation strategies
   - Proper TTL settings

3. **Concurrency Management**
   - Connection pooling
   - Task queuing for expensive operations
   - Rate limiting for heavy operations

## Implementation Progress

- [x] Establish performance metrics and thresholds
- [x] Implement frontend performance monitoring with Perfume.js
- [x] Create Locust test scripts for backend load testing
- [x] Integrate Lighthouse CI for automated frontend performance testing
- [x] Setup GitHub Actions workflow for CI/CD integration
- [x] Implement performance hooks in LivingMap component
- [x] Optimize map endpoint with Redis caching
- [ ] Create comprehensive performance dashboard
- [ ] Implement automated alerts for performance regressions
- [ ] Document optimization guidelines for developers
- [ ] Setup regular performance review process

## Conclusion

This performance testing strategy provides a comprehensive approach to measuring, monitoring, and improving the performance of the Biosphere platform. By implementing these practices, we ensure that the application remains responsive, efficient, and scalable as it grows and evolves.

We've already seen significant improvements in the map component rendering speed and backend API response times through the optimizations implemented so far. Continuing this work will be critical as we add more features and scale to more users and larger organizational datasets.