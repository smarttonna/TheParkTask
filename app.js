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
// 2. PROCEDURAL WEBAUDIO: ENGINE IDLE/THROTTLE, REVERSE WHINE, RADAR & UI SFX
// ==========================================================================
class ParkingAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastBeepTime = 0;
    this.engineStarted = false;
    this.engineOsc = null;
    this.engineSub = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.revOsc = null;
    this.revGain = null;
  }

  init() {
    if (!this.ctx && typeof AudioContext !== 'undefined') {
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.ctx && !this.engineStarted) {
      this.startEngineNodes();
    }
  }

  startEngineNodes() {
    this.engineStarted = true;
    const t = this.ctx.currentTime;

    // Warm low-pass filtered engine sawtooth + sub-harmonic sine
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(180, t);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, t);

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(46, t);

    this.engineSub = this.ctx.createOscillator();
    this.engineSub.type = 'sine';
    this.engineSub.frequency.setValueAtTime(23, t);

    this.engineOsc.connect(this.engineFilter);
    this.engineSub.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc.start(t);
    this.engineSub.start(t);

    // Subtle transmission reverse whine
    this.revGain = this.ctx.createGain();
    this.revGain.gain.setValueAtTime(0, t);
    this.revOsc = this.ctx.createOscillator();
    this.revOsc.type = 'sine';
    this.revOsc.frequency.setValueAtTime(340, t);
    this.revOsc.connect(this.revGain);
    this.revGain.connect(this.ctx.destination);
    this.revOsc.start(t);
  }

  updateEngine(speed, isAccelerating) {
    if (!this.ctx || !this.engineStarted) return;
    const t = this.ctx.currentTime;
    if (!this.enabled) {
      this.engineGain.gain.setTargetAtTime(0, t, 0.05);
      this.revGain.gain.setTargetAtTime(0, t, 0.05);
      return;
    }

    const ratio = Math.min(1, Math.abs(speed) / 175);
    const rpmHz = 44 + ratio * 68 + (isAccelerating ? 10 : 0);
    this.engineOsc.frequency.setTargetAtTime(rpmHz, t, 0.06);
    this.engineSub.frequency.setTargetAtTime(rpmHz * 0.5, t, 0.06);
    this.engineFilter.frequency.setTargetAtTime(160 + ratio * 240, t, 0.08);
    this.engineGain.gain.setTargetAtTime(0.028 + ratio * 0.045, t, 0.08);

    // Reverse transmission whine when moving backwards
    if (speed < -6) {
      this.revOsc.frequency.setTargetAtTime(330 + ratio * 180, t, 0.06);
      this.revGain.gain.setTargetAtTime(0.012 + ratio * 0.018, t, 0.06);
    } else {
      this.revGain.gain.setTargetAtTime(0, t, 0.06);
    }
  }

  setEnabled(val) {
    this.enabled = val;
    if (!val && this.ctx && this.engineStarted) {
      const t = this.ctx.currentTime;
      this.engineGain.gain.setTargetAtTime(0, t, 0.04);
      this.revGain.gain.setTargetAtTime(0, t, 0.04);
    } else if (val) {
      this.init();
      this.playUiClick();
    }
  }

  playGearShift() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.045);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.055);
  }

  playUiClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(760, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.03);
    gain.gain.setValueAtTime(0.045, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
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
      const diff = (num - 1) / 107;
      const tight = Math.round(diff * 6);
      const colorA = carColors[(num + 1) % carColors.length];
      const colorB = carColors[(num + 4) % carColors.length];

      // 12 distinct parking archetypes × 4 spatial mirror/flip variations + lateral shift
      const pattern = (num - 1) % 12;
      const flipY = num >= 4 && num % 2 === 0 ? -1 : 1;
      const flipX = num >= 4 && Math.floor((num - 1) / 3) % 2 === 1 ? -1 : 1;
      const shiftX = ((num * 7) % 5 - 2) * 10;

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
        // 0: 90° Reverse Bay Between Two Cars
        const bayX = 20;
        stage.start = { x: -200, y: 115, angle: 0 };
        stage.target = { x: bayX, y: -66, angle: -Math.PI / 2, w: 68 - tight, h: 120 - tight };
        stage.coachCue = `${name} ${surname}: Pull past the 90° bay in D, then reverse full-lock into the slot.`;
        stage.tip = `COACH TIP (${context}): Pivot around your rear axle as soon as your rear bumper passes the adjacent vehicle.`;
        stage.obstacles = [
          { x: 0, y: -142, w: 500, h: 20, type: 'curb' },
          { x: bayX - (80 - tight / 2), y: -66, w: 48, h: 98, type: 'car', color: colorA },
          { x: bayX + (80 - tight / 2), y: -66, w: 48, h: 98, type: 'car', color: colorB },
          { x: -225, y: -66, w: 48, h: 98, type: 'car', color: '#2b303a' }
        ];
        stage.demoSegments = [
          { to: { x: bayX + 88, y: 108, angle: 0.18 }, gear: 'D', cue: 'DEMO [1/2] · Shift D: Pull forward past the bay to the pivot point…' },
          { to: { x: bayX, y: 14, angle: -Math.PI / 2 }, leadStraight: { x: bayX, y: -66, angle: -Math.PI / 2 }, gear: 'R', cue: 'DEMO [2/2] · Shift R: Turn wheel to lock, then straighten to 0° inside the bay.' }
        ];
      } else if (pattern === 1) {
        // 1: Curbside Parallel Pocket
        const gap = 144 - tight;
        stage.start = { x: 125, y: -8, angle: 0 };
        stage.target = { x: 0, y: -76, angle: 0, w: 58 - Math.round(tight / 2), h: 126 - tight };
        stage.coachCue = `${name} ${surname}: Parallel park between the 2 cars — shift R, S-curve into slot, then straighten.`;
        stage.tip = `COACH TIP (${context}): Wait until your front bumper clears the lead car before counter-steering.`;
        stage.obstacles = [
          { x: 0, y: -132, w: 520, h: 24, type: 'curb' },
          { x: -gap, y: -76, w: 100, h: 48, type: 'car', color: colorA },
          { x: gap, y: -76, w: 100, h: 48, type: 'car', color: colorB }
        ];
        stage.demoSegments = [
          { to: { x: -16, y: -76, angle: 0 }, gear: 'R', cue: 'DEMO [1/2] · Shift R: S-curve reverse smoothly into the parallel curb pocket…' },
          { to: { x: 0, y: -76, angle: 0 }, gear: 'D', cue: 'DEMO [2/2] · Shift D: Pull forward to center cleanly between both cars.' }
        ];
      } else if (pattern === 2) {
        // 2: 90° Blind Pillar Corner Alley
        stage.start = { x: -185, y: 122, angle: 0 };
        stage.target = { x: 132, y: -56, angle: -Math.PI / 2, w: 66 - Math.round(tight / 2), h: 118 - tight };
        stage.coachCue = `${name} ${surname}: Swing past the concrete pillar in D, then reverse straight into the corner bay.`;
        stage.tip = `COACH TIP (${context}): Turning too early around a pillar clips the rear quarter panel.`;
        stage.obstacles = [
          { x: 132, y: -138, w: 190, h: 22, type: 'wall' },
          { x: 212, y: -35, w: 24, h: 220, type: 'wall' },
          { x: 30 + Math.round(tight / 2), y: -44, w: 44, h: 96, type: 'pillar' },
          { x: -80, y: 190, w: 540, h: 22, type: 'curb' }
        ];
        stage.demoSegments = [
          { to: { x: 132, y: 78, angle: -Math.PI / 2 }, gear: 'D', cue: 'DEMO [1/2] · Shift D: Drive past the pillar and align with the corner alley…' },
          { to: { x: 132, y: -12, angle: -Math.PI / 2 }, leadStraight: { x: 132, y: -56, angle: -Math.PI / 2 }, gear: 'R', cue: 'DEMO [2/2] · Shift R: Reverse straight into the corner bay.' }
        ];
      } else if (pattern === 3) {
        // 3: 45° Angled Diagonal Reverse
        stage.start = { x: -195, y: 105, angle: 0 };
        stage.target = { x: 45, y: -62, angle: Math.PI / 4, w: 68 - tight, h: 120 - tight };
        stage.coachCue = `${name} ${surname}: Pull forward past the 45° slot, then reverse smoothly at an angle.`;
        stage.tip = `COACH TIP (${context}): Diagonal slots need smooth 18–22° lock rather than full lock.`;
        stage.obstacles = [
          { x: 0, y: -148, w: 480, h: 20, type: 'curb' },
          { x: -62 + Math.round(tight / 2), y: -62, w: 96, h: 46, angle: Math.PI / 4, type: 'car', color: colorA },
          { x: 152 - Math.round(tight / 2), y: -62, w: 96, h: 46, angle: Math.PI / 4, type: 'car', color: colorB },
          { x: 0, y: 176, w: 480, h: 20, type: 'curb' }
        ];
        stage.demoSegments = [
          { to: { x: 152, y: 78, angle: 0.32 }, gear: 'D', cue: 'DEMO [1/2] · Shift D: Pull past the 45° diagonal bay…' },
          { to: { x: 75, y: -32, angle: Math.PI / 4 }, leadStraight: { x: 45, y: -62, angle: Math.PI / 4 }, gear: 'R', cue: 'DEMO [2/2] · Shift R: Half-lock steer into the 45° diagonal slot.' }
        ];
      } else if (pattern === 4) {
        // 4: S-Curve Cone Chicane Back-In
        stage.start = { x: -230, y: 70, angle: Math.PI };
        stage.target = { x: 205, y: -45, angle: Math.PI, w: 66 - Math.round(tight / 2), h: 120 - tight };
        stage.coachCue = `${name} ${surname}: Shift to R and weave through the two cone gates into the end bay.`;
        stage.tip = `COACH TIP (${context}): Keep speed under 10 km/h when threading tight bollards in reverse.`;
        stage.obstacles = [
          { x: -60, y: -52, r: 13, type: 'cone' },
          { x: -60, y: 82, r: 13, type: 'cone' },
          { x: 75, y: -118, r: 13, type: 'cone' },
          { x: 75, y: 16, r: 13, type: 'cone' },
          { x: 304, y: -45, w: 22, h: 180, type: 'wall' },
          { x: 0, y: -158, w: 620, h: 20, type: 'curb' },
          { x: 0, y: 168, w: 620, h: 20, type: 'curb' }
        ];
        stage.demoSegments = [
          { to: { x: -55, y: 16, angle: Math.PI - 0.36 }, gear: 'R', cue: 'DEMO [1/2] · Shift R: Guide rear axle through the first cone gate…' },
          { to: { x: 148, y: -45, angle: Math.PI }, leadStraight: { x: 205, y: -45, angle: Math.PI }, gear: 'R', cue: 'DEMO [2/2] · Shift R: Counter-steer through second gate and straighten into bay.' }
        ];
      } else if (pattern === 5) {
        // 5: Twin-Pillar Garage Squeeze
        stage.start = { x: -200, y: 120, angle: 0 };
        stage.target = { x: 10, y: -68, angle: -Math.PI / 2, w: 66 - tight, h: 118 - tight };
        stage.coachCue = `${name} ${surname}: Thread between the twin concrete columns — watch front bumper swing!`;
        stage.tip = `COACH TIP (${context}): Align straight with the column gap before backing into the garage bay.`;
        stage.obstacles = [
          { x: 0, y: -144, w: 500, h: 22, type: 'wall' },
          { x: -64 + Math.round(tight / 2), y: -32, w: 32, h: 48, type: 'pillar' },
          { x: 84 - Math.round(tight / 2), y: -32, w: 32, h: 48, type: 'pillar' },
          { x: -144, y: -68, w: 48, h: 98, type: 'car', color: colorA },
          { x: 164, y: -68, w: 48, h: 98, type: 'car', color: colorB },
          { x: 0, y: 186, w: 500, h: 22, type: 'curb' }
        ];
        stage.demoSegments = [
          { to: { x: 96, y: 112, angle: 0.18 }, gear: 'D', cue: 'DEMO [1/2] · Shift D: Pull past the twin garage columns…' },
          { to: { x: 10, y: 14, angle: -Math.PI / 2 }, leadStraight: { x: 10, y: -68, angle: -Math.PI / 2 }, gear: 'R', cue: 'DEMO [2/2] · Shift R: Line up straight between the pillars and back in.' }
        ];
      } else if (pattern === 6) {
        // 6: Forward 90° Swing-In Bay
        stage.start = { x: -205, y: 96, angle: 0 };
        stage.target = { x: 35, y: -64, angle: -Math.PI / 2, w: 68 - tight, h: 120 - tight };
        stage.coachCue = `${name} ${surname}: Swing wide in D and turn 90° forward directly into the bay.`;
        stage.tip = `COACH TIP (${context}): When pulling forward into a 90° bay, swing wide first so your rear inside wheel clears the corner car.`;
        stage.obstacles = [
          { x: 0, y: -142, w: 500, h: 20, type: 'curb' },
          { x: 35 - (80 - tight / 2), y: -64, w: 48, h: 98, type: 'car', color: colorA },
          { x: 35 + (80 - tight / 2), y: -64, w: 48, h: 98, type: 'car', color: colorB },
          { x: -40, y: 175, w: 480, h: 20, type: 'curb' }
        ];
        stage.demoSegments = [
          { to: { x: 35, y: -12, angle: -Math.PI / 2 }, leadStraight: { x: 35, y: -64, angle: -Math.PI / 2 }, gear: 'D', cue: 'DEMO [1/1] · Shift D: Swing wide in the aisle and turn 90° forward into the bay.' }
        ];
      } else if (pattern === 7) {
        // 7: Forward 60° Herringbone Commuter Slot
        stage.start = { x: -210, y: 82, angle: 0 };
        stage.target = { x: 30, y: -58, angle: -Math.PI / 3, w: 68 - tight, h: 120 - tight };
        stage.coachCue = `${name} ${surname}: Drive forward in D into the 60° angled commuter bay.`;
        stage.tip = `COACH TIP (${context}): Angled one-way commuter slots allow a smooth single-arc forward entry.`;
        stage.obstacles = [
          { x: 0, y: -146, w: 500, h: 20, type: 'curb' },
          { x: -64 + Math.round(tight / 2), y: -58, w: 96, h: 46, angle: -Math.PI / 3, type: 'car', color: colorA },
          { x: 124 - Math.round(tight / 2), y: -58, w: 96, h: 46, angle: -Math.PI / 3, type: 'car', color: colorB },
          { x: 0, y: 170, w: 500, h: 20, type: 'curb' }
        ];
        stage.demoSegments = [
          { to: { x: 4, y: -13, angle: -Math.PI / 3 }, leadStraight: { x: 30, y: -58, angle: -Math.PI / 3 }, gear: 'D', cue: 'DEMO [1/1] · Shift D: Sweep smoothly into the 60° herringbone slot.' }
        ];
      } else if (pattern === 8) {
        // 8: Cul-de-Sac 3-Point Turn / K-Turn Escape Bay
        stage.start = { x: -125, y: -64, angle: 0 };
        stage.target = { x: -95, y: 82, angle: Math.PI, w: 62 - Math.round(tight / 2), h: 124 - tight };
        stage.coachCue = `${name} ${surname}: Execute a 3-point K-turn (D → R → D) in the dead-end to park facing out.`;
        stage.tip = `COACH TIP (${context}): Use full lock in D, counter-steer full lock in R, then drive straight into the exit bay.`;
        stage.obstacles = [
          { x: 0, y: -138, w: 520, h: 22, type: 'wall' },
          { x: 252, y: 0, w: 24, h: 290, type: 'wall' },
          { x: 0, y: 148, w: 520, h: 22, type: 'curb' },
          { x: 135, y: -76, w: 98, h: 46, type: 'car', color: colorA }
        ];
        stage.demoSegments = [
          { to: { x: 32, y: -16, angle: 0.65 }, gear: 'D', cue: 'DEMO [1/3] · Shift D: Turn right toward the cul-de-sac turnaround…' },
          { to: { x: 128, y: 56, angle: 2.35 }, gear: 'R', cue: 'DEMO [2/3] · Shift R: Counter-steer in Reverse to rotate the car…' },
          { to: { x: -48, y: 82, angle: Math.PI }, leadStraight: { x: -95, y: 82, angle: Math.PI }, gear: 'D', cue: 'DEMO [3/3] · Shift D: Drive straight into the exit bay.' }
        ];
      } else if (pattern === 9) {
        // 9: Offset Loading-Dock S-Reverse
        stage.start = { x: -185, y: -55, angle: Math.PI };
        stage.target = { x: 175, y: 68, angle: Math.PI, w: 66 - Math.round(tight / 2), h: 122 - tight };
        stage.coachCue = `${name} ${surname}: Shift R and execute a wide S-bend reverse into the recessed loading dock.`;
        stage.tip = `COACH TIP (${context}): Start your counter-steer halfway across the yard so your trailer/rear lines up square with the dock.`;
        stage.obstacles = [
          { x: 0, y: -140, w: 560, h: 20, type: 'curb' },
          { x: 0, y: 148, w: 560, h: 20, type: 'curb' },
          { x: 278, y: 68, w: 22, h: 140, type: 'wall' },
          { x: 175, y: -20, w: 98, h: 46, type: 'car', color: colorA },
          { x: -15, y: 58, r: 13, type: 'cone' }
        ];
        stage.demoSegments = [
          { to: { x: 125, y: 68, angle: Math.PI }, leadStraight: { x: 175, y: 68, angle: Math.PI }, gear: 'R', cue: 'DEMO [1/1] · Shift R: S-bend reverse across the yard and straighten into the dock.' }
        ];
      } else if (pattern === 10) {
        // 10: Central Island Turnaround Bay
        stage.start = { x: -190, y: 98, angle: 0 };
        stage.target = { x: -95, y: -76, angle: 0, w: 62 - Math.round(tight / 2), h: 122 - tight };
        stage.coachCue = `${name} ${surname}: Drive around the central island in D, then back into the upper pocket.`;
        stage.tip = `COACH TIP (${context}): Give the central island pillar plenty of inside clearance before shifting to Reverse.`;
        stage.obstacles = [
          { x: 0, y: -138, w: 540, h: 20, type: 'curb' },
          { x: 0, y: 162, w: 540, h: 20, type: 'curb' },
          { x: -20, y: 24, w: 68, h: 40, type: 'pillar' },
          { x: 125, y: -76, w: 96, h: 46, type: 'car', color: colorB }
        ];
        stage.demoSegments = [
          { to: { x: 132, y: 72, angle: -Math.PI / 3 }, gear: 'D', cue: 'DEMO [1/2] · Shift D: Sweep wide around the central courtyard island…' },
          { to: { x: -35, y: -76, angle: 0 }, leadStraight: { x: -95, y: -76, angle: 0 }, gear: 'R', cue: 'DEMO [2/2] · Shift R: Curve above the island and straighten into the bay.' }
        ];
      } else {
        // 11: Double-Row Lot Aisle Back-In
        stage.start = { x: -215, y: 36, angle: 0 };
        stage.target = { x: -35, y: -72, angle: -Math.PI / 2, w: 66 - tight, h: 118 - tight };
        stage.coachCue = `${name} ${surname}: Thread the two-sided aisle in D, then back 90° into the upper row.`;
        stage.tip = `COACH TIP (${context}): Watch both your front bumper swing against the bottom row and rear corners entering the slot.`;
        stage.obstacles = [
          { x: -35 - (82 - tight / 2), y: -72, w: 48, h: 98, type: 'car', color: colorA },
          { x: -35 + (82 - tight / 2), y: -72, w: 48, h: 98, type: 'car', color: colorB },
          { x: 122, y: -72, w: 48, h: 98, type: 'car', color: '#2b303a' },
          { x: -125, y: 138, w: 96, h: 46, type: 'car', color: colorB },
          { x: 85, y: 138, w: 96, h: 46, type: 'car', color: colorA }
        ];
        stage.demoSegments = [
          { to: { x: 58, y: 46, angle: 0.14 }, gear: 'D', cue: 'DEMO [1/2] · Shift D: Advance down the double-row aisle past the target slot…' },
          { to: { x: -35, y: 12, angle: -Math.PI / 2 }, leadStraight: { x: -35, y: -72, angle: -Math.PI / 2 }, gear: 'R', cue: 'DEMO [2/2] · Shift R: Pivot 90° into the row and straighten wheels.' }
        ];
      }

      // Apply spatial variation (flipX, flipY, shiftX) so every stage 1..108 has a distinct layout
      const txX = (x) => (x + shiftX) * flipX;
      const txY = (y) => y * flipY;
      const txAngle = (a) => Math.atan2(Math.sin(a) * flipY, Math.cos(a) * flipX);

      stage.start = {
        x: txX(stage.start.x),
        y: txY(stage.start.y),
        angle: txAngle(stage.start.angle)
      };
      stage.target = {
        ...stage.target,
        x: txX(stage.target.x),
        y: txY(stage.target.y),
        angle: txAngle(stage.target.angle)
      };
      stage.obstacles = stage.obstacles.map((obs) => ({
        ...obs,
        x: txX(obs.x),
        y: txY(obs.y),
        angle: obs.angle ? obs.angle * flipX * flipY : 0
      }));
      stage.demoSegments = stage.demoSegments.map((seg) => ({
        ...seg,
        to: {
          x: txX(seg.to.x),
          y: txY(seg.to.y),
          angle: txAngle(seg.to.angle)
        },
        leadStraight: seg.leadStraight
          ? {
              x: txX(seg.leadStraight.x),
              y: txY(seg.leadStraight.y),
              angle: txAngle(seg.leadStraight.angle)
            }
          : null
      }));

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
const STAR_STORAGE_KEY = 'theparktask_stars_v1';
const ANALYTICS_STORAGE_KEY = 'theparktask_analytics_v1';
const VISITOR_ID_KEY = 'theparktask_visitor_id_v1';

// Load Vercel Web Analytics automatically when hosted on a public domain (avoids 404 on localhost)
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  window.va = window.va || function (...args) { (window.vaq = window.vaq || []).push(args); };
  const vaScript = document.createElement('script');
  vaScript.defer = true;
  vaScript.src = '/_vercel/insights/script.js';
  document.head.appendChild(vaScript);
}

class GameAnalytics {
  constructor() {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    this.visitorId = vid;
    const raw = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || 'null');
    this.data = raw || {
      visits: 0,
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
  }

  reloadFromStorage() {
    const raw = JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || 'null');
    if (raw && typeof raw === 'object') {
      this.data = { ...this.data, ...raw };
    }
  }

  save() {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(this.data));
  }

  ensureStage(bay) {
    if (!this.data.stages[bay.id]) {
      this.data.stages[bay.id] = {
        id: bay.id,
        name: `${bay.name} ${bay.surname}`,
        attempts: 0,
        clears: 0,
        collisions: 0,
        bestTime: null,
        stars: 0
      };
    }
    return this.data.stages[bay.id];
  }

  logEvent(label) {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    this.data.events.unshift({ ts, label });
    this.data.events = this.data.events.slice(0, 40);
  }

  trackVercel(eventName, props = {}) {
    if (typeof window.va === 'function') {
      try { window.va('event', { name: eventName, data: props }); } catch {}
    }
  }

  trackVisit() {
    this.reloadFromStorage();
    this.data.visits++;
    this.logEvent('Visitor session started (Parking Academy)');
    this.save();
    this.trackVercel('session_start', { page: 'parking' });
  }

  trackAttempt(bay) {
    this.reloadFromStorage();
    this.data.attempts++;
    const st = this.ensureStage(bay);
    st.attempts++;
    this.save();
    this.trackVercel('stage_attempt', { stage: bay.id, name: `${bay.name} ${bay.surname}` });
  }

  trackDemo(bay) {
    this.reloadFromStorage();
    this.data.demos++;
    const label = `Watched Auto-Demo on Stage ${bay.id} (${bay.name} ${bay.surname})`;
    this.logEvent(label);
    this.save();
    this.trackVercel('demo_watch', { stage: bay.id });
  }

  trackCollision(bay, obsName) {
    this.reloadFromStorage();
    this.data.collisions++;
    const st = this.ensureStage(bay);
    st.collisions++;
    const label = `Stage ${bay.id}: Bumped ${obsName}`;
    this.logEvent(label);
    this.save();
  }

  trackClear(bay, score, stars, timeSec) {
    this.reloadFromStorage();
    this.data.clears++;
    this.data.scoreSum += score;
    this.data.scoreCount++;
    const st = this.ensureStage(bay);
    st.clears++;
    st.stars = Math.max(st.stars || 0, stars);
    st.bestTime = st.bestTime === null ? timeSec : Math.min(st.bestTime, timeSec);
    const label = `Cleared Stage ${bay.id} (${bay.name} ${bay.surname}) · ${score}% · ${'★'.repeat(stars)} in ${timeSec}s`;
    this.logEvent(label);
    this.save();
    this.trackVercel('stage_clear', { stage: bay.id, score, stars, timeSec });
  }

  tickPlayTime(sec) {
    this.reloadFromStorage();
    this.data.totalPlaySec += sec;
    this.save();
  }

  getSnapshot() {
    this.reloadFromStorage();
    const avgScore = this.data.scoreCount > 0 ? Math.round(this.data.scoreSum / this.data.scoreCount) : 0;
    return {
      visits: this.data.visits,
      uniqueVisitors: this.data.uniqueVisitors || 1,
      totalPlaySec: this.data.totalPlaySec,
      attempts: this.data.attempts,
      clears: this.data.clears,
      demos: this.data.demos,
      collisions: this.data.collisions,
      arkanoidRuns: this.data.arkanoidRuns || 0,
      arkanoidHigh: this.data.arkanoidHigh || 0,
      avgScore,
      stages: this.data.stages,
      events: this.data.events,
      source: 'ADMIN UNLOCKED · VERCEL & BROWSER TELEMETRY'
    };
  }
}

const analytics = new GameAnalytics();
analytics.trackVisit();
setInterval(() => {
  if (!document.hidden) analytics.tickPlayTime(5);
}, 5000);
let clearedBays = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
let stageRatings = JSON.parse(localStorage.getItem(STAR_STORAGE_KEY) || '{}');
let currentBayIdx = 0;
let showGuides = true;
let bayCleared = false;
let bayPosState = 'outside'; // 'outside' | 'partial' | 'aligned' | 'passed'
let startTime = performance.now();
let collisions = 0;
let reversals = 0;
let lastGear = 'N';
let activeGear = 'D'; // 'P' | 'R' | 'D'
let lastCollisionBump = 0;
let holdTimer = 0;
let autoDemo = false;
let demoTime = 0;
let demoPlan = null;
let demoDone = false;
let hitObsRef = null;
let hitObsUntil = 0;

// Drive Recording & Replay State (allows user to replay their drive & see mistakes)
let driveHistory = [];
let driveMistakes = [];
let lastSavedDrive = null;
let isReplaying = false;
let replayTime = 0;
let replayPlan = null;
let lastReplaySampleAt = 0;
let lastCloseCallAt = 0;

function haptic(pattern) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch {}
  }
}

function setActiveGear(gear, silent = false) {
  const prevGear = activeGear;
  activeGear = gear;
  document.querySelectorAll('.gear-btn').forEach((btn) => {
    const isMatch = btn.dataset.gear === gear;
    btn.classList.toggle('on', isMatch);
    btn.setAttribute('aria-checked', String(isMatch));
  });
  if (gear === 'P') {
    CAR.speed = 0;
    document.getElementById('gearP')?.classList.remove('ready-to-park');
  }
  if (!silent && prevGear !== gear) {
    if (sfx.enabled) sfx.init();
    sfx.playGearShift();
    haptic(12);
  }
  // When user clicks [P] (or presses P) while in the target parking box, grade immediately!
  if (gear === 'P' && !silent && !bayCleared && !autoDemo && !isReplaying) {
    const bay = BAYS[currentBayIdx];
    if (bay) {
      checkParked(bay, 0.016, true);
      if (!bayCleared && bayPosState === 'outside') {
        setCoachCue('Drive into the parking box first, then click [P] PARK to grade.', 'warn');
      }
    }
  }
}

// Input state
const keys = { up: false, down: false, left: false, right: false, brake: false, gas: false };

function stopReplay(msg) {
  if (!isReplaying) return;
  isReplaying = false;
  document.getElementById('replayBtn')?.classList.remove('replay-on');
  document.getElementById('replayBtn')?.setAttribute('aria-pressed', 'false');
  if (msg) setCoachCue(msg, 'neutral');
}

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
  autoDemo = false;
  demoTime = 0;
  demoPlan = null;
  demoDone = false;
  isReplaying = false;
  replayTime = 0;
  replayPlan = null;
  driveHistory = [
    {
      t: 0,
      x: bay.start.x,
      y: bay.start.y,
      angle: bay.start.angle,
      steer: 0,
      speed: 0,
      gear: 'D',
      clearance: 80
    }
  ];
  driveMistakes = [];
  lastReplaySampleAt = performance.now();
  lastCloseCallAt = 0;
  hitObsRef = null;
  hitObsUntil = 0;
  document.getElementById('demoBtn')?.classList.remove('demo-on');
  document.getElementById('demoBtn')?.setAttribute('aria-pressed', 'false');
  document.getElementById('replayBtn')?.classList.remove('replay-on');
  document.getElementById('replayBtn')?.setAttribute('aria-pressed', 'false');
  document.getElementById('gearP')?.classList.remove('ready-to-park');
  setActiveGear('D', true);

  document.body.classList.remove('is-detail', 'bay-passed');
  document.getElementById('hudLevelKicker').textContent = `BAY ${bay.id} · ${bay.name.toUpperCase()} ${bay.surname.toUpperCase()}`;
  document.getElementById('dockTitle').innerHTML = `<b>${bay.id}</b>${bay.name} ${bay.surname}`;
  setCoachCue(bay.coachCue, 'neutral');

  analytics.trackAttempt(bay);
  updateDockUI();
  if (typeof syncChatStageUI === 'function') syncChatStageUI();
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
  const dxEdge = Math.abs(lx) - obs.w / 2;
  const dyEdge = Math.abs(ly) - obs.h / 2;
  if (dxEdge <= 0 && dyEdge <= 0) {
    return Math.max(dxEdge, dyEdge); // negative penetration depth inside solid obstacle
  }
  return Math.hypot(Math.max(dxEdge, 0), Math.max(dyEdge, 0));
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
  let nearestObs = null;
  for (const obs of bay.obstacles) {
    for (const pt of samples) {
      const d = pointToObsDist(pt.x, pt.y, obs);
      if (d < minDist) { minDist = d; nearestObs = obs; }
    }
    // Also check obstacle corners inside car
    if (obs.type !== 'cone') {
      const obsCorners = getRectCorners(obs.x, obs.y, obs.w, obs.h, obs.angle || 0);
      for (const oc of obsCorners) {
        const d = pointToObsDist(oc.x, oc.y, { x: carX, y: carY, w: CAR.length, h: CAR.width, angle: carAngle });
        if (d < minDist) { minDist = d; nearestObs = obs; }
      }
    }
  }
  return { dist: minDist, obs: nearestObs };
}

// Check if car is inside target bay — requires clicking [P] PARK (or pressing P) before grading!
function checkParked(bay, dt, forceParkClick = false) {
  const t = bay.target;
  const dx = CAR.x - t.x;
  const dy = CAR.y - t.y;
  const lx = dx * Math.cos(-t.angle) - dy * Math.sin(-t.angle);
  const ly = dx * Math.sin(-t.angle) + dy * Math.cos(-t.angle);

  const rawAngleDiff = Math.abs(Math.atan2(Math.sin(CAR.angle - t.angle), Math.cos(CAR.angle - t.angle)));
  const angleDiff = Math.min(rawAngleDiff, Math.abs(rawAngleDiff - Math.PI));
  const aligned = angleDiff < 0.18;
  const centered = Math.abs(lx) < (t.h - CAR.length) / 2 + 10 && Math.abs(ly) < (t.w - CAR.width) / 2 + 7;
  const insideRoughly = Math.abs(lx) < t.h / 2 + 12 && Math.abs(ly) < t.w / 2 + 10;
  const stopped = Math.abs(CAR.speed) < 14;
  const gearPBtn = document.getElementById('gearP');

  if (aligned && centered) {
    bayPosState = 'aligned';
    if (!bayCleared) gearPBtn?.classList.add('ready-to-park');
    if ((forceParkClick || activeGear === 'P') && stopped && !bayCleared) {
      gearPBtn?.classList.remove('ready-to-park');
      completeBay(bay, angleDiff, Math.hypot(lx, ly));
    } else {
      holdTimer = 0;
      setCoachCue('✓ Box is GREEN! Click [P] PARK (or press P) to lock brakes & grade your park.', 'ok');
    }
  } else if (insideRoughly) {
    bayPosState = 'partial';
    if (!bayCleared) gearPBtn?.classList.add('ready-to-park');
    if ((forceParkClick || activeGear === 'P') && stopped && !bayCleared) {
      gearPBtn?.classList.remove('ready-to-park');
      const degOff = Math.round(angleDiff * 57.3);
      const cmOff = Math.round(Math.hypot(lx, ly) * 4.5);
      driveMistakes.push({
        t: (performance.now() - startTime) / 1000,
        x: CAR.x,
        y: CAR.y,
        type: 'ALIGNMENT',
        label: `Parked Off-Center (${degOff}°, ${cmOff}cm)`,
        fix: `Mistake: Parked ${degOff}° crooked / ${cmOff}cm off-center. Correction: Straighten wheel to 0° and center inside the green box before clicking [P].`
      });
      completeBay(bay, angleDiff, Math.hypot(lx, ly));
    } else {
      holdTimer = 0;
      setCoachCue(
        aligned
          ? 'Inside bay — pull centered until box turns GREEN, then click [P] PARK to grade.'
          : 'Inside bay — straighten steering to align with lines, then click [P] PARK to grade.',
        'neutral'
      );
    }
  } else {
    bayPosState = 'outside';
    holdTimer = 0;
    gearPBtn?.classList.remove('ready-to-park');
  }
}

function saveCurrentDriveSnapshot() {
  if (driveHistory.length < 2) return;
  const lastSample = driveHistory[driveHistory.length - 1];
  lastSavedDrive = {
    bayIdx: currentBayIdx,
    bayId: BAYS[currentBayIdx]?.id || '001',
    samples: driveHistory.map((s) => ({ ...s })),
    mistakes: driveMistakes.map((m) => ({ ...m })),
    totalTime: Math.max(0.5, lastSample.t)
  };
}

function completeBay(bay, angleDiff, offsetPx) {
  bayCleared = true;
  bayPosState = 'passed';
  document.getElementById('gearP')?.classList.remove('ready-to-park');

  // Record final parked sample for Replay
  const finalRelT = Math.max(0.2, (performance.now() - startTime) / 1000);
  driveHistory.push({
    t: finalRelT,
    x: CAR.x,
    y: CAR.y,
    angle: CAR.angle,
    steer: CAR.steer,
    speed: 0,
    gear: 'P',
    clearance: getCarClearance(CAR.x, CAR.y, CAR.angle, bay).dist
  });
  saveCurrentDriveSnapshot();

  clearedBays.add(bay.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...clearedBays]));
  if (typeof syncAuthUI === 'function') syncAuthUI();

  const stars = collisions === 0 && reversals <= 3 && angleDiff < 0.18 ? 3 : collisions <= 1 ? 2 : 1;
  const clearTimeSec = Math.round((performance.now() - startTime) / 100) / 10;
  const prev = stageRatings[bay.id];
  stageRatings[bay.id] = {
    stars: Math.max(stars, prev?.stars || 0),
    bestTime: prev?.bestTime ? Math.min(clearTimeSec, prev.bestTime) : clearTimeSec
  };
  localStorage.setItem(STAR_STORAGE_KEY, JSON.stringify(stageRatings));

  document.body.classList.add('bay-passed');
  const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('passSignTitle').textContent = `${starStr} · STAGE ${bay.id} GRADED`;
  sfx.playSuccess();
  haptic([25, 35, 55]);
  updateDockUI();
  renderStagesModal();

  const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(1);
  const alignPct = Math.max(55, Math.round(100 - angleDiff * 140 - offsetPx * 0.6));
  const penalty = collisions * 12;
  const finalScore = Math.max(45, Math.min(100, alignPct - penalty));
  const grade = finalScore >= 94 ? 'A+' : finalScore >= 86 ? 'A' : finalScore >= 75 ? 'B' : 'C';
  analytics.trackClear(bay, finalScore, stars, clearTimeSec);

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
    collisions === 0 && driveMistakes.length === 0
      ? 'Clean entry with zero curb or bumper contact. Click "REPLAY MY DRIVE" below to review your exact trajectory.'
      : `Recorded ${driveMistakes.length} mistake(s) / close call(s). Click "REPLAY MY DRIVE" below to see your exact mistake points and how to correct them!`;
  document.getElementById('shTip').innerHTML = `<b>${bay.tip.split(':')[0]}:</b>${bay.tip.split(':').slice(1).join(':')}`;

  document.body.classList.add('is-detail');
}

// ==========================================================================
// 6. PHYSICS UPDATE LOOP, AUTO-DEMO & USER DRIVE REPLAY
// ==========================================================================
let lastTime = performance.now();

function stopAutoDemo(msg) {
  if (!autoDemo) return;
  autoDemo = false;
  keys.brake = false;
  document.getElementById('demoBtn')?.classList.remove('demo-on');
  document.getElementById('demoBtn')?.setAttribute('aria-pressed', 'false');
  if (msg) setCoachCue(msg, 'ok');
}

function startReplay() {
  if (isReplaying) {
    stopReplay('Replay stopped — you have manual control.');
    return;
  }
  if (autoDemo) stopAutoDemo();

  // Save latest ongoing drive samples if user clicks Replay mid-drive
  if (driveHistory.length >= 2) {
    saveCurrentDriveSnapshot();
  }

  const bay = BAYS[currentBayIdx];
  let source =
    lastSavedDrive && lastSavedDrive.bayIdx === currentBayIdx && lastSavedDrive.samples.length >= 2
      ? lastSavedDrive
      : null;

  if (!source) {
    // If user clicks Replay before driving far, create an instant diagnostic preview from current pose
    const nowClear = getCarClearance(CAR.x, CAR.y, CAR.angle, bay).dist;
    source = {
      bayIdx: currentBayIdx,
      bayId: bay.id,
      samples: [
        { t: 0, x: bay.start.x, y: bay.start.y, angle: bay.start.angle, steer: 0, speed: 0, gear: 'D', clearance: nowClear },
        { t: 1.2, x: CAR.x, y: CAR.y, angle: CAR.angle, steer: CAR.steer, speed: 0, gear: activeGear, clearance: nowClear }
      ],
      mistakes: [...driveMistakes],
      totalTime: 1.2
    };
  }

  // Normalize timestamps so stationary pauses don't make replay sluggish
  const normSamples = [];
  let accumT = 0;
  for (let i = 0; i < source.samples.length; i++) {
    const s = source.samples[i];
    if (i > 0) {
      const prev = source.samples[i - 1];
      const dtRaw = Math.max(0.02, Math.min(0.25, s.t - prev.t));
      accumT += dtRaw;
    }
    normSamples.push({ ...s, t: accumT });
  }

  const idealPlan = buildDemoTrajectory(bay);
  replayPlan = {
    samples: normSamples,
    mistakes: source.mistakes || [],
    idealSamples: idealPlan.samples || [],
    totalTime: Math.max(0.8, accumT)
  };

  // Hide telemetry sheet so canvas replay is fully visible
  document.body.classList.remove('is-detail', 'bay-passed');
  bayCleared = false;
  isReplaying = true;
  replayTime = 0;
  document.getElementById('replayBtn')?.classList.add('replay-on');
  document.getElementById('replayBtn')?.setAttribute('aria-pressed', 'true');

  const mistakeCount = replayPlan.mistakes.length;
  setCoachCue(
    mistakeCount > 0
      ? `REPLAYING YOUR DRIVE · Reviewing ${mistakeCount} mistake(s) vs. Ideal Green Line…`
      : 'REPLAYING YOUR DRIVE · Clean run! Comparing your path against the Ideal Reference Line…',
    mistakeCount > 0 ? 'warn' : 'ok'
  );
}

function stepReplay(dt, bay) {
  if (!replayPlan || !replayPlan.samples.length) {
    stopReplay();
    return;
  }
  replayTime += dt;
  const list = replayPlan.samples;
  if (replayTime >= replayPlan.totalTime) {
    const last = list[list.length - 1];
    CAR.x = last.x;
    CAR.y = last.y;
    CAR.angle = last.angle;
    CAR.steer = last.steer || 0;
    CAR.speed = 0;
    setActiveGear(last.gear || 'P', true);
    const mCount = replayPlan.mistakes.length;
    const summaryMsg =
      mCount > 0
        ? `REPLAY COMPLETE · ${mCount} mistake(s) highlighted on lot: ${replayPlan.mistakes[mCount - 1].fix}`
        : 'REPLAY COMPLETE · Zero collisions or close calls! Click [P] inside box to grade or (↺) to retry.';
    stopReplay(summaryMsg);
    return;
  }

  let idx = 0;
  while (idx < list.length - 2 && list[idx + 1].t < replayTime) idx++;
  const a = list[idx];
  const b = list[idx + 1] || a;
  const span = Math.max(0.0001, b.t - a.t);
  const u = Math.max(0, Math.min(1, (replayTime - a.t) / span));

  CAR.x = a.x + (b.x - a.x) * u;
  CAR.y = a.y + (b.y - a.y) * u;
  const dAng = Math.atan2(Math.sin(b.angle - a.angle), Math.cos(b.angle - a.angle));
  CAR.angle = a.angle + dAng * u;
  CAR.steer = (a.steer || 0) + ((b.steer || 0) - (a.steer || 0)) * u;
  CAR.speed = (a.speed || 0) + ((b.speed || 0) - (a.speed || 0)) * u;
  setActiveGear(b.gear || 'D', true);

  // Check if replay is passing near a recorded mistake to show live correction tip
  const activeMistake = replayPlan.mistakes.find((m) => Math.hypot(CAR.x - m.x, CAR.y - m.y) < 36);
  if (activeMistake) {
    setCoachCue(`⚠ ${activeMistake.fix}`, 'warn');
  }
}

function buildDemoTrajectory(bay) {
  const samples = [];
  const pivots = [];
  let cur = { x: bay.start.x, y: bay.start.y, angle: bay.start.angle };
  let tAccum = 0;
  const segs = bay.demoSegments || [];

  const pushArc = (p0, p1, gear, cue, isStraight = false) => {
    const dir = gear === 'R' ? -1 : 1;
    const distChord = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const steps = Math.max(24, Math.round(distChord * 0.9));
    const t0x = dir * Math.cos(p0.angle);
    const t0y = dir * Math.sin(p0.angle);
    const t1x = dir * Math.cos(p1.angle);
    const t1y = dir * Math.sin(p1.angle);
    const m = distChord * 0.86;

    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      if (isStraight) {
        pts.push({
          x: p0.x + (p1.x - p0.x) * u,
          y: p0.y + (p1.y - p0.y) * u,
          angle: p1.angle,
          u
        });
      } else {
        const h00 = 2 * u * u * u - 3 * u * u + 1;
        const h10 = u * u * u - 2 * u * u + u;
        const h01 = -2 * u * u * u + 3 * u * u;
        const h11 = u * u * u - u * u;
        const x = h00 * p0.x + h10 * m * t0x + h01 * p1.x + h11 * m * t1x;
        const y = h00 * p0.y + h10 * m * t0y + h01 * p1.y + h11 * m * t1y;

        // Exact derivative for tangent heading
        const dh00 = 6 * u * u - 6 * u;
        const dh10 = 3 * u * u - 4 * u + 1;
        const dh01 = -6 * u * u + 6 * u;
        const dh11 = 3 * u * u - 2 * u;
        const dx = dh00 * p0.x + dh10 * m * t0x + dh01 * p1.x + dh11 * m * t1x;
        const dy = dh00 * p0.y + dh10 * m * t0y + dh01 * p1.y + dh11 * m * t1y;
        const angle = i === 0 ? p0.angle : i === steps ? p1.angle : (dir > 0 ? Math.atan2(dy, dx) : Math.atan2(-dy, -dx));
        pts.push({ x, y, angle, u });
      }
    }

    const nomSpeed = isStraight ? 56 : gear === 'R' ? 68 : 82;
    for (let i = 0; i < pts.length; i++) {
      const curr = pts[i];
      const next = pts[Math.min(pts.length - 1, i + 1)];
      const prev = pts[Math.max(0, i - 1)];
      const ds = Math.max(0.5, Math.hypot(next.x - prev.x, next.y - prev.y));
      const dTheta = Math.atan2(Math.sin(next.angle - prev.angle), Math.cos(next.angle - prev.angle));
      const kappa = (dir * dTheta) / ds;
      const steer = isStraight ? 0 : Math.max(-CAR.maxSteer, Math.min(CAR.maxSteer, Math.atan(kappa * CAR.wheelbase)));

      // Smooth ease-in / ease-out speed profile
      const env = Math.sin(Math.PI * Math.max(0.12, Math.min(0.88, curr.u)));
      const spd = dir * nomSpeed * (0.55 + 0.45 * env);
      const stepDist = i > 0 ? Math.hypot(curr.x - pts[i - 1].x, curr.y - pts[i - 1].y) : 0;
      tAccum += stepDist / Math.max(24, Math.abs(spd));

      samples.push({
        t: tAccum,
        x: curr.x,
        y: curr.y,
        angle: curr.angle,
        steer,
        speed: spd,
        gear,
        cue
      });
    }
  };

  segs.forEach((seg, idx) => {
    if (idx > 0) {
      pivots.push({ x: cur.x, y: cur.y, gear: seg.gear });
      // Brief instructor pause at gear shift / pivot point
      tAccum += 0.35;
      samples.push({
        t: tAccum,
        x: cur.x,
        y: cur.y,
        angle: cur.angle,
        steer: 0,
        speed: 0,
        gear: seg.gear,
        cue: seg.cue
      });
    }
    pushArc(cur, seg.to, seg.gear, seg.cue, false);
    cur = { ...seg.to };
    if (seg.leadStraight) {
      pushArc(
        cur,
        seg.leadStraight,
        seg.gear,
        'DEMO · Straighten wheel to 0° and glide into the center of the bay.',
        true
      );
      cur = { ...seg.leadStraight };
    }
  });

  // Final parked lock at exact target center with 0° wheel angle
  samples.push({
    t: tAccum + 0.05,
    x: bay.target.x,
    y: bay.target.y,
    angle: bay.target.angle,
    steer: 0,
    speed: 0,
    gear: 'P',
    cue: 'PERFECT PARK (100% ALIGNED) — Tap Reset (↺) to practice this maneuver!'
  });

  return { samples, pivots, totalTime: tAccum + 0.05 };
}

function startAutoDemo() {
  if (autoDemo) {
    stopAutoDemo('Demo paused — you have manual control.');
    return;
  }
  loadBay(currentBayIdx);
  const bay = BAYS[currentBayIdx];
  analytics.trackDemo(bay);
  demoPlan = buildDemoTrajectory(bay);
  demoTime = 0;
  autoDemo = true;
  demoDone = false;
  if (sfx.enabled) sfx.init();
  document.getElementById('demoBtn')?.classList.add('demo-on');
  document.getElementById('demoBtn')?.setAttribute('aria-pressed', 'true');
  if (demoPlan.samples[0]?.cue) setCoachCue(demoPlan.samples[0].cue, 'neutral');
}

function stepAutoDemo(dt, bay) {
  if (!demoPlan || !demoPlan.samples.length) {
    stopAutoDemo();
    return;
  }
  demoTime += dt;
  const list = demoPlan.samples;
  if (demoTime >= demoPlan.totalTime) {
    const last = list[list.length - 1];
    CAR.x = last.x;
    CAR.y = last.y;
    CAR.angle = last.angle;
    CAR.steer = 0;
    CAR.speed = 0;
    setActiveGear('P', true);
    bayPosState = 'aligned';
    if (!demoDone) {
      demoDone = true;
      sfx.playSuccess();
      stopAutoDemo(last.cue);
    }
    return;
  }

  // Find current sample along trajectory
  let idx = 0;
  while (idx < list.length - 2 && list[idx + 1].t < demoTime) idx++;
  const a = list[idx];
  const b = list[idx + 1] || a;
  const span = Math.max(0.0001, b.t - a.t);
  const u = Math.max(0, Math.min(1, (demoTime - a.t) / span));

  CAR.x = a.x + (b.x - a.x) * u;
  CAR.y = a.y + (b.y - a.y) * u;
  const dAng = Math.atan2(Math.sin(b.angle - a.angle), Math.cos(b.angle - a.angle));
  CAR.angle = a.angle + dAng * u;
  CAR.steer = a.steer + (b.steer - a.steer) * u;
  CAR.speed = a.speed + (b.speed - a.speed) * u;
  setActiveGear(b.gear, false);
  if (b.cue) setCoachCue(b.cue, 'neutral');
}

function updatePhysics(dt) {
  if (bayCleared || document.querySelector('dialog[open]')) return;

  const bay = BAYS[currentBayIdx];

  if (isReplaying) {
    stepReplay(dt, bay);
    syncStickVisual();
    const { dist: clearance } = getCarClearance(CAR.x, CAR.y, CAR.angle, bay);
    const kmh = Math.round(Math.abs(CAR.speed) * 0.12);
    const steerDeg = Math.round((CAR.steer * 180) / Math.PI);
    const radarCm = clearance === Infinity ? 'CLEAR' : `${Math.max(0, Math.round(clearance * 4.5))} CM`;
    document.getElementById('dockTelemetry').textContent =
      `REPLAY · GEAR: ${activeGear} · ${kmh} KM/H · STEER: ${steerDeg > 0 ? '+' : ''}${steerDeg}° · RADAR: ${radarCm}`;
    return;
  }

  if (autoDemo) {
    stepAutoDemo(dt, bay);
    syncStickVisual();
    const { dist: clearance } = getCarClearance(CAR.x, CAR.y, CAR.angle, bay);
    const t = bay.target;
    const dx = CAR.x - t.x;
    const dy = CAR.y - t.y;
    const lx = dx * Math.cos(-t.angle) - dy * Math.sin(-t.angle);
    const ly = dx * Math.sin(-t.angle) + dy * Math.cos(-t.angle);
    const angleDiff = Math.abs(Math.atan2(Math.sin(CAR.angle - t.angle), Math.cos(CAR.angle - t.angle)));
    const aligned = angleDiff < 0.18 || Math.abs(angleDiff - Math.PI) < 0.18;
    const centered = Math.abs(lx) < (t.h - CAR.length) / 2 + 10 && Math.abs(ly) < (t.w - CAR.width) / 2 + 7;
    bayPosState = aligned && centered ? 'aligned' : 'outside';
    sfx.updateEngine(CAR.speed, Math.abs(CAR.speed) > 4);
    sfx.updateRadar(clearance, CAR.speed < -4);
    const kmh = Math.round(Math.abs(CAR.speed) * 0.12);
    const steerDeg = Math.round((CAR.steer * 180) / Math.PI);
    const radarCm = clearance === Infinity ? 'CLEAR' : `${Math.max(0, Math.round(clearance * 4.5))} CM`;
    document.getElementById('dockTelemetry').textContent =
      `GEAR: ${activeGear} · ${kmh} KM/H · STEER: ${steerDeg > 0 ? '+' : ''}${steerDeg}° · RADAR: ${radarCm}`;
    return;
  } else {
    // Steering input (Rotational wheel overrides digital keys)
    const steerRate = 2.6;
    if (analogueSteer !== null) {
      const targetSteer = analogueSteer * CAR.maxSteer;
      CAR.steer += (targetSteer - CAR.steer) * Math.min(1, 18 * dt);
    } else if (keys.left) {
      CAR.steer = Math.max(-CAR.maxSteer, CAR.steer - steerRate * dt);
    } else if (keys.right) {
      CAR.steer = Math.min(CAR.maxSteer, CAR.steer + steerRate * dt);
    } else {
      // Realistic self-centering only while rolling
      if (Math.abs(CAR.speed) > 10) {
        CAR.steer *= Math.pow(0.25, dt);
      }
    }
    syncStickVisual();

    // Throttle & Brake (respects P / R / D gear selector + keyboard W/S)
    const accel = 260;
    const drag = 190;
    const wantFwd = keys.up || (keys.gas && activeGear === 'D');
    const wantRev = keys.down || (keys.gas && activeGear === 'R');
    if (keys.brake) {
      if (Math.abs(CAR.speed) < 18) CAR.speed = 0;
      else CAR.speed -= Math.sign(CAR.speed) * 460 * dt;
    } else if (keys.gas && activeGear === 'P') {
      CAR.speed = 0;
      setCoachCue('Car is in PARK (P) — tap D or R to drive.', 'neutral');
    } else if (wantFwd) {
      CAR.speed = Math.min(CAR.maxFwd, CAR.speed + accel * dt);
    } else if (wantRev) {
      CAR.speed = Math.max(CAR.maxRev, CAR.speed - accel * dt);
    } else {
      if (Math.abs(CAR.speed) < 6) CAR.speed = 0;
      else CAR.speed -= Math.sign(CAR.speed) * drag * dt;
    }
  }

  // Track gear reversals & active P/R/D gear
  const gear = keys.brake || activeGear === 'P' ? 'P' : CAR.speed > 5 ? 'D' : CAR.speed < -5 ? 'R' : activeGear;
  if (gear !== 'N' && gear !== 'P' && gear !== lastGear) {
    if (lastGear !== 'N') reversals++;
    lastGear = gear;
    sfx.playGearShift();
  }

  sfx.updateEngine(CAR.speed, autoDemo || keys.up || keys.down || keys.gas);

  // Save previous pose for solid wall/obstacle rollback
  const prevX = CAR.x;
  const prevY = CAR.y;
  const prevAngle = CAR.angle;

  // Ackermann bicycle kinematics (pivot around rear axle)
  const angularVel = (CAR.speed / CAR.wheelbase) * Math.tan(CAR.steer);
  CAR.angle += angularVel * dt;
  CAR.x += Math.cos(CAR.angle) * CAR.speed * dt;
  CAR.y += Math.sin(CAR.angle) * CAR.speed * dt;

  const { dist: clearance, obs: hitObs } = getCarClearance(CAR.x, CAR.y, CAR.angle, bay);
  const nowPerf = performance.now();
  const relT = (nowPerf - startTime) / 1000;

  if (clearance <= 0.5) {
    // Solid obstacle stop: walls, curbs, pillars, cones, and parked cars block the car
    CAR.x = prevX;
    CAR.y = prevY;
    CAR.angle = prevAngle;
    CAR.speed = 0;
    hitObsRef = hitObs;
    hitObsUntil = nowPerf + 550;
    if (nowPerf - lastCollisionBump > 550) {
      collisions++;
      lastCollisionBump = nowPerf;
      sfx.playBump();
      haptic([28, 18, 28]);
      const obsName = hitObs?.type === 'wall' ? 'Wall' : hitObs?.type === 'curb' ? 'Curb' : hitObs?.type === 'pillar' ? 'Pillar' : hitObs?.type === 'cone' ? 'Cone' : 'Parked car';
      analytics.trackCollision(bay, obsName);
      driveMistakes.push({
        t: relT,
        x: CAR.x,
        y: CAR.y,
        type: 'COLLISION',
        label: `Hit ${obsName}`,
        fix: `Mistake: Hit ${obsName} in ${activeGear}. Correction: Stop when the guide line turns RED, shift to ${activeGear === 'R' ? 'D' : 'R'}, and counter-steer.`
      });
      driveHistory.push({
        t: relT,
        x: CAR.x,
        y: CAR.y,
        angle: CAR.angle,
        steer: CAR.steer,
        speed: 0,
        gear: activeGear,
        clearance: 0
      });
      saveCurrentDriveSnapshot();
      setCoachCue(`${obsName} blocked you! Shift opposite gear & steer clear (or tap ↺ Replay to review).`, 'warn');
    }
  } else {
    // Record user's manual trajectory samples for Replay
    if (Math.abs(CAR.speed) > 3 && nowPerf - lastReplaySampleAt > 55) {
      lastReplaySampleAt = nowPerf;
      driveHistory.push({
        t: relT,
        x: CAR.x,
        y: CAR.y,
        angle: CAR.angle,
        steer: CAR.steer,
        speed: CAR.speed,
        gear: activeGear,
        clearance
      });
      if (driveHistory.length > 900) driveHistory.shift();
      saveCurrentDriveSnapshot();
    }

    // Record close-call warning if user drives into the RED (< 14 px) danger zone at speed
    if (clearance < 14 && Math.abs(CAR.speed) > 10 && nowPerf - lastCloseCallAt > 2000) {
      lastCloseCallAt = nowPerf;
      const cm = Math.max(1, Math.round(clearance * 4.5));
      driveMistakes.push({
        t: relT,
        x: CAR.x,
        y: CAR.y,
        type: 'TOO_CLOSE',
        label: `Danger Zone (${cm}cm)`,
        fix: `Close Call: Passed ${cm}cm from obstacle (Red Guide). Correction: Begin your turn earlier while the guide is Orange.`
      });
      saveCurrentDriveSnapshot();
    }

    sfx.updateRadar(clearance, CAR.speed < -4);
    if (!autoDemo && !demoDone) {
      checkParked(bay, dt);
    } else {
      // Update bayPosState visually during demo without awarding user pass/stars
      const t = bay.target;
      const dx = CAR.x - t.x;
      const dy = CAR.y - t.y;
      const lx = dx * Math.cos(-t.angle) - dy * Math.sin(-t.angle);
      const ly = dx * Math.sin(-t.angle) + dy * Math.cos(-t.angle);
      const angleDiff = Math.abs(Math.atan2(Math.sin(CAR.angle - t.angle), Math.cos(CAR.angle - t.angle)));
      const aligned = angleDiff < 0.18 || Math.abs(angleDiff - Math.PI) < 0.18;
      const centered = Math.abs(lx) < (t.h - CAR.length) / 2 + 10 && Math.abs(ly) < (t.w - CAR.width) / 2 + 7;
      bayPosState = aligned && centered ? 'aligned' : 'outside';
    }
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
  const isMobile = window.innerWidth <= 760 || window.innerWidth < window.innerHeight;
  const uiScale = isMobile
    ? 1
    : Math.max(0.76, Math.min(1.12, Math.min(window.innerWidth / 1568, window.innerHeight / 913)));
  document.documentElement.style.setProperty('--ui', uiScale.toFixed(4));
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  updateDockThumb();
  updateViewThumb();
}
window.addEventListener('resize', resizeCanvas);

function getProximityLightInfo(clearancePx) {
  if (clearancePx < 16) {
    return {
      level: 'red',
      hex: '#ef4444',
      rgba: 'rgba(239, 68, 68, 0.88)',
      glow: 'rgba(239, 68, 68, 0.55)',
      label: 'RED · TOO CLOSE!'
    };
  }
  if (clearancePx < 42) {
    return {
      level: 'orange',
      hex: '#f97316',
      rgba: 'rgba(249, 115, 22, 0.86)',
      glow: 'rgba(249, 115, 22, 0.45)',
      label: 'ORANGE · GETTING CLOSER'
    };
  }
  return {
    level: 'green',
    hex: '#22c55e',
    rgba: 'rgba(34, 197, 94, 0.84)',
    glow: 'rgba(34, 197, 94, 0.42)',
    label: 'GREEN · SAFE'
  };
}

function drawReplayOverlay() {
  if (!replayPlan) return;
  ctx.save();

  // 1. Draw Ideal Reference Path (dashed cyan/emerald line) so player sees how to correct
  if (replayPlan.idealSamples && replayPlan.idealSamples.length > 1) {
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.68)';
    ctx.beginPath();
    replayPlan.idealSamples.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 2. Draw Player's Recorded Trail color-coded by Green / Orange / Red obstacle clearance
  const pts = replayPlan.samples;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const info = getProximityLightInfo(b.clearance ?? 60);
    ctx.strokeStyle = info.hex;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // 3. Draw Mistake Markers (Collisions, Close Calls & Alignment Offsets)
  (replayPlan.mistakes || []).forEach((m, idx) => {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 9.5px "Geist Mono", monospace';
    const tag = `⚠ #${idx + 1} ${m.label.toUpperCase()}`;
    const tw = ctx.measureText(tag).width + 12;
    ctx.fillStyle = 'rgba(18, 8, 10, 0.92)';
    roundRect(ctx, -tw / 2, -28, tw, 16, 5);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fca5a5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, 0, -20);
    ctx.restore();
  });

  ctx.restore();
}

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
  const isMobile = vw <= 760 || vw < vh;
  if (isMobile) zoom *= 0.68;
  const camX = camMode === 'wide' ? 0 : CAR.x * 0.55;
  const camY = camMode === 'wide' ? 0 : CAR.y * 0.55;

  ctx.translate(vw / 2, vh / 2 - (isMobile ? 42 : 20));
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

  ctx.fillStyle = isGreen ? '#4ade80' : isPartial ? '#ffa92c' : 'rgba(255, 197, 112, 0.72)';
  ctx.font = '700 10.5px "Geist Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const bayLabelText = bayCleared
    ? '✓ GRADED'
    : isGreen
      ? 'CLICK [P] TO PARK'
      : isPartial
        ? 'ALIGN & CLICK [P]'
        : `PARK · ${bay.id} ▸`;
  ctx.fillText(bayLabelText, 0, 0);
  ctx.restore();

  // Obstacles (Curbs, Pillars, Cones, Parked Cars)
  const nowMs = performance.now();
  for (const obs of bay.obstacles) {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    if (obs.angle) ctx.rotate(obs.angle);
    const isHit = obs === hitObsRef && nowMs < hitObsUntil;
    if (isHit) {
      ctx.shadowColor = '#ff4d4d';
      ctx.shadowBlur = 16;
    }

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
      // Parked car obstacle (matches exact obs.w × obs.h collision box)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(-obs.w / 2 + 4, -obs.h / 2 + 5, obs.w, obs.h);
      ctx.fillStyle = obs.color || '#3e4a59';
      roundRect(ctx, -obs.w / 2, -obs.h / 2, obs.w, obs.h, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Windshield along longer axis
      ctx.fillStyle = 'rgba(10, 14, 22, 0.72)';
      if (obs.w >= obs.h) {
        roundRect(ctx, -obs.w / 4, -obs.h / 2 + 5, obs.w * 0.55, obs.h - 10, 5);
      } else {
        roundRect(ctx, -obs.w / 2 + 5, -obs.h / 4, obs.w - 10, obs.h * 0.55, 5);
      }
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

  // Draw Replay Overlay (recorded user trail + mistake callouts + ideal path) when replaying
  if (isReplaying || replayPlan) {
    drawReplayOverlay();
  }

  // Ackermann Predicted Trajectory Arcs with Green / Orange / Red Proximity Lights
  if (showGuides) {
    drawTrajectoryGuides();
  }

  // Player Tonna Car
  drawPlayerCar(isNight);

  ctx.restore();
}

function drawTrajectoryGuides() {
  const bay = BAYS[currentBayIdx];

  // Draw Instructor Demo Reference Path & Pivot Markers when demo is active or completed
  if ((autoDemo || demoDone) && demoPlan && demoPlan.samples.length) {
    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.65)';
    ctx.beginPath();
    demoPlan.samples.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    demoPlan.pivots.forEach((pv, i) => {
      ctx.fillStyle = '#ffc570';
      ctx.beginPath();
      ctx.arc(pv.x, pv.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '700 9px "Geist Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`PIVOT ${i + 1} (${pv.gear})`, pv.x, pv.y - 10);
    });
    ctx.restore();
  }

  const steps = 22;
  const stepDt = 0.075;
  const dir = activeGear === 'R' || keys.down || CAR.speed < -2 ? -1 : 1;
  const simSpeed = dir * 95;

  let sx = CAR.x;
  let sy = CAR.y;
  let sa = CAR.angle;

  const liveClearance = getCarClearance(CAR.x, CAR.y, CAR.angle, bay).dist;
  let worstClearance = liveClearance;

  // Left & Right tire paths + per-step obstacle clearance for Green / Orange / Red light coloring
  const leftPts = [];
  const rightPts = [];
  const stepLights = [];

  for (let i = 0; i < steps; i++) {
    const w = (simSpeed / CAR.wheelbase) * Math.tan(CAR.steer);
    sa += w * stepDt;
    sx += Math.cos(sa) * simSpeed * stepDt;
    sy += Math.sin(sa) * simSpeed * stepDt;

    const stepClearance = getCarClearance(sx, sy, sa, bay).dist;
    // Weight near-field trajectory steps into overall guide light state
    if (i < 12 && stepClearance < worstClearance) {
      worstClearance = stepClearance;
    }
    const light = getProximityLightInfo(Math.min(liveClearance, stepClearance));
    stepLights.push(light);

    const rearOff = dir < 0 ? -CAR.length / 2 : CAR.length / 2;
    const rx = sx + Math.cos(sa) * rearOff;
    const ry = sy + Math.sin(sa) * rearOff;
    const nx = -Math.sin(sa) * (CAR.width / 2 - 4);
    const ny = Math.cos(sa) * (CAR.width / 2 - 4);
    leftPts.push({ x: rx + nx, y: ry + ny });
    rightPts.push({ x: rx - nx, y: ry - ny });
  }

  const activeLight = getProximityLightInfo(worstClearance);

  ctx.save();
  ctx.lineWidth = 2.6;
  ctx.setLineDash([6, 4]);

  // Draw per-segment colored left and right guide rails (Green = Safe, Orange = Getting Closer, Red = Too Close)
  [leftPts, rightPts].forEach((pts) => {
    for (let i = 1; i < pts.length; i++) {
      ctx.strokeStyle = stepLights[i].rgba;
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
  });

  // Distance zone crossbars & glowing LED proximity light beacons along the guide rails
  ctx.setLineDash([]);
  ctx.lineWidth = 1.6;
  [4, 9, 14, 19].forEach((idx) => {
    const l = leftPts[idx];
    const r = rightPts[idx];
    const light = stepLights[idx];
    if (!l || !r || !light) return;

    ctx.strokeStyle = light.rgba;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y);
    ctx.lineTo(r.x, r.y);
    ctx.stroke();

    // Glowing LED light nodes on both rails
    [l, r].forEach((pt) => {
      ctx.save();
      ctx.shadowColor = light.hex;
      ctx.shadowBlur = 10;
      ctx.fillStyle = light.hex;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  });

  // 3-Light Traffic Indicator Pill at the tip of the guide line (Green / Orange / Red)
  const tipL = leftPts[leftPts.length - 1];
  const tipR = rightPts[rightPts.length - 1];
  if (tipL && tipR) {
    const mx = (tipL.x + tipR.x) / 2;
    const my = (tipL.y + tipR.y) / 2;
    ctx.save();
    ctx.font = '700 8.5px "Geist Mono", monospace';
    const textW = ctx.measureText(activeLight.label).width;
    const pillW = textW + 46;
    const pillH = 18;

    ctx.fillStyle = 'rgba(12, 10, 12, 0.88)';
    roundRect(ctx, mx - pillW / 2, my - pillH / 2, pillW, pillH, 9);
    ctx.fill();
    ctx.strokeStyle = activeLight.hex;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Draw 3 mini LED bulbs (Green, Orange, Red) inside the pill
    const lightsOrder = [
      { id: 'green', hex: '#22c55e' },
      { id: 'orange', hex: '#f97316' },
      { id: 'red', hex: '#ef4444' }
    ];
    lightsOrder.forEach((bulb, bIdx) => {
      const bx = mx - pillW / 2 + 10 + bIdx * 10;
      const isLit = activeLight.level === bulb.id;
      ctx.save();
      if (isLit) {
        ctx.shadowColor = bulb.hex;
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = isLit ? bulb.hex : 'rgba(255, 255, 255, 0.18)';
      ctx.beginPath();
      ctx.arc(bx, my, isLit ? 3.6 : 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.fillStyle = activeLight.hex;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(activeLight.label, mx - pillW / 2 + 38, my + 0.5);
    ctx.restore();
  }

  // Rear-axle pivot crosshair
  const px = CAR.x - Math.cos(CAR.angle) * (CAR.wheelbase / 2);
  const py = CAR.y - Math.sin(CAR.angle) * (CAR.wheelbase / 2);
  ctx.setLineDash([]);
  ctx.fillStyle = activeLight.hex;
  ctx.beginPath();
  ctx.arc(px, py, 3.8, 0, Math.PI * 2);
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
      const rating = stageRatings[b.id];
      const badgeText = isDone
        ? (rating?.stars ? `${'★'.repeat(rating.stars)} PASSED` : '✓ PASSED')
        : b.category.toUpperCase();
      return `
        <button type="button" class="stage-card${isActive ? ' active' : ''}${isDone ? ' cleared' : ''}" data-idx="${idx}">
          <div class="stage-card-top">
            <span>STAGE ${b.id}</span>
            <span>${badgeText}</span>
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

// Sound toggle & first-gesture audio unlock
const soundBtn = document.getElementById('sound2');
soundBtn.addEventListener('click', () => {
  sfx.setEnabled(!sfx.enabled);
  soundBtn.setAttribute('aria-pressed', String(sfx.enabled));
  document.getElementById('soundWaves').style.opacity = sfx.enabled ? '1' : '0.2';
});

['keydown', 'pointerdown'].forEach((evt) => {
  window.addEventListener(evt, () => {
    if (sfx.enabled) sfx.init();
  }, { once: true });
});

// Reset & Navigation buttons
document.getElementById('resetBtnLink').addEventListener('click', (e) => {
  e.preventDefault();
  loadBay(currentBayIdx);
});
document.getElementById('demoBtn')?.addEventListener('click', startAutoDemo);
document.getElementById('replayBtn')?.addEventListener('click', startReplay);
document.getElementById('shReplayBtn')?.addEventListener('click', startReplay);
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

// Keyboard Controls (ignores keystrokes while typing in chatbox or form inputs)
window.addEventListener('keydown', (e) => {
  const activeTag = document.activeElement?.tagName;
  if (document.querySelector('dialog[open]') || activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
    return;
  }
  const k = e.key.toLowerCase();
  if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
    if (autoDemo) stopAutoDemo('Manual override — you have control.');
    if (isReplaying) stopReplay('Manual override — you have control.');
  }
  if (k === 'w' || e.key === 'ArrowUp') { keys.up = true; setActiveGear('D', true); e.preventDefault(); }
  if (k === 's' || e.key === 'ArrowDown') { keys.down = true; setActiveGear('R', true); e.preventDefault(); }
  if (k === 'a' || e.key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
  if (k === 'd' || e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
  if (k === 'p') { setActiveGear('P', false); e.preventDefault(); }
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

// On-Screen Touch / Pointer Rotational Steering Wheel & Pedals (P / R / D)
let analogueSteer = null;
let stickSpringing = false;
const steerWheelEl = document.getElementById('steerWheel');
const steerRotorEl = document.getElementById('steerWheelRotor');
const stickReadoutEl = document.getElementById('stickReadout');
let lastWheelDegAttr = null;
let lastWheelCssDeg = null;

function syncStickVisual(overrideNorm = null) {
  if (!steerWheelEl || !steerRotorEl) return;
  const norm = overrideNorm !== null ? overrideNorm : CAR.steer / CAR.maxSteer;
  const wheelDeg = norm * 180;
  if (lastWheelCssDeg === null || Math.abs(wheelDeg - lastWheelCssDeg) > 0.15) {
    lastWheelCssDeg = wheelDeg;
    steerRotorEl.style.setProperty('--wheel-deg', `${wheelDeg.toFixed(1)}deg`);
  }
  const deg = Math.round(norm * ((CAR.maxSteer * 180) / Math.PI));
  if (deg !== lastWheelDegAttr) {
    lastWheelDegAttr = deg;
    if (stickReadoutEl) stickReadoutEl.textContent = `${deg > 0 ? '+' : ''}${deg}°`;
    steerWheelEl.setAttribute('aria-valuenow', String(deg));
  }
}

if (steerWheelEl) {
  let lastPointerAngle = null;
  let lastPointerX = 0;
  let wheelLockNorm = 0;
  let cachedWheelRect = null;

  const getPointerInfo = (e) => {
    const rect = cachedWheelRect || steerWheelEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    return { angle: dist >= 10 ? Math.atan2(dy, dx) : null, radius: Math.max(28, rect.width / 2) };
  };

  steerWheelEl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (autoDemo) stopAutoDemo('Manual override — you have control.');
    cachedWheelRect = steerWheelEl.getBoundingClientRect();
    steerWheelEl.setPointerCapture(e.pointerId);
    steerWheelEl.classList.add('dragging');
    stickSpringing = false;
    if (sfx.enabled) sfx.init();
    wheelLockNorm = CAR.steer / CAR.maxSteer;
    analogueSteer = wheelLockNorm;
    const info = getPointerInfo(e);
    lastPointerAngle = info.angle;
    lastPointerX = e.clientX;
  });

  const handleWheelMove = (ev) => {
    const info = getPointerInfo(ev);
    const dx = ev.clientX - lastPointerX;
    lastPointerX = ev.clientX;

    if (info.angle !== null && lastPointerAngle !== null) {
      let dAngle = info.angle - lastPointerAngle;
      while (dAngle > Math.PI) dAngle -= Math.PI * 2;
      while (dAngle < -Math.PI) dAngle += Math.PI * 2;
      lastPointerAngle = info.angle;
      wheelLockNorm = Math.max(-1, Math.min(1, wheelLockNorm + dAngle / (Math.PI * 0.85)));
    } else {
      // Smooth horizontal drag fallback when finger passes near wheel center
      lastPointerAngle = info.angle;
      wheelLockNorm = Math.max(-1, Math.min(1, wheelLockNorm + dx / info.radius));
    }
    analogueSteer = wheelLockNorm;
    CAR.steer = analogueSteer * CAR.maxSteer;
    syncStickVisual(analogueSteer);
  };

  steerWheelEl.addEventListener('pointermove', (e) => {
    if (analogueSteer === null) return;
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
    for (const ev of events) {
      handleWheelMove(ev);
    }
  });

  const releaseWheel = () => {
    analogueSteer = null;
    cachedWheelRect = null;
    lastPointerAngle = null;
    steerWheelEl.classList.remove('dragging');
  };
  steerWheelEl.addEventListener('pointerup', releaseWheel);
  steerWheelEl.addEventListener('pointercancel', releaseWheel);
  steerWheelEl.addEventListener('dblclick', () => {
    CAR.steer = 0;
    syncStickVisual(0);
    haptic(10);
  });
}

document.querySelectorAll('.gear-btn').forEach((btn) => {
  btn.addEventListener('click', () => setActiveGear(btn.dataset.gear));
});

function bindPadBtn(id, keyProp) {
  const el = document.getElementById(id);
  if (!el) return;
  const on = (e) => {
    e.preventDefault();
    if (autoDemo) stopAutoDemo('Manual override — you have control.');
    if (sfx.enabled) sfx.init();
    keys[keyProp] = true;
    el.classList.add('active');
  };
  const off = () => { keys[keyProp] = false; el.classList.remove('active'); };
  el.addEventListener('pointerdown', on);
  window.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('pointerleave', off);
}
bindPadBtn('btnBrake', 'brake');
bindPadBtn('btnGas', 'gas');

// Visitor & Gameplay Analytics Modal Renderer (Admin Password Protected)
const ADMIN_AUTH_SESSION_KEY = 'theparktask_admin_auth_v1';
const ADMIN_PW_HASH_KEY = 'theparktask_admin_pw_hash_v1';
const DEFAULT_ADMIN_PW = 'admin2026';

async function sha256Hex(str) {
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic digest if Web Crypto is unavailable
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
  if (!unlocked) {
    const tag = document.getElementById('anSourceTag');
    if (tag) tag.textContent = 'ADMIN AUTHENTICATION REQUIRED';
  }
}

function formatDuration(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m}m ${s}s`;
}

function renderAnalyticsModal() {
  syncAdminGateUI();
  if (!isAdminUnlocked()) {
    const pwInput = document.getElementById('anAdminPassword');
    setTimeout(() => pwInput?.focus(), 40);
    return;
  }

  const snap = analytics.getSnapshot();
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  };
  setTxt('anSourceTag', snap.source);
  setTxt('anVisits', snap.visits);
  setTxt('anVisitors', snap.uniqueVisitors);
  setTxt('anPlayTime', formatDuration(snap.totalPlaySec));
  setTxt('anClears', `${snap.clears} (${clearedBays.size}/108)`);
  setTxt('anAttempts', snap.attempts);
  setTxt('anDemos', snap.demos);
  setTxt('anArkRuns', snap.arkanoidHigh > 0 ? `${snap.arkanoidRuns} (Best: ${snap.arkanoidHigh})` : snap.arkanoidRuns);
  setTxt('anAvgScore', snap.avgScore > 0 ? `${snap.avgScore}%` : '—');

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
            <td>${st.clears || 0} ${st.stars ? '★'.repeat(st.stars) : ''}</td>
            <td>${st.collisions || 0}</td>
            <td>${st.bestTime != null ? `${st.bestTime}s` : '—'}</td>
          </tr>
        `
          )
          .join('')
      : `<tr><td colspan="6" style="color:var(--dim)">No stages played yet.</td></tr>`;
  }

  const feed = document.getElementById('anEventLog');
  if (feed) {
    const evs = snap.events || [];
    feed.innerHTML = evs.length
      ? evs
          .map(
            (ev) => `
          <div class="an-event">
            <span>${ev.label}</span>
            <small>${ev.ts}</small>
          </div>
        `
          )
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
  anAdminPwInput.setCustomValidity('');
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
  const candidate = anAdminPwInput.value;
  if (!candidate) {
    if (anAuthError) anAuthError.textContent = 'Administrator password is required.';
    anAdminPwInput.focus();
    return;
  }
  const ok = await verifyAdminPassword(candidate);
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

document.getElementById('anChangePwForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('anNewPassword');
  const status = document.getElementById('anChangePwStatus');
  if (!input || !status) return;
  const val = input.value.trim();
  if (val.length < 6) {
    status.style.color = '#ff7b7b';
    status.textContent = 'Password must be at least 6 characters.';
    return;
  }
  const digest = await sha256Hex(val);
  localStorage.setItem(ADMIN_PW_HASH_KEY, digest);
  input.value = '';
  status.style.color = '#4ade80';
  status.textContent = '✓ Admin password updated for this browser.';
});

document.getElementById('btnExportAnalytics')?.addEventListener('click', () => {
  if (!isAdminUnlocked()) return;
  const snap = analytics.getSnapshot();
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `theparktask-analytics-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// ==========================================================================
// 9. USER LOGIN + GUEST PLAY & COMMUNITY COMMENTS CHATBOX (100% VERCEL READY)
// ==========================================================================
const USERS_DB_KEY = 'theparktask_users_v1';
const USER_SESSION_KEY = 'theparktask_user_session_v1';
const GUEST_NAME_KEY = 'theparktask_guest_name_v1';
const COMMENTS_DB_KEY = 'theparktask_comments_v1';
const LIKED_COMMENTS_KEY = 'theparktask_liked_comments_v1';
const FIREBASE_CFG_KEY = 'theparktask_firebase_cfg_v1';

const communityChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('theparktask_community_v1') : null;

const SEED_COMMENTS = [
  {
    id: 'seed-1',
    author: 'Coach Tonna',
    role: 'member',
    stageId: '001',
    text: 'Welcome! Remember: once your car is aligned inside the green box, click [P] PARK (or press P) to lock the brakes and get your grade!',
    likes: 14,
    ts: 'Pinned Tip'
  },
  {
    id: 'seed-2',
    author: 'Maya R.',
    role: 'member',
    stageId: '001',
    text: 'The new Green / Orange / Red guide lights make reverse bay parking so much clearer. As soon as it turns Orange I start straightening the wheel.',
    likes: 8,
    ts: '12m ago'
  },
  {
    id: 'seed-3',
    author: 'Guest_Drifter',
    role: 'guest',
    stageId: '002',
    text: 'Playing as a guest right now! The Replay button (↺) showed me I was turning full-lock too late on the 45° diagonal bay.',
    likes: 6,
    ts: '8m ago'
  },
  {
    id: 'seed-4',
    author: 'Devon K.',
    role: 'member',
    stageId: '003',
    text: 'For Stage 003 parallel curb: reverse until the rear axle dot hits the first pivot marker, then counter-steer full left.',
    likes: 11,
    ts: '5m ago'
  },
  {
    id: 'seed-5',
    author: 'Guest_Amaka',
    role: 'guest',
    stageId: '004',
    text: 'Love that guests can play and drop tips in the chatbox without being forced to register first!',
    likes: 5,
    ts: '2m ago'
  },
  {
    id: 'seed-6',
    author: 'Seyi A.',
    role: 'member',
    stageId: '005',
    text: 'On S-Bend stages, keep speed under 8 km/h and watch the Red guide light near the cones.',
    likes: 9,
    ts: 'Just now'
  }
];

function loadUsersDB() {
  try {
    return JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveUsersDB(db) {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(userObj) {
  if (userObj) {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userObj));
  } else {
    localStorage.removeItem(USER_SESSION_KEY);
  }
  syncAuthUI();
}

function getGuestNickname() {
  return (localStorage.getItem(GUEST_NAME_KEY) || 'Guest Driver').trim() || 'Guest Driver';
}

function setGuestNickname(name) {
  const clean = (name || '').trim().slice(0, 24) || 'Guest Driver';
  localStorage.setItem(GUEST_NAME_KEY, clean);
  const input = document.getElementById('chatGuestNameInput');
  if (input && input.value !== clean) input.value = clean;
}

function syncAuthUI() {
  const user = getCurrentUser();
  const guestName = getGuestNickname();
  const hasFirebaseCfg = Boolean(localStorage.getItem(FIREBASE_CFG_KEY));

  // Top nav button
  const authBtn = document.getElementById('userAuthBtn');
  const authLabel = document.getElementById('userAuthLabel');
  if (authBtn && authLabel) {
    authBtn.classList.toggle('signed-in', Boolean(user));
    authLabel.textContent = user ? `✓ ${user.name.toUpperCase()}` : '👤 GUEST · SIGN IN';
  }

  // Chatbox identity bar
  const badge = document.getElementById('chatIdentityBadge');
  const guestInput = document.getElementById('chatGuestNameInput');
  const signedText = document.getElementById('chatSignedUserText');
  const openAuthBtn = document.getElementById('chatOpenAuthBtn');
  if (badge && guestInput && signedText && openAuthBtn) {
    if (user) {
      badge.textContent = 'MEMBER';
      badge.className = 'chat-badge member';
      guestInput.hidden = true;
      signedText.hidden = false;
      signedText.textContent = `${user.name} (${user.email})`;
      openAuthBtn.textContent = 'ACCOUNT';
    } else {
      badge.textContent = 'GUEST';
      badge.className = 'chat-badge guest';
      guestInput.hidden = false;
      if (document.activeElement !== guestInput) guestInput.value = guestName;
      signedText.hidden = true;
      openAuthBtn.textContent = 'SIGN IN';
    }
  }

  // Auth modal profile card
  const profileCard = document.getElementById('authProfileView');
  if (profileCard) {
    if (user) {
      profileCard.hidden = false;
      const initials = user.name
        .split(/\s+/)
        .map((p) => p[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'DR';
      const avatarInitEl = document.getElementById('authAvatarInitials');
      const avatarImgEl = document.getElementById('authAvatarImg');
      if (user.photoURL && avatarImgEl && avatarInitEl) {
        avatarImgEl.src = user.photoURL;
        avatarImgEl.hidden = false;
        avatarInitEl.hidden = true;
      } else if (avatarInitEl && avatarImgEl) {
        avatarInitEl.textContent = initials;
        avatarInitEl.hidden = false;
        avatarImgEl.hidden = true;
      }
      document.getElementById('authProfileName').textContent = user.name;
      document.getElementById('authProfileEmail').textContent = user.email;
      document.getElementById('authStatClears').textContent = `${clearedBays.size} / ${BAYS.length}`;
      document.getElementById('authStatProvider').textContent =
        user.provider === 'google.com'
          ? 'Google Account (Firebase)'
          : hasFirebaseCfg
            ? 'Firebase Cloud + Local'
            : 'Built-In WebCrypto Auth';
    } else {
      profileCard.hidden = true;
    }
  }
}

// Auth Modal Tab Switching
const authTabs = [
  { btnId: 'authTabSignIn', panelId: 'authPanelSignIn', key: 'signin' },
  { btnId: 'authTabSignUp', panelId: 'authPanelSignUp', key: 'signup' },
  { btnId: 'authTabSetup', panelId: 'authPanelSetup', key: 'setup' }
];

function switchAuthTab(targetKey) {
  authTabs.forEach((t) => {
    const btn = document.getElementById(t.btnId);
    const panel = document.getElementById(t.panelId);
    const active = t.key === targetKey;
    if (btn) {
      btn.classList.toggle('on', active);
      btn.setAttribute('aria-selected', String(active));
    }
    if (panel) panel.hidden = !active;
  });
}

authTabs.forEach((t) => {
  document.getElementById(t.btnId)?.addEventListener('click', () => switchAuthTab(t.key));
});

document.getElementById('menuAuthBtn')?.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  document.getElementById('menuBtn')?.setAttribute('aria-expanded', 'false');
  syncAuthUI();
});

document.getElementById('userAuthBtn')?.addEventListener('click', syncAuthUI);

// Show / Hide Password in Sign-In Form
const signInPwInput = document.getElementById('current-password');
const toggleSignInPwBtn = document.getElementById('toggleSignInPwBtn');
toggleSignInPwBtn?.addEventListener('click', () => {
  if (!signInPwInput) return;
  const showing = signInPwInput.type === 'text';
  signInPwInput.type = showing ? 'password' : 'text';
  toggleSignInPwBtn.setAttribute('aria-pressed', String(!showing));
  toggleSignInPwBtn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
  toggleSignInPwBtn.textContent = showing ? 'SHOW' : 'HIDE';
});

// Continue as Guest button
document.getElementById('continueGuestBtn')?.addEventListener('click', () => {
  setCurrentUser(null);
  document.getElementById('authModal')?.close();
  setCoachCue(`Playing as ${getGuestNickname()} — Guests can play all 108 stages & post in Comments!`, 'ok');
});

// Optional Live Firebase Cloud Bridge (dynamically connects Firebase Google Auth + Firestore when configured)
let fbCloud = null; // { auth, db, googleProvider, authMod, fsMod }

async function initFirebaseCloudIfConfigured() {
  const raw = localStorage.getItem(FIREBASE_CFG_KEY);
  if (!raw) {
    fbCloud = null;
    return null;
  }
  try {
    const cfg = JSON.parse(raw);
    if (!cfg.apiKey || !cfg.projectId) return null;
    const [appMod, authMod, fsMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js')
    ]);
    const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(cfg);
    const auth = authMod.getAuth(app);
    const db = fsMod.getFirestore(app);
    const googleProvider = new authMod.GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    fbCloud = { auth, db, googleProvider, authMod, fsMod };

    // Observe Firebase Auth state changes (automatically syncs Google Sign-In popup & redirect users)
    authMod.onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const providerId = fbUser.providerData?.[0]?.providerId || 'google.com';
        setCurrentUser({
          uid: fbUser.uid,
          name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Google Driver'),
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || '',
          provider: providerId
        });
      }
    });

    // Complete Google Sign-In redirect if returning from mobile redirect flow
    authMod.getRedirectResult(auth).catch(() => {});

    // Subscribe to real-time Firestore comments collection if available
    const q = fsMod.query(fsMod.collection(db, 'comments'), fsMod.orderBy('createdAtMs', 'desc'), fsMod.limit(80));
    fsMod.onSnapshot(
      q,
      (snap) => {
        const cloudComments = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          cloudComments.push({
            id: docSnap.id,
            author: d.author || 'Guest Driver',
            role: d.role || 'guest',
            stageId: d.stageId || '001',
            text: d.text || '',
            likes: Number(d.likes || 0),
            ts: d.ts || 'Cloud'
          });
        });
        if (cloudComments.length) {
          saveComments(cloudComments);
          renderChatComments();
        }
      },
      () => {
        // Ignore Firestore permission/offline errors and keep local comments active
      }
    );
    syncAuthUI();
    return fbCloud;
  } catch {
    fbCloud = null;
    return null;
  }
}

async function handleGoogleSignIn(statusElId = 'signInStatus') {
  const statusEl = document.getElementById(statusElId);
  if (!fbCloud) {
    await initFirebaseCloudIfConfigured();
  }

  if (fbCloud?.auth && fbCloud?.googleProvider) {
    try {
      if (statusEl) {
        statusEl.style.color = '#ffc570';
        statusEl.textContent = 'Opening Google Sign-In popup…';
      }
      const result = await fbCloud.authMod.signInWithPopup(fbCloud.auth, fbCloud.googleProvider);
      const user = result.user;
      const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Google Driver');
      setCurrentUser({
        uid: user.uid,
        name: displayName,
        email: user.email || '',
        photoURL: user.photoURL || '',
        provider: 'google.com'
      });
      if (statusEl) {
        statusEl.style.color = '#4ade80';
        statusEl.textContent = `✓ Signed in with Google as ${displayName}!`;
      }
      setCoachCue(`✓ Signed in with Google as ${displayName}!`, 'ok');
    } catch (error) {
      if (error?.code === 'auth/popup-blocked') {
        await fbCloud.authMod.signInWithRedirect(fbCloud.auth, fbCloud.googleProvider);
        return;
      }
      if (statusEl) {
        statusEl.style.color = '#ff7b7b';
        if (error?.code === 'auth/unauthorized-domain') {
          statusEl.textContent = `Domain "${location.hostname}" is not authorized yet in Firebase Console → Authentication → Settings → Authorized domains.`;
        } else {
          statusEl.textContent = error?.message || 'Google Sign-In failed. Check your Firebase config in HOW TO SET UP LOGIN.';
        }
      }
    }
    return;
  }

  // If Firebase Config is not pasted yet, guide the admin to the Setup tab to paste their Firebase Config JSON
  switchAuthTab('setup');
  const fbInput = document.getElementById('firebaseConfigInput');
  const fbStatus = document.getElementById('firebaseConfigStatus');
  if (fbStatus) {
    fbStatus.style.color = '#ffc570';
    fbStatus.textContent =
      'Paste your Firebase Web Config JSON above and click SAVE CLOUD CONFIG to activate live Google Sign-In!';
  }
  setTimeout(() => fbInput?.focus(), 60);
}

document.getElementById('googleSignInBtn')?.addEventListener('click', () => handleGoogleSignIn('signInStatus'));
document.getElementById('googleSignUpBtn')?.addEventListener('click', () => handleGoogleSignIn('signUpStatus'));

// Sign Out button
document.getElementById('authSignOutBtn')?.addEventListener('click', async () => {
  if (fbCloud?.auth) {
    try { await fbCloud.authMod.signOut(fbCloud.auth); } catch {}
  }
  setCurrentUser(null);
  const status = document.getElementById('signInStatus');
  if (status) {
    status.style.color = '#ffc570';
    status.textContent = 'Signed out — now playing & commenting in Guest mode.';
  }
});

// Create Account Form Submit (autofill-sign-up-form compliant)
document.getElementById('signUpForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nameEl = document.getElementById('signup-name');
  const emailEl = document.getElementById('signup-email');
  const pwEl = document.getElementById('new-password');
  const statusEl = document.getElementById('signUpStatus');
  if (!nameEl || !emailEl || !pwEl || !statusEl) return;

  const name = nameEl.value.trim();
  const email = emailEl.value.trim().toLowerCase();
  const pw = pwEl.value;

  if (!name || !email || pw.length < 6) {
    statusEl.style.color = '#ff7b7b';
    statusEl.textContent = 'Please provide your name, email, and a password of at least 6 characters.';
    return;
  }

  if (fbCloud?.auth) {
    try {
      const cred = await fbCloud.authMod.createUserWithEmailAndPassword(fbCloud.auth, email, pw);
      if (cred.user && fbCloud.authMod.updateProfile) {
        await fbCloud.authMod.updateProfile(cred.user, { displayName: name });
      }
    } catch (err) {
      statusEl.style.color = '#ff7b7b';
      statusEl.textContent = err?.message || 'Firebase Sign-Up error — check your Firebase console settings.';
      return;
    }
  }

  const users = loadUsersDB();
  const pwHash = await sha256Hex(`${email}::${pw}`);
  users[email] = {
    name,
    email,
    pwHash,
    createdAt: new Date().toISOString(),
    clearedBays: [...clearedBays]
  };
  saveUsersDB(users);

  setCurrentUser({ name, email });
  nameEl.value = '';
  emailEl.value = '';
  pwEl.value = '';
  statusEl.style.color = '#4ade80';
  statusEl.textContent = `✓ Account created! Welcome, ${name}.`;
  setCoachCue(`✓ Signed in as ${name}! Your stage clears & comments are now linked to your account.`, 'ok');
});

// Sign In Form Submit (autofill-sign-in-form compliant)
document.getElementById('signInForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const emailEl = document.getElementById('signin-email');
  const pwEl = document.getElementById('current-password');
  const statusEl = document.getElementById('signInStatus');
  if (!emailEl || !pwEl || !statusEl) return;

  const email = emailEl.value.trim().toLowerCase();
  const pw = pwEl.value;

  if (fbCloud?.auth) {
    try {
      const cred = await fbCloud.authMod.signInWithEmailAndPassword(fbCloud.auth, email, pw);
      const displayName = cred.user?.displayName || email.split('@')[0];
      setCurrentUser({ name: displayName, email });
      pwEl.value = '';
      statusEl.style.color = '#4ade80';
      statusEl.textContent = `✓ Welcome back, ${displayName} (Firebase Cloud)!`;
      setCoachCue(`✓ Welcome back, ${displayName}!`, 'ok');
      return;
    } catch {
      // Fall back to local WebCrypto DB check if account was created locally
    }
  }

  const users = loadUsersDB();
  const record = users[email];
  const candidateHash = await sha256Hex(`${email}::${pw}`);

  if (!record) {
    statusEl.style.color = '#ff7b7b';
    statusEl.textContent = 'No account found for that email yet — switch to CREATE ACCOUNT tab to register in 5 seconds!';
    return;
  }

  if (record.pwHash !== candidateHash) {
    statusEl.style.color = '#ff7b7b';
    statusEl.textContent = 'Invalid password for this email address.';
    pwEl.select();
    return;
  }

  // Merge any stages saved on the user's account
  if (Array.isArray(record.clearedBays)) {
    record.clearedBays.forEach((id) => clearedBays.add(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...clearedBays]));
    updateDockUI();
    renderStagesModal();
  }

  setCurrentUser({ name: record.name, email: record.email });
  pwEl.value = '';
  statusEl.style.color = '#4ade80';
  statusEl.textContent = `✓ Welcome back, ${record.name}!`;
  setCoachCue(`✓ Welcome back, ${record.name}!`, 'ok');
});

// Optional Firebase Cloud Config Form in Setup Guide Tab
const fbCfgInput = document.getElementById('firebaseConfigInput');
const fbCfgStatus = document.getElementById('firebaseConfigStatus');
if (fbCfgInput) {
  const existingCfg = localStorage.getItem(FIREBASE_CFG_KEY);
  if (existingCfg) fbCfgInput.value = existingCfg;
}

document.getElementById('firebaseConfigForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!fbCfgInput || !fbCfgStatus) return;
  const raw = fbCfgInput.value.trim();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.apiKey || !parsed.projectId) {
      throw new Error('Missing apiKey or projectId');
    }
    localStorage.setItem(FIREBASE_CFG_KEY, JSON.stringify(parsed, null, 2));
    fbCfgStatus.style.color = '#4ade80';
    fbCfgStatus.textContent = `✓ Firebase config saved for project "${parsed.projectId}" — connecting SDK…`;
    await initFirebaseCloudIfConfigured();
    syncAuthUI();
  } catch {
    fbCfgStatus.style.color = '#ff7b7b';
    fbCfgStatus.textContent = 'Please paste a valid JSON object containing at least "apiKey" and "projectId".';
  }
});

document.getElementById('clearFirebaseConfigBtn')?.addEventListener('click', () => {
  localStorage.removeItem(FIREBASE_CFG_KEY);
  fbCloud = null;
  if (fbCfgInput) fbCfgInput.value = '';
  if (fbCfgStatus) {
    fbCfgStatus.style.color = '#ffc570';
    fbCfgStatus.textContent = 'Using Built-In Instant Local & Cross-Tab Auth Mode.';
  }
  syncAuthUI();
});

// ==========================================================================
// 10. COMMENTS CHATBOX DRAWER (GUESTS & LOGGED-IN USERS)
// ==========================================================================
let activeChatFilter = 'all'; // 'all' | 'stage'

function loadComments() {
  try {
    const raw = localStorage.getItem(COMMENTS_DB_KEY);
    if (!raw) {
      localStorage.setItem(COMMENTS_DB_KEY, JSON.stringify(SEED_COMMENTS));
      return [...SEED_COMMENTS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...SEED_COMMENTS];
  } catch {
    return [...SEED_COMMENTS];
  }
}

function saveComments(list) {
  localStorage.setItem(COMMENTS_DB_KEY, JSON.stringify(list.slice(0, 120)));
}

function loadLikedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_COMMENTS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveLikedSet(setObj) {
  localStorage.setItem(LIKED_COMMENTS_KEY, JSON.stringify([...setObj]));
}

function escapeHtmlText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function syncChatStageUI() {
  const bay = BAYS[currentBayIdx];
  if (!bay) return;
  const codeEl = document.getElementById('chatStageCode');
  const postStageEl = document.getElementById('chatPostingStage');
  if (codeEl) codeEl.textContent = bay.id;
  if (postStageEl) postStageEl.textContent = `Stage ${bay.id}`;
  renderChatComments();
}

function renderChatComments() {
  const feedEl = document.getElementById('chatFeed');
  const badgeEl = document.getElementById('chatCountBadge');
  if (!feedEl) return;

  const allComments = loadComments();
  if (badgeEl) badgeEl.textContent = String(allComments.length);

  const currentStageId = BAYS[currentBayIdx]?.id || '001';
  const filtered =
    activeChatFilter === 'stage'
      ? allComments.filter((c) => c.stageId === currentStageId)
      : allComments;

  const likedSet = loadLikedSet();

  if (!filtered.length) {
    feedEl.innerHTML = `
      <div class="chat-msg">
        <p class="chat-body" style="color:var(--dim)">No comments on Stage ${currentStageId} yet. Be the first to share a tip as a Guest or Member!</p>
      </div>
    `;
    return;
  }

  feedEl.innerHTML = filtered
    .map((c) => {
      const isLiked = likedSet.has(c.id);
      const roleClass = c.role === 'member' ? 'member' : 'guest';
      const roleLabel = c.role === 'member' ? 'MEMBER' : 'GUEST';
      return `
        <article class="chat-msg" data-comment-id="${escapeHtmlText(c.id)}">
          <div class="chat-msg-top">
            <div class="chat-author-wrap">
              <span class="chat-badge ${roleClass}">${roleLabel}</span>
              <strong class="chat-author">${escapeHtmlText(c.author)}</strong>
              <span class="chat-stage-tag">STAGE ${escapeHtmlText(c.stageId || '001')}</span>
            </div>
            <span class="chat-time">${escapeHtmlText(c.ts || 'Just now')}</span>
          </div>
          <p class="chat-body">${escapeHtmlText(c.text)}</p>
          <div class="chat-msg-foot">
            <button type="button" class="chat-like-btn${isLiked ? ' liked' : ''}" data-like-id="${escapeHtmlText(c.id)}" aria-label="Like comment">
              ♥ ${Number(c.likes || 0)}
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  feedEl.querySelectorAll('.chat-like-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cid = btn.dataset.likeId;
      const list = loadComments();
      const liked = loadLikedSet();
      const item = list.find((x) => x.id === cid);
      if (!item) return;
      if (liked.has(cid)) {
        liked.delete(cid);
        item.likes = Math.max(0, (item.likes || 1) - 1);
      } else {
        liked.add(cid);
        item.likes = (item.likes || 0) + 1;
      }
      saveLikedSet(liked);
      saveComments(list);
      renderChatComments();
      communityChannel?.postMessage({ type: 'comments_updated' });
    });
  });
}

function toggleChatDrawer(forceState) {
  const drawer = document.getElementById('chatDrawer');
  const toggleBtn = document.getElementById('chatToggleBtn');
  if (!drawer) return;
  const isOpen = typeof forceState === 'boolean' ? forceState : !drawer.classList.contains('open');
  drawer.classList.toggle('open', isOpen);
  drawer.setAttribute('aria-hidden', String(!isOpen));
  toggleBtn?.classList.toggle('active', isOpen);
  toggleBtn?.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) {
    syncAuthUI();
    syncChatStageUI();
    setTimeout(() => document.getElementById('chatInput')?.focus(), 60);
  }
}

document.getElementById('chatToggleBtn')?.addEventListener('click', () => toggleChatDrawer());
document.getElementById('chatCloseBtn')?.addEventListener('click', () => toggleChatDrawer(false));
document.getElementById('menuChatBtn')?.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  document.getElementById('menuBtn')?.setAttribute('aria-expanded', 'false');
  toggleChatDrawer(true);
});

document.getElementById('chatGuestNameInput')?.addEventListener('change', (e) => {
  setGuestNickname(e.target.value);
});

document.getElementById('chatFilterAll')?.addEventListener('click', () => {
  activeChatFilter = 'all';
  document.getElementById('chatFilterAll')?.classList.add('on');
  document.getElementById('chatFilterStage')?.classList.remove('on');
  renderChatComments();
});

document.getElementById('chatFilterStage')?.addEventListener('click', () => {
  activeChatFilter = 'stage';
  document.getElementById('chatFilterStage')?.classList.add('on');
  document.getElementById('chatFilterAll')?.classList.remove('on');
  renderChatComments();
});

// IME-safe Enter-to-Submit on Chatbox Textarea (per modern-web-guidance ime-safe-enter-submit)
const chatFormEl = document.getElementById('chatForm');
const chatInputEl = document.getElementById('chatInput');

chatInputEl?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if (event.isComposing || event.keyCode === 229) {
      return;
    }
    chatFormEl?.requestSubmit();
  }
});

chatFormEl?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!chatInputEl) return;
  const text = chatInputEl.value.trim();
  if (!text) return;

  const user = getCurrentUser();
  const guestInputEl = document.getElementById('chatGuestNameInput');
  if (!user && guestInputEl?.value) {
    setGuestNickname(guestInputEl.value);
  }
  const author = user ? user.name : getGuestNickname();
  const role = user ? 'member' : 'guest';
  const stageId = BAYS[currentBayIdx]?.id || '001';
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newComment = {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    author,
    role,
    stageId,
    text,
    likes: 0,
    ts: nowStr
  };

  const list = loadComments();
  list.unshift(newComment);
  saveComments(list);
  chatInputEl.value = '';
  renderChatComments();
  communityChannel?.postMessage({ type: 'comments_updated' });

  // Also write to Cloud Firestore if Firebase Cloud is configured
  if (fbCloud?.db) {
    fbCloud.fsMod
      .addDoc(fbCloud.fsMod.collection(fbCloud.db, 'comments'), {
        ...newComment,
        createdAtMs: Date.now()
      })
      .catch(() => {});
  }
});

communityChannel?.addEventListener('message', (ev) => {
  if (ev.data?.type === 'comments_updated') {
    renderChatComments();
  }
});

// Fallback for browsers without native <dialog closedby="any"> support
if (!('closedBy' in HTMLDialogElement.prototype)) {
  document.querySelectorAll('dialog[closedby="any"]').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (isDialogContent) return;
      dialog.close();
    });
  });
}

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
syncAdminGateUI();
syncAuthUI();
renderChatComments();
initFirebaseCloudIfConfigured();
requestAnimationFrame(loop);
