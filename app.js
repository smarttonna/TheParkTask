// ==========================================================================
// GARUDA 2026: PRECISION PARKING & REVERSE ACADEMY
// Ackermann Bicycle Kinematics + Ultrasonic Bumper Radar + Swiss Telemetry
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

// ==========================================================================
// 2. PROCEDURAL WEBAUDIO: ULTRASONIC REVERSE RADAR & COLLISION THUD
// ==========================================================================
class ParkingAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastBeepTime = 0;
  }

  init() {
    if (!this.ctx && typeof AudioContext !== 'undefined') {
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  updateRadar(minDistPx, isReversing) {
    if (!this.enabled || !isReversing || minDistPx > 95) return;
    this.init();
    if (!this.ctx) return;

    const now = performance.now();
    // Closer distance -> faster ultrasonic chime interval (700ms down to 90ms)
    const interval = Math.max(90, Math.min(680, (minDistPx / 95) * 680));
    if (now - this.lastBeepTime < interval) return;
    this.lastBeepTime = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(minDistPx < 22 ? 1480 : 1080, t);
    gain.gain.setValueAtTime(0.055, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  playBump() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.17);
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const t = this.ctx.currentTime + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }
}

const sfx = new ParkingAudio();

// ==========================================================================
// 3. 108 REAL-LIFE PARKING & REVERSE SCENARIOS (9 CHAPTERS × 12 STAGES)
// ==========================================================================
const REAL_LIFE_CHAPTERS = [
  {
    cat: 'Home & Driveway',
    events: [
      ['Morning Driveway', 'Reverse', 'NARROW SUBURBAN GATE'],
      ['Trash Bin', 'Dodge', 'CURBSIDE BINS OUT'],
      ['Garage Door', 'Entry', 'TIGHT SINGLE-CAR GARAGE'],
      ['Visitor Curb', 'Squeeze', 'MAILBOX & HEDGE'],
      ['Night Return', 'Back-In', 'UNLIT CUL-DE-SAC'],
      ['Shared Duplex', 'Bay', 'NEIGHBOR SUV OVERHANG'],
      ['Rainy Evening', 'Garage', 'SIDE-MIRROR CLEARANCE'],
      ['Trailer Hitch', 'Align', 'REAR BALL ALIGNMENT'],
      ['Garden Wall', 'Corner', '90° BRICK WALL TURN'],
      ['Sloped Apron', 'Reverse', 'LOW CLEARANCE CURB'],
      ['Double Park', 'Exit', 'BLOCKED-IN ESCAPE'],
      ['Midnight Home', 'Master', 'ZERO-MARGIN CARPORT']
    ]
  },
  {
    cat: 'Grocery & Retail',
    events: [
      ['Morning Market', 'Bay', 'OPEN AISLE ENTRY'],
      ['Cart Corral', 'Squeeze', 'METAL RACK HAZARD'],
      ['Trader Lot', 'Tight', 'COMPACT-ONLY LINES'],
      ['Pickup Truck', 'Shadow', 'OVERSIZED NEIGHBOR'],
      ['Weekend Rush', 'Reverse', 'NARROW TWO-WAY LANE'],
      ['Loading Zone', 'Back-In', 'FLATBED CART ACCESS'],
      ['Corner Endcap', 'Bay', 'CONCRETE PLANTER BOX'],
      ['Holiday Mall', 'Squeeze', 'TWO WIDE CROSSOVERS'],
      ['Pharmacy', 'Quick-In', 'CURB BOLLARD CORNER'],
      ['Hardware', 'Lumber', 'REAR TAILGATE CLEAR'],
      ['Bakery Curb', 'Parallel', '30-SECOND DROP-OFF'],
      ['Superstore', 'Master', 'PEAK SATURDAY SLOT']
    ]
  },
  {
    cat: 'Downtown Parallel',
    events: [
      ['Coffee Shop', 'Curb', 'GENEROUS STREET GAP'],
      ['Metered', 'Squeeze', 'CITY SEDAN POCKET'],
      ['Bike Lane', 'Buffer', 'PROTECTED CURB EDGE'],
      ['Fire Hydrant', 'Clear', 'NO-CLIP ZONE CHECK'],
      ['Bus Stop', 'Corner', 'REAR BUMPER TUCK'],
      ['One-Way St', 'Left-Side', 'REVERSE LEFT ENTRY'],
      ['Cobblestone', 'Alley', 'NARROW CAFE PATIO'],
      ['Delivery Van', 'Blind', 'HIGH-ROOF OBSCURED'],
      ['Rush Hour', 'Gap', 'QUICK 45° ENTRY'],
      ['Outdoor Dining', 'Patio', 'WOODEN DECK GUARD'],
      ['Theater Row', 'Night', 'TIGHT VALET STRIP'],
      ['Financial Dist', 'Master', 'MICRO-GAP PARALLEL']
    ]
  },
  {
    cat: 'Parking Garage',
    events: [
      ['Level P1', 'Pillar', 'SINGLE COLUMN BAY'],
      ['Spiral Ramp', 'Exit', 'BLIND 90° LANDING'],
      ['Compact B2', 'Twin', 'DUAL CONCRETE COLUMNS'],
      ['Elevator', 'Lobby', 'BOLLARD GUARDED BAY'],
      ['Low Ceiling', 'Corner', 'WALL PIPE CLEARANCE'],
      ['EV Charger', 'Back-In', 'REAR PORT ALIGNMENT'],
      ['Valet Pit', 'Angle', '45° TANDEM ENTRY'],
      ['Dark B3', 'Squeeze', 'DIM FLUORESCENT BAY'],
      ['Ticket Gate', 'Booth', 'CURB ISLAND TURN'],
      ['Corner Wall', 'Pocket', 'DEAD-END REVERSE'],
      ['Sub-Level 4', 'Chicane', 'SLALOM PILLAR RUN'],
      ['Basement B5', 'Master', 'ZERO-ERROR CONCRETE']
    ]
  },
  {
    cat: 'School & Family',
    events: [
      ['Morning Drop', 'Lane', 'CURBSIDE KISS-N-GO'],
      ['Crosswalk', 'Clear', 'GUARDRAIL OFFSET'],
      ['Sports Field', 'Grass', 'CONE-LINED BOUNDARY'],
      ['Daycare', 'Reverse', 'STROLLER ACCESS GAP'],
      ['Library', 'Quiet', 'ANGLED 45° BAY'],
      ['Swim Club', 'Lot', 'NARROW LANE ENTRY'],
      ['Piano Lesson', 'Curb', 'DRIVEWAY APRON'],
      ['Pediatric', 'Clinic', 'CORNER ACCESS BAY'],
      ['Playground', 'Fence', 'BOLLARD PERIMETER'],
      ['Rec Center', 'Gym', 'TIGHT END-OF-ROW'],
      ['Graduation', 'Overflow', 'DOUBLE-SIDED CONES'],
      ['School Run', 'Master', 'BUS-LANE SQUEEZE']
    ]
  },
  {
    cat: 'Airport & Transit',
    events: [
      ['Terminal 1', 'Pickup', 'CURBSIDE EXPRESS'],
      ['Short-Term', 'Bay', 'LUGGAGE TRUNK SPACE'],
      ['Valet Drop', 'Angle', 'DIAGONAL TERMINAL'],
      ['Train Kiss', 'Ride', 'TIGHT TURNAROUND'],
      ['Ferry Dock', 'Lane', 'BOLLARD CHICANE'],
      ['Rental Return', 'Slot', 'BUMPER-TO-BUMPER'],
      ['Long-Term', 'Row', 'NARROW SHUTTLE LANE'],
      ['Ride-Share', 'Zone', 'CONED PICKUP BAY'],
      ['Cargo Bay', 'Reverse', 'LOADING RAMP ALIGN'],
      ['Charter Bus', 'Corner', 'BLIND OVERHANG'],
      ['Customs Lot', 'Check', 'INSPECTION SLALOM'],
      ['VIP Hangar', 'Master', 'PRECISION BAY 108']
    ]
  },
  {
    cat: 'Hospital & Medical',
    events: [
      ['ER Valet', 'Approach', 'CURVED DROP-OFF'],
      ['Pharmacy', 'Drive', 'TIGHT BOLLARD ARCH'],
      ['Outpatient', 'Wing', '90° REVERSE BAY'],
      ['Ambulance', 'Clear', 'KEEP-OUT LANE'],
      ['Dental', 'Suite', 'SMALL CLINIC LOT'],
      ['Lab Pickup', 'Curb', 'SHORT-STAY PARALLEL'],
      ['Rehab', 'Center', 'WIDE-DOOR BAY'],
      ['Night Shift', 'Garage', 'PILLAR B2 CORNER'],
      ['Imaging', 'Annex', 'DEAD-END REVERSE'],
      ['Helipad', 'Perimeter', 'SAFETY CONE SLALOM'],
      ['Urgent Care', 'Rush', 'TIGHT TWO-CAR GAP'],
      ['Trauma', 'Master', 'FAST-LOCK REVERSE']
    ]
  },
  {
    cat: 'Events & Dining',
    events: [
      ['Wedding', 'Venue', 'MANICURED HEDGE BAY'],
      ['Stadium', 'Gate', 'CONE-LINED TAILGATE'],
      ['Food Truck', 'Alley', 'NARROW BRICK LANE'],
      ['Cinema', 'Night', 'LATE-SHOW SQUEEZE'],
      ['Rooftop', 'Deck', 'PERIMETER PARAPET'],
      ['Bistro', 'Valet', 'TIGHT CURB POCKET'],
      ['Concert', 'Exit', 'REVERSE OUT OF ROW'],
      ['Museum', 'Courtyard', '45° STONE BAY'],
      ['Hotel', 'Porte', 'PILLAR TURNAROUND'],
      ['Beach', 'Boardwalk', 'SANDY CURB CONES'],
      ['Night Market', 'Corner', 'CROWDED STALL ALLEY'],
      ['Gala', 'Master', 'RED-CARPET REVERSE']
    ]
  },
  {
    cat: 'Pro & Commercial',
    events: [
      ['Warehouse', 'Dock', '90° BAY ALIGNMENT'],
      ['Courier', 'Alley', 'BRICK DUMPSTER GAP'],
      ['Workshop', 'Lift', 'CENTER-LINE REVERSE'],
      ['Car Wash', 'Track', 'RAIL GUIDE ENTRY'],
      ['Dealership', 'Row', 'MIRROR-TO-MIRROR'],
      ['Film Set', 'Basecamp', 'GENERATOR TRAILER'],
      ['Catering', 'Service', 'S-CURVE BACK-IN'],
      ['Marina', 'Slip', 'BOAT RAMP REVERSE'],
      ['Firehouse', 'Apron', 'STRAIGHT BACK-IN'],
      ['Studio', 'Gate', 'SECURITY BOLLARDS'],
      ['Construction', 'Site', 'BARRICADE CHICANE'],
      ['Grand Final', 'Master', 'CHAMPIONSHIP ALLEY']
    ]
  }
];

function buildAllStages() {
  const list = [];
  let num = 1;
  const carColors = ['#3b4b5e', '#6b3e3e', '#2b303a', '#2f4550', '#583134', '#455a64', '#6d4c41', '#37474f'];

  REAL_LIFE_CHAPTERS.forEach((chapter, cIdx) => {
    chapter.events.forEach(([name, surname, context], eIdx) => {
      const id = String(num).padStart(3, '0');
      // Difficulty tightens progressively from 0 to 1
      const diff = (num - 1) / 107;
      const tight = Math.round(diff * 8); // up to 8px tighter bay
      const colorA = carColors[(num + 1) % carColors.length];
      const colorB = carColors[(num + 4) % carColors.length];
      const pattern = (cIdx + eIdx) % 6;

      let stage = {
        id,
        num,
        category: chapter.cat,
        short: `STAGE ${id}`,
        name,
        surname,
        subtitle: `${chapter.cat.toUpperCase()} · ${context}`
      };

      if (pattern === 0) {
        // 90° Reverse Bay between two cars
        const bayX = 30 + ((eIdx % 3) - 1) * 28;
        stage.start = { x: -205, y: 120, angle: 0 };
        stage.target = { x: bayX, y: -66, angle: -Math.PI / 2, w: 68 - tight, h: 120 - tight };
        stage.coachCue = `${name} ${surname}: Pull past the slot, then full-lock LEFT in Reverse.`;
        stage.tip = `COACH TIP (${context}): Pivot around your rear axle as soon as your rear bumper passes the adjacent vehicle.`;
        stage.obstacles = [
          { x: 0, y: -140, w: 460, h: 20, type: 'curb' },
          { x: bayX - (76 - tight / 2), y: -66, w: 50, h: 102, type: 'car', color: colorA },
          { x: bayX + (76 - tight / 2), y: -66, w: 50, h: 102, type: 'car', color: colorB },
          { x: -235, y: -66, w: 50, h: 102, type: 'car', color: '#2b303a' }
        ];
      } else if (pattern === 1) {
        // Tight Parallel Curb
        const gap = 138 - tight * 1.4;
        stage.start = { x: 125, y: -12, angle: 0 };
        stage.target = { x: 0, y: -76, angle: 0, w: 126 - tight, h: 58 - Math.round(tight / 2) };
        stage.coachCue = `${name} ${surname}: Reverse full-lock LEFT to 45°, then counter-steer RIGHT.`;
        stage.tip = `COACH TIP (${context}): Wait until your front bumper clears the lead car before counter-steering.`;
        stage.obstacles = [
          { x: 0, y: -126, w: 480, h: 24, type: 'curb' },
          { x: -gap, y: -76, w: 102, h: 48, type: 'car', color: colorA },
          { x: gap, y: -76, w: 102, h: 48, type: 'car', color: colorB }
        ];
      } else if (pattern === 2) {
        // 90° Blind Corner / Pillar Alley
        stage.start = { x: -185, y: 125, angle: 0 };
        stage.target = { x: 130, y: -56, angle: -Math.PI / 2, w: 66 - Math.round(tight / 2), h: 118 - tight };
        stage.coachCue = `${name} ${surname}: Clear the corner pillar with your rear axle before turning.`;
        stage.tip = `COACH TIP (${context}): Turning too early around a pillar clips the rear quarter panel.`;
        stage.obstacles = [
          { x: 130, y: -136, w: 190, h: 22, type: 'wall' },
          { x: 206, y: -35, w: 26, h: 220, type: 'wall' },
          { x: 35 + Math.round(tight / 2), y: -35, w: 46, h: 108, type: 'pillar' },
          { x: -110, y: 190, w: 540, h: 22, type: 'curb' }
        ];
      } else if (pattern === 3) {
        // 45° Angled Diagonal Reverse
        stage.start = { x: -195, y: 105, angle: 0 };
        stage.target = { x: 45, y: -62, angle: -Math.PI / 4, w: 68 - tight, h: 120 - tight };
        stage.coachCue = `${name} ${surname}: Use half-lock steering in Reverse to glide into the 45° bay.`;
        stage.tip = `COACH TIP (${context}): Diagonal slots need smooth 18–22° lock rather than full lock.`;
        stage.obstacles = [
          { x: 0, y: -146, w: 460, h: 20, type: 'curb' },
          { x: -45 + Math.round(tight / 2), y: -62, w: 50, h: 100, angle: -Math.PI / 4, type: 'car', color: colorA },
          { x: 135 - Math.round(tight / 2), y: -62, w: 50, h: 100, angle: -Math.PI / 4, type: 'car', color: colorB },
          { x: 0, y: 176, w: 460, h: 20, type: 'curb' }
        ];
      } else if (pattern === 4) {
        // S-Curve Cone/Bollard Reverse Chicane
        const shift = (eIdx % 2 === 0 ? 1 : -1) * 16;
        stage.start = { x: -240, y: 80, angle: Math.PI };
        stage.target = { x: 205, y: -45, angle: Math.PI, w: 120 - tight, h: 66 - Math.round(tight / 2) };
        stage.coachCue = `${name} ${surname}: Reverse slowly through the cones using your trajectory arcs.`;
        stage.tip = `COACH TIP (${context}): Keep speed under 10 km/h when threading tight bollards in reverse.`;
        stage.obstacles = [
          { x: -60, y: -40 + shift, r: 14, type: 'cone' },
          { x: -60, y: 55 + shift, r: 14, type: 'cone' },
          { x: 75, y: -95 - shift, r: 14, type: 'cone' },
          { x: 75, y: 5 - shift, r: 14, type: 'cone' },
          { x: 280, y: -45, w: 22, h: 180, type: 'wall' },
          { x: 0, y: -156, w: 600, h: 20, type: 'curb' },
          { x: 0, y: 166, w: 600, h: 20, type: 'curb' }
        ];
      } else {
        // Dual Concrete Pillar Garage Squeeze
        stage.start = { x: -200, y: 120, angle: 0 };
        stage.target = { x: 10, y: -68, angle: -Math.PI / 2, w: 66 - tight, h: 118 - tight };
        stage.coachCue = `${name} ${surname}: Thread between the concrete columns—watch front bumper swing!`;
        stage.tip = `COACH TIP (${context}): If you enter off-center, pull forward 0.5m to straighten—smart drivers adjust!`;
        stage.obstacles = [
          { x: 0, y: -142, w: 500, h: 22, type: 'wall' },
          { x: -60 + Math.round(tight / 2), y: -35, w: 34, h: 52, type: 'pillar' },
          { x: 80 - Math.round(tight / 2), y: -35, w: 34, h: 52, type: 'pillar' },
          { x: -138, y: -68, w: 48, h: 98, type: 'car', color: colorA },
          { x: 158, y: -68, w: 48, h: 98, type: 'car', color: colorB },
          { x: 0, y: 186, w: 500, h: 22, type: 'curb' }
        ];
      }

      list.push(stage);
      num++;
    });
  });
  return list;
}

const BAYS = buildAllStages();

// ==========================================================================
// 4. VEHICLE STATE & ACKERMANN KINEMATICS
// ==========================================================================
const CAR = {
  x: 0,
  y: 0,
  angle: 0,
  speed: 0,        // px/s (positive = forward, negative = reverse)
  steer: 0,        // radians (-0.62 to +0.62)
  wheelbase: 58,   // L in px (distance between rear and front axle)
  length: 92,      // total car body length
  width: 44,       // total car body width
  maxSteer: 0.62,  // ~35.5 deg
  maxFwd: 175,
  maxRev: -125
};

const STORAGE_KEY = 'garuda_drive_cleared_v1';
let clearedBays = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
let currentBayIdx = 0;
let showGuides = true;
let bayCleared = false;
let bayPosState = 'outside'; // 'outside' | 'partial' | 'aligned' | 'passed'
let startTime = performance.now();
let collisions = 0;
let reversals = 0;
let lastGear = 'N';
let lastCollisionBump = 0;
let holdTimer = 0;

// Input state
const keys = { up: false, down: false, left: false, right: false, brake: false };

function loadBay(idx) {
  currentBayIdx = (idx + BAYS.length) % BAYS.length;
  const bay = BAYS[currentBayIdx];

  CAR.x = bay.start.x;
  CAR.y = bay.start.y;
  CAR.angle = bay.start.angle;
  CAR.speed = 0;
  CAR.steer = 0;

  bayCleared = false;
  bayPosState = 'outside';
  startTime = performance.now();
  collisions = 0;
  reversals = 0;
  lastGear = 'N';
  holdTimer = 0;

  document.body.classList.remove('is-detail', 'bay-passed');
  document.getElementById('hudLevelKicker').textContent = `BAY ${bay.id} · ${bay.name.toUpperCase()} ${bay.surname.toUpperCase()}`;
  document.getElementById('dockTitle').innerHTML = `<b>${bay.id}</b>${bay.name} ${bay.surname}`;
  setCoachCue(bay.coachCue, 'neutral');

  updateDockUI();
}

function setCoachCue(text, state = 'neutral') {
  const cue = document.getElementById('coachCue');
  const txt = document.getElementById('coachCueText');
  txt.textContent = text;
  cue.classList.remove('ok', 'warn');
  if (state === 'ok') cue.classList.add('ok');
  if (state === 'warn') cue.classList.add('warn');
}

// ==========================================================================
// 5. GEOMETRY & COLLISION HELPERS (OBB Corners + Circle/Rect Distance)
// ==========================================================================
function getRectCorners(cx, cy, w, h, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const hw = w / 2;
  const hh = h / 2;
  return [
    { x: cx + cos * hw - sin * hh, y: cy + sin * hw + cos * hh },
    { x: cx + cos * hw + sin * hh, y: cy + sin * hw - cos * hh },
    { x: cx - cos * hw + sin * hh, y: cy - sin * hw - cos * hh },
    { x: cx - cos * hw - sin * hh, y: cy - sin * hw + cos * hh }
  ];
}

function pointToObsDist(px, py, obs) {
  if (obs.type === 'cone') {
    return Math.hypot(px - obs.x, py - obs.y) - obs.r;
  }
  const a = obs.angle || 0;
  const dx = px - obs.x;
  const dy = py - obs.y;
  const lx = dx * Math.cos(-a) - dy * Math.sin(-a);
  const ly = dx * Math.sin(-a) + dy * Math.cos(-a);
  const qx = Math.max(Math.abs(lx) - obs.w / 2, 0);
  const qy = Math.max(Math.abs(ly) - obs.h / 2, 0);
  return Math.hypot(qx, qy);
}

function getCarClearance(carX, carY, carAngle, bay) {
  const corners = getRectCorners(carX, carY, CAR.length, CAR.width, carAngle);
  // Also sample midpoints along bumpers for tight pillar checks
  const cos = Math.cos(carAngle);
  const sin = Math.sin(carAngle);
  const samples = [
    ...corners,
    { x: carX + cos * (CAR.length / 2), y: carY + sin * (CAR.length / 2) },
    { x: carX - cos * (CAR.length / 2), y: carY - sin * (CAR.length / 2) },
    { x: carX + sin * (CAR.width / 2), y: carY - cos * (CAR.width / 2) },
    { x: carX - sin * (CAR.width / 2), y: carY + cos * (CAR.width / 2) }
  ];

  let minDist = Infinity;
  for (const obs of bay.obstacles) {
    for (const pt of samples) {
      const d = pointToObsDist(pt.x, pt.y, obs);
      if (d < minDist) minDist = d;
    }
    // Also check obstacle corners inside car
    if (obs.type !== 'cone') {
      const obsCorners = getRectCorners(obs.x, obs.y, obs.w, obs.h, obs.angle || 0);
      for (const oc of obsCorners) {
        const d = pointToObsDist(oc.x, oc.y, { x: carX, y: carY, w: CAR.length, h: CAR.width, angle: carAngle });
        if (d < minDist) minDist = d;
      }
    }
  }
  return minDist;
}

// Check if car is cleanly parked inside target bay
function checkParked(bay, dt) {
  const t = bay.target;
  const dx = CAR.x - t.x;
  const dy = CAR.y - t.y;
  const lx = dx * Math.cos(-t.angle) - dy * Math.sin(-t.angle);
  const ly = dx * Math.sin(-t.angle) + dy * Math.cos(-t.angle);

  const angleDiff = Math.abs(Math.atan2(Math.sin(CAR.angle - t.angle), Math.cos(CAR.angle - t.angle)));
  const aligned = angleDiff < 0.18 || Math.abs(angleDiff - Math.PI) < 0.18;
  const centered = Math.abs(lx) < (t.h - CAR.length) / 2 + 10 && Math.abs(ly) < (t.w - CAR.width) / 2 + 7;
  const insideRoughly = Math.abs(lx) < t.h / 2 + 12 && Math.abs(ly) < t.w / 2 + 10;
  const stopped = Math.abs(CAR.speed) < 14;

  if (aligned && centered) {
    bayPosState = 'aligned';
    if (stopped) {
      holdTimer += dt;
      setCoachCue('Box is GREEN! Hold still to pass stage…', 'ok');
      if (holdTimer > 0.45 && !bayCleared) {
        completeBay(bay, angleDiff, Math.hypot(lx, ly));
      }
    } else {
      holdTimer = 0;
      setCoachCue('Properly positioned! Brake to a complete stop (SPACE or release).', 'ok');
    }
  } else if (insideRoughly) {
    bayPosState = 'partial';
    holdTimer = 0;
    setCoachCue(
      aligned ? 'Good angle — center the car inside the bay lines.' : 'Inside the bay — straighten your steering to align with the lines.',
      'neutral'
    );
  } else {
    bayPosState = 'outside';
    holdTimer = 0;
  }
}

function completeBay(bay, angleDiff, offsetPx) {
  bayCleared = true;
  bayPosState = 'passed';
  clearedBays.add(bay.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...clearedBays]));
  document.body.classList.add('bay-passed');
  document.getElementById('passSignTitle').textContent = `STAGE ${bay.id} · ${bay.name.toUpperCase()} ${bay.surname.toUpperCase()} CLEARED`;
  sfx.playSuccess();
  updateDockUI();
  renderStagesModal();

  const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(1);
  const alignPct = Math.max(60, Math.round(100 - angleDiff * 140 - offsetPx * 0.6));
  const penalty = collisions * 12;
  const finalScore = Math.max(45, Math.min(100, alignPct - penalty));
  const grade = finalScore >= 94 ? 'A+' : finalScore >= 86 ? 'A' : finalScore >= 75 ? 'B' : 'C';

  document.getElementById('shPageIdx').textContent = bay.id;
  document.getElementById('shPageTotal').textContent = String(BAYS.length).padStart(2, '0');
  document.getElementById('shGrade').textContent = grade;
  document.getElementById('shSub').textContent = `BAY ${bay.id} · ${bay.subtitle.split(' · ')[0]}`;
  document.getElementById('shTitle').innerHTML = `${bay.name} <b>${bay.surname}</b>`;
  document.getElementById('shScoreText').textContent = `${finalScore}% PARKING PRECISION`;

  document.getElementById('shFacts').innerHTML = `
    <div><dt>TIME ELAPSED</dt><i></i><dd><b>${elapsedSec} s</b></dd></div>
    <div><dt>ALIGNMENT</dt><i></i><dd><b>${(angleDiff * 57.3).toFixed(1)}°</b></dd></div>
    <div><dt>CENTER OFFSET</dt><i></i><dd><b>${Math.round(offsetPx * 4.5)} cm</b></dd></div>
    <div><dt>GEAR SHIFTS</dt><i></i><dd><b>${reversals}</b></dd></div>
    <div><dt>BUMP / CURB HITS</dt><i></i><dd><b>${collisions}</b></dd></div>
  `;

  const cleanScore = Math.max(20, 100 - collisions * 25);
  document.getElementById('shMetrics').innerHTML = `
    <div class="fr">
      <div class="fr-meta"><b>ANGLE</b><small>Parallelism</small></div>
      <div class="fr-bar"><svg viewBox="0 0 300 18"><rect class="fr-on good" x="0" y="3" width="${Math.round(alignPct * 3)}" height="12" rx="2"/></svg></div>
    </div>
    <div class="fr">
      <div class="fr-meta"><b>SAFETY</b><small>Zero-Hit</small></div>
      <div class="fr-bar"><svg viewBox="0 0 300 18"><rect class="fr-on ${cleanScore > 75 ? 'good' : ''}" x="0" y="3" width="${Math.round(cleanScore * 3)}" height="12" rx="2"/></svg></div>
    </div>
    <div class="fr">
      <div class="fr-meta"><b>EFFICIENCY</b><small>Shunts</small></div>
      <div class="fr-bar"><svg viewBox="0 0 300 18"><rect class="fr-on good" x="0" y="3" width="${Math.max(90, 300 - reversals * 28)}" height="12" rx="2"/></svg></div>
    </div>
  `;

  document.getElementById('shSummary').textContent = `${collisions} COLLISIONS · ${reversals} SHUNTS · GRADE ${grade}`;
  document.getElementById('shDebrief').textContent =
    collisions === 0
      ? 'Clean entry with zero curb or bumper contact. Your rear-axle pivot timing kept the front swing safely clear.'
      : `Completed with ${collisions} light contact(s). Slow down to walking pace when the ultrasonic radar chimes rapidly.`;
  document.getElementById('shTip').innerHTML = `<b>${bay.tip.split(':')[0]}:</b>${bay.tip.split(':').slice(1).join(':')}`;

  document.body.classList.add('is-detail');
}

// ==========================================================================
// 6. PHYSICS UPDATE LOOP (Ackermann Rear-Axle Pivot)
// ==========================================================================
let lastTime = performance.now();

function updatePhysics(dt) {
  if (bayCleared || document.querySelector('dialog[open]')) return;

  // Steering input
  const steerRate = 2.6;
  if (keys.left) {
    CAR.steer = Math.max(-CAR.maxSteer, CAR.steer - steerRate * dt);
  } else if (keys.right) {
    CAR.steer = Math.min(CAR.maxSteer, CAR.steer + steerRate * dt);
  } else {
    // Gentle self-centering when rolling
    if (Math.abs(CAR.speed) > 10) {
      CAR.steer *= Math.pow(0.25, dt);
    }
  }

  // Throttle & Brake
  const accel = 260;
  const drag = 190;
  if (keys.brake) {
    if (Math.abs(CAR.speed) < 18) CAR.speed = 0;
    else CAR.speed -= Math.sign(CAR.speed) * 420 * dt;
  } else if (keys.up) {
    CAR.speed = Math.min(CAR.maxFwd, CAR.speed + accel * dt);
  } else if (keys.down) {
    CAR.speed = Math.max(CAR.maxRev, CAR.speed - accel * dt);
  } else {
    if (Math.abs(CAR.speed) < 6) CAR.speed = 0;
    else CAR.speed -= Math.sign(CAR.speed) * drag * dt;
  }

  // Track gear reversals
  const gear = CAR.speed > 5 ? 'D' : CAR.speed < -5 ? 'R' : 'N';
  if (gear !== 'N' && gear !== lastGear) {
    if (lastGear !== 'N') reversals++;
    lastGear = gear;
  }

  // Save previous pose for collision rollback
  const prevX = CAR.x;
  const prevY = CAR.y;
  const prevAngle = CAR.angle;

  // Ackermann bicycle kinematics (pivot around rear axle)
  const angularVel = (CAR.speed / CAR.wheelbase) * Math.tan(CAR.steer);
  CAR.angle += angularVel * dt;
  CAR.x += Math.cos(CAR.angle) * CAR.speed * dt;
  CAR.y += Math.sin(CAR.angle) * CAR.speed * dt;

  const bay = BAYS[currentBayIdx];
  const clearance = getCarClearance(CAR.x, CAR.y, CAR.angle, bay);

  if (clearance < 0) {
    // Bounce / stop at obstacle
    CAR.x = prevX;
    CAR.y = prevY;
    CAR.angle = prevAngle;
    CAR.speed = -CAR.speed * 0.25;
    if (performance.now() - lastCollisionBump > 550) {
      collisions++;
      lastCollisionBump = performance.now();
      sfx.playBump();
      setCoachCue('Bump! Pull slightly opposite & counter-steer for clearance.', 'warn');
    }
  } else {
    sfx.updateRadar(clearance, CAR.speed < -4);
    checkParked(bay, dt);
  }

  // Update bottom dock telemetry string
  const kmh = Math.round(Math.abs(CAR.speed) * 0.12);
  const steerDeg = Math.round((CAR.steer * 180) / Math.PI);
  const radarCm = clearance === Infinity ? 'CLEAR' : `${Math.max(0, Math.round(clearance * 4.5))} CM`;
  document.getElementById('dockTelemetry').textContent =
    `GEAR: ${gear} · ${kmh} KM/H · STEER: ${steerDeg > 0 ? '+' : ''}${steerDeg}° · RADAR: ${radarCm}`;
}

// ==========================================================================
// 7. 2.5D CANVAS RENDERER (Asphalt, Bay Markings, Guides, Car & Night Lights)
// ==========================================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const uiScale = Math.max(0.76, Math.min(1.12, Math.min(window.innerWidth / 1568, window.innerHeight / 913)));
  document.documentElement.style.setProperty('--ui', uiScale.toFixed(4));
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  updateDockThumb();
  updateViewThumb();
}
window.addEventListener('resize', resizeCanvas);

function drawScene() {
  const w = canvas.width;
  const h = canvas.height;
  const dpr = window.devicePixelRatio || 1;
  const isNight = document.body.classList.contains('amb-on');
  const camMode = document.body.dataset.cam || 'follow';
  const bay = BAYS[currentBayIdx];

  // Asphalt background
  ctx.fillStyle = isNight ? '#070914' : '#181617';
  ctx.fillRect(0, 0, w, h);

  // Subtle asphalt grid texture
  ctx.save();
  ctx.scale(dpr, dpr);
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Camera transform
  let zoom = camMode === 'wide' ? 0.92 : camMode === 'tight' ? 1.45 : 1.15;
  if (vw < 760) zoom *= 0.72;
  const camX = camMode === 'wide' ? 0 : CAR.x * 0.55;
  const camY = camMode === 'wide' ? 0 : CAR.y * 0.55;

  ctx.translate(vw / 2, vh / 2 - 20);
  ctx.scale(zoom, zoom);
  ctx.translate(-camX, -camY);

  // Lot floor lines
  ctx.strokeStyle = isNight ? 'rgba(180, 200, 255, 0.05)' : 'rgba(255, 240, 220, 0.05)';
  ctx.lineWidth = 1;
  for (let gx = -500; gx <= 500; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, -350);
    ctx.lineTo(gx, 350);
    ctx.stroke();
  }
  for (let gy = -360; gy <= 360; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(-500, gy);
    ctx.lineTo(500, gy);
    ctx.stroke();
  }

  // Target Parking Bay (Live color feedback: Gold -> Amber -> Emerald Green)
  const t = bay.target;
  const isGreen = bayCleared || bayPosState === 'aligned';
  const isPartial = bayPosState === 'partial';
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate(t.angle);
  if (isGreen) {
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 18;
    ctx.fillStyle = bayCleared ? 'rgba(74, 222, 128, 0.28)' : 'rgba(74, 222, 128, 0.20)';
  } else if (isPartial) {
    ctx.fillStyle = 'rgba(255, 169, 44, 0.15)';
  } else {
    ctx.fillStyle = 'rgba(232, 171, 54, 0.10)';
  }
  ctx.fillRect(-t.h / 2, -t.w / 2, t.h, t.w);
  ctx.strokeStyle = isGreen ? '#4ade80' : isPartial ? '#ffa92c' : '#ffc570';
  ctx.lineWidth = isGreen ? 3.5 : 2.5;
  ctx.setLineDash(isGreen ? [] : [8, 6]);
  ctx.strokeRect(-t.h / 2, -t.w / 2, t.h, t.w);
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;

  // Hold-to-lock progress bar along bay edge when aligned
  if (bayPosState === 'aligned' && !bayCleared && holdTimer > 0) {
    const pct = Math.min(1, holdTimer / 0.45);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(-t.h / 2, -t.w / 2 - 7, t.h * pct, 4);
  }

  ctx.fillStyle = isGreen ? '#4ade80' : isPartial ? '#ffa92c' : 'rgba(255, 197, 112, 0.65)';
  ctx.font = '700 11px "Geist Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(bayCleared ? `✓ PASSED` : `BAY ${bay.id}`, 0, 0);
  ctx.restore();

  // Obstacles (Curbs, Pillars, Cones, Parked Cars)
  for (const obs of bay.obstacles) {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    if (obs.angle) ctx.rotate(obs.angle);

    if (obs.type === 'cone') {
      ctx.beginPath();
      ctx.arc(0, 0, obs.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6d3b';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, obs.r * 0.48, 0, Math.PI * 2);
      ctx.fillStyle = '#f6faf9';
      ctx.fill();
    } else if (obs.type === 'car') {
      // Parked car obstacle
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(-obs.h / 2 + 4, -obs.w / 2 + 5, obs.h, obs.w);
      ctx.fillStyle = obs.color || '#3e4a59';
      roundRect(ctx, -obs.h / 2, -obs.w / 2, obs.h, obs.w, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Windshield
      ctx.fillStyle = 'rgba(10, 14, 22, 0.72)';
      roundRect(ctx, -obs.h / 4, -obs.w / 2 + 5, obs.h * 0.55, obs.w - 10, 5);
      ctx.fill();
    } else {
      // Curb / Wall / Concrete Pillar
      ctx.fillStyle = obs.type === 'pillar' ? '#645c58' : '#3a3432';
      ctx.fillRect(-obs.w / 2, -obs.h / 2, obs.w, obs.h);
      ctx.strokeStyle = obs.type === 'pillar' ? '#ffc570' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-obs.w / 2, -obs.h / 2, obs.w, obs.h);
    }
    ctx.restore();
  }

  // Ackermann Predicted Trajectory Arcs (when GUIDE is ON)
  if (showGuides) {
    drawTrajectoryGuides();
  }

  // Player Garuda Car
  drawPlayerCar(isNight);

  ctx.restore();
}

function drawTrajectoryGuides() {
  const steps = 22;
  const stepDt = 0.075;
  const dir = keys.down || CAR.speed < -2 ? -1 : 1;
  const simSpeed = dir * 95;

  let sx = CAR.x;
  let sy = CAR.y;
  let sa = CAR.angle;

  ctx.save();
  ctx.strokeStyle = dir < 0 ? 'rgba(255, 197, 112, 0.75)' : 'rgba(246, 250, 249, 0.48)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  // Left & Right tire paths
  const leftPts = [];
  const rightPts = [];
  for (let i = 0; i < steps; i++) {
    const w = (simSpeed / CAR.wheelbase) * Math.tan(CAR.steer);
    sa += w * stepDt;
    sx += Math.cos(sa) * simSpeed * stepDt;
    sy += Math.sin(sa) * simSpeed * stepDt;

    const rearOff = dir < 0 ? -CAR.length / 2 : CAR.length / 2;
    const rx = sx + Math.cos(sa) * rearOff;
    const ry = sy + Math.sin(sa) * rearOff;
    const nx = -Math.sin(sa) * (CAR.width / 2 - 4);
    const ny = Math.cos(sa) * (CAR.width / 2 - 4);
    leftPts.push({ x: rx + nx, y: ry + ny });
    rightPts.push({ x: rx - nx, y: ry - ny });
  }

  [leftPts, rightPts].forEach((pts) => {
    ctx.beginPath();
    pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  });

  // Rear-axle pivot crosshair
  const px = CAR.x - Math.cos(CAR.angle) * (CAR.wheelbase / 2);
  const py = CAR.y - Math.sin(CAR.angle) * (CAR.wheelbase / 2);
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffa92c';
  ctx.beginPath();
  ctx.arc(px, py, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayerCar(isNight) {
  ctx.save();
  ctx.translate(CAR.x, CAR.y);
  ctx.rotate(CAR.angle);

  // Night headlights & reverse lights
  if (isNight) {
    const headGrad = ctx.createLinearGradient(CAR.length / 2, 0, CAR.length / 2 + 170, 0);
    headGrad.addColorStop(0, 'rgba(255, 246, 224, 0.34)');
    headGrad.addColorStop(1, 'rgba(255, 246, 224, 0)');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(CAR.length / 2, -16);
    ctx.lineTo(CAR.length / 2 + 170, -54);
    ctx.lineTo(CAR.length / 2 + 170, 54);
    ctx.lineTo(CAR.length / 2, 16);
    ctx.closePath();
    ctx.fill();
  }

  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
  roundRect(ctx, -CAR.length / 2 + 3, -CAR.width / 2 + 4, CAR.length, CAR.width, 9);
  ctx.fill();

  // Front steerable wheels
  const wheelX = CAR.wheelbase / 2;
  [-CAR.width / 2 - 1, CAR.width / 2 - 4].forEach((wy) => {
    ctx.save();
    ctx.translate(wheelX, wy + 2.5);
    ctx.rotate(CAR.steer);
    ctx.fillStyle = '#111';
    ctx.fillRect(-7, -2.5, 14, 5);
    ctx.restore();
  });

  // Crimson Lacquered Garuda Body
  const bodyGrad = ctx.createLinearGradient(-CAR.length / 2, -CAR.width / 2, CAR.length / 2, CAR.width / 2);
  bodyGrad.addColorStop(0, '#a80f18');
  bodyGrad.addColorStop(0.5, '#da1f26');
  bodyGrad.addColorStop(1, '#7c0910');
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, -CAR.length / 2, -CAR.width / 2, CAR.length, CAR.width, 9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 214, 150, 0.55)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Cabin Glass
  ctx.fillStyle = 'rgba(12, 14, 22, 0.84)';
  roundRect(ctx, -CAR.length * 0.24, -CAR.width / 2 + 5, CAR.length * 0.48, CAR.width - 10, 6);
  ctx.fill();

  // Reverse white lights & brake lights
  const isReversing = CAR.speed < -3;
  ctx.fillStyle = isReversing ? '#ffffff' : '#ff3b3b';
  ctx.fillRect(-CAR.length / 2, -CAR.width / 2 + 5, 3, 8);
  ctx.fillRect(-CAR.length / 2, CAR.width / 2 - 13, 3, 8);

  // Headlight LEDs
  ctx.fillStyle = '#fff6ea';
  ctx.fillRect(CAR.length / 2 - 3, -CAR.width / 2 + 5, 3, 8);
  ctx.fillRect(CAR.length / 2 - 3, CAR.width / 2 - 13, 3, 8);

  ctx.restore();
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// ==========================================================================
// 8. HUD CONTROLS, BAY DOCK & KEYBOARD / TOUCH BINDINGS
// ==========================================================================
const dockCellsEl = document.getElementById('dockCells');
const dockThumbEl = document.getElementById('dockThumb');
let dockChapterStart = 0;

function buildDock() {
  const chapterStart = Math.floor(currentBayIdx / 12) * 12;
  dockChapterStart = chapterStart;
  dockCellsEl.innerHTML = '';
  dockCellsEl.appendChild(dockThumbEl);

  const slice = BAYS.slice(chapterStart, chapterStart + 12);
  slice.forEach((bay, localIdx) => {
    const globalIdx = chapterStart + localIdx;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `ws-c${globalIdx === currentBayIdx ? ' on' : ''}${clearedBays.has(bay.id) ? ' cleared' : ''}`;
    btn.textContent = bay.id;
    btn.title = `${bay.id}: ${bay.name} ${bay.surname}`;
    btn.addEventListener('click', () => loadBay(globalIdx));
    dockCellsEl.appendChild(btn);
  });
  requestAnimationFrame(updateDockThumb);
}

function updateDockUI() {
  const chapterStart = Math.floor(currentBayIdx / 12) * 12;
  if (chapterStart !== dockChapterStart) {
    buildDock();
    return;
  }
  const buttons = dockCellsEl.querySelectorAll('.ws-c');
  buttons.forEach((b, localIdx) => {
    const globalIdx = chapterStart + localIdx;
    b.classList.toggle('on', globalIdx === currentBayIdx);
    b.classList.toggle('cleared', clearedBays.has(BAYS[globalIdx].id));
  });
  requestAnimationFrame(updateDockThumb);
}

function updateDockThumb() {
  const localIdx = currentBayIdx - dockChapterStart;
  const activeBtn = dockCellsEl.querySelectorAll('.ws-c')[localIdx];
  if (!activeBtn || !dockThumbEl) return;
  dockThumbEl.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
  dockThumbEl.style.width = `${activeBtn.offsetWidth}px`;
}

// 108-Stage Modal Browser
let activeCategory = 'ALL';
const stageCatsEl = document.getElementById('stageCats');
const stagesGridEl = document.getElementById('stagesGrid');
const stageSearchEl = document.getElementById('stageSearch');

function renderStagesModal() {
  if (!stageCatsEl || !stagesGridEl) return;
  document.getElementById('stagesProgress').textContent = `${clearedBays.size} / ${BAYS.length} REAL-LIFE SCENARIOS CLEARED`;

  const cats = ['ALL', ...REAL_LIFE_CHAPTERS.map((c) => c.cat)];
  stageCatsEl.innerHTML = cats
    .map((cat) => `<button type="button" class="cat-pill${activeCategory === cat ? ' on' : ''}" data-cat="${cat}">${cat}</button>`)
    .join('');

  stageCatsEl.querySelectorAll('.cat-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      renderStagesModal();
    });
  });

  const q = (stageSearchEl?.value || '').trim().toLowerCase();
  const filtered = BAYS.filter((b) => {
    const matchCat = activeCategory === 'ALL' || b.category === activeCategory;
    const matchQ = !q || `${b.id} ${b.name} ${b.surname} ${b.subtitle} ${b.category}`.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  stagesGridEl.innerHTML = filtered
    .map((b) => {
      const idx = b.num - 1;
      const isActive = idx === currentBayIdx;
      const isDone = clearedBays.has(b.id);
      return `
        <button type="button" class="stage-card${isActive ? ' active' : ''}${isDone ? ' cleared' : ''}" data-idx="${idx}">
          <div class="stage-card-top">
            <span>STAGE ${b.id}</span>
            <span>${isDone ? '✓ PASSED' : b.category.toUpperCase()}</span>
          </div>
          <strong>${b.name} ${b.surname}</strong>
          <small>${b.subtitle.split(' · ')[1] || b.subtitle}</small>
        </button>
      `;
    })
    .join('');

  stagesGridEl.querySelectorAll('.stage-card').forEach((card) => {
    card.addEventListener('click', () => {
      loadBay(Number(card.dataset.idx));
      document.getElementById('stagesModal')?.close();
    });
  });
}

stageSearchEl?.addEventListener('input', renderStagesModal);
renderStagesModal();

const viewBtns = document.querySelectorAll('#views .rn-opt');
const viewThumbEl = document.getElementById('viewThumb');

function updateViewThumb() {
  const active = document.querySelector('#views .rn-opt.on');
  if (!active || !viewThumbEl) return;
  viewThumbEl.style.transform = `translateX(${active.offsetLeft}px)`;
  viewThumbEl.style.width = `${active.offsetWidth}px`;
}

viewBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    viewBtns.forEach((b) => b.classList.remove('on'));
    btn.classList.add('on');
    document.body.dataset.cam = btn.dataset.cam;
    updateViewThumb();
  });
});

// Guide toggle
const guideBtn = document.getElementById('guideBtn');
function toggleGuides() {
  showGuides = !showGuides;
  guideBtn.classList.toggle('active', showGuides);
  guideBtn.setAttribute('aria-pressed', String(showGuides));
  guideBtn.querySelector('span').textContent = showGuides ? 'GUIDE: ON' : 'GUIDE: OFF';
}
guideBtn.addEventListener('click', toggleGuides);
document.getElementById('menuGuideBtn').addEventListener('click', toggleGuides);

// Day/Night toggle
const ambBtn = document.getElementById('ambBtn');
function toggleAmbience() {
  const night = document.body.classList.toggle('amb-on');
  ambBtn.dataset.mode = night ? 'night' : 'day';
}
ambBtn.addEventListener('click', toggleAmbience);
document.getElementById('menuAmbBtn').addEventListener('click', toggleAmbience);

// Sound toggle
const soundBtn = document.getElementById('sound2');
soundBtn.addEventListener('click', () => {
  sfx.enabled = !sfx.enabled;
  soundBtn.setAttribute('aria-pressed', String(sfx.enabled));
  document.getElementById('soundWaves').style.opacity = sfx.enabled ? '1' : '0.2';
});

// Reset & Navigation buttons
document.getElementById('resetBtnLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadBay(currentBayIdx);
});
document.getElementById('resetHudBtn').addEventListener('click', () => loadBay(currentBayIdx));
document.getElementById('menuRestartBtn').addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  loadBay(currentBayIdx);
});
document.getElementById('menuShowStatsBtn').addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  document.body.classList.toggle('is-detail');
});
document.getElementById('shNextBayBtn').addEventListener('click', () => loadBay(currentBayIdx + 1));
document.getElementById('shRetryBtn').addEventListener('click', () => loadBay(currentBayIdx));
document.getElementById('dockPrevBtn').addEventListener('click', () => loadBay(currentBayIdx - 1));
document.getElementById('dockNextBtn').addEventListener('click', () => loadBay(currentBayIdx + 1));

// Menu Toggle
const menuBtn = document.getElementById('menuBtn');
menuBtn.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

// Keyboard Controls
window.addEventListener('keydown', (e) => {
  if (document.querySelector('dialog[open]')) return;
  const k = e.key.toLowerCase();
  if (k === 'w' || e.key === 'ArrowUp') { keys.up = true; e.preventDefault(); }
  if (k === 's' || e.key === 'ArrowDown') { keys.down = true; e.preventDefault(); }
  if (k === 'a' || e.key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
  if (k === 'd' || e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
  if (e.code === 'Space') { keys.brake = true; e.preventDefault(); }
  if (k === 'r') loadBay(currentBayIdx);
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || e.key === 'ArrowUp') keys.up = false;
  if (k === 's' || e.key === 'ArrowDown') keys.down = false;
  if (k === 'a' || e.key === 'ArrowLeft') keys.left = false;
  if (k === 'd' || e.key === 'ArrowRight') keys.right = false;
  if (e.code === 'Space') keys.brake = false;
});

// On-Screen Touch / Pointer Driving Pad
function bindPadBtn(id, keyProp) {
  const el = document.getElementById(id);
  const on = (e) => { e.preventDefault(); keys[keyProp] = true; el.classList.add('active'); };
  const off = () => { keys[keyProp] = false; el.classList.remove('active'); };
  el.addEventListener('pointerdown', on);
  window.addEventListener('pointerup', off);
  el.addEventListener('pointerleave', off);
}
bindPadBtn('btnLeft', 'left');
bindPadBtn('btnRight', 'right');
bindPadBtn('btnGas', 'up');
bindPadBtn('btnRev', 'down');

// Main Animation Loop
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  updatePhysics(dt);
  drawScene();
  requestAnimationFrame(loop);
}

buildDock();
loadBay(0);
resizeCanvas();
requestAnimationFrame(loop);
