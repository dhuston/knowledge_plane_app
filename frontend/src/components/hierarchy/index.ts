/**
 * index.ts
 * Entry point for the Organizational Hierarchy Navigator components
 */

// Export main components
export { HierarchyNavigator } from './HierarchyNavigator';
export { HierarchyNavigatorView } from './HierarchyNavigatorView';
export { HierarchyItem } from './HierarchyItem';
export { HierarchyPopover } from './HierarchyPopover';
export { HierarchySearchPopover } from './HierarchySearchPopover';
export { UserPositionCard } from './UserPositionCard';

// Export context and hooks
export { HierarchyProvider, useHierarchy } from './state/HierarchyContext';

// Export popovers
export { TeamPopover } from './popovers/TeamPopover';
export { DepartmentPopover } from './popovers/DepartmentPopover';
export { OrganizationPopover } from './popovers/OrganizationPopover';
export { UserPopover } from './popovers/UserPopover';

// Export search components
export { SearchInput } from './search/SearchInput';
export { SearchFilters } from './search/SearchFilters';
export { SearchResults } from './search/SearchResults';
export { RecentSearches } from './search/RecentSearches';

// Export types from hierarchy types file
export * from '../../types/hierarchy';

// Export services
export { HierarchyService } from './services/HierarchyService';

// Export styles
export * from './styles';