# Package Update Plan for Biosphere Alpha

## Overview

This document outlines a comprehensive plan to update and maintain the dependencies in the Biosphere Alpha project, with a focus on addressing security vulnerabilities and keeping packages up-to-date.

## Current Status Summary

As of May 3, 2025, we have resolved the most critical security vulnerabilities:

- ✅ Updated `jspdf` to v3.0.1 to fix DOMPurify XSS vulnerability
- ✅ Downgraded `react-force-graph` to v1.29.3 to resolve dependency vulnerabilities
- ✅ Updated `react-syntax-highlighter` to v15.6.1 and added `prismjs@1.30.0` directly
- ✅ Updated `vite` to v6.3.4 to fix path traversal vulnerability
- ✅ Updated `@lhci/cli` to v0.14.0 to fix lodash.set vulnerabilities
- ✅ Updated `vitest` and `@vitest/coverage-v8` to v3.1.2
- ✅ Added `got@11.8.5` to prevent UNIX socket redirect vulnerability

### Remaining Vulnerabilities

After these fixes, 13 vulnerabilities remain (5 low, 8 moderate):

1. **cookie < 0.7.0** (low severity) - Used by @sentry/node in the lighthouse package
2. **got < 11.8.5** (moderate severity) - Still used by nice-color-palettes
3. **prismjs < 1.30.0** (moderate severity) - Used by refractor in react-syntax-highlighter

These remaining vulnerabilities are in deeper dependencies that can't be easily updated without potentially breaking changes.

## Update Strategy

### Phase 1: Non-Breaking Updates (Immediate)

These updates can be applied immediately with minimal risk:

| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| @chakra-ui/icons | ^2.2.4 | ^2.2.4 | No update needed |
| @emotion/react | ^11.14.0 | ^11.14.0 | No update needed |
| axios | ^1.8.4 | ^1.9.0 | Minor update |
| react-hot-toast | ^2.5.2 | ^2.5.2 | No update needed |
| react-icons | ^5.5.0 | ^5.5.0 | No update needed |
| react-markdown | ^10.1.0 | ^10.1.0 | No update needed |
| three | ^0.161.0 | ^0.168.0 | Minor update |

### Phase 2: Careful Testing Required (Next Sprint)

These updates require more careful testing:

| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| @chakra-ui/react | ^2.10.7 | ^3.0.0 | Major version update |
| @testing-library/react | ^16.0.0 | ^16.3.0 | Minor update |
| framer-motion | ^11.0.5 | ^12.9.4 | Major version update |
| react | ^19.0.0 | ^19.1.0 | Minor update |
| react-dom | ^19.0.0 | ^19.1.0 | Minor update |
| react-router-dom | ^6.27.1 | ^7.5.3 | Major version update |

### Phase 3: Deal with Problematic Dependencies (Future)

These packages need special attention due to deep vulnerabilities:

| Package | Issue | Plan |
|---------|-------|------|
| @lhci/cli | Has multiple dependencies with vulnerabilities | Consider alternatives or accept risk (dev dependency) |
| react-syntax-highlighter | Uses vulnerable prismjs via refractor | Research alternatives or create PR to update |
| nice-color-palettes | Uses vulnerable got version | Consider forking or replacing |

## Implementation Guidelines

1. **Testing Protocol**:
   - Create dedicated test branch for each phase
   - Run full test suite after updates
   - Verify key UI components with visual regression tests
   - Test on different browsers (Chrome, Firefox, Safari)

2. **Update Process**:
   - Update one package at a time, commit, and verify
   - Use `npm update [package]@[version]` rather than editing package.json
   - Document any breaking changes and required code modifications

3. **Vulnerability Monitoring**:
   - Set up regular npm audit checks as part of CI pipeline
   - Review security advisories weekly
   - Prioritize critical and high severity issues

## Long-term Maintenance

1. **Scheduled Updates**:
   - Minor version updates: Monthly
   - Major version updates: Quarterly
   - Security patches: Immediately

2. **Dependency Health Metrics**:
   - Maximum acceptable outdated packages: 10%
   - Maximum acceptable vulnerabilities: 0 high/critical, <5 moderate

3. **Package Selection Guidelines**:
   - Prefer actively maintained libraries (>1 release in past 6 months)
   - Check bundle size impact before adding new packages
   - Evaluate security history of major dependencies

## Backend Package Considerations

A similar strategy should be implemented for the Python backend dependencies:

1. Review and update FastAPI and its dependencies
2. Address any vulnerabilities in the Pydantic ecosystem
3. Keep SQLAlchemy, asyncpg, and alembic up to date
4. Review OAuth and authentication libraries for security issues

This plan will help maintain a secure, up-to-date dependency tree while minimizing disruption to development.