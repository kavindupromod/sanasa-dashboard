---
name: PastDue Ledger
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3c4947'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6c7a77'
  outline-variant: '#bbcac6'
  surface-tint: '#006b5f'
  primary: '#006b5f'
  on-primary: '#ffffff'
  primary-container: '#14b8a6'
  on-primary-container: '#00423b'
  inverse-primary: '#4fdbc8'
  secondary: '#4e5e84'
  on-secondary: '#ffffff'
  secondary-container: '#c1d1fd'
  on-secondary-container: '#4a597f'
  tertiary: '#005ac2'
  on-tertiary: '#ffffff'
  tertiary-container: '#75a3ff'
  on-tertiary-container: '#00377d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#71f8e4'
  primary-fixed-dim: '#4fdbc8'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005048'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#b6c6f1'
  on-secondary-fixed: '#081a3d'
  on-secondary-fixed-variant: '#37466b'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 260px
  container-max-width: 1440px
  gutter: 1.5rem
  section-padding: 2rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
---

## Brand & Style
The design system for this product is built on a foundation of institutional trust, precision, and clarity. It targets financial controllers and accounts receivable professionals who require a high-density, low-friction environment to manage complex ledger data. 

The design style is **Corporate / Modern** with a focus on structural integrity. It utilizes a systematic approach to hierarchy, prioritizing readability and functional density. The aesthetic is clean and "unflappable," evoking the feeling of a high-end financial terminal while maintaining the accessibility of a modern SaaS platform. We avoid unnecessary ornamentation to ensure that data—the primary asset—remains the focus.

## Colors
This design system employs a sophisticated palette rooted in Deep Navy and Professional Blues to establish authority. 

- **Primary Action**: Teal (#14B8A6) is reserved exclusively for primary calls-to-action and key interactive milestones, ensuring high visibility against the corporate blue backdrop.
- **Brand Core**: Deep Navy (#1B2B4E) is used for structural elements like the persistent sidebar and primary headings, providing a "heavy" anchor for the layout.
- **Supporting Blues & Greys**: Professional Blue (#3B82F6) handles secondary actions and links, while Cool Greys (#64748B) manage borders, captions, and de-emphasized metadata.
- **Semantic Accents**: A dedicated status palette (Teal for 'Paid/Active', Amber for 'Pending/Past Due', and Slate for 'Closed/Archived') ensures clear data categorization within tables and dashboards.

## Typography
We utilize **Inter** across all levels of the design system to take advantage of its exceptional legibility and systematic weight distribution.

- **Data Presentation**: For ledger entries and financial figures, use the `mono-data` style which enables tabular numbers (`tnum`) to ensure columns of figures align vertically for easy comparison.
- **Hierarchy**: Use `display-lg` sparingly for dashboard overviews. `label-md` should be used for table headers and small metadata tags, always in uppercase with slight tracking to maintain readability at small sizes.
- **Scale**: On mobile devices, large headlines automatically scale down to maintain layout integrity without sacrificing touch-target clarity.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy within a fluid container, anchored by a persistent left sidebar.

- **Sidebar**: A fixed 260px width Deep Navy sidebar contains the primary navigation.
- **Main Canvas**: Content is housed in a flexible workspace that caps at 1440px to prevent excessive line lengths in data tables.
- **Grid**: A 12-column grid system with 24px (1.5rem) gutters is used for dashboard widgets and card layouts.
- **Responsiveness**: 
  - **Desktop**: Sidebar is persistent; 3nd-level navigation appears as a sub-header.
  - **Tablet**: Sidebar collapses into an icon-only rail or a hamburger menu.
  - **Mobile**: Single-column flow with horizontal scrolling enabled specifically for wide data tables.

## Elevation & Depth
This design system uses **Tonal Layers** and **Ambient Shadows** to create a structured hierarchy without overwhelming the user with "floating" elements.

- **Level 0 (Background)**: The base application background uses a very light cool grey (#F8FAFC) to reduce eye strain.
- **Level 1 (Cards)**: Main content areas and ledger tables sit on White (#FFFFFF) cards with a subtle 1px border (#E2E8F0) and a soft, low-opacity shadow (Offset 0, 1px, 3px, rgba(0,0,0,0.05)).
- **Level 2 (Dropdowns/Modals)**: Overlays use a more pronounced shadow (Offset 0, 10px, 15px, rgba(0,0,0,0.1)) and a sharp 1px border to differentiate from the content beneath.
- **Drag-and-Drop Zones**: Active drop zones use a dashed border in Professional Blue (#3B82F6) with a subtle tinted background (5% opacity) to indicate receptivity.

## Shapes
We employ a **Soft** shape language to balance the serious corporate tone with modern friendliness. 

- **Standard Elements**: Buttons, input fields, and small cards use a 4px (0.25rem) corner radius.
- **Large Containers**: Dashboard widgets and main ledger containers use an 8px (0.5rem) radius.
- **Status Tags**: Status tags utilize a slightly higher roundedness (12px) to give them a "pill-like" appearance that distinguishes them from interactive buttons.

## Components
- **Buttons**: 
  - *Primary*: Solid Teal (#14B8A6) with white text. 
  - *Secondary*: Outlined Blue (#3B82F6) with a 1px border.
- **Data Tables**: Use a clean, row-based layout with a subtle hover state (#F1F5F9). Headers are fixed during scroll, styled with `label-md` and a Slate (#475569) text color.
- **Status Tags**: 
  - *Paid*: Teal background (10% opacity) with Teal text.
  - *Past Due*: Amber background (10% opacity) with Amber text.
  - *Archived*: Slate background (10% opacity) with Slate text.
- **Input Fields**: Crisp white backgrounds with 1px Slate (#CBD5E1) borders. On focus, the border transitions to Professional Blue (#3B82F6) with a 2px soft outer glow.
- **Drag-and-Drop Zones**: Large rectangular areas with dashed borders, centered icons, and `body-md` instructional text.
- **Sidebar Items**: High-contrast icons with 20px size. Active states feature a left-aligned Teal vertical indicator and a subtle background highlight.