/**
 * Setup file for performance tests
 * 
 * This file is imported by Vitest when running performance tests
 * to set up the environment with performance measurement utilities.
 */

// Mock browser performance API if needed in JSDOM environment
if (typeof window !== 'undefined' && !window.performance) {
  window.performance = {
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => [],
    getEntriesByName: () => [],
    clearMarks: () => {},
    clearMeasures: () => {},
    now: () => Date.now()
  };
}

// Add performance test utilities to global scope
global.measurePerformance = (name, testFn) => {
  const start = performance.now();
  const result = testFn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`Performance test: ${name} - ${duration.toFixed(2)}ms`);
  
  return {
    result,
    duration,
    name
  };
};

// Helper for async performance measurement
global.measurePerformanceAsync = async (name, testFn) => {
  const start = performance.now();
  const result = await testFn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`Performance test (async): ${name} - ${duration.toFixed(2)}ms`);
  
  return {
    result,
    duration,
    name
  };
};

// Create a place to store performance metrics
global.performanceResults = [];

// Before all tests, ensure the performance results are cleared
beforeAll(() => {
  global.performanceResults = [];
});

// After all tests, save performance results if needed
afterAll(() => {
  if (global.performanceResults.length > 0) {
    console.log('Performance test summary:');
    
    global.performanceResults.forEach(result => {
      console.log(`${result.name}: ${result.duration.toFixed(2)}ms`);
    });
    
    // We could write results to a file here if needed
    // using Node's fs module
  }
});