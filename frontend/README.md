# KnowledgePlane AI Frontend

## Overview

This is the React frontend for the KnowledgePlane AI platform. It provides the user interface for the Living Map visualization, organization insights, and collaborative workspaces.

## Features

- **Living Map Visualization:** Interactive network graph showing organizational connections
- **Context Panels:** Detailed information about selected entities
- **Organizational Hierarchy Navigator:** Navigation through formal org structure
- **Workspaces:** Team and project collaboration spaces
- **Admin Console:** Platform configuration and user management
- **Integration Framework UI:** Configure and manage external service integrations
- **Notification System:** Real-time alerts and updates

## Tech Stack

- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **UI Library:** Chakra UI with custom theme
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Graph Visualization:** Custom WebGL renderer
- **Testing:** Vitest, React Testing Library
- **Code Quality:** ESLint, Prettier

## Setup & Development

### Prerequisites

- Node.js 16+ and npm
- Backend service running (see main project README)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests
- `npm run lint` - Check for linting issues
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier

## Project Structure

### Core Directories

- `/src/components/` - UI components organized by feature
  - `/admin/` - Admin console components
  - `/common/` - Shared UI components
  - `/hierarchy/` - Organization hierarchy navigator
  - `/layout/` - Page layouts and containers
  - `/map/` - Living Map visualization components
  - `/panels/` - Context panels for entity details
  - `/workspace/` - Team and project workspace components
- `/src/hooks/` - Custom React hooks
  - `useApiClient.ts` - API client hook
  - `useDeltaStream.ts` - Real-time updates
  - `useEntitySuggestions.ts` - ML-based entity suggestions
  - `useAnimatedTab.ts` - Tab animations
- `/src/context/` - React Context providers
  - `AuthContext.tsx` - Authentication state
  - `NodeSelectionContext.tsx` - Selected map entities
  - `UserContext.tsx` - Current user information
  - `AdminContext.tsx` - Admin settings and stats
- `/src/types/` - TypeScript type definitions
  - `entities.ts` - Shared entity types
  - `map.ts` - Map visualization types
  - `user.ts` - User-related types
- `/src/utils/` - Utility functions
  - `errorHandling.ts` - Error handling utilities
  - `performance.ts` - Performance optimizations
  - `featureFlags.ts` - Feature toggling
- `/src/workers/` - Web workers
  - `analytics-worker.ts` - Background analytics processing
  - `layout-worker.ts` - Graph layout calculations

## Architecture

The frontend follows a component-based architecture with clear separation of concerns:

- **Components** handle rendering and user interactions
- **Hooks** encapsulate reusable logic and side effects
- **Context** providers manage shared state
- **Services** handle external API communication
- **Types** ensure proper type checking across the application
- **Utils** provide shared helper functions

## Component Design Patterns

1. **Container/Presentation Pattern**: Logic in container components, UI in presentational components
2. **Compound Components**: Related components grouped together (e.g., Tabs system)
3. **Render Props**: Used for flexible component composition
4. **Custom Hooks**: Extract and share stateful logic between components

## State Management

- **Local Component State**: For component-specific UI state
- **Context API**: For shared state across component trees
- **URL State**: For shareable/bookmarkable application states
- **Server State**: Managed with custom `useApiClient` hook

## Performance Optimizations

- **Component Memoization**: Using React.memo for expensive components
- **Web Workers**: Offloading heavy computations for map layout and analytics
- **Code Splitting**: Lazy loading for routes and heavy components
- **Virtualization**: For long lists and large datasets
- **Caching**: API response caching using custom hooks

## Adding New Components

1. Create a new component file in the appropriate directory
2. Write the component using TypeScript and functional components
3. Use Chakra UI for styling and responsive design
4. Add tests to ensure proper functionality
5. Document props and usage

## Testing Strategy

- **Unit Tests**: For individual components and hooks
- **Integration Tests**: For component interactions
- **Accessibility Tests**: Ensure proper a11y support
- **Visual Regression**: For critical UI components

## Styling Guidelines

- Use Chakra UI theme tokens for consistency
- Follow the design system in `/src/theme/`
- Prefer component composition over complex styling
- Use responsive styles for different screen sizes

## Accessibility

- All components should be keyboard navigable
- Use semantic HTML elements
- Include proper ARIA attributes
- Ensure sufficient color contrast
- Support screen readers

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest version)

## Contributing

1. Follow the code style and patterns used in the project
2. Write tests for new components and features
3. Document your changes in component code
4. Follow accessibility guidelines
5. Optimize performance where appropriate