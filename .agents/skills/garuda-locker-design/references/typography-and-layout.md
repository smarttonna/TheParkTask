# Typography Matrix, Spatial HUD Layout & Responsive Architecture

## 1. Font Stack & Role Assignment

| Role | Primary Family | Fallbacks | Weights Used | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Primary UI & Editorial** | `"Geist"` | `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | `400`, `500`, `600`, `700`, `800` + `600 italic` | Headings, player/item names, dossier prose, italic broadcast marquee |
| **Technical & Metadata** | `"Geist Mono"` | `"JetBrains Mono", "SFMono-Regular", monospace` | `400`, `500`, `600`, `700` | Kickers, locker numbers, buttons, `<dt>` fact keys, timestamps, `tabular-nums` |
| **3D Extruded Chrome Header** | `"Montserrat"` | `"Archivo Black", Impact, sans-serif` | `900` | Top-center `"CHAMPIONS"` 3D gold/chrome extruded display wordmark |
| **Athletic / Kit Numbering** | `"Barlow Condensed"` | `"Chakra Petch", sans-serif` | `600`, `700` | Jersey inputs (`.fd-f input`), kit back lettering |
| **Editorial Pull-Quote** | `"Lexend Giga"` | `"Archivo Black", sans-serif` | `600` | Manifesto pull-quotes (`.mf-quote p`) in `#ffc570` |
| **Iconography (`.ms`)** | `"Material Symbols Rounded"` | — | `300`–`500` | `font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 40` |

---

## 2. Complete Type Scale Matrix

| UI Element / Selector | Font Family | Weight | Desktop Size | Compact / Mobile | Line Height | Letter Spacing | Transform / Features |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Goal / Hero Celebration (`.gl-goal b`)** | `Geist` | `700` | `96px` | `68px` | `0.90` | `-0.035em` | None |
| **Manifesto Title (`.mf-title`)** | `Geist` | `600` | `calc(52px * var(--ui))` | `38px` | `1.00` | `-0.035em` | `text-wrap: balance` |
| **Dossier Stamp Number (`.sh-stamp b`)** | `Geist` | `800` | `42px` | `36px` | `0.90` | `-0.030em` | `tabular-nums` |
| **Header "CHAMPIONS" (`.brand .champs`)** | `Montserrat` | `900` | `calc(38px * var(--ui))` | `19px` | `1.00` | `0.015em` | `uppercase` |
| **Dossier H2 Name (`.sh-h h2`)** | `Geist` | `400` (`<b>` `700`) | `36px` | `30px` / `28px` | `1.02` | `-0.035em` | First name `400`, Surname `700` |
| **Gallery Modal Title (`.gal-title`)** | `Geist` | `600` | `calc(34px * var(--ui))` | `27px` | `1.05` | `-0.028em` | None |
| **Menu Primary Link (`.mn-go .mn-t`)** | `Geist` | `600` | `27px` | `24px` | `1.08` | `-0.028em` | None |
| **Jersey Input (`.fd-f input`)** | `Barlow Condensed` | `700` | `26px` | `24px` | `1.00` | `0.060em` | `uppercase` |
| **Dock Active Name (`.ws-name`)** | `Geist` | `600` | `20px` | `17px` | `1.10` | `-0.010em` | Number `<b>` in `700 20px Geist Mono` `#ffc570` |
| **Manifesto Lead (`.mf-lead`)** | `Geist` | `500` | `calc(21px * var(--ui))` | `19px` | `1.45` | `-0.010em` | None |
| **Manifesto Pullquote (`.mf-quote p`)** | `Lexend Giga` | `600` | `calc(19px * var(--ui))` | `17px` | `1.42` | `-0.010em` | Color `#ffc570`, `text-wrap: balance` |
| **Marquee Ticker Copy (`.track span`)** | `Geist` | `600 italic` | `calc(17px * var(--ui))` | — | `1.00` | `0.020em` | `uppercase` (`<em>` is `500 italic` normal-case) |
| **Dossier Facts Row (`.sh-facts > div`)** | `Geist` | `400` (`<b>` `700`) | `15px` | `14px` | `1.30` | `0` | `<dd><b>` uses `tabular-nums` |
| **Dossier Profile Body (`.sh-note p`)** | `Geist` | `400` | `14.5px` | `13.5px` | `1.45` | `0` | `text-wrap: pretty` |
| **3D Floating Hover Label (`.label`)** | `Geist` | `500` | `14px` | `13px` | `1.00` | `0.010em` | `<b>` number in `600 14px Geist Mono` |
| **Locker Cell Number (`.ws-c`)** | `Geist Mono` | `600` | `12px` | `11px` | `1.00` | `0.040em` | `tabular-nums` |
| **Segmented Pill Option (`.rn-opt`, `.gl-btn`)** | `Geist Mono` | `600` | `11.5px` | `10px` | `1.00` | `0.160em` | `uppercase` |
| **Header Subtitle (`.brand p`)** | `Geist Mono` | `500` | `calc(11px * var(--ui))` | `8px` | `1.00` | `0.240em` | `uppercase` |
| **Dossier Section Header (`.sh-pos`, `.sh-note span`)**| `Geist` | `600` | `10.5px` | `10px` | `1.00` | `0.300em` | `uppercase` |
| **Dossier Fact Key (`.sh-facts dt`, `.sh-k`)** | `Geist Mono` | `500` | `10.5px` | `10px` | `1.00` | `0.200em` | `uppercase` |
| **Dock Meta Subtitle (`.ws-pos`)** | `Geist Mono` | `500` | `10px` | `9.5px` | `1.00` | `0.220em` | `uppercase` |
| **Section Kicker (`.mn-k`, `.gal-k`, `.mf-k`, `.tr-k`)**| `Geist Mono` | `500` | `9.5px` – `10px` | `9.5px` | `1.00` | `0.240em` – `0.280em` | `uppercase`, `#ffc570` or `--muted` |

---

## 3. Full-Viewport Spatial HUD Layout Architecture

### 3.1 Zero-Scroll Canvas Stage
```css
html, body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  background: #0a0807;
  color: var(--ink);
  font-family: "Geist", sans-serif;
  touch-action: manipulation;
  -webkit-font-smoothing: antialiased;
}

main#app {
  position: fixed;
  inset: 0;
  z-index: 0;
}
```

### 3.2 Viewport Perimeter Pinning (Desktop `@media (min-width: 761px) and (min-aspect-ratio: 1/1)`)
All HUD controls sit along the perimeter so the central 70%+ of the viewport remains open:

- **Top Header Bar (`header.top`)**:
  - `position: fixed; inset: 0 0 auto; z-index: 3;`
  - `display: grid; grid-template-columns: 1fr auto 1fr; align-items: start;`
  - `padding: calc(22px * var(--ui)) calc(36px * var(--ui)) 0;`
  - **Left (`1fr`)**: Brand logo (`.logo`, `height: calc(20px * var(--ui))`).
  - **Center (`auto`)**: Championship emblem + subtitle (`FIFA ASEAN CUP 2026™`) + 3D extruded `.champs` wordmark.
  - **Right (`1fr`, `justify-self: end`, `margin-right: calc(54px * var(--ui))`)**: Context action pill (`#doorBtn`) + segmented camera switcher (`FRONT / WIDE / ANGLE`).
- **Top-Right Menu Trigger (`#menuBtn`)**:
  - `position: fixed; top: var(--mn-top, 24px); right: calc(36px * var(--ui)); width: 44px; height: 44px; border-radius: 50%; z-index: 41;`
- **Bottom-Left Utility Cluster (`#sound2`, `#ambBtn`)**:
  - Two `44×44px` circular glass buttons at `bottom: calc(62px * var(--ui))`, `left: calc(36px * var(--ui))` and `left: calc(90px * var(--ui))`.
- **Bottom-Center Segmented Locker Dock (`nav#strip.wl-strip`)**:
  - `position: fixed; left: 50%; bottom: calc(62px * var(--ui)); transform: translate(-50%) scale(var(--ui)); transform-origin: center bottom;`
  - `width: min(1080px, calc((100vw - 440px * var(--ui)) / var(--ui))); z-index: 3;`
- **Bottom-Right Stacked Card Portal (`#xlink.wl-next`)**:
  - `position: fixed; right: calc(32px * var(--ui)); bottom: calc(62px * var(--ui)); z-index: 3;`
- **Bottom Broadcast Marquee (`footer.marquee`)**:
  - `position: fixed; inset: auto 0 0; height: calc(46px * var(--ui)); background: var(--red); z-index: 3;`
- **Right-Side Inspection Dossier (`aside#sheet`)**:
  - When a locker/item is inspected in detail (`body.is-detail`), the 3D subject shifts to the left half of the screen while `aside#sheet` slides into the right half (`width: 760px` in two-column `.sheet-wide` mode, or `440px` in single-column mode; `top: 132px; bottom: 62px; margin: auto 0; z-index: 4`).

---

## 4. Responsive & Adaptive Rules

### 4.1 Mobile & Portrait Tablet (`@media (max-width: 760px), (max-aspect-ratio: 1 / 1)`)
- **Hide Bottom Marquee & Portal Stack**: Hide `footer.marquee` and `#xlink.wl-next`; show a compact centered `.credit` line at the bottom.
- **Vertical Utility Column on Right Edge**: Move sound, day/night ambience, door toggle, and camera view switcher into a vertical `38px`-wide stack pinned to `right: 14px`.
- **Top Readability Vignette**: Add `.top::before` (`height: 156px; background: linear-gradient(rgba(8,5,5,0.93), rgba(8,5,5,0.78) 36%, rgba(8,5,5,0.32) 70%, transparent)`).
- **Collapsible Bottom Sheet Dossier**: Convert `aside#sheet` into a bottom-anchored sheet (`left: 14px; right: 14px; width: auto; bottom: calc(var(--foot) + 22px); max-height: 44vh`) with a `.sh-fold` chevron button that collapses the sheet down to its title header.

### 4.2 Coarse Pointer GPU Fallback (`@media (hover: none) and (pointer: coarse)`)
- Replace `backdrop-filter: blur(16px)` on full-screen modals (`.gal-panel`, `.mf-panel`) with an opaque garnet-obsidian gradient:
  ```css
  background: linear-gradient(165deg, rgba(92, 52, 50, 0.90), rgba(38, 22, 24, 0.93) 40%, rgba(18, 11, 13, 0.95));
  backdrop-filter: none;
  ```

