import { expect } from 'vitest';

/**
 * Visual regression testing utilities.
 * 
 * These utilities leverage Vitest's snapshot capabilities to compare DOM snapshots
 * for visual regression testing of web components. For more advanced visual
 * regression testing, tools like Percy, Chromatic, or Loki could be integrated.
 */

/**
 * Helper to extract only the properties relevant for visual comparison
 * to reduce noise in snapshots and make them more stable
 */
export const extractVisualProperties = (element: HTMLElement): Record<string, any> => {
  if (!element) return {};
  
  const style = window.getComputedStyle(element);
  const boundingRect = element.getBoundingClientRect();
  
  // Extract only the CSS properties that would affect visual appearance
  return {
    tagName: element.tagName,
    id: element.id || undefined,
    className: element.className || undefined,
    childElementCount: element.childElementCount,
    textContent: element.textContent?.trim() || undefined,
    dimensions: {
      width: boundingRect.width,
      height: boundingRect.height,
    },
    visibleStyles: {
      backgroundColor: style.backgroundColor,
      color: style.color,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      padding: style.padding,
      margin: style.margin,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
      display: style.display,
      position: style.position,
      visibility: style.visibility,
      opacity: style.opacity,
      transform: style.transform,
    }
  };
};

/**
 * Takes a snapshot of the visual state of a component for regression testing
 * 
 * @param element The DOM element to snapshot
 * @param name Optional name for the snapshot
 */
export const expectVisualSnapshot = (element: HTMLElement, name?: string) => {
  const visualProps = extractVisualProperties(element);
  expect(visualProps).toMatchSnapshot(name);
};

/**
 * Takes a visual snapshot of an entire component tree
 * 
 * @param rootElement The root DOM element
 * @param options Configuration options
 */
export const expectComponentTreeSnapshot = (
  rootElement: HTMLElement,
  options: { 
    maxDepth?: number;
    ignoreClasses?: string[];
    name?: string;
  } = {}
) => {
  const { maxDepth = 5, ignoreClasses = [], name } = options;
  
  const extractTree = (element: HTMLElement, depth = 0): Record<string, any> => {
    if (!element || depth > maxDepth) return {};
    
    // Skip elements with ignored classes
    if (ignoreClasses.some(cls => element.classList.contains(cls))) {
      return {};
    }
    
    const props = extractVisualProperties(element);
    const children: Record<string, any>[] = [];
    
    Array.from(element.children).forEach((child, index) => {
      if (child instanceof HTMLElement) {
        const childProps = extractTree(child, depth + 1);
        if (Object.keys(childProps).length > 0) {
          children.push(childProps);
        }
      }
    });
    
    return {
      ...props,
      children: children.length > 0 ? children : undefined
    };
  };
  
  const tree = extractTree(rootElement);
  expect(tree).toMatchSnapshot(name);
};

/**
 * Takes a "visual snapshot" of a container for regression testing
 * This is a convenience wrapper around expectComponentTreeSnapshot
 * 
 * @param container The container element to snapshot
 * @param snapshotName Name of the snapshot for reference
 */
export const visualSnapshot = async (
  container: Element | null,
  snapshotName: string
): Promise<void> => {
  if (!container) {
    console.error(`Cannot take visual snapshot: container is null`);
    return Promise.resolve();
  }

  // Use existing snapshot functionality with the provided name
  expectComponentTreeSnapshot(container as HTMLElement, {
    name: snapshotName,
    maxDepth: 10 // Increase depth for more detailed snapshots
  });
  
  return Promise.resolve();
};

/**
 * Compare two snapshots from different test runs
 * This is used when you want to compare snapshots across test runs,
 * rather than against a stored baseline
 * 
 * @param test1Name Name of first test snapshot
 * @param test2Name Name of second test snapshot 
 */
export const compareSnapshots = (test1Name: string, test2Name: string): void => {
  // In a real implementation, this would load and compare stored snapshots
  // For now, log that a comparison would be performed
  console.log(`Would compare snapshots: ${test1Name} vs ${test2Name}`);
};

/**
 * Creates a map snapshot that can be used for visual diff visualization
 * This would typically generate a visual diff image highlighting the differences
 * 
 * @param container The map container to snapshot
 * @param options Additional options for snapshot generation
 */
export const createMapSnapshot = async (
  container: HTMLElement, 
  options: { includeControls?: boolean; highlightNodes?: string[] } = {}
): Promise<string> => {
  // In a real implementation, this would create an actual snapshot image
  // For testing purposes, we're using DOM snapshotting
  
  expectComponentTreeSnapshot(container, {
    name: 'map-snapshot',
    maxDepth: options.includeControls ? 15 : 10,
  });
  
  return 'map-snapshot';
};