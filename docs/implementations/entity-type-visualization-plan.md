# Entity Type Visualization Implementation Plan

## 1. Code Organization

### Issue: Large WebGLMap.tsx file (1300+ lines)
**Solution:**
1. Extract the node renderer function to `components/map/renderers/NodeRenderer.tsx`
2. Move node styling logic to `components/map/styles/NodeStyles.ts`
3. Create a separate `components/map/SigmaGraphLoader.tsx` component

**Implementation Steps:**
- Create new files for the extracted components
- Move existing node rendering logic to NodeRenderer.tsx
- Import and use the new components in WebGLMap.tsx
- Update imports and references

### Issue: Duplicated styling logic between WebGLMap.tsx and LivingMap.tsx
**Solution:**
1. Create a shared styles module at `components/map/styles/MapStyles.ts`
2. Export common styling constants, types and helper functions
3. Import shared styles in both components

**Implementation Steps:**
- Create MapStyles.ts with shared color definitions and styling logic
- Update both WebGLMap.tsx and LivingMap.tsx to use the shared styles
- Remove duplicate styling code

## 2. Potential Bugs

### Issue: Reference to undefined variable 'node' in node renderer function
**Solution:**
1. Fix the reference on lines 863-864 in WebGLMap.tsx
2. Properly access the node entity type from data parameter

**Implementation Steps:**
- Replace `graph.getNodeAttribute(node, 'entityType')` with direct access to `data.entityType`
- Add proper type checking before accessing node attributes

### Issue: Commented out or unused code in LivingMap.tsx
**Solution:**
1. Remove all commented code blocks
2. Delete unused imports and variables
3. Clean up unused functions and hooks

**Implementation Steps:**
- Scan LivingMap.tsx for commented code sections and remove them
- Remove unused imports at the top of the file
- Delete unused functions like `applyDeltaUpdates` if not needed

## 3. Performance Considerations

### Issue: Complex node renderer function affecting performance
**Solution:**
1. Optimize the node rendering logic
2. Cache computed values where possible
3. Reduce conditional checks and redundant calculations

**Implementation Steps:**
- Use memoization for computed style values
- Simplify shape rendering logic by using predefined shapes
- Pre-compute static values outside render loops

### Issue: Debug logging in production code
**Solution:**
1. Remove console.log statements (like line 693)
2. Replace with proper logging system that can be toggled

**Implementation Steps:**
- Remove all console.log statements
- Implement a debug flag that can be toggled in development
- Add proper error reporting for critical issues

## 4. UX Improvements

### Issue: Small nodes difficult to see at different zoom levels
**Solution:**
1. Implement adaptive size scaling based on zoom level
2. Add minimum visibility size threshold for nodes

**Implementation Steps:**
- Create a zoom-level dependent size calculation function
- Apply minimum visibility thresholds for nodes at distant zoom levels
- Update the nodeReducer to incorporate zoom level in size calculations

### Issue: Edge visibility with relationship types
**Solution:**
1. Enhance edge styling based on relationship type
2. Add visual indicators for edge directions
3. Implement hover effects for edges

**Implementation Steps:**
- Create distinct visual styles for different relationship types
- Add directional indicators (arrows, gradients) for directed relationships
- Implement edge highlighting on node hover

## 5. Consistency

### Issue: Color definitions spread between nodeStyles and colors.ts
**Solution:**
1. Consolidate all color definitions in theme/foundations/colors.ts
2. Reference the centralized colors in WebGLMap.tsx

**Implementation Steps:**
- Move all node type colors to colors.ts under a structured format
- Update nodeStyles in WebGLMap.tsx to import colors from the central source
- Ensure consistent color naming across the application

### Issue: Entity-specific styles defined in multiple places
**Solution:**
1. Create a dedicated entityStyles.ts in theme/foundations
2. Import entity styles from this single source of truth
3. Update all components to reference this file

**Implementation Steps:**
- Create entityStyles.ts with comprehensive entity styling information
- Move all entity-specific styling from WebGLMap.tsx and LivingMap.tsx
- Update imports in all components that use entity styling

## Implementation Timeline

### Week 1: Code Organization & Bug Fixes
- Extract components from WebGLMap.tsx
- Create shared styling modules
- Fix the undefined 'node' reference
- Clean up LivingMap.tsx

### Week 2: Performance Optimization & UX Improvements
- Optimize node renderer function
- Remove debug logging
- Implement adaptive size scaling
- Enhance edge visibility

### Week 3: Consistency & Testing
- Consolidate color definitions
- Create entityStyles.ts
- Update all components to use centralized styling
- Test across different zoom levels and entity types

## Testing Plan

1. **Visual Testing:**
   - Compare before/after rendering of all entity types
   - Verify shape and style consistency across zoom levels

2. **Performance Testing:**
   - Measure rendering performance before and after changes
   - Test with large datasets (100+ nodes)
   - Profile memory usage and frame rates

3. **Cross-browser Testing:**
   - Ensure consistent rendering in Chrome, Firefox, Safari
   - Verify WebGL compatibility across platforms

4. **Accessibility Testing:**
   - Ensure sufficient color contrast for entity types
   - Verify entity visualization works with assistive technologies