/**
 * Lighthouse CI configuration for Biosphere Alpha frontend performance testing
 */

module.exports = {
  ci: {
    collect: {
      /* The URL patterns to test with Lighthouse */
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/map',
        'http://localhost:5173/admin',
        'http://localhost:5173/workspace'
      ],
      /* Configure the start server command and settings */
      startServerCommand: 'npm run serve',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3, // Multiple runs for more accurate results
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
        throttling: {
          // Throttling settings to simulate average connection
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        // Chrome flags for headless execution
        chromeFlags: '--headless --disable-gpu --no-sandbox',
      },
    },
    upload: {
      /* Upload the results */
      target: 'filesystem',
      outputDir: './lighthouse-results',
    },
    assert: {
      /* Performance budgets for the application based on PERFORMANCE_TESTING_PLAN.md */
      preset: 'lighthouse:recommended',
      assertions: {
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }], // 1.8s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
        'interactive': ['error', { maxNumericValue: 3800 }], // 3.8s
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // 300ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1
        'speed-index': ['warn', { maxNumericValue: 3000 }], // 3s
        
        // Resource optimization
        'render-blocking-resources': ['warn', { maxNumericValue: 5 }], // Max 5 blocking resources
        'uses-responsive-images': ['warn', { minScore: 0.8 }],
        'offscreen-images': ['warn', { minScore: 0.8 }],
        'uses-optimized-images': ['warn', { minScore: 0.8 }],
        'uses-text-compression': 'off', // Disable for local development
        'unminified-javascript': 'off', // Dev environment may have unminified code
        'unminified-css': 'off', // Dev environment may have unminified code
        
        // Accessibility
        'color-contrast': 'error',
        'heading-order': 'warn',
        'link-name': 'error',
        
        // Best practices
        'is-on-https': 'off', // Disable for local development
        
        // PWA
        'installable-manifest': 'off',
        'service-worker': 'off',
        'splash-screen': 'off',
        'themed-omnibox': 'off',
        
        // Categories
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': 'off',
      },
    },
    server: {
      // Configuration for the Lighthouse CI server if needed later
      port: 9001,
    },
  },
};