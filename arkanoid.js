// ==========================================================================
// ARKANOID: TONNA SHATTER 2026 — KINETIC BRICK BREAKER ENGINE
// Sub-stepped Physics · Analogue Stick Control · 6 Augments · 12 Sectors
// ==========================================================================

// 1. Modern Web Guidance: Invoker Commands & Light-Dismiss Dialog Fallbacks
if (!('commandForElement' in HTMLButtonElement.prototype)) {
  (async () => {
    try {
      await import('https://esm.run/invokers-polyfill');
    } catch {
      document.addEventListener('click', (event) => {
        const button = event.composedPath().find((el) => el.matches?.('button[commandfor]'));
        if (!button) return;
        const target = document.getElementById(button.getAttribute('commandfor'));
        const command = button.getAttribute('command');
        if (!target || !command) return;
        if (command === 'show-modal' && typeof target.showModal === 'function') {
          document.body.classList.remove('menu-open');
          target.showModal();
        } else if (command === 'close' && typeof target.close === 'function') {
          target.close();
        }
      });
    }
  })();
}

if (!('closedBy' in HTMLDialogElement.prototype)) {
  document.querySelectorAll('dialog[closedby="any"]').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) dialog.close();
    });
  });
}

// 2. Vercel Web Analytics (Public Domains) & Shared Local Telemetry
const ANALYTICS_STORAGE_KEY = 'theparktask_analytics_v1';
const ADMIN_AUTH_SESSION_KEY = 'theparktask_admin_auth_v1';
const ADMIN_PW_HASH_KEY = 'theparktask_admin_pw_hash_v1';
const DEFAULT_ADMIN_PW = 'admin2026';
const ARK_HIGH_KEY = 'garuda_arkanoid_high_v1';
const ARK_CLEARED_KEY = 'garuda_arkanoid_cleared_v1';

if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  window.va = window.va || function (...args) { (window.vaq = window.vaq || []).push(args); };
  const vaScript = document.createElement('script');
  vaScript.defer = true;
  vaScript.src = '/_vercel/insights/script.js';
  document.head.appendChild(vaScript);
}

function recordAnalytics(mutator, eventLabel = null) {
  try {
    const raw = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || 'null') || {
      visits: 1,
      uniqueVisitors: 1,
      totalPlaySec: 0,
      attempts: 0,
      clears: 0,
      demos: 0,
      collisions: 0,
      arkanoidRuns: 0,
      arkanoidHigh: 0,
      scoreSum: 0,
      scoreCount: 0,
      stages: {},
      events: []
    };
    mutator(raw);
    if (eventLabel) {
      const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      raw.events = raw.events || [];
      raw.events.unshift({ ts, label: eventLabel });
      raw.events = raw.events.slice(0, 40);
    }
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(raw));
  } catch {}
}

// 3. Procedural WebAudio Synthesizer
class ArkanoidAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) this.ctx = new AudioCtx();
  }

  tone(freq, dur = 0.09, type = 'sine', gainVal = 0.11, slideTo = null) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  paddleHit(normOffset = 0) {
    const base = 210 + Math.abs(normOffset) * 70;
    this.tone(base, 0.08, 'triangle', 0.14, base * 1.35);
  }

  brickBreak(streak = 1) {
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
    const f = scale[Math.min(scale.length - 1, (streak - 1) % scale.length)] * (streak > 10 ? 1.5 : 1);
    this.tone(f, 0.11, 'sine', 0.12, f * 1.25);
  }

  armorClang() {
    this.tone(165, 0.07, 'sawtooth', 0.1, 115);
  }

  explosion() {
    this.tone(110, 0.28, 'sawtooth', 0.18, 34);
    setTimeout(() => this.tone(75, 0.22, 'triangle', 0.15, 28), 35);
  }

  laserShot() {
    this.tone(880, 0.07, 'sawtooth', 0.07, 220);
  }

  powerUp() {
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.1, 'triangle', 0.11), i * 45);
    });
  }

  sectorClear() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.22, 'triangle', 0.14), i * 85);
    });
  }

  loseCore() {
    [300, 220, 155].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.16, 'sawtooth', 0.12), i * 90);
    });
  }
}

const sfx = new ArkanoidAudio();

// 4. Color Palette & 12 Kinetic Sector Definitions
const TIER_PALETTE = [
  { fill: '#e11d48', glow: 'rgba(225, 29, 72, 0.55)', rim: '#fda4af' }, // Crimson
  { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.55)', rim: '#fde68a' }, // Gold
  { fill: '#06b6d4', glow: 'rgba(6, 182, 212, 0.55)', rim: '#a5f3fc' }, // Cyan
  { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.55)', rim: '#a7f3d0' }, // Emerald
  { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.55)', rim: '#ddd6fe' }, // Violet
  { fill: '#f97316', glow: 'rgba(249, 115, 22, 0.55)', rim: '#fed7aa' }  // Coral
];

const POWER_TYPES = [
  { id: 'WIDE', label: 'WIDE VAUS', color: '#38bdf8', dur: 18 },
  { id: 'MULTI', label: 'TRI-SPLIT', color: '#ffc570', dur: 0 },
  { id: 'LASER', label: 'PULSE LASER', color: '#ff5a6e', dur: 14 },
  { id: 'FIRE', label: 'FIRE COMET', color: '#fb923c', dur: 11 },
  { id: 'MAGNET', label: 'GRAV-LOCK', color: '#c084fc', dur: 15 },
  { id: 'LIFE', label: '+1 CORE', color: '#4ade80', dur: 0 }
];

const SECTORS = [
  {
    id: '01',
    name: 'TONNA CREST',
    sub: 'Winged Formation & Prism Core',
    baseSpeed: 500,
    build(cols, rows) {
      const list = [];
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < cols; c++) {
          const distCenter = Math.abs(c - (cols - 1) / 2);
          if (r === 0 && distCenter > 3.5) continue;
          let kind = 'standard';
          if (r === 2 && Math.abs(distCenter - 2) < 0.8) kind = 'prism';
          else if (r === 1 && distCenter < 1.2) kind = 'explosive';
          list.push({ c, r, kind, tier: r % TIER_PALETTE.length });
        }
      }
      return list;
    }
  },
  {
    id: '02',
    name: 'TITANIUM VAULT',
    sub: 'Armored Frontline & Explosive Vault',
    baseSpeed: 520,
    build(cols) {
      const list = [];
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < cols; c++) {
          if (c === Math.floor(cols / 2) && r >= 4) continue;
          let kind = 'standard';
          if (r === 5 && c !== 0 && c !== cols - 1) kind = 'armor2';
          if (r === 2 && (c === 3 || c === cols - 4)) kind = 'explosive';
          if (r === 1 && (c === 2 || c === cols - 3)) kind = 'prism';
          list.push({ c, r, kind, tier: (r + c) % TIER_PALETTE.length });
        }
      }
      return list;
    }
  },
  {
    id: '03',
    name: 'PLASMA REACTOR',
    sub: 'Chain-Reaction Detonation Grid',
    baseSpeed: 535,
    build(cols) {
      const list = [];
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r + c) % 2 === 1 && r === 6) continue;
          let kind = 'standard';
          if ((r === 2 || r === 4) && (c === 2 || c === Math.floor(cols / 2) || c === cols - 3)) {
            kind = 'explosive';
          } else if (r === 0) {
            kind = 'armor2';
          }
          list.push({ c, r, kind, tier: (r * 2) % TIER_PALETTE.length });
        }
      }
      return list;
    }
  },
  {
    id: '04',
    name: 'HYPERION CORRIDOR',
    sub: 'Gold Bumper Deflectors & Prism Lanes',
    baseSpeed: 545,
    build(cols) {
      const list = [];
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < cols; c++) {
          if (c === 4 || c === cols - 5) {
            if (r === 5) list.push({ c, r, kind: 'bumper', tier: 1 });
            continue;
          }
          let kind = 'standard';
          if (r === 3 && (c === 1 || c === cols - 2)) kind = 'prism';
          if (r === 1 && c >= 3 && c <= cols - 4) kind = 'explosive';
          list.push({ c, r, kind, tier: c % TIER_PALETTE.length });
        }
      }
      return list;
    }
  },
  {
    id: '05',
    name: 'TWIN CITADELS',
    sub: 'Dual Armored Bastions',
    baseSpeed: 555,
    build(cols) {
      const list = [];
      const mid = (cols - 1) / 2;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.abs(c - mid) < 1.1) continue;
          let kind = 'standard';
          if (r === 7 || c === 0 || c === cols - 1) kind = 'armor2';
          if (r === 3 && (c === 2 || c === cols - 3)) kind = 'explosive';
          if (r === 1 && (c === 1 || c === cols - 2)) kind = 'prism';
          list.push({ c, r, kind, tier: r % TIER_PALETTE.length });
        }
      }
      return list;
    }
  },
  {
    id: '06',
    name: 'DIAMOND LATTICE',
    sub: 'Angled Ricochet Matrix',
    baseSpeed: 565,
    build(cols) {
      const list = [];
      const midC = (cols - 1) / 2;
      const midR = 3.5;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < cols; c++) {
          const d = Math.abs(c - midC) * 0.85 + Math.abs(r - midR);
          if (d > 4.6) continue;
          let kind = 'standard';
          if (d < 1.2) kind = 'explosive';
          else if (Math.abs(d - 3.6) < 0.55) kind = 'armor2';
          else if (r === 2 && (c === 3 || c === cols - 4)) kind = 'prism';
          list.push({ c, r, kind, tier: Math.floor(d) % TIER_PALETTE.length });
        }
      }
      return list;
    }
  },
  {
    id: '07',
    name: 'SUPERNOVA RING',
    sub: 'Heavy Titanium Shell Around Plasma Core',
    baseSpeed: 575,
    build(cols) {
      const list = [];
      const midC = (cols - 1) / 2;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < cols; c++) {
          const dist = Math.hypot((c - midC) * 0.9, r - 3.5);
          if (dist > 4.3 || (dist > 1.6 && dist < 2.3 && r < 6)) continue;
          let kind = 'standard';
          if (dist <= 1.5) kind = 'explosive';
          else if (dist >= 3.3 && r < 6) kind = 'armor3';
          else if (r === 6) kind = 'prism';
          list.push({ c, r, kind, tier: (r + c) % TIER_PALETTE.length });
        }
      }
      return list;
    }
  },
  {
    id: '08',
    name: 'CHICANE NEXUS',
    sub: 'Kinetic Pinball Bumper Gauntlet',
    baseSpeed: 585,
    build(cols) {
      const list = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 6 && (c === 2 || c === cols - 3)) {
            list.push({ c, r, kind: 'bumper', tier: 1 });
            continue;
          }
          if (r === 4 && c === Math.floor(cols / 2)) {
            list.push({ c, r, kind: 'bumper', tier: 1 });
            continue;
          }
          if (r === 6) continue;
          let kind = 'standard';
          if (r === 2 && c % 3 === 1) kind = 'explosive';
          else if (r === 5 && c % 2 === 0) kind = 'armor2';
          else if (r === 0 && (c === 3 || c === cols - 4)) kind = 'prism';
          list.push({ c, r, kind, tier: r % TIER_PALETTE.length });
        }
      }
      return list;
    }
  },
  {
    id: '09',
    name: 'OVERDRIVE MATRIX',
    sub: 'High-Density Checkerboard Assault',
    baseSpeed: 595,
    build(cols) {
      const list = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r + c) % 2 === 1) continue;
          let kind = 'standard';
          if (r === 1 || r === 5) kind = 'explosive';
          else if (r === 7) kind = 'armor2';
          else if (r === 3) kind = 'prism';
          list.push({ c, r, kind, tier: c % TIER_PALETTE.length });
        }
      }
      return list;
    }
  },
  {
    id: '10',
    name: 'VALKYRIE CHEVRON',
    sub: 'Triple V-Strike Formation',
    baseSpeed: 605,
    build(cols) {
      const list = [];
      const mid = (cols - 1) / 2;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < cols; c++) {
          const vRow = Math.floor(Math.abs(c - mid) * 0.75);
          if ((r + vRow) % 3 === 2) continue;
          let kind = 'standard';
          if (Math.abs(c - mid) < 1.1 && r % 2 === 0) kind = 'explosive';
          else if (r === 7) kind = 'armor3';
          else if (r === 1) kind = 'prism';
          list.push({ c, r, kind, tier: (r + vRow) % TIER_PALETTE.length });
        }
      }
      return list;
    }
  },
  {
    id: '11',
    name: 'OBSIDIAN BUNKER',
    sub: 'Armored Containment Wall with Breach Gap',
    baseSpeed: 615,
    build(cols) {
      const list = [];
      const mid = Math.floor(cols / 2);
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 6 && Math.abs(c - mid) <= 1) continue;
          let kind = 'standard';
          if (r === 6) kind = 'armor3';
          else if (r === 3 && Math.abs(c - mid) <= 2) kind = 'explosive';
          else if (r === 1 && (c === 1 || c === cols - 2)) kind = 'prism';
          list.push({ c, r, kind, tier: r % TIER_PALETTE.length });
        }
      }
      return list;
    }
  },
  {
    id: '12',
    name: 'OMEGA SINGULARITY',
    sub: 'Grand Finale Boss Matrix',
    baseSpeed: 630,
    build(cols) {
      const list = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < cols; c++) {
          if (r === 7 && (c === 3 || c === cols - 4)) {
            list.push({ c, r, kind: 'bumper', tier: 1 });
            continue;
          }
          let kind = 'standard';
          if (r === 0 || (r === 7 && c !== Math.floor(cols / 2))) kind = 'armor3';
          else if ((r === 2 || r === 5) && c % 3 === 1) kind = 'explosive';
          else if (r === 3 && c % 2 === 0) kind = 'prism';
          list.push({ c, r, kind, tier: (r + c) % TIER_PALETTE.length });
        }
      }
      return list;
    }
  }
];

// 5. Game State & Arena Geometry
const canvas = document.getElementById('arkCanvas');
const ctx = canvas.getContext('2d');

let vw = window.innerWidth;
let vh = window.innerHeight;
let dpr = Math.min(2, window.devicePixelRatio || 1);

const arena = {
  x: 0,
  y: 0,
  w: 800,
  h: 600,
  cols: 11
};

let currentSectorIdx = 0;
let score = 0;
let highScore = Number(localStorage.getItem(ARK_HIGH_KEY) || 0);
let clearedSectors = new Set(JSON.parse(localStorage.getItem(ARK_CLEARED_KEY) || '[]'));
let lives = 3;
let comboStreak = 0;
let bonusMultiplier = 1;
let paused = false;
let aiPilot = false;
let gameOver = false;
let sectorCleared = false;
let shake = 0;
let laserCooldown = 0;

const powers = {
  WIDE: 0,
  LASER: 0,
  FIRE: 0,
  MAGNET: 0
};

const paddle = {
  x: 400,
  y: 540,
  baseW: 118,
  w: 118,
  h: 16,
  vx: 0,
  targetX: null
};

let balls = [];
let bricks = [];
let capsules = [];
let lasers = [];
let particles = [];
let shockwaves = [];
let popups = [];

const keys = { left: false, right: false };
let analogueStickNorm = null; // -1..1 when dragging analogue stick

const stickTrackEl = document.getElementById('arkStickTrack');
const stickReadoutEl = document.getElementById('arkStickReadout');

function syncAnalogueStickVisual(normVal) {
  if (!stickTrackEl) return;
  const clamped = Math.max(-1, Math.min(1, normVal));
  stickTrackEl.style.setProperty('--stick-norm', clamped.toFixed(3));
  const pct = Math.round(clamped * 100);
  if (stickReadoutEl) {
    stickReadoutEl.textContent = `${pct > 0 ? '+' : ''}${pct}%`;
  }
  stickTrackEl.setAttribute('aria-valuenow', String(pct));
}

function setCue(msg) {
  const el = document.getElementById('arkCueText');
  if (el) el.textContent = msg;
}

function computeArenaBounds() {
  const isMobile = vw <= 900;
  const sideMargin = isMobile ? 12 : Math.max(220, vw * 0.18);
  const topMargin = isMobile ? 148 : 126;
  const botMargin = isMobile ? 102 : 112;

  const maxW = Math.min(960, vw - sideMargin * 2);
  const maxH = Math.max(320, vh - topMargin - botMargin);

  arena.w = Math.max(296, maxW);
  arena.h = maxH;
  arena.x = Math.round((vw - arena.w) / 2);
  arena.y = topMargin;

  paddle.baseW = Math.max(84, Math.min(132, arena.w * 0.165));
  paddle.w = powers.WIDE > 0 ? paddle.baseW * 1.45 : paddle.baseW;
  paddle.h = isMobile ? 14 : 16;
  paddle.y = arena.y + arena.h - 34;
  paddle.x = Math.max(arena.x + paddle.w / 2, Math.min(arena.x + arena.w - paddle.w / 2, paddle.x));
}

function layoutBricksFromGrid() {
  const padX = Math.max(14, arena.w * 0.03);
  const topY = arena.y + Math.max(26, arena.h * 0.065);
  const gap = Math.max(4, Math.round(arena.w * 0.008));
  const totalW = arena.w - padX * 2;
  const bw = (totalW - gap * (arena.cols - 1)) / arena.cols;
  const bh = Math.max(18, Math.min(28, arena.h * 0.042));

  bricks.forEach((b) => {
    b.w = bw;
    b.h = bh;
    b.x = arena.x + padX + b.c * (bw + gap);
    b.y = topY + b.r * (bh + gap);
  });
}

function resizeCanvas() {
  vw = window.innerWidth;
  vh = window.innerHeight;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(vw * dpr);
  canvas.height = Math.round(vh * dpr);
  canvas.style.width = `${vw}px`;
  canvas.style.height = `${vh}px`;
  computeArenaBounds();
  layoutBricksFromGrid();
  balls.forEach((ball) => {
    if (ball.stuck) {
      ball.x = paddle.x + ball.stuckOffset;
      ball.y = paddle.y - paddle.h / 2 - ball.r - 1;
    }
  });
}

window.addEventListener('resize', resizeCanvas);

function spawnBallOnPaddle(offset = 0) {
  const sec = SECTORS[currentSectorIdx];
  const r = Math.max(6.5, Math.min(8.5, arena.w * 0.011));
  balls.push({
    x: paddle.x + offset,
    y: paddle.y - paddle.h / 2 - r - 1,
    vx: 0,
    vy: 0,
    r,
    speed: sec.baseSpeed,
    stuck: true,
    stuckOffset: offset,
    trail: []
  });
}

function loadSector(idx, resetScoreAndLives = false) {
  currentSectorIdx = ((idx % SECTORS.length) + SECTORS.length) % SECTORS.length;
  const sec = SECTORS[currentSectorIdx];

  if (resetScoreAndLives) {
    score = 0;
    lives = 3;
    Object.keys(powers).forEach((k) => { powers[k] = 0; });
  }

  comboStreak = 0;
  bonusMultiplier = 1;
  sectorCleared = false;
  gameOver = false;
  paused = false;
  capsules = [];
  lasers = [];
  particles = [];
  shockwaves = [];
  popups = [];
  balls = [];

  hideBanner();
  computeArenaBounds();
  paddle.x = arena.x + arena.w / 2;

  const rawDefs = sec.build(arena.cols, 8);
  bricks = rawDefs.map((d) => {
    let maxHp = 1;
    if (d.kind === 'armor2') maxHp = 2;
    if (d.kind === 'armor3') maxHp = 3;
    if (d.kind === 'bumper') maxHp = 999;
    return {
      c: d.c,
      r: d.r,
      kind: d.kind,
      tier: d.tier ?? 0,
      hp: maxHp,
      maxHp,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      hitFlash: 0
    };
  });

  layoutBricksFromGrid();
  spawnBallOnPaddle(0);

  const kicker = document.getElementById('arkSectorKicker');
  if (kicker) kicker.textContent = `SECTOR ${sec.id} · ${sec.name}`;
  setCue(`SECTOR ${sec.id}: ${sec.sub} — Use the Analogue Stick (or A·D / ←·→) and tap LAUNCH.`);
  updateHUD();
  renderStagesGrid();
}

function launchStuckBalls() {
  let launched = false;
  balls.forEach((b, i) => {
    if (b.stuck) {
      b.stuck = false;
      const spread = (b.stuckOffset / (paddle.w * 0.5)) * 0.55 + (i - (balls.length - 1) / 2) * 0.18;
      const angle = -Math.PI / 2 + Math.max(-0.65, Math.min(0.65, spread || 0.16));
      b.vx = Math.cos(angle) * b.speed;
      b.vy = Math.sin(angle) * b.speed;
      launched = true;
    }
  });
  if (launched) {
    sfx.paddleHit(0.2);
    setCue(`Plasma core in flight — deflect at Vaus edges to aim at high-value targets.`);
  } else if (powers.LASER > 0) {
    firePaddleLasers();
  }
}

function firePaddleLasers() {
  if (laserCooldown > 0 || sectorCleared || gameOver || paused) return;
  laserCooldown = 0.24;
  const y = paddle.y - paddle.h / 2;
  lasers.push(
    { x: paddle.x - paddle.w * 0.36, y, vy: -820 },
    { x: paddle.x + paddle.w * 0.36, y, vy: -820 }
  );
  sfx.laserShot();
}

function spawnParticles(x, y, color, count = 14, speedScale = 1) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = (55 + Math.random() * 195) * speedScale;
    particles.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      size: 2 + Math.random() * 3.5,
      color,
      life: 0.45 + Math.random() * 0.35,
      maxLife: 0.8
    });
  }
}

function addPopup(x, y, text, color = '#ffc570') {
  popups.push({ x, y, text, color, life: 0.85 });
}

function maybeDropCapsule(brick) {
  const guaranteed = brick.kind === 'prism';
  const chance = brick.kind === 'explosive' ? 0.38 : 0.21;
  if (!guaranteed && Math.random() > chance) return;
  const pick = POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)];
  capsules.push({
    x: brick.x + brick.w / 2,
    y: brick.y + brick.h / 2,
    w: 58,
    h: 20,
    vy: 155,
    type: pick
  });
}

function applyPowerUp(type) {
  sfx.powerUp();
  addPopup(paddle.x, paddle.y - 24, type.label, type.color);
  setCue(`AUGMENT ARMED: [${type.id}] ${type.label}`);

  if (type.id === 'WIDE') {
    powers.WIDE = type.dur;
  } else if (type.id === 'LASER') {
    powers.LASER = type.dur;
  } else if (type.id === 'FIRE') {
    powers.FIRE = type.dur;
  } else if (type.id === 'MAGNET') {
    powers.MAGNET = type.dur;
  } else if (type.id === 'LIFE') {
    lives = Math.min(5, lives + 1);
  } else if (type.id === 'MULTI') {
    const active = balls.filter((b) => !b.stuck);
    const source = active[0] || balls[0];
    if (source) {
      if (source.stuck) launchStuckBalls();
      const baseAng = Math.atan2(source.vy, source.vx);
      [-0.32, 0.32].forEach((delta) => {
        if (balls.length >= 9) return;
        const ang = baseAng + delta;
        balls.push({
          x: source.x,
          y: source.y,
          vx: Math.cos(ang) * source.speed,
          vy: Math.sin(ang) * source.speed,
          r: source.r,
          speed: source.speed,
          stuck: false,
          stuckOffset: 0,
          trail: []
        });
      });
    }
  }
  updateHUD();
}

function damageBrick(brick, isExplosion = false) {
  if (brick.hp <= 0) return;
  if (brick.kind === 'bumper') {
    brick.hitFlash = 1;
    sfx.armorClang();
    spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, '#ffc570', 6, 0.6);
    return;
  }

  brick.hp -= isExplosion ? 3 : 1;
  brick.hitFlash = 1;
  const cx = brick.x + brick.w / 2;
  const cy = brick.y + brick.h / 2;

  if (brick.hp > 0) {
    sfx.armorClang();
    score += 40 * bonusMultiplier;
    spawnParticles(cx, cy, '#cbd5e1', 8, 0.7);
    return;
  }

  // Brick Shattered!
  comboStreak++;
  const mult = Math.min(8, bonusMultiplier + Math.floor(comboStreak / 4));
  let basePts = 100;
  if (brick.kind === 'armor2' || brick.kind === 'armor3') basePts = 220;
  if (brick.kind === 'explosive') basePts = 260;
  if (brick.kind === 'prism') {
    basePts = 300;
    bonusMultiplier = Math.min(8, bonusMultiplier + 1);
  }
  const pts = basePts * mult;
  score += pts;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(ARK_HIGH_KEY, String(highScore));
  }

  const pal = TIER_PALETTE[brick.tier % TIER_PALETTE.length];
  spawnParticles(cx, cy, pal.fill, 16, 1);
  addPopup(cx, cy, `+${pts}`, pal.rim);
  maybeDropCapsule(brick);

  if (brick.kind === 'explosive') {
    sfx.explosion();
    shake = Math.max(shake, 11);
    const blastR = Math.max(brick.w * 1.75, 92);
    shockwaves.push({ x: cx, y: cy, r: 8, maxR: blastR, alpha: 1, color: '#fb923c' });
    bricks.forEach((other) => {
      if (other !== brick && other.hp > 0 && other.kind !== 'bumper') {
        const ox = other.x + other.w / 2;
        const oy = other.y + other.h / 2;
        if (Math.hypot(ox - cx, oy - cy) <= blastR) {
          damageBrick(other, true);
        }
      }
    });
  } else {
    sfx.brickBreak(comboStreak);
    shake = Math.max(shake, 3.5);
  }
}

function countBreakableBricks() {
  return bricks.reduce((acc, b) => acc + (b.hp > 0 && b.kind !== 'bumper' ? 1 : 0), 0);
}

function showBanner(kicker, title, sub, primaryText, onPrimary, secondaryText, onSecondary) {
  const banner = document.getElementById('arkBanner');
  document.getElementById('arkBannerKicker').textContent = kicker;
  document.getElementById('arkBannerTitle').textContent = title;
  document.getElementById('arkBannerSub').textContent = sub;
  const pBtn = document.getElementById('arkBannerPrimaryBtn');
  const sBtn = document.getElementById('arkBannerSecondaryBtn');
  pBtn.textContent = primaryText;
  pBtn.onclick = onPrimary;
  sBtn.textContent = secondaryText;
  sBtn.onclick = onSecondary;
  banner.classList.add('show');
}

function hideBanner() {
  document.getElementById('arkBanner')?.classList.remove('show');
}

function triggerSectorClear() {
  sectorCleared = true;
  sfx.sectorClear();
  const sec = SECTORS[currentSectorIdx];
  const bonus = lives * 500;
  score += bonus;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(ARK_HIGH_KEY, String(highScore));
  }
  clearedSectors.add(sec.id);
  localStorage.setItem(ARK_CLEARED_KEY, JSON.stringify([...clearedSectors]));

  recordAnalytics((data) => {
    data.arkanoidRuns = (data.arkanoidRuns || 0) + 1;
    data.arkanoidHigh = Math.max(data.arkanoidHigh || 0, score);
  }, `Arkanoid: Cleared Sector ${sec.id} (${sec.name}) · Score ${score.toLocaleString()}`);

  updateHUD();
  renderStagesGrid();

  if (aiPilot) {
    setCue(`AI AUTO-PILOT CLEARED SECTOR ${sec.id}! Advancing to next sector…`);
    setTimeout(() => {
      if (aiPilot && sectorCleared) loadSector(currentSectorIdx + 1, false);
    }, 1800);
  }

  showBanner(
    `✓ SECTOR ${sec.id} CLEARED`,
    `${sec.name} SHATTERED`,
    `Core Survival Bonus +${bonus.toLocaleString()} · Total Score: ${score.toLocaleString()}`,
    'NEXT SECTOR →',
    () => loadSector(currentSectorIdx + 1, false),
    'REPLAY SECTOR',
    () => loadSector(currentSectorIdx, false)
  );
}

function triggerGameOver() {
  gameOver = true;
  sfx.loseCore();
  const sec = SECTORS[currentSectorIdx];

  recordAnalytics((data) => {
    data.arkanoidRuns = (data.arkanoidRuns || 0) + 1;
    data.arkanoidHigh = Math.max(data.arkanoidHigh || 0, score);
  }, `Arkanoid: Run ended on Sector ${sec.id} · Score ${score.toLocaleString()}`);

  showBanner(
    'VAUS CORES DEPLETED',
    'MISSION TERMINATED',
    `Final Score: ${score.toLocaleString()} · Best: ${highScore.toLocaleString()}`,
    'RETRY SECTOR',
    () => loadSector(currentSectorIdx, true),
    'SECTOR 01',
    () => loadSector(0, true)
  );
}

// 6. AI Auto-Pilot Trajectory Predictor
function stepAiPilot(dt) {
  const activeBalls = balls.filter((b) => !b.stuck);
  if (activeBalls.length === 0) {
    launchStuckBalls();
    return;
  }

  // Pick the lowest downward-moving ball, or lowest ball overall
  const descending = activeBalls.filter((b) => b.vy > 0).sort((a, b) => b.y - a.y);
  const lead = descending[0] || activeBalls.sort((a, b) => b.y - a.y)[0];

  let targetX = lead.x;
  if (lead.vy > 0 && lead.y < paddle.y) {
    const timeToPaddle = (paddle.y - paddle.h / 2 - lead.r - lead.y) / lead.vy;
    if (timeToPaddle > 0 && timeToPaddle < 2.5) {
      let predX = lead.x + lead.vx * timeToPaddle;
      const minX = arena.x + lead.r;
      const maxX = arena.x + arena.w - lead.r;
      const span = maxX - minX;
      // Reflect across arena walls
      let rel = (predX - minX) % (span * 2);
      if (rel < 0) rel += span * 2;
      if (rel > span) rel = span * 2 - rel;
      targetX = minX + rel;
    }
  } else if (capsules.length > 0) {
    // Grab nearest falling power-up capsule when ball is heading up
    const cap = capsules.slice().sort((a, b) => b.y - a.y)[0];
    targetX = cap.x;
  }

  // Aim slightly off-center toward a remaining breakable brick so AI never loops vertically
  const targetBrick = bricks.find((b) => b.hp > 0 && b.kind !== 'bumper');
  if (targetBrick) {
    const bx = targetBrick.x + targetBrick.w / 2;
    const desiredOffset = Math.max(-paddle.w * 0.28, Math.min(paddle.w * 0.28, (targetX - bx) * 0.14));
    targetX += desiredOffset;
  }

  const diff = targetX - paddle.x;
  const maxMove = 780 * dt;
  const step = Math.max(-maxMove, Math.min(maxMove, diff));
  paddle.vx = step / Math.max(0.001, dt);
  paddle.x += step;

  if (powers.LASER > 0 && laserCooldown <= 0) {
    firePaddleLasers();
  }
}

// 7. Physics Update Loop
function updatePhysics(dt) {
  if (paused || sectorCleared || gameOver) return;

  if (shake > 0) shake = Math.max(0, shake - dt * 28);
  if (laserCooldown > 0) laserCooldown = Math.max(0, laserCooldown - dt);

  // Decrement active power-up timers
  let powerChanged = false;
  ['WIDE', 'LASER', 'FIRE', 'MAGNET'].forEach((k) => {
    if (powers[k] > 0) {
      powers[k] = Math.max(0, powers[k] - dt);
      powerChanged = true;
    }
  });
  paddle.w = powers.WIDE > 0 ? paddle.baseW * 1.45 : paddle.baseW;

  // Paddle movement (Analogue Stick + Directional Pads + Keyboard + AI Pilot)
  const prevPaddleX = paddle.x;
  if (aiPilot) {
    stepAiPilot(dt);
    syncAnalogueStickVisual(Math.max(-1, Math.min(1, paddle.vx / 680)));
  } else if (analogueStickNorm !== null) {
    paddle.x += analogueStickNorm * 720 * dt;
    syncAnalogueStickVisual(analogueStickNorm);
  } else {
    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    paddle.x += dir * 680 * dt;
    syncAnalogueStickVisual(dir);
  }

  const minPadX = arena.x + paddle.w / 2;
  const maxPadX = arena.x + arena.w - paddle.w / 2;
  paddle.x = Math.max(minPadX, Math.min(maxPadX, paddle.x));
  paddle.vx = (paddle.x - prevPaddleX) / Math.max(0.001, dt);

  if (powers.LASER > 0 && !aiPilot && laserCooldown <= 0 && balls.some((b) => !b.stuck)) {
    firePaddleLasers();
  }

  // Update Laser Bolts
  for (let i = lasers.length - 1; i >= 0; i--) {
    const l = lasers[i];
    l.y += l.vy * dt;
    if (l.y < arena.y) {
      lasers.splice(i, 1);
      continue;
    }
    let hit = false;
    for (const b of bricks) {
      if (b.hp > 0 && l.x >= b.x && l.x <= b.x + b.w && l.y >= b.y && l.y <= b.y + b.h) {
        damageBrick(b, false);
        spawnParticles(l.x, l.y, '#ff5a6e', 6, 0.5);
        hit = true;
        break;
      }
    }
    if (hit) lasers.splice(i, 1);
  }

  // Sub-stepped Ball Physics
  const subSteps = 4;
  const subDt = dt / subSteps;

  for (let bIdx = balls.length - 1; bIdx >= 0; bIdx--) {
    const ball = balls[bIdx];
    if (ball.stuck) {
      ball.x = paddle.x + ball.stuckOffset;
      ball.y = paddle.y - paddle.h / 2 - ball.r - 1;
      if (aiPilot) launchStuckBalls();
      continue;
    }

    for (let s = 0; s < subSteps; s++) {
      ball.x += ball.vx * subDt;
      ball.y += ball.vy * subDt;

      // Arena Wall Collisions
      if (ball.x - ball.r < arena.x) {
        ball.x = arena.x + ball.r;
        ball.vx = Math.abs(ball.vx);
      } else if (ball.x + ball.r > arena.x + arena.w) {
        ball.x = arena.x + arena.w - ball.r;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y - ball.r < arena.y) {
        ball.y = arena.y + ball.r;
        ball.vy = Math.abs(ball.vy);
      }

      // Paddle Deflection
      const padTop = paddle.y - paddle.h / 2;
      const padBot = paddle.y + paddle.h / 2;
      const padLeft = paddle.x - paddle.w / 2;
      const padRight = paddle.x + paddle.w / 2;

      if (
        ball.vy > 0 &&
        ball.y + ball.r >= padTop &&
        ball.y - ball.r <= padBot &&
        ball.x + ball.r >= padLeft &&
        ball.x - ball.r <= padRight
      ) {
        const hitNorm = Math.max(-1, Math.min(1, (ball.x - paddle.x) / (paddle.w / 2)));
        comboStreak = 0;

        if (powers.MAGNET > 0 && !aiPilot) {
          ball.stuck = true;
          ball.stuckOffset = hitNorm * (paddle.w * 0.42);
          ball.vx = 0;
          ball.vy = 0;
          sfx.paddleHit(hitNorm);
          break;
        }

        const maxBounceAngle = 1.18; // ~67.5 deg max
        const bounceAngle = hitNorm * maxBounceAngle - Math.PI / 2;
        const speedBoost = Math.min(820, ball.speed * 1.008);
        ball.speed = speedBoost;
        ball.vx = Math.cos(bounceAngle) * ball.speed + paddle.vx * 0.12;
        ball.vy = -Math.abs(Math.sin(bounceAngle) * ball.speed);
        // Renormalize to ball.speed
        const mag = Math.hypot(ball.vx, ball.vy) || 1;
        ball.vx = (ball.vx / mag) * ball.speed;
        ball.vy = Math.min(-180, (ball.vy / mag) * ball.speed);
        ball.y = padTop - ball.r - 0.5;
        sfx.paddleHit(hitNorm);
        spawnParticles(ball.x, padTop, '#ffc570', 7, 0.55);
      }

      // Brick Collisions (Circle vs AABB)
      for (const brick of bricks) {
        if (brick.hp <= 0) continue;
        const nearX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
        const nearY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));
        const dx = ball.x - nearX;
        const dy = ball.y - nearY;
        const distSq = dx * dx + dy * dy;

        if (distSq <= ball.r * ball.r) {
          const isFire = powers.FIRE > 0 && brick.kind !== 'bumper';
          damageBrick(brick, false);

          if (!isFire) {
            const overlapLeft = ball.x + ball.r - brick.x;
            const overlapRight = brick.x + brick.w - (ball.x - ball.r);
            const overlapTop = ball.y + ball.r - brick.y;
            const overlapBottom = brick.y + brick.h - (ball.y - ball.r);
            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapX < minOverlapY) {
              ball.vx = overlapLeft < overlapRight ? -Math.abs(ball.vx) : Math.abs(ball.vx);
            } else {
              ball.vy = overlapTop < overlapBottom ? -Math.abs(ball.vy) : Math.abs(ball.vy);
            }

            if (brick.kind === 'bumper') {
              ball.speed = Math.min(840, ball.speed * 1.05);
              const m = Math.hypot(ball.vx, ball.vy) || 1;
              ball.vx = (ball.vx / m) * ball.speed;
              ball.vy = (ball.vy / m) * ball.speed;
            }
          }
          break;
        }
      }
    }

    // Ball Trail
    ball.trail.unshift({ x: ball.x, y: ball.y });
    if (ball.trail.length > 10) ball.trail.pop();

    // Check Bottom Drain
    if (ball.y - ball.r > arena.y + arena.h) {
      balls.splice(bIdx, 1);
    }
  }

  // If all balls drained
  if (balls.length === 0 && !sectorCleared) {
    comboStreak = 0;
    bonusMultiplier = 1;
    if (aiPilot) {
      // AI Demo never permanently dies — respawns ball smoothly
      spawnBallOnPaddle(0);
    } else {
      lives--;
      if (lives <= 0) {
        lives = 0;
        updateHUD();
        triggerGameOver();
        return;
      }
      sfx.loseCore();
      spawnBallOnPaddle(0);
      setCue(`CORE LOST — ${lives} Vaus Core${lives === 1 ? '' : 's'} remaining. Press SPACE or Tap LAUNCH.`);
    }
  }

  // Update Power-Up Capsules
  for (let i = capsules.length - 1; i >= 0; i--) {
    const c = capsules[i];
    c.y += c.vy * dt;
    if (
      c.y + c.h / 2 >= paddle.y - paddle.h / 2 &&
      c.y - c.h / 2 <= paddle.y + paddle.h / 2 &&
      c.x + c.w / 2 >= paddle.x - paddle.w / 2 &&
      c.x - c.w / 2 <= paddle.x + paddle.w / 2
    ) {
      applyPowerUp(c.type);
      capsules.splice(i, 1);
      continue;
    }
    if (c.y - c.h > arena.y + arena.h) {
      capsules.splice(i, 1);
    }
  }

  // Brick hit flash decay
  bricks.forEach((b) => {
    if (b.hitFlash > 0) b.hitFlash = Math.max(0, b.hitFlash - dt * 6);
  });

  // Particles, Shockwaves, Popups
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 240 * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.r += (sw.maxR - sw.r) * Math.min(1, dt * 11);
    sw.alpha -= dt * 2.8;
    if (sw.alpha <= 0) shockwaves.splice(i, 1);
  }

  for (let i = popups.length - 1; i >= 0; i--) {
    const pop = popups[i];
    pop.y -= 38 * dt;
    pop.life -= dt;
    if (pop.life <= 0) popups.splice(i, 1);
  }

  // Check Sector Clear
  if (countBreakableBricks() === 0 && !sectorCleared) {
    triggerSectorClear();
    return;
  }

  if (powerChanged || Math.random() < 0.25) updateHUD();
}

// 8. Canvas Rendering (Garuda 2026 Atmospheric & Kinetic Glass Style)
function roundRectPath(c, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rad, y);
  c.arcTo(x + w, y, x + w, y + h, rad);
  c.arcTo(x + w, y + h, x, y + h, rad);
  c.arcTo(x, y + h, x, y, rad);
  c.arcTo(x, y, x + w, y, rad);
  c.closePath();
}

function drawScene(now) {
  ctx.save();
  ctx.scale(dpr, dpr);

  const isNight = document.body.classList.contains('amb-on');

  // 1. Deep Atmospheric Lacquered Backdrop
  const bgGrad = ctx.createRadialGradient(vw * 0.5, vh * 0.35, 40, vw * 0.5, vh * 0.5, Math.max(vw, vh) * 0.85);
  if (isNight) {
    bgGrad.addColorStop(0, '#131832');
    bgGrad.addColorStop(0.55, '#090b18');
    bgGrad.addColorStop(1, '#04050a');
  } else {
    bgGrad.addColorStop(0, '#3e0912');
    bgGrad.addColorStop(0.52, '#180609');
    bgGrad.addColorStop(1, '#080506');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, vw, vh);

  // Screen-shake offset
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  // 2. Kinetic Arena Chamber Frame
  roundRectPath(ctx, arena.x, arena.y, arena.w, arena.h, 18);
  ctx.fillStyle = isNight ? 'rgba(8, 12, 26, 0.78)' : 'rgba(14, 7, 9, 0.78)';
  ctx.fill();

  // Perspective Subtle Grid inside Arena
  ctx.save();
  roundRectPath(ctx, arena.x, arena.y, arena.w, arena.h, 18);
  ctx.clip();

  ctx.strokeStyle = isNight ? 'rgba(148, 163, 255, 0.06)' : 'rgba(255, 197, 112, 0.055)';
  ctx.lineWidth = 1;
  const gridStep = 44;
  for (let gx = arena.x; gx <= arena.x + arena.w; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, arena.y);
    ctx.lineTo(gx, arena.y + arena.h);
    ctx.stroke();
  }
  for (let gy = arena.y; gy <= arena.y + arena.h; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(arena.x, gy);
    ctx.lineTo(arena.x + arena.w, gy);
    ctx.stroke();
  }

  // Danger Drain Line at bottom
  const drainGrad = ctx.createLinearGradient(0, arena.y + arena.h - 22, 0, arena.y + arena.h);
  drainGrad.addColorStop(0, 'rgba(225, 29, 72, 0)');
  drainGrad.addColorStop(1, 'rgba(225, 29, 72, 0.28)');
  ctx.fillStyle = drainGrad;
  ctx.fillRect(arena.x, arena.y + arena.h - 22, arena.w, 22);

  // 3. Draw Bricks
  for (const b of bricks) {
    if (b.hp <= 0) continue;
    const pal = TIER_PALETTE[b.tier % TIER_PALETTE.length];

    ctx.save();
    roundRectPath(ctx, b.x, b.y, b.w, b.h, 6);

    if (b.kind === 'bumper') {
      const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      g.addColorStop(0, '#ffe49e');
      g.addColorStop(1, '#b45309');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#fffbeb';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (b.kind === 'armor2' || b.kind === 'armor3') {
      const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      g.addColorStop(0, b.hp >= 3 ? '#94a3b8' : '#64748b');
      g.addColorStop(1, '#1e293b');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = b.hitFlash > 0 ? '#ffffff' : 'rgba(226, 232, 240, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (b.kind === 'explosive') {
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.009);
      const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      g.addColorStop(0, '#fb923c');
      g.addColorStop(1, '#9a3412');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 237, 213, ${0.55 + pulse * 0.45})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    } else if (b.kind === 'prism') {
      const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
      g.addColorStop(0, '#38bdf8');
      g.addColorStop(0.5, '#c084fc');
      g.addColorStop(1, '#f472b6');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else {
      const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      g.addColorStop(0, pal.fill);
      g.addColorStop(1, 'rgba(15, 10, 14, 0.85)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = b.hitFlash > 0 ? '#ffffff' : pal.rim;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    // Specular Top Glass Glint
    roundRectPath(ctx, b.x + 2, b.y + 2, b.w - 4, Math.max(3, b.h * 0.28), 3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.fill();

    // Brick Badges / Crack Indicators
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.font = '700 9px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    if (b.kind === 'explosive') ctx.fillText('BOOM', cx, cy + 0.5);
    else if (b.kind === 'prism') ctx.fillText('×2', cx, cy + 0.5);
    else if (b.kind === 'bumper') {
      ctx.fillStyle = '#1c1917';
      ctx.fillText('♦', cx, cy + 0.5);
    } else if (b.maxHp > 1) {
      ctx.fillText('★'.repeat(b.hp), cx, cy + 0.5);
    }
    ctx.restore();
  }

  // 4. Draw Shockwaves
  for (const sw of shockwaves) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
    ctx.strokeStyle = sw.color;
    ctx.globalAlpha = Math.max(0, sw.alpha);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  // 5. Draw Falling Power-Up Capsules
  for (const c of capsules) {
    ctx.save();
    roundRectPath(ctx, c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, 999);
    ctx.fillStyle = 'rgba(15, 12, 16, 0.92)';
    ctx.fill();
    ctx.strokeStyle = c.type.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = c.type.color;
    ctx.font = '700 9.5px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.type.id, c.x, c.y + 0.5);
    ctx.restore();
  }

  // 6. Draw Laser Bolts
  ctx.fillStyle = '#ff5a6e';
  for (const l of lasers) {
    roundRectPath(ctx, l.x - 2, l.y - 10, 4, 18, 2);
    ctx.fill();
  }

  // 7. Draw Vaus Paddle
  const px = paddle.x - paddle.w / 2;
  const py = paddle.y - paddle.h / 2;
  ctx.save();
  roundRectPath(ctx, px, py, paddle.w, paddle.h, 999);
  const padGrad = ctx.createLinearGradient(px, py, px, py + paddle.h);
  if (powers.FIRE > 0) {
    padGrad.addColorStop(0, '#fed7aa');
    padGrad.addColorStop(0.5, '#f97316');
    padGrad.addColorStop(1, '#7c2d12');
  } else if (powers.MAGNET > 0) {
    padGrad.addColorStop(0, '#e9d5ff');
    padGrad.addColorStop(0.5, '#a855f7');
    padGrad.addColorStop(1, '#4c1d95');
  } else {
    padGrad.addColorStop(0, '#fff6ea');
    padGrad.addColorStop(0.45, '#ffc570');
    padGrad.addColorStop(1, '#854d0e');
  }
  ctx.fillStyle = padGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Laser Cannons on Paddle Wings
  if (powers.LASER > 0) {
    ctx.fillStyle = '#ff5a6e';
    ctx.fillRect(paddle.x - paddle.w * 0.36 - 3, py - 6, 6, 7);
    ctx.fillRect(paddle.x + paddle.w * 0.36 - 3, py - 6, 6, 7);
  }
  ctx.restore();

  // 8. Draw Balls & Motion Trails
  const isFireBall = powers.FIRE > 0;
  for (const ball of balls) {
    for (let t = 0; t < ball.trail.length; t++) {
      const pt = ball.trail[t];
      const frac = 1 - t / ball.trail.length;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, ball.r * frac * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = isFireBall
        ? `rgba(251, 146, 60, ${frac * 0.42})`
        : `rgba(255, 197, 112, ${frac * 0.32})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = isFireBall ? '#fb923c' : '#fff6ea';
    ctx.fill();
    ctx.strokeStyle = isFireBall ? '#fef08a' : '#ffc570';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 9. Draw Shatter Particles & Score Popups
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.restore();
  }

  for (const pop of popups) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, pop.life * 1.4));
    ctx.font = '700 11px "Geist Mono", monospace';
    ctx.fillStyle = pop.color;
    ctx.textAlign = 'center';
    ctx.fillText(pop.text, pop.x, pop.y);
    ctx.restore();
  }

  ctx.restore(); // end arena clip

  // Arena Specular Rim Border
  roundRectPath(ctx, arena.x, arena.y, arena.w, arena.h, 18);
  ctx.strokeStyle = 'rgba(255, 197, 112, 0.32)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

// 9. HUD & Controls Synchronization
function updateHUD() {
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  };

  const activeMult = Math.min(8, bonusMultiplier + Math.floor(comboStreak / 4));
  const bricksLeft = countBreakableBricks();
  const leadSpeed = balls[0] ? Math.round(balls[0].speed) : 500;

  setTxt('hudScore', score.toLocaleString().padStart(6, '0'));
  setTxt('hudHighScore', highScore.toLocaleString().padStart(6, '0'));
  setTxt('hudMultiplier', `${activeMult}×`);
  setTxt('hudStreakText', `STREAK: ${comboStreak} HIT${comboStreak === 1 ? '' : 'S'}`);
  setTxt('hudBricksLeft', String(bricksLeft).padStart(2, '0'));
  setTxt('hudSpeedText', `BALL VELOCITY: ${leadSpeed} PX/S`);
  setTxt('hudLivesText', `${lives} CORE${lives === 1 ? '' : 'S'} ACTIVE`);

  // Mobile bar
  setTxt('mScore', score.toLocaleString());
  setTxt('mCombo', `${activeMult}×`);
  setTxt('mBricks', bricksLeft);
  setTxt('mLives', lives);

  const livesRow = document.getElementById('hudLivesRow');
  if (livesRow) {
    livesRow.innerHTML = Array.from({ length: 5 }, (_, i) =>
      `<span class="ark-life-pip ${i < lives ? '' : 'lost'}"></span>`
    ).join('');
  }

  const powerList = document.getElementById('hudPowerList');
  if (powerList) {
    const active = POWER_TYPES.filter((p) => p.dur > 0 && powers[p.id] > 0);
    if (active.length === 0) {
      powerList.innerHTML = `<span class="ark-stat-sub">Collect falling capsules to arm Vaus augments.</span>`;
    } else {
      powerList.innerHTML = active
        .map((p) => {
          const rem = powers[p.id];
          const pct = Math.round((rem / p.dur) * 100);
          return `
            <div class="ark-power-pill">
              <div class="ark-power-top">
                <span style="color:${p.color}">${p.label}</span>
                <span>${rem.toFixed(1)}s</span>
              </div>
              <div class="ark-power-bar"><i style="--pct:${pct}%;--pw-color:${p.color}"></i></div>
            </div>
          `;
        })
        .join('');
    }
  }
}

function renderStagesGrid() {
  const grid = document.getElementById('arkStagesGrid');
  if (!grid) return;
  grid.innerHTML = SECTORS.map((sec, idx) => {
    const isCleared = clearedSectors.has(sec.id);
    const isCurrent = idx === currentSectorIdx;
    return `
      <button type="button" class="stage-card ${isCleared ? 'cleared' : ''} ${isCurrent ? 'active' : ''}" data-sector-idx="${idx}">
        <div class="stage-card-top">
          <span class="stage-num">SECTOR ${sec.id}</span>
          <span class="stage-stars">${isCleared ? '★ CLEARED' : `${sec.baseSpeed} PX/S`}</span>
        </div>
        <strong class="stage-name">${sec.name}</strong>
        <span class="stage-cat">${sec.sub}</span>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.stage-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.sectorIdx || 0);
      loadSector(idx, false);
      document.getElementById('arkStagesModal')?.close();
    });
  });
}

// 10. Analogue Stick, Directional Pads & Keyboard Listeners (No Sensor/Hover Movement)
if (stickTrackEl) {
  const updateStickFromEvent = (e) => {
    const rect = stickTrackEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const maxTravel = Math.max(24, (rect.width - 54) / 2);
    const norm = Math.max(-1, Math.min(1, (e.clientX - centerX) / maxTravel));
    analogueStickNorm = norm;
    syncAnalogueStickVisual(norm);
  };

  stickTrackEl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (aiPilot) toggleAiPilot();
    if (sfx.enabled) sfx.init();
    stickTrackEl.setPointerCapture(e.pointerId);
    stickTrackEl.classList.add('dragging');
    updateStickFromEvent(e);
  });

  stickTrackEl.addEventListener('pointermove', (e) => {
    if (analogueStickNorm === null) return;
    updateStickFromEvent(e);
  });

  const releaseStick = () => {
    analogueStickNorm = null;
    stickTrackEl.classList.remove('dragging');
    syncAnalogueStickVisual(0);
  };

  stickTrackEl.addEventListener('pointerup', releaseStick);
  stickTrackEl.addEventListener('pointercancel', releaseStick);
}

function bindDirPad(id, prop) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const on = (e) => {
    e.preventDefault();
    if (aiPilot) toggleAiPilot();
    if (sfx.enabled) sfx.init();
    keys[prop] = true;
    btn.classList.add('active');
  };
  const off = () => {
    keys[prop] = false;
    btn.classList.remove('active');
  };
  btn.addEventListener('pointerdown', on);
  window.addEventListener('pointerup', off);
  window.addEventListener('pointercancel', off);
}
bindDirPad('btnPadLeft', 'left');
bindDirPad('btnPadRight', 'right');

window.addEventListener('keydown', (e) => {
  if (document.querySelector('dialog[open]')) return;
  const k = e.key.toLowerCase();
  if (k === 'a' || e.key === 'ArrowLeft') {
    if (aiPilot) toggleAiPilot();
    keys.left = true;
    e.preventDefault();
  }
  if (k === 'd' || e.key === 'ArrowRight') {
    if (aiPilot) toggleAiPilot();
    keys.right = true;
    e.preventDefault();
  }
  if (e.code === 'Space') {
    launchStuckBalls();
    e.preventDefault();
  }
  if (k === 'p') {
    togglePause();
  }
  if (k === 'r') {
    loadSector(currentSectorIdx, false);
  }
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'a' || e.key === 'ArrowLeft') keys.left = false;
  if (k === 'd' || e.key === 'ArrowRight') keys.right = false;
});

function toggleAiPilot() {
  aiPilot = !aiPilot;
  const aiBtn = document.getElementById('aiBtn');
  const aiQuick = document.getElementById('btnAiQuick');
  if (aiBtn) {
    aiBtn.classList.toggle('active', aiPilot);
    aiBtn.setAttribute('aria-pressed', String(aiPilot));
    aiBtn.innerHTML = `<span>AI PILOT: ${aiPilot ? 'ON' : 'OFF'}</span>`;
  }
  if (aiQuick) {
    aiQuick.classList.toggle('active', aiPilot);
    aiQuick.textContent = aiPilot ? 'AI DEMO: ON' : 'AI DEMO';
  }
  if (aiPilot) {
    launchStuckBalls();
    setCue('AI AUTO-PILOT ENGAGED — Predictive Vaus trajectory solver active.');
  } else {
    setCue('Manual Vaus control restored.');
  }
}

function togglePause() {
  paused = !paused;
  const btn = document.getElementById('btnPauseGame');
  if (btn) {
    btn.classList.toggle('active', paused);
    btn.textContent = paused ? 'RESUME (P)' : 'PAUSE (P)';
  }
  setCue(paused ? 'MISSION PAUSED — Press P or Tap RESUME to continue.' : 'Mission resumed.');
}

document.getElementById('aiBtn')?.addEventListener('click', toggleAiPilot);
document.getElementById('btnAiQuick')?.addEventListener('click', toggleAiPilot);
document.getElementById('menuAiBtn')?.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  toggleAiPilot();
});

document.getElementById('sfxBtn')?.addEventListener('click', (e) => {
  sfx.enabled = !sfx.enabled;
  const btn = e.currentTarget;
  btn.classList.toggle('active', sfx.enabled);
  btn.setAttribute('aria-pressed', String(sfx.enabled));
  btn.innerHTML = `<span>SFX: ${sfx.enabled ? 'ON' : 'OFF'}</span>`;
});

document.getElementById('btnLaunchBall')?.addEventListener('click', launchStuckBalls);
document.getElementById('btnPauseGame')?.addEventListener('click', togglePause);
document.getElementById('btnPrevSector')?.addEventListener('click', () => loadSector(currentSectorIdx - 1, false));
document.getElementById('btnNextSector')?.addEventListener('click', () => loadSector(currentSectorIdx + 1, false));
document.getElementById('menuRestartSectorBtn')?.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  loadSector(currentSectorIdx, false);
});
document.getElementById('menuAmbBtn')?.addEventListener('click', () => {
  document.body.classList.toggle('amb-on');
});

const menuBtn = document.getElementById('menuBtn');
menuBtn?.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

// 11. Admin-Protected Analytics Modal Logic (Shared with Parking Academy)
async function sha256Hex(str) {
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

async function verifyAdminPassword(candidate) {
  const storedHash = localStorage.getItem(ADMIN_PW_HASH_KEY) || (await sha256Hex(DEFAULT_ADMIN_PW));
  const candidateHash = await sha256Hex(candidate);
  return candidateHash === storedHash;
}

function isAdminUnlocked() {
  return sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) === '1';
}

function syncAdminGateUI() {
  const unlocked = isAdminUnlocked();
  const gate = document.getElementById('anAuthGate');
  const dash = document.getElementById('anDashboardContent');
  const btnExport = document.getElementById('btnExportAnalytics');
  const btnLock = document.getElementById('btnLockAnalytics');
  const menuAnalyticsLabel = document.querySelector('#menuAnalyticsBtn .mn-t');

  if (gate) gate.hidden = unlocked;
  if (dash) {
    dash.hidden = !unlocked;
    if (unlocked) dash.removeAttribute('inert');
    else dash.setAttribute('inert', '');
  }
  if (btnExport) btnExport.hidden = !unlocked;
  if (btnLock) btnLock.hidden = !unlocked;
  if (menuAnalyticsLabel) {
    menuAnalyticsLabel.textContent = unlocked ? 'Visitor & Player Analytics' : 'Admin Analytics (Locked)';
  }
}

function formatDuration(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m ${s}s`;
}

function renderAnalyticsModal() {
  syncAdminGateUI();
  if (!isAdminUnlocked()) {
    setTimeout(() => document.getElementById('anAdminPassword')?.focus(), 40);
    return;
  }
  const snap = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || '{}');
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  };
  const avgScore = snap.scoreCount > 0 ? Math.round(snap.scoreSum / snap.scoreCount) : 0;
  setTxt('anSourceTag', 'ADMIN UNLOCKED · VERCEL & BROWSER TELEMETRY');
  setTxt('anVisits', snap.visits || 1);
  setTxt('anVisitors', snap.uniqueVisitors || 1);
  setTxt('anPlayTime', formatDuration(snap.totalPlaySec || 0));
  setTxt('anClears', snap.clears || 0);
  setTxt('anArkRuns', snap.arkanoidRuns || 0);
  setTxt('anArkBest', (snap.arkanoidHigh || highScore || 0).toLocaleString());
  setTxt('anDemos', snap.demos || 0);
  setTxt('anAvgScore', avgScore > 0 ? `${avgScore}%` : '—');

  const tbody = document.getElementById('anStageTableBody');
  if (tbody) {
    const stageRows = Object.values(snap.stages || {}).sort((a, b) => (b.attempts || 0) - (a.attempts || 0));
    tbody.innerHTML = stageRows.length
      ? stageRows
          .map(
            (st) => `
          <tr>
            <td><b>${st.id}</b></td>
            <td>${st.name || ''}</td>
            <td>${st.attempts || 0}</td>
            <td>${st.clears || 0}</td>
            <td>${st.collisions || 0}</td>
            <td>${st.bestTime != null ? `${st.bestTime}s` : '—'}</td>
          </tr>
        `
          )
          .join('')
      : `<tr><td colspan="6" style="color:var(--dim)">No parking stages recorded yet.</td></tr>`;
  }

  const feed = document.getElementById('anEventLog');
  if (feed) {
    const evs = snap.events || [];
    feed.innerHTML = evs.length
      ? evs
          .map((ev) => `<div class="an-event"><span>${ev.label}</span><small>${ev.ts}</small></div>`)
          .join('')
      : `<div class="an-event"><span>No activity recorded yet.</span></div>`;
  }
}

document.getElementById('menuAnalyticsBtn')?.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  document.getElementById('menuBtn')?.setAttribute('aria-expanded', 'false');
  renderAnalyticsModal();
});

const anAdminPwInput = document.getElementById('anAdminPassword');
const anAuthError = document.getElementById('anAuthError');
const anTogglePwBtn = document.getElementById('anTogglePwBtn');

anAdminPwInput?.addEventListener('input', () => {
  if (anAuthError) anAuthError.textContent = '';
});
anAdminPwInput?.addEventListener('blur', () => {
  if (!anAdminPwInput.value.trim() && anAuthError) {
    anAuthError.textContent = 'Please enter the administrator password.';
  }
});
anTogglePwBtn?.addEventListener('click', () => {
  if (!anAdminPwInput) return;
  const showing = anAdminPwInput.type === 'text';
  anAdminPwInput.type = showing ? 'password' : 'text';
  anTogglePwBtn.setAttribute('aria-pressed', String(!showing));
  anTogglePwBtn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
  anTogglePwBtn.textContent = showing ? 'SHOW' : 'HIDE';
});
document.getElementById('anAuthForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!anAdminPwInput) return;
  const ok = await verifyAdminPassword(anAdminPwInput.value);
  if (!ok) {
    if (anAuthError) anAuthError.textContent = 'Access denied — invalid administrator password.';
    anAdminPwInput.select();
    return;
  }
  sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, '1');
  anAdminPwInput.value = '';
  if (anAuthError) anAuthError.textContent = '';
  renderAnalyticsModal();
});
document.getElementById('btnLockAnalytics')?.addEventListener('click', () => {
  sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
  renderAnalyticsModal();
});
document.getElementById('btnExportAnalytics')?.addEventListener('click', () => {
  if (!isAdminUnlocked()) return;
  const snap = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || '{}');
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `theparktask-analytics-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Log Arkanoid session visit
recordAnalytics((data) => {
  data.visits = (data.visits || 0) + 1;
}, 'Visitor session started (Arkanoid: Tonna Shatter)');

// 12. Main Animation Loop
let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.04, (now - lastTime) / 1000);
  lastTime = now;
  updatePhysics(dt);
  drawScene(now);
  requestAnimationFrame(loop);
}

resizeCanvas();
loadSector(0, true);
syncAdminGateUI();
requestAnimationFrame(loop);
