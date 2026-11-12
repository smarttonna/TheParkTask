# Tokens, Color System & Surface Recipes

## 1. Root Custom Properties (`:root`)

```css
:root {
  /* Dynamic Viewport Scale Token (1.000 at 1568×913 desktop baseline; use px denominators or compute via JS) */
  --ui: clamp(0.78, min(100vw / 1568px, 100vh / 913px), 1.15);
  --sheet-scale: 1;
  --player-sheet-h: 646px;
  --mn-top: 24px;
  --over-foot: calc(46px * var(--ui, 1) + 14px + env(safe-area-inset-bottom, 0px));

  /* Core Brand & HUD Palette */
  --bg-canvas: #0a0807;               /* Deep warm obsidian page/canvas base */
  --ink: #f6faf9;                     /* Primary alabaster/mint-white text */
  --dim: rgba(246, 250, 249, 0.62);   /* Secondary/muted HUD text */
  --muted: rgba(246, 250, 249, 0.45); /* Kickers, inactive nav items, hints */
  --subtle: rgba(246, 250, 249, 0.34);/* Captions, legal footers, empty slots */
  --night: #0c0c20;                   /* Deep midnight navy-black */

  /* Championship & Crimson Accents */
  --red: #b3121d;                     /* Garuda crimson (marquee bar & brand red) */
  --kit: #da1f26;                     /* Kit scarlet red (light mode chart bars) */
  --gold: #e8ab36;                    /* Championship metallic gold */
  --gold-bright: #ffc570;             /* Luminous gold highlight (active numbers, kickers, icons) */
  --signal: #ffa92c;                  /* Warm signal amber (active thumb laser bar & badges) */
  --coral-alert: #ff7a59;             /* Error / overpower / shake state */
  --night-blue: #dfe6ff;              /* Night mode moonlit icon accent */
  --live: #234341;                    /* Deep pitch teal */

  /* Dossier Sheet Default Tokens (Print/Paper Mode base) */
  --paper: #f6faf9;
  --pen: #0c0c20;
  --grey: #565a64;
  --rule: #d3dbd8;

  /* Motion Curves */
  --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
  --ease-panel: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-spring: cubic-bezier(0.3, 1.35, 0.45, 1);
  --ease-spring-snappy: cubic-bezier(0.3, 1.4, 0.5, 1);

  color-scheme: dark;
}

/* Liquid Glass Dossier Overrides (Default Active Mode) */
body[data-glass] .sheet,
.sheet[data-glass="liquid"] {
  --pen: #f6faf9;
  --paper: #0c0c20;
  --grey: rgba(246, 250, 249, 0.76);
  --rule: rgba(246, 250, 249, 0.16);
  --signal: #ffa92c;
  --kit: #ee2f3b;
  --frame-border: rgba(246, 250, 249, 0.42);
}
```

---

## 2. Color Role Reference Table

| Role / Element | Value | Usage Context |
| :--- | :--- | :--- |
| **Canvas / Page Base** | `#0a0807` (`rgb(10, 8, 7)`) | `html, body` background behind 3D/interactive stage |
| **Primary Text (`--ink`)** | `#f6faf9` (`rgb(246, 250, 249)`) | Primary headings, active labels, player/item titles |
| **Secondary Text (`--dim`)** | `rgba(246, 250, 249, 0.62)` | Inactive dock numbers, subtitles, position/club metadata |
| **Muted Kicker Text** | `rgba(246, 250, 249, 0.45)` | Menu kickers (`.mn-k`), inactive nav links, hints |
| **Brand Crimson (`--red`)** | `#b3121d` (`rgb(179, 18, 29)`) | Bottom `.marquee` broadcast ticker bar |
| **Kit Scarlet (`--kit`)** | `#ee2f3b` (Glass) / `#da1f26` (Paper) | Horizontal SVG bar chart fills (`.fr-on`) |
| **Championship Gold (`--gold`)** | `#e8ab36` (`rgb(232, 171, 54)`) | Primary gold token, active borders, trophy badges, progress |
| **Luminous Gold Highlight** | `#ffc570` (`rgb(255, 197, 112)`) | Active locker numbers, kickers, `.ms` icons, pull-quotes |
| **Signal Amber (`--signal`)** | `#ffa92c` (`rgb(255, 169, 44)`) | Active thumb indicator bar (`14×2px`), `Fig. 1` label, pill tags |
| **Alert Coral** | `#ff7a59` (`rgb(255, 122, 89)`) | Overpower gauge, invalid input shake (`.bad`) |
| **Structural Hairline** | `rgba(246, 250, 249, 0.42)` | `1.5px solid` internal grid borders inside `.sheet` |
| **Dotted Leader Rule** | `rgba(246, 250, 249, 0.30)` | `1.5px dotted` horizontal leader between `<dt>` and `<dd>` |
| **Outer Glass Border** | `rgba(255, 255, 255, 0.20)` – `0.24` | `1px solid` outer border on glass pills, buttons, and sheets |

---

## 3. Surface Recipes

### 3.1 Primary "Liquid Glass" Panel (`.sheet`, `.gal-panel`, `.mf-panel`)
Combines a 3-stop diagonal translucent gradient, high-saturation backdrop blur, 4-edge inset specular rim highlights, and a `mix-blend-mode: screen` radial glare overlay:

```css
.glass-panel {
  position: relative;
  background: linear-gradient(
    165deg,
    rgba(255, 255, 255, 0.17),
    rgba(255, 255, 255, 0.06) 38%,
    rgba(20, 14, 16, 0.22)
  );
  backdrop-filter: blur(12px) saturate(190%) brightness(0.92);
  -webkit-backdrop-filter: blur(12px) saturate(190%) brightness(0.92);
  border: 1px solid rgba(255, 255, 255, 0.24);
  box-shadow:
    rgba(0, 0, 0, 0.42) 0px 24px 60px,
    rgba(255, 255, 255, 0.70) 0px 1px 1px inset,
    rgba(255, 255, 255, 0.14) 0px -1px 1px inset,
    rgba(255, 255, 255, 0.22) 1px 0px 1px inset,
    rgba(255, 255, 255, 0.07) 0px 0px 28px inset;
}

/* Night Mode Glass Adjustment */
body.amb-on .glass-panel {
  backdrop-filter: blur(12px) saturate(112%) brightness(0.66);
  -webkit-backdrop-filter: blur(12px) saturate(112%) brightness(0.66);
}

/* Specular Screen Glare Overlay */
.glass-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(120% 55% at 12% -8%, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0) 46%),
    radial-gradient(80% 40% at 100% 108%, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0) 50%);
  mix-blend-mode: screen;
}
```

### 3.2 Liquid Glass Segmented Pill & Icon Button (`.rn-seg`, `.rn-round`, `.gl-btn`)
```css
.glass-pill {
  border: 1px solid rgba(255, 255, 255, 0.20);
  background: linear-gradient(
    165deg,
    rgba(255, 255, 255, 0.15),
    rgba(255, 255, 255, 0.05) 45%,
    rgba(12, 8, 8, 0.50)
  );
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  box-shadow:
    rgba(0, 0, 0, 0.40) 0px 12px 34px,
    rgba(255, 255, 255, 0.55) 0px 1px 1px inset,
    rgba(255, 255, 255, 0.10) 0px -1px 1px inset;
}
```

### 3.3 Active Segmented Thumb with Gold Laser Bar (`.rn-thumb`, `.ws-thumb`)
```css
.glass-thumb {
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.34),
    rgba(255, 255, 255, 0.12) 50%,
    rgba(255, 255, 255, 0.06)
  );
  box-shadow:
    rgba(0, 0, 0, 0.32) 0px 6px 16px,
    rgba(255, 255, 255, 0.85) 0px 1px 1px inset,
    rgba(255, 255, 255, 0.20) 0px -1px 1px inset,
    rgba(255, 197, 112, 0.28) 0px 0px 0px 1px;
}

.glass-thumb::after {
  content: "";
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 2px;
  border-radius: 2px;
  background: #ffa92c;
  box-shadow: rgba(255, 169, 44, 0.8) 0px 0px 8px;
}
```

### 3.4 Opaque Warm Espresso-Mahogany Card (`.mn-panel`, `.tr-card`, `.ab-card`, `.fd-card`)
Used for floating navigation drawers, onboarding spotlight cards, and artist attribution cards:
```css
.espresso-card {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: linear-gradient(
    165deg,
    rgba(58, 26, 24, 0.94),
    rgba(20, 12, 12, 0.96) 55%,
    rgba(12, 9, 9, 0.97)
  );
  box-shadow:
    rgba(0, 0, 0, 0.60) 0px 30px 80px,
    rgba(255, 255, 255, 0.28) 0px 1px 1px inset;
}
```

### 3.5 Primary Championship Gold CTA Pill (`.tr-next`, `.fd-go`, `.pl-on`)
```css
.btn-gold-cta {
  color: rgb(26, 15, 10);
  border: 1px solid rgba(255, 214, 150, 0.90);
  background: linear-gradient(
    170deg,
    rgb(255, 217, 154),
    rgb(255, 197, 112) 45%,
    rgb(232, 171, 54)
  );
  box-shadow: rgba(232, 171, 54, 0.30) 0px 6px 18px;
}
```

### 3.6 Lacquered Crimson Locker Surface (`.mf-door`)
```css
.crimson-lacquer {
  background:
    radial-gradient(90% 60% at 72% 8%, rgba(255, 120, 80, 0.16), rgba(255, 120, 80, 0) 60%),
    linear-gradient(rgb(81, 3, 1), rgb(76, 2, 1) 42%, rgb(59, 1, 0) 74%, rgb(38, 0, 0));
  box-shadow: rgba(0, 0, 0, 0.28) -24px 0px 40px inset;
}
```

---

## 4. 3D Scene PBR Material Specifications (Three.js / WebGPU)

When pairing the HUD with a 3D Three.js scene, match these physical material parameters:
- **Lacquered Crimson Wood/Metal (`PaintRed`)**: `roughness: 0.38`, `clearcoat: 0.55`, `clearcoatRoughness: 0.09`
- **Interior Crimson (`PaintRedInner`)**: `roughness: 0.42`, `clearcoat: 0.45`
- **Dark Plinth (`Charcoal`)**: `roughness: 0.85`
- **Concrete Floor (`FloorConcrete`)**: `roughness: 0.58`
- **Brushed Chrome Hardware / Hooks**: `metalness: 1.0`, `roughness: 0.10` – `0.14`
- **Warm Internal LED Strip (`LedStrip`)**: Emissive RGB `[6.0, 5.16, 4.08]`
- **Overhead Locker Spotlight**: Color `#fff6ea`, intensity `5.97`, paired with a low-opacity volumetric cone mesh (`beamMesh`) and instanced floating dust motes (`48` particles).

