# Entity Type Visualization Code Review

## Areas for Improvement

### 1. Code Organization
- The WebGLMap.tsx file is very large (1300+ lines) - consider splitting into smaller components
- Some duplicated styling logic between WebGLMap.tsx and LivingMap.tsx

### 2. Potential Bugs
- Line 863-864: Reference to undefined variable 'node' in node renderer function
- LivingMap.tsx has commented out or unused code that could be cleaned up

### 3. Performance Considerations
- The node renderer function is complex and could impact rendering performance
- Debug logging in production code (e.g., line 693)

### 4. UX Improvements
- Small nodes may still be difficult to see at different zoom levels
- Edge visibility could be further improved with the relationship types

### 5. Consistency
- Color definitions are spread between nodeStyles in WebGLMap.tsx and colors.ts
- Some entity-specific styles are defined in multiple places

## Recommendations

### 1. Code Organization
- Extract the node renderer function to a separate component
- Move node styling logic to a dedicated styling utility
- Remove debug console.log statements from production code

### 2. Bug Fixes
- Fix undefined 'node' reference in the nodeRenderer function
- Clean up unused imports and commented code in LivingMap.tsx

### 3. Performance
- Add performance monitoring for large graphs
- Consider implementing level-of-detail rendering based on zoom level

### 4. UX Enhancements
- Implement adaptive size scaling based on zoom level
- Add toggling animation for entity type visibility

### 5. Consistency
- Consolidate color definitions to a single source of truth
- Use entity.types from colors.ts instead of redefining in WebGLMap.tsx