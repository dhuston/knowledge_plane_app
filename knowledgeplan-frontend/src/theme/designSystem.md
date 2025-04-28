# KnowledgePlane AI Design System

## Introduction

This design system provides comprehensive guidelines for a professional, enterprise-ready UI for the KnowledgePlane AI platform. It aims to create a cohesive visual language that communicates the platform's sophisticated capabilities while ensuring excellent usability.

## Core Principles

1. **Clarity**: Information hierarchy and UI elements should be clear and intuitive.
2. **Focus**: The Living Map is the centerpiece; UI should support and enhance it without distraction.
3. **Consistency**: Patterns, components, and interactions should be consistent throughout.
4. **Scalability**: The design system must work across different screen sizes and for large datasets.
5. **Enterprise Polish**: Professional appearance with subtle refinements that convey quality.

## Color System

### Primary Palette

| Name          | Hex       | Usage                                      |
|---------------|-----------|-------------------------------------------|
| Primary-50    | `#EBF8FF` | Backgrounds, hover states                  |
| Primary-100   | `#BEE3F8` | Borders, subtle backgrounds               |
| Primary-300   | `#63B3ED` | Secondary buttons, less prominent elements |
| Primary-500   | `#3182CE` | Primary buttons, links, focus states       |
| Primary-700   | `#2C5282` | Hover states for primary actions           |
| Primary-900   | `#1A365D` | Text on light backgrounds, headings        |

### Secondary Palette

| Name          | Hex       | Usage                                      |
|---------------|-----------|-------------------------------------------|
| Secondary-100 | `#EBF4FF` | Secondary backgrounds                     |
| Secondary-300 | `#A3BFFA` | Accent elements                           |
| Secondary-500 | `#667EEA` | Highlights, secondary CTAs                 |
| Secondary-700 | `#434190` | Hover states for secondary elements        |

### Semantic Colors

| Name          | Hex       | Usage                                      |
|---------------|-----------|-------------------------------------------|
| Success-100   | `#C6F6D5` | Success backgrounds                       |
| Success-500   | `#48BB78` | Success states, confirmations              |
| Warning-100   | `#FEEBC8` | Warning backgrounds                       |
| Warning-500   | `#ED8936` | Warning indicators                         |
| Error-100     | `#FED7D7` | Error backgrounds                         |
| Error-500     | `#E53E3E` | Error states, destructive actions          |
| Info-100      | `#BEE3F8` | Information backgrounds                   |
| Info-500      | `#3182CE` | Information indicators                     |

### Neutral Colors

| Name          | Hex       | Usage                                      |
|---------------|-----------|-------------------------------------------|
| Neutral-50    | `#F7FAFC` | Page backgrounds                          |
| Neutral-100   | `#EDF2F7` | Card backgrounds, form fields             |
| Neutral-200   | `#E2E8F0` | Borders, dividers                         |
| Neutral-300   | `#CBD5E0` | Disabled elements                         |
| Neutral-400   | `#A0AEC0` | Placeholder text                          |
| Neutral-500   | `#718096` | Secondary text                            |
| Neutral-700   | `#2D3748` | Primary text                              |
| Neutral-900   | `#1A202C` | Headings                                  |

### Map Node Colors

| Entity Type   | Hex       | Notes                                      |
|---------------|-----------|-------------------------------------------|
| User          | `#3182CE` | Primary-500                                |
| Team          | `#6B46C1` | Purple-600                                |
| Project       | `#ED8936` | Orange-500                                |
| Goal          | `#48BB78` | Green-500                                 |
| Team Cluster  | `#805AD5` | Purple-500                                |

## Typography

### Font Families

- **Headings**: Inter, system-ui, sans-serif
- **Body**: Inter, system-ui, sans-serif
- **Monospace**: SFMono-Regular, Menlo, Monaco, Consolas, monospace

### Type Scale

| Name       | Size    | Line Height | Weight | Usage                           |
|------------|---------|-------------|--------|----------------------------------|
| heading-1  | 36px    | 1.1         | 700    | Page titles                     |
| heading-2  | 30px    | 1.2         | 700    | Section headers                 |
| heading-3  | 24px    | 1.3         | 600    | Card titles, panel headers      |
| heading-4  | 20px    | 1.4         | 600    | Subsection headers              |
| heading-5  | 16px    | 1.5         | 600    | Minor headings                  |
| body-lg    | 18px    | 1.5         | 400    | Featured content                |
| body       | 16px    | 1.5         | 400    | Primary content                 |
| body-sm    | 14px    | 1.5         | 400    | Secondary content               |
| caption    | 12px    | 1.5         | 400    | Captions, metadata              |
| button     | 14px    | 1.2         | 600    | Buttons, tabs, interactive elements |
| code       | 14px    | 1.5         | 400    | Code blocks, technical content  |

## Spacing System

We use a base-4 spacing system for consistency and visual harmony.

| Token      | Value | Example Usage                              |
|------------|-------|--------------------------------------------|
| space-0    | 0     | Removing margins/padding                   |
| space-1    | 4px   | Tiny spacing, between icon and text        |
| space-2    | 8px   | Small spacing, internal component padding  |
| space-3    | 12px  | Default spacing                            |
| space-4    | 16px  | Medium spacing, margins between elements   |
| space-5    | 20px  | Medium-large spacing                       |
| space-6    | 24px  | Large spacing, section padding             |
| space-8    | 32px  | Extra large spacing                        |
| space-10   | 40px  | Major section separation                   |
| space-12   | 48px  | Page-level spacing                         |
| space-16   | 64px  | Dramatic separation                        |

## Border Radius

| Token           | Value | Usage                               |
|-----------------|-------|-------------------------------------|
| radius-none     | 0     | Square elements                     |
| radius-sm       | 2px   | Small elements                      |
| radius-md       | 4px   | Buttons, input fields, cards        |
| radius-lg       | 8px   | Modal dialogs, larger components    |
| radius-xl       | 12px  | Featured cards                      |
| radius-2xl      | 16px  | Large featured elements             |
| radius-full     | 9999px| Circular elements, pills            |

## Shadows

| Token           | Value                                      | Usage                           |
|-----------------|--------------------------------------------|---------------------------------|
| shadow-xs       | `0 1px 2px rgba(0, 0, 0, 0.05)`            | Subtle elevation                |
| shadow-sm       | `0 1px 3px rgba(0, 0, 0, 0.1)`             | Slightly elevated elements      |
| shadow-md       | `0 4px 6px rgba(0, 0, 0, 0.1)`             | Cards, dropdowns                |
| shadow-lg       | `0 10px 15px rgba(0, 0, 0, 0.1)`           | Modals, popovers                |
| shadow-xl       | `0 20px 25px rgba(0, 0, 0, 0.15)`          | High elevation elements         |
| shadow-focus    | `0 0 0 3px rgba(66, 153, 225, 0.5)`        | Focus states                    |

## Components

### Buttons

#### Primary Button
- Background: Primary-500
- Text: White
- Hover: Primary-600
- Active: Primary-700
- Border Radius: radius-md
- Padding: space-2 space-4
- Font: button

#### Secondary Button
- Background: White
- Text: Primary-500
- Border: 1px solid Primary-500
- Hover: Primary-50
- Active: Primary-100
- Border Radius: radius-md
- Padding: space-2 space-4
- Font: button

#### Tertiary Button
- Background: Transparent
- Text: Primary-500
- Hover: Primary-50
- Active: Primary-100
- Border Radius: radius-md
- Padding: space-2 space-4
- Font: button

### Cards

#### Standard Card
- Background: White
- Border: 1px solid Neutral-200
- Border Radius: radius-md
- Shadow: shadow-md
- Padding: space-6
- Header Font: heading-3
- Content Font: body

#### Hover Card
- Standard Card +
- Hover: shadow-lg, transform: translateY(-2px)
- Transition: all 0.2s ease

### Form Elements

#### Input Field
- Background: White
- Border: 1px solid Neutral-300
- Border Radius: radius-md
- Padding: space-3 space-4
- Font: body
- Focus: shadow-focus
- Height: 40px

#### Dropdown
- Same as Input Field
- Dropdown Background: White
- Dropdown Shadow: shadow-lg
- Option Hover: Primary-50
- Option Selected: Primary-100

### Navigation

#### Top Navigation
- Background: White
- Border Bottom: 1px solid Neutral-200
- Shadow: shadow-sm
- Height: 64px
- Font: body
- Active Item: Primary-500

#### Sidebar Navigation
- Background: White
- Border Right: 1px solid Neutral-200
- Width: 280px
- Item Padding: space-3 space-4
- Item Hover: Primary-50
- Item Active: Primary-100 with 3px Primary-500 left border

### Map Elements

#### Node Styles
- Default Size: 10px diameter 
- Hover Size: 14px diameter
- Selected Size: 14px diameter with 3px stroke
- Animation: 0.2s ease-in-out for state changes
- Label: body-sm, appears on hover or when zoomed in

#### Edge Styles
- Default: 1px, Neutral-400, 50% opacity
- Hover: 2px, color matches source node with 80% opacity
- Selected: 2px, matches source node with 100% opacity
- Different line styles for different relationship types

### Panels

#### Briefing Panel
- Background: White
- Shadow: shadow-lg
- Border Radius: radius-lg on outer corner
- Width: 450px default, responsive
- Header: sticky, background white with subtle shadow
- Body: scrollable
- Padding: space-6
- Section spacing: space-8

## Responsive Breakpoints

| Name      | Size (px) | Description                     |
|-----------|-----------|----------------------------------|
| sm        | 640       | Small screens, mobile portrait   |
| md        | 768       | Medium screens, mobile landscape |
| lg        | 1024      | Large screens, tablets           |
| xl        | 1280      | Extra large, small desktops      |
| 2xl       | 1536      | 2X large, large desktops         |

## Accessibility

- All color combinations must meet WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
- Focus states must be clearly visible (shadow-focus)
- Interactive elements must have sufficient touch targets (minimum 44px × 44px)
- Proper semantic HTML elements should be used
- All interactive elements must be keyboard accessible

## Animation & Transitions

### Duration
- Fast: 100ms - Micro-interactions, immediate feedback
- Normal: 200ms - Standard transitions
- Slow: 300ms - Emphasis, important state changes

### Easing
- Standard: cubic-bezier(0.4, 0, 0.2, 1) - Most transitions
- Decelerate: cubic-bezier(0, 0, 0.2, 1) - Elements entering the screen
- Accelerate: cubic-bezier(0.4, 0, 1, 1) - Elements leaving the screen

## Z-Index Scale

| Level | Value | Usage                                |
|-------|-------|--------------------------------------|
| base  | 0     | Default                              |
| above | 1     | Elements slightly above others       |
| hover | 100   | Hover states, tooltips               |
| modal | 1000  | Modal dialogs, popovers              |
| toast | 2000  | Notifications, toasts                |
| top   | 9999  | Critical notifications, full overlays|

## Implementation Notes

This design system will be implemented in the following ways:

1. **Theme Configuration**: Updated `theme/index.ts` file with new tokens
2. **Component Library**: Enhanced component definitions in `theme/components/`
3. **Global Styles**: Updated global styles in the theme configuration
4. **Documentation**: Living documentation in Storybook
5. **Design Assets**: Figma library with components and styles 