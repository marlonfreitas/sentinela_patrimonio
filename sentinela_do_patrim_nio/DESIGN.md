---
name: Sentinela do Patrimônio
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
  on-surface-variant: '#404944'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#a53c19'
  on-secondary: '#ffffff'
  secondary-container: '#fb7b54'
  on-secondary-container: '#6b1a00'
  tertiary: '#00237e'
  on-tertiary: '#ffffff'
  tertiary-container: '#1238a8'
  on-tertiary-container: '#9badff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb59f'
  on-secondary-fixed: '#3a0a00'
  on-secondary-fixed-variant: '#842503'
  tertiary-fixed: '#dde1ff'
  tertiary-fixed-dim: '#b8c4ff'
  on-tertiary-fixed: '#001453'
  on-tertiary-fixed-variant: '#173bab'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  heritage-green-deep: '#064E3B'
  heritage-green-leaf: '#166534'
  material-terracotta: '#9A3412'
  material-ochre: '#B45309'
  institutional-blue: '#1E40AF'
  surface-gray: '#F8FAFC'
  border-subtle: '#E2E8F0'
  status-critical: '#B91C1C'
  status-warning: '#D97706'
  status-stable: '#059669'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Public Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style
The design system is engineered for the **Sentinela do Patrimônio**, a government platform dedicated to the oversight and preservation of Tocantins' cultural and natural assets. The brand personality is **authoritative, meticulous, and enduring**. It must evoke the gravity of law and history while maintaining the efficiency of a modern technical tool.

The visual style is **Institutional Modernism**. It prioritizes clarity and information density over decorative elements. By blending structured layouts with high-quality typography, the system bridges the gap between historical archival work and real-time digital administration. The aesthetic is clean and data-centric, ensuring that complex geospatial and legislative information remains accessible to administrative users.

## Colors
The palette is rooted in the physical reality of heritage management. **Primary Green** represents the natural biomes and ecological preservation of Tocantins. **Secondary Terracotta** serves as a link to material heritage, archaeological sites, and historic architecture. **Tertiary Blue** provides the institutional weight required for governmental software.

Functional colors are strictly defined for status indicators:
- **Critical:** Reserved for high-urgency reports or immediate risks to heritage sites.
- **Warning:** Used for pending maintenance or investigative actions.
- **Stable:** Indicates preserved or successfully audited assets.

The default mode is **Light**, utilizing a "Paper White" (`#F8FAFC`) background to mimic official documentation, reducing eye strain during long administrative sessions.

## Typography
This design system utilizes a hybrid typographic scale. **Source Serif 4** is employed for headings to evoke a sense of history, tradition, and legislative authority. Its sturdy serifs ensure readability even in formal document-style layouts.

**Public Sans** is used for all UI elements, data tables, and body copy. It was chosen for its institutional clarity and neutral characteristics, which are essential for a platform that handles high-density technical data and geographic coordinates. 

- Use **Display** sizes for dashboard overviews.
- Use **Label-caps** for table headers and category tags to differentiate them from interactive content.
- Maintain a minimum of **Body-sm** for any legal footnotes to ensure accessibility standards are met.

## Layout & Spacing
The layout follows a **fixed-fluid hybrid grid**. The main content area is capped at 1440px to ensure line lengths for technical reports remain legible. 

- **Desktop (1280px+):** 12-column grid with a fixed left navigation sidebar (280px).
- **Tablet (768px - 1279px):** 8-column grid with a collapsible sidebar.
- **Mobile (<767px):** Single-column stack with 16px lateral margins.

Spacing follows an 8px base unit. Data-heavy views (like asset inventories) should use "Compact" spacing (4px/8px), while public-facing landing pages or document readers should use "Spacious" units (24px/32px) to improve focus.

## Elevation & Depth
To maintain a professional and "flat" institutional feel, this design system avoids heavy shadows. Instead, it utilizes **Tonal Layering** and **Low-contrast Outlines**.

- **Level 0 (Base):** Background color (`#F8FAFC`).
- **Level 1 (Cards/Sections):** White background with a 1px solid border (`#E2E8F0`). No shadow.
- **Level 2 (Interactive/Floating):** White background with a subtle, 4px blur, 10% opacity neutral shadow to indicate hover states or dropdown menus.
- **Map Layers:** Components overlaying the map interface should use a semi-transparent backdrop blur (12px) with a Primary Green border to separate management tools from the geographical base map.

## Shapes
The shape language is **Soft (0.25rem)**. This subtle rounding provides a modern touch without sacrificing the "serious" nature of an institutional platform. 

- **Standard Elements:** 4px (0.25rem) radius for buttons, input fields, and small cards.
- **Large Components:** 8px (0.5rem) radius for dashboard containers and modal windows.
- **Data Tags:** 2px radius or sharp corners are acceptable for small status chips to emphasize a technical/tabular aesthetic.

## Components
### Dashboard Cards
Cards must contain a "Category Header" using **label-caps** and the corresponding brand color (e.g., Green for Natural, Terracotta for Material). Use a 1px border instead of shadows for a cleaner data-room feel.

### Status Indicators
Urgency levels are represented by "Indicator Pills." 
- **High Alert:** `#B91C1C` background with white text.
- **Monitored:** `#D97706` background with white text.
- **Archived:** Light gray background with neutral text.

### Map Components
Map controls (Zoom, Layer Toggle, Legend) should be housed in white, Level 2 elevation containers positioned in the top-right or bottom-right of the viewport. Use **Primary Green** for active toggle states to signify "Protected" layers.

### Buttons & Inputs
- **Primary Button:** Solid `#064E3B` with white text. High contrast, sharp focus states.
- **Secondary Button:** Outlined `#064E3B` with a 1px stroke.
- **Input Fields:** Use a 1px `#E2E8F0` border that thickens to 2px in **Institutional Blue** on focus.

### Lists & Tables
Tables are the backbone of the system. Use alternating row stripes (Zebra striping) in `#F8FAFC` for high-density data. Headers must be "Sticky" to ensure context is never lost during scrolling.