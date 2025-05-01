import { expect } from 'vitest';

/**
 * Visual regression testing utilities.
 * 
 * These utilities leverage Vitest's snapshot capabilities to compare DOM snapshots
 * for visual regression testing of web components.
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