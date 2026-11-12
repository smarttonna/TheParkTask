---
name: garuda-locker-design
description: >-
  Applies the "Garuda 2026: Champions' Locker Room" (OFFWG × Screenagers) spatial HUD,
  Liquid Glass, and Swiss Editorial Dossier design system. Use this skill when the user
  asks to build, style, or redesign a web interface, 3D showcase, interactive gallery,
  roster/locker explorer, or dashboard using the Garuda 2026 / OFFWG Locker Room aesthetic.
---

# Garuda 2026 Locker Room Design System (`garuda-locker-design`)

This skill codifies the visual, typographic, spatial, and interactive design language of **OFFWG × Screenagers' "GARUDA 2026: The Champions' Locker Room"** (`garuda2026.offwg.com/lockers`).

## 1. Core Design Philosophy: The "Three-Layer Contrast" System

Every screen built with this style balances three distinct layers of contrast:

1. **Atmospheric Dark / Lacquered Crimson Canvas**:
   - Full-viewport spatial canvas (`100vw × 100vh`, `overflow: hidden`, base `#0a0807`) featuring warm architectural lighting (`#fff6ea`), deep Garuda crimson lacquer (`#b3121d` / `#510301`), dark slate/espresso shadows (`#0c0c20`), and championship gold accents (`#e8ab36` / `#ffc570`).
   - Supports a dual-ambience toggle: **Day Mode** (warm sunbeams, gold accents `#ffc570`) and **Night Mode** (`data-mode="night"`, cool cobalt moonlight `#dfe6ff` with dimmed glass brightness).
2. **Specular "Liquid Glass" HUD Chrome (`[data-glass="liquid"]`)**:
   - Floating perimeter controls, segmented docks, and modal panels use a 165° translucent gradient (`rgba(255,255,255,0.17)` → `rgba(20,14,16,0.22)`), heavy backdrop saturation (`blur(12px–16px) saturate(190%) brightness(0.92)`), **4-directional inset specular rim shadows**, and a `mix-blend-mode: screen` radial highlight overlay (`::before`).
   - High-density floating menus and artist cards use an **Opaque Warm Espresso-Mahogany** surface (`rgba(58,26,24,0.94)` → `rgba(12,9,9,0.97)`) to preserve text contrast without blur muddiness.
3. **Swiss Editorial / Archival Dossier Typography (`.sheet`)**:
   - Inspection drawers and detail views are structured like precision technical dossiers: `1.5px solid rgba(246,250,249,0.42)` internal framing, oversized tabular jersey/index stamps (`42px` extra-bold), dotted leader lines (`1.5px dotted`) connecting `<dt>` keys and `<dd>` values, and inline SVG data visualizations (`Fig. 1`).

---

## 2. Quick-Start Implementation Workflow

When applying this design style to a project, follow these steps in order:

1. **Load Tokens & Surfaces**:
   - Read [references/tokens-and-surfaces.md](./references/tokens-and-surfaces.md) for the exact `:root` CSS custom properties, color palette, Liquid Glass box-shadow recipes, and surface gradients.
   - Start from the production CSS boilerplate in [examples/tokens-and-components.css](./examples/tokens-and-components.css).
2. **Establish Typography & Viewport Perimeter Layout**:
   - Read [references/typography-and-layout.md](./references/typography-and-layout.md) to configure the font pairing (`Geist` for editorial/UI, `Geist Mono` for uppercase tracked metadata and `tabular-nums`, `Montserrat 900` / `Archivo Black` for 3D extruded chrome headers, `Barlow Condensed` for athletic numbering).
   - Pin HUD chrome to the viewport perimeter using proportional `--ui` scaling (`calc(Npx * var(--ui))`) so the central canvas/stage remains unobstructed.
3. **Build Signature Components & Motion**:
   - Read [references/components-and-motion.md](./references/components-and-motion.md) to implement the signature components:
     - **Bottom Segmented Dock (`.wl-strip` / `.rn-seg`)** with a spring-animated sliding pill thumb (`.ws-thumb`) and bottom gold laser bar (`14×2px` `#ffa92c`).
     - **Swiss Technical Dossier (`.sheet`)** with two-column framed hairline architecture, dotted `<dl>` leader rows, and staggered cascade reveal animations.
     - **Clip-Path Morphing Menu Drawer (`.mn-panel`)** expanding from the top-right `44×44px` circular glass trigger.
     - **Broadcast Marquee Footer (`footer.marquee`)** in `#b3121d` crimson with italic uppercase ticker copy.

---

## 3. Non-Negotiable Style Rules

- **Never use flat opaque grey cards**: Every floating surface must either use the **Liquid Glass** recipe (translucent gradient + `backdrop-filter` + 4-edge inset specular `box-shadow` + `::before` screen glare) or the **Warm Espresso-Mahogany** gradient (`#3a1a18` → `#0c0909`).
- **Pair Sans Display with Tracked Mono Kicker**: Every major heading or card title (`Geist 600/700`, tight tracking `-0.028em` to `-0.035em`) must be preceded by a micro uppercase kicker in `Geist Mono` (`9.5px–11px`, `letter-spacing: 0.20em–0.34em`, color `--dim` or `#ffc570`).
- **Enforce `tabular-nums` on all numbers**: Roster numbers, pagination (`14 / 25`), statistics, and timers must always set `font-variant-numeric: tabular-nums`.
- **Use Spring Physics for Selection Thumbs, Fast Deceleration for Panels**:
  - Panel/sheet transitions use `--ease: cubic-bezier(0.2, 0.7, 0.2, 1)`.
  - Sliding pill thumbs and icon morphs use spring overshoot (`cubic-bezier(0.3, 1.35, 0.45, 1)` or `cubic-bezier(0.3, 1.4, 0.5, 1)`).
- **Provide Touch/Coarse-Pointer Fallbacks**: Under `@media (hover: none) and (pointer: coarse)`, replace heavy `backdrop-filter: blur(16px)` on large modals with rich opaque dark-garnet gradients to maintain 60fps performance.

---

## 4. Reference Documentation & Boilerplate

- **[Tokens, Color System & Liquid Glass Surfaces](./references/tokens-and-surfaces.md)**
- **[Typography Matrix, Spatial HUD Layout & Responsive Rules](./references/typography-and-layout.md)**
- **[Component Anatomy, Keyframes & Micro-Interactions](./references/components-and-motion.md)**
- **[Ready-to-Use CSS Boilerplate (`tokens-and-components.css`)](./examples/tokens-and-components.css)**

