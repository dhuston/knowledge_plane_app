module.exports = {
  ci: {
    collect: {
      // Using local development server
      startServerCommand: 'npm run dev',
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/map',
        'http://localhost:5173/workspace',
        'http://localhost:5173/admin',
      ],
      numberOfRuns: 3,
      settings: {
        // Throttling settings to simulate average connection
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        // Run desktop Chrome
        emulatedFormFactor: 'desktop',
        // Chrome flags for headless execution
        chromeFlags: '--headless --disable-gpu --no-sandbox',
      },
    },
    assert: {
      // Performance budgets based on our performance testing plan
      preset: 'lighthouse:recommended',
      assertions: {
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }], // 1.8s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
        'interactive': ['error', { maxNumericValue: 3800 }], // 3.8s
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // 300ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1
        
        // Resource optimization
        'render-blocking-resources': ['warn', { maxLength: 5 }],
        'unminified-javascript': ['error', { maxLength: 0 }],
        'unused-javascript': ['warn', { maxNumericValue: 1 }],
        'uses-responsive-images': ['warn', { minScore: 0.8 }],
        'offscreen-images': ['warn', { minScore: 0.8 }],
        
        // PWA
        'installable-manifest': 'off',
        'service-worker': 'off',
        'splash-screen': 'off',
        'themed-omnibox': 'off',
        
        // Accessibility is important but not part of perf testing
        'color-contrast': 'off',
        'document-title': 'off',
        'html-has-lang': 'off',
        'meta-description': 'off',
        
        // Categories
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
      // Upload LHR reports to GitHub via GitHub Actions
      // Can be configured once we have a GitHub Actions workflow
    },
    server: {
      // Optional: Configure a local server for test reports
      port: 9001,
    },
  },
};