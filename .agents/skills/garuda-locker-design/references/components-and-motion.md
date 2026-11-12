# Component Anatomy, Motion & Micro-Interactions

## 1. Swiss Editorial Dossier Sheet (`aside#sheet`)

The signature inspection panel blends **Liquid Glass** outer chrome with **Swiss archival/editorial** internal typography and hairline framing.

### 1.1 DOM Structure Blueprint
```html
<aside id="sheet" class="sheet on" data-glass="liquid">
  <!-- 1. Running Header -->
  <div class="sh-run">
    <span class="sh-field">THE LOCKERS <em>ASEAN CUP 2026 CHAMPIONS</em></span>
    <span class="sh-page"><b>14</b> / 25</span>
  </div>

  <!-- 2. Framed Two-Column Swiss Grid -->
  <div class="sh-frame">
    <!-- Left Column (46% width on desktop) -->
    <div class="sh-col-a">
      <header class="sh-title">
        <div class="sh-stamp">
          <span class="st-flag" aria-hidden="true"></span>
          <i></i>
          <b>2</b>
        </div>
        <div class="sh-h">
          <p class="sh-pos">DEFENDER <i class="cap-c">C</i></p>
          <h2>Kevin <b>Diks</b></h2>
          <a class="sh-rail" href="#rail">SEE HIS SHIRT ON THE RAIL ↗</a>
        </div>
      </header>

      <!-- Dotted-Leader Facts List -->
      <dl class="sh-facts">
        <div style="--i:0"><dt>CLUB</dt><i></i><dd><b>Borussia Mönchengladbach</b><small>GERMANY · BUNDESLIGA</small></dd></div>
        <div style="--i:1"><dt>AGE / BORN</dt><i></i><dd><b>29</b><small>06 OCT 1996 · APELDOORN</small></dd></div>
        <div style="--i:2"><dt>HEIGHT</dt><i></i><dd><b>1.86 m</b></dd></div>
        <div style="--i:3"><dt>CAPS / GOALS</dt><i></i><dd><b>18 / 4</b></dd></div>
      </dl>
    </div>

    <!-- Right Column (54% width on desktop) -->
    <div class="sh-col-b">
      <section class="sh-fig">
        <p class="sh-k"><span>Fig. 1</span> ASEAN CUP 2026, MATCH BY MATCH</p>
        <div class="fr-scale"><span>0′</span><span>45′</span><span>90′</span><span>120′</span></div>
        <div class="fr" style="--i:0">
          <div class="fr-meta"><b>vs SGP 2–0</b><small>25 Sep · Group</small></div>
          <div class="fr-bar">
            <svg viewBox="0 -2 300 32">
              <line class="fr-half" x1="112.5" y1="0" x2="112.5" y2="28" />
              <rect class="fr-on" style="--d:0.05s" x="0" y="6" width="225" height="16" rx="2" />
              <circle class="fr-goal" cx="220" cy="14" r="5" />
            </svg>
            <span class="fr-n">Started · 90′ · goal 90′+6′</span>
          </div>
        </div>
        <p class="sh-sum">4 APPS · 4 STARTS · 390′ · 1 GOAL</p>
      </section>

      <section class="sh-note">
        <span>PROFILE</span>
        <p>Editorial player biography copy set in 14px Geist with balanced line measure.</p>
        <p class="sh-final"><b>THE FINAL · 5 OCT 2026:</b> Narrative summary of championship performance.</p>
      </section>
    </div>
  </div>

  <!-- 3. Archival Source Caption -->
  <p class="sh-cap">SOURCES: ASEAN FOOTBALL FEDERATION · TRANSFERMARKT · OPTA</p>

  <!-- 4. Bottom Action & Pager Bar -->
  <div class="sh-ctrl">
    <button class="sh-btn sh-close">BACK TO THE LOCKERS</button>
    <div class="sh-pager">
      <button class="sh-round sh-prev" aria-label="Previous">‹</button>
      <button class="sh-round sh-next" aria-label="Next">›</button>
    </div>
  </div>
</aside>
```

### 1.2 Key Structural Details of `.sheet`
- **Internal Frame (`.sh-frame`)**: `border: 1.5px solid rgba(246, 250, 249, 0.42); border-radius: 12px; display: flex;`
- **Column Divider (`.sh-col-b`)**: `border-left: 1.5px solid rgba(246, 250, 249, 0.42);`
- **Section Dividers (`.sh-title`, `.sh-fig`)**: `border-bottom: 1.5px solid rgba(246, 250, 249, 0.42);`
- **Dotted Leader Rows (`.sh-facts > div`)**:
  `display: grid; grid-template-columns: auto minmax(16px, 1fr) auto; align-items: baseline; gap: 8px;`
  where the middle `<i>` has `border-bottom: 1.5px dotted rgba(246, 250, 249, 0.30)`.
- **Indonesian Flag Stamp (`.st-flag`)**: `width: 36px; height: 24px; border-radius: 3px; background: linear-gradient(#e0141f 50%, #f6faf9 50%); box-shadow: 0 0 0 1px rgba(255,255,255,0.28);`

---

## 2. Bottom Segmented Locker Dock (`nav#strip.wl-strip`)

```html
<nav id="strip" class="wl-strip" aria-label="Locker selection">
  <div class="ws-head">
    <p class="ws-name"><b>2</b>Kevin Diks<i class="cap-c">C</i></p>
    <p class="ws-pos">Defender · Borussia Mönchengladbach</p>
  </div>
  <div class="ws-track">
    <button class="rn-round ws-prev" aria-label="Previous locker">‹</button>
    <div class="rn-seg ws-cells">
      <i class="ws-thumb" style="transform: translateX(480px); width: 38px;"></i>
      <button class="ws-c">6</button>
      <button class="ws-c">3</button>
      <!-- ... -->
      <button class="ws-c on">2</button>
    </div>
    <button class="rn-round ws-next" aria-label="Next locker">›</button>
  </div>
</nav>
```

- **Captain Badge (`.cap-c`)**: Inline square (`width: 0.95em; height: 0.95em; border-radius: 0.2em; background: linear-gradient(160deg, #ffd58a, #e8ab36); color: #1a1008; font: 800 0.64em/1 "Geist", sans-serif`).
- **Sliding Pill Thumb (`.ws-thumb`)**: Positioned `position: absolute; top: 4px; bottom: 4px; left: 0; border-radius: 999px; pointer-events: none;` with a glowing `14×2px` `#ffa92c` laser bar at `bottom: 2px` (`::after`). Transitions `transform` and `width` using `0.5s cubic-bezier(0.3, 1.35, 0.45, 1)`.

---

## 3. 3D Extruded Chrome/Gold Header Wordmark (`.brand .champs`)

Uses two overlapping `<span>` elements in the same CSS Grid cell (`grid-area: 1 / 1`):
```html
<div class="champs" aria-label="CHAMPIONS">
  <span class="ch-gold" aria-hidden="true">CHAMPIONS</span>
  <span class="ch-face">CHAMPIONS</span>
</div>
```

```css
.champs {
  display: inline-grid;
  font: 900 calc(38px * var(--ui, 1))/1 "Montserrat", "Archivo Black", sans-serif;
  letter-spacing: 0.015em;
  text-transform: uppercase;
  user-select: none;
}
.champs > span {
  grid-area: 1 / 1;
}
.champs .ch-gold {
  color: rgb(176, 122, 34);
  text-shadow:
    rgb(243, 205, 106) 0.4px 0.5px 0px,
    rgb(224, 173, 69) 0.8px 1px 0px,
    rgb(197, 143, 44) 1.2px 1.5px 0px,
    rgb(168, 116, 30) 1.6px 2px 0px,
    rgb(138, 92, 22) 2px 2.5px 0px,
    rgb(109, 70, 16) 2.4px 3px 0px,
    rgb(84, 53, 12) 2.8px 3.5px 0px,
    rgba(0, 0, 0, 0.7) 3px 6px 12px;
}
.champs .ch-face {
  color: transparent;
  -webkit-text-fill-color: transparent;
  background:
    linear-gradient(104deg, transparent 42%, rgba(255, 255, 255, 0.95) 50%, transparent 58%) 160% 0px / 260% 100% no-repeat,
    linear-gradient(
      rgb(255, 255, 255),
      rgb(238, 241, 244) 20%,
      rgb(195, 202, 210) 41%,
      rgb(124, 134, 146) 49%,
      rgb(154, 163, 173) 52%,
      rgb(232, 236, 239) 60%,
      rgb(251, 252, 252) 76%,
      rgb(185, 193, 201)
    ) 0px 0px / 100% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ch-shine 7s ease-in-out infinite;
}
@keyframes ch-shine {
  0%, 72% { background-position: 160% 0, 0 0; }
  100%    { background-position: -60% 0, 0 0; }
}
```

---

## 4. Clip-Path Morphing Menu Drawer (`.mn-panel`)

The top-right menu drawer (`width: 360px; border-radius: 26px`) expands directly out of the circular trigger button corner:
```css
.mn-panel {
  position: fixed;
  top: calc(var(--mn-top, 26px) - 8px);
  right: 28px;
  width: 360px;
  padding: 22px 22px 18px;
  border-radius: 26px;
  clip-path: inset(0px 0px calc(100% - 52px) calc(100% - 52px) round 26px);
  opacity: 0;
  pointer-events: none;
  transition:
    clip-path 0.62s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.35s var(--ease);
}

.mn.open .mn-panel {
  clip-path: inset(0px round 26px);
  opacity: 1;
  pointer-events: auto;
}

/* Staggered item reveal using inline --i variable */
.mn-panel [style*="--i"] {
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.38s var(--ease), transform 0.38s var(--ease);
}
.mn.open .mn-panel [style*="--i"] {
  opacity: 1;
  transform: translateY(0);
  transition-delay: calc(0.12s + var(--i) * 35ms);
}
```

---

## 5. Stacked Card Portal Hover (`#xlink.wl-next`) & Broadcast Marquee (`footer.marquee`)

- **Stacked Card Fan-Out (`.wl-next`)**:
  Two overlapping miniature preview cards (`.nx-back` and `.nx-front`, `border-radius: 12px`). On `:hover`, `.nx-back` fans left (`transform: translate(-22px, 1px) rotate(-10deg)`) while `.nx-front` lifts (`transform: translateY(-5px) rotate(0deg) scale(1.04)`) with `transition: transform 0.45s cubic-bezier(0.3, 1.35, 0.45, 1)` and a `1.5px` `#ffc570` border glow.
- **Broadcast Marquee (`footer.marquee`)**:
  Full-width `46px`-tall `#b3121d` crimson bar at the bottom viewport edge. Uses a duplicated `.track` flex container animating `transform: translateZ(0)` → `translate3d(-50%, 0, 0)` over `40s linear infinite` (`600 italic 17px "Geist"`, `uppercase`).

---

## 6. Signature Keyframe Animations

```css
/* Dossier staggered vertical cascade */
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* SVG match-minutes horizontal bar growth */
@keyframes grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/* Preloader shirt hanger swing physics */
@keyframes pl-hang {
  0%   { opacity: 0; transform: translateY(-10px) rotate(10deg); }
  35%  { opacity: 1; transform: translateY(0) rotate(-7deg); }
  60%  { transform: rotate(4deg); }
  82%  { transform: rotate(-2deg); }
  100% { opacity: 1; transform: rotate(0deg); }
}

/* 3D hotspot concentric gold pulse */
@keyframes wl-breathe {
  0%   { transform: scale(0.45); opacity: 0.95; }
  100% { transform: scale(1.35); opacity: 0; }
}
```

