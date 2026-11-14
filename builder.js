import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================================
// 1. AUDIO SYNTHESIS ENGINE (Engine hum, Gear shift & Ultrasonic Radar)
// ============================================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.engineOsc = null;
    this.engineGain = null;
    this.lastBeep = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineOsc.type = 'triangle';
    this.engineOsc.frequency.value = 52;
    this.engineGain.gain.value = 0;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 210;
    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on && this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  updateEngine(speed, throttle) {
    if (!this.enabled || !this.ctx || !this.engineGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const abs = Math.abs(speed);
    const freq = 48 + abs * 0.44 + (throttle ? 14 : 0);
    const vol = throttle || abs > 6 ? 0.042 : 0.01;
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.08);
    this.engineGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.08);
  }

  playTone(freq, dur = 0.08, type = 'sine', gainVal = 0.07) {
    if (!this.enabled || !this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + dur + 0.02);
  }

  playGearShift() {
    this.playTone(170, 0.055, 'triangle', 0.06);
    setTimeout(() => this.playTone(230, 0.045, 'sine', 0.045), 35);
  }

  playBump() {
    this.playTone(95, 0.16, 'sawtooth', 0.11);
  }

  playSuccess() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 0.22, 'triangle', 0.08), idx * 90);
    });
  }

  updateRadar(minDist, isReversing) {
    if (!this.enabled || !this.ctx || minDist > 42 || (!isReversing && minDist > 26)) return;
    const now = performance.now();
    const interval = minDist < 10 ? 115 : minDist < 20 ? 220 : 420;
    if (now - this.lastBeep > interval) {
      this.lastBeep = now;
      const tone = minDist < 12 ? 1280 : minDist < 22 ? 980 : 760;
      this.playTone(tone, 0.05, 'sine', 0.04);
    }
  }
}
const sfx = new SoundEngine();

// ============================================================================
// 2. PRESET TEMPLATES & CUSTOM LOT STATE
// ============================================================================
const CUSTOM_LOT_STORAGE_KEY = 'theparktask_custom_lot_3d_v1';
const LOT_BOUNDS = { w: 1100, h: 800 };

const VEHICLE_PROFILES = [
  { id: 'compact', short: 'COMPACT', length: 72, width: 38, wheelbase: 44, maxSteer: 0.68, maxFwd: 150, maxRev: -95, bodyColor: '#2563eb' },
  { id: 'sedan', short: 'SEDAN', length: 82, width: 40, wheelbase: 54, maxSteer: 0.62, maxFwd: 145, maxRev: -98, bodyColor: '#c81d25' },
  { id: 'suv', short: 'SUV', length: 94, width: 44, wheelbase: 60, maxSteer: 0.56, maxFwd: 140, maxRev: -92, bodyColor: '#0f766e' },
  { id: 'van', short: 'VAN', length: 106, width: 48, wheelbase: 68, maxSteer: 0.50, maxFwd: 132, maxRev: -85, bodyColor: '#d97706' }
];
let vehIdx = 1; // Default Sports Sedan
let weatherMode = 'dry';

const CAR = {
  x: -240,
  y: -140,
  angle: 0,
  speed: 0,
  steer: 0,
  length: VEHICLE_PROFILES[1].length,
  width: VEHICLE_PROFILES[1].width,
  wheelbase: VEHICLE_PROFILES[1].wheelbase,
  maxSteer: VEHICLE_PROFILES[1].maxSteer,
  maxFwd: VEHICLE_PROFILES[1].maxFwd,
  maxRev: VEHICLE_PROFILES[1].maxRev,
  bodyColor: VEHICLE_PROFILES[1].bodyColor
};

const PRESETS = {
  compound: {
    name: 'Blocked-In Compound (Maneuver Out)',
    start: { x: -250, y: -150, angle: Math.PI / 2 },
    target: { x: 250, y: 120, angle: 0, w: 56, h: 106 },
    obstacles: [
      { id: 'obs-1', type: 'wall', x: -250, y: -235, w: 170, h: 24, angle: 0 },
      { id: 'obs-2', type: 'wall', x: -345, y: -115, w: 24, h: 260, angle: 0 },
      { id: 'obs-3', type: 'car', label: 'Sedan', x: -165, y: -145, w: 82, h: 40, angle: Math.PI / 2, color: '#2c5282' },
      { id: 'obs-4', type: 'car', label: 'SUV', x: -245, y: 35, w: 94, h: 44, angle: 0, color: '#285e61' },
      { id: 'obs-5', type: 'pillar', x: -45, y: -45, w: 34, h: 34, angle: 0 },
      { id: 'obs-6', type: 'cone', x: 75, y: -20, r: 10 },
      { id: 'obs-7', type: 'cone', x: 75, y: 70, r: 10 },
      { id: 'obs-8', type: 'car', label: 'Sedan', x: 250, y: 45, w: 82, h: 40, angle: 0, color: '#744210' },
      { id: 'obs-9', type: 'car', label: 'Sedan', x: 250, y: 195, w: 82, h: 40, angle: 0, color: '#4a5568' },
      { id: 'obs-10', type: 'curb', x: 350, y: 120, w: 22, h: 250, angle: 0 }
    ]
  },
  parallel_squeeze: {
    name: 'Tight Parallel Squeeze Exit',
    start: { x: -180, y: 170, angle: 0 },
    target: { x: 210, y: -140, angle: 0, w: 56, h: 106 },
    obstacles: [
      { id: 'obs-p1', type: 'curb', x: -175, y: 225, w: 380, h: 22, angle: 0 },
      { id: 'obs-p2', type: 'car', label: 'SUV', x: -292, y: 170, w: 94, h: 44, angle: 0, color: '#285e61' },
      { id: 'obs-p3', type: 'car', label: 'Sedan', x: -65, y: 170, w: 82, h: 40, angle: 0, color: '#3e4a59' },
      { id: 'obs-p4', type: 'cone', x: 55, y: 110, r: 10 },
      { id: 'obs-p5', type: 'pillar', x: 15, y: -10, w: 36, h: 36, angle: 0 },
      { id: 'obs-p6', type: 'car', label: 'Sedan', x: 96, y: -140, w: 82, h: 40, angle: 0, color: '#702459' },
      { id: 'obs-p7', type: 'car', label: 'SUV', x: 325, y: -140, w: 94, h: 44, angle: 0, color: '#2c5282' },
      { id: 'obs-p8', type: 'curb', x: 210, y: -195, w: 340, h: 22, angle: 0 }
    ]
  },
  pillar_maze: {
    name: 'Basement Pillar Maze',
    start: { x: -340, y: 180, angle: -Math.PI / 2 },
    target: { x: 310, y: -155, angle: 0, w: 56, h: 106 },
    obstacles: [
      { id: 'obs-m1', type: 'pillar', x: -210, y: 95, w: 38, h: 38, angle: 0 },
      { id: 'obs-m2', type: 'pillar', x: -210, y: -95, w: 38, h: 38, angle: 0 },
      { id: 'obs-m3', type: 'pillar', x: 0, y: 95, w: 38, h: 38, angle: 0 },
      { id: 'obs-m4', type: 'pillar', x: 0, y: -95, w: 38, h: 38, angle: 0 },
      { id: 'obs-m5', type: 'pillar', x: 185, y: 20, w: 38, h: 38, angle: 0 },
      { id: 'obs-m6', type: 'wall', x: -115, y: 0, w: 120, h: 24, angle: 0 },
      { id: 'obs-m7', type: 'car', label: 'SUV', x: 95, y: 165, w: 94, h: 44, angle: Math.PI / 2, color: '#4a5568' },
      { id: 'obs-m8', type: 'cone', x: 115, y: -145, r: 10 },
      { id: 'obs-m9', type: 'wall', x: 390, y: -155, w: 22, h: 180, angle: 0 }
    ]
  },
  angled_lot: {
    name: '45° Diagonal Shopping Mall',
    start: { x: -250, y: -135, angle: Math.PI / 4 },
    target: { x: 235, y: 125, angle: -Math.PI / 4, w: 56, h: 106 },
    obstacles: [
      { id: 'obs-a1', type: 'car', label: 'Sedan', x: -315, y: -175, w: 82, h: 40, angle: Math.PI / 4, color: '#2c5282' },
      { id: 'obs-a2', type: 'car', label: 'SUV', x: -185, y: -95, w: 94, h: 44, angle: Math.PI / 4, color: '#744210' },
      { id: 'obs-a3', type: 'curb', x: -250, y: -230, w: 280, h: 20, angle: 0 },
      { id: 'obs-a4', type: 'cone', x: 10, y: 0, r: 10 },
      { id: 'obs-a5', type: 'car', label: 'Sedan', x: 170, y: 175, w: 82, h: 40, angle: -Math.PI / 4, color: '#285e61' },
      { id: 'obs-a6', type: 'car', label: 'Sedan', x: 300, y: 75, w: 82, h: 40, angle: -Math.PI / 4, color: '#702459' }
    ]
  },
  blank: {
    name: 'Blank Lot (Build From Scratch)',
    start: { x: -200, y: 0, angle: 0 },
    target: { x: 220, y: 0, angle: 0, w: 56, h: 106 },
    obstacles: []
  }
};

let customEnv = cloneEnv(PRESETS.compound);
let appMode = 'build'; // 'build' | 'drive'
let selectedRef = { kind: 'start', id: null }; // 'start' | 'target' | 'obstacle'

// Drive & Replay Runtime State
let showGuides = true;
let bayCleared = false;
let bayPosState = 'outside';
let startTime = performance.now();
let collisions = 0;
let reversals = 0;
let lastGear = 'N';
let activeGear = 'D';
let lastCollisionBump = 0;
let autoDemo = false;
let demoTime = 0;
let demoPlan = null;
let demoDone = false;
let isReplaying = false;
let replayTime = 0;
let replayPlan = null;
let driveHistory = [];
let driveMistakes = [];
let lastSavedDrive = null;
let lastReplaySampleAt = 0;
let lastCloseCallAt = 0;
let hitObsId = null;
let hitObsUntil = 0;

function cloneEnv(src) {
  return {
    name: src.name || 'Custom Environment',
    start: { ...src.start },
    target: { w: 56, h: 106, ...src.target },
    obstacles: (src.obstacles || []).map((o, i) => ({
      ...o,
      id: o.id || `obs-${Date.now()}-${i}`
    }))
  };
}

// ============================================================================
// 3. THREE.JS 3D SCENE SETUP, LIGHTS, PROCEDURAL MATERIALS & MESH BUILDERS
// ============================================================================
const canvasEl = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#161417');
scene.fog = new THREE.FogExp2('#161417', 0.00072);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 4, 4200);
camera.position.set(0, 420, 460);

const orbitControls = new OrbitControls(camera, canvasEl);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.08;
orbitControls.maxPolarAngle = Math.PI * 0.46;
orbitControls.minDistance = 120;
orbitControls.maxDistance = 1150;
orbitControls.target.set(0, 0, 0);

// Lights
const hemiLight = new THREE.HemisphereLight('#fff2df', '#2c2529', 0.95);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight('#fff4e3', 2.1);
sunLight.position.set(240, 460, 220);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -620;
sunLight.shadow.camera.right = 620;
sunLight.shadow.camera.top = 460;
sunLight.shadow.camera.bottom = -460;
sunLight.shadow.camera.near = 60;
sunLight.shadow.camera.far = 1200;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight('#93c5fd', 0.45);
fillLight.position.set(-280, 220, -240);
scene.add(fillLight);

// Procedural Asphalt Canvas Texture
function createAsphaltTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#201e21';
  g.fillRect(0, 0, 1024, 1024);

  // Fine asphalt speckle grain
  for (let i = 0; i < 16000; i++) {
    const px = Math.random() * 1024;
    const py = Math.random() * 1024;
    const v = 24 + Math.floor(Math.random() * 24);
    g.fillStyle = `rgb(${v},${v - 1},${v + 1})`;
    g.fillRect(px, py, 2, 2);
  }

  // Subtle architectural grid
  g.strokeStyle = 'rgba(255, 224, 178, 0.065)';
  g.lineWidth = 2;
  for (let x = 0; x <= 1024; x += 64) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 1024);
    g.stroke();
  }
  for (let y = 0; y <= 1024; y += 64) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(1024, y);
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1.1);
  tex.anisotropy = 4;
  return tex;
}

const groundGeo = new THREE.PlaneGeometry(LOT_BOUNDS.w, LOT_BOUNDS.h);
const groundMat = new THREE.MeshStandardMaterial({
  map: createAsphaltTexture(),
  roughness: 0.88,
  metalness: 0.08
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Outer Safety Lot Frame Curb
const perimeterMat = new THREE.MeshStandardMaterial({ color: '#3b3431', roughness: 0.78 });
const stripeMat = new THREE.MeshBasicMaterial({ color: '#ffc570' });
[
  { x: 0, z: -LOT_BOUNDS.h / 2 - 8, w: LOT_BOUNDS.w + 32, d: 16 },
  { x: 0, z: LOT_BOUNDS.h / 2 + 8, w: LOT_BOUNDS.w + 32, d: 16 },
  { x: -LOT_BOUNDS.w / 2 - 8, z: 0, w: 16, d: LOT_BOUNDS.h },
  { x: LOT_BOUNDS.w / 2 + 8, z: 0, w: 16, d: LOT_BOUNDS.h }
].forEach((b) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, 12, b.d), perimeterMat);
  m.position.set(b.x, 6, b.z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
});
const perimeterLine = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-LOT_BOUNDS.w / 2 + 12, 0.8, -LOT_BOUNDS.h / 2 + 12),
    new THREE.Vector3(LOT_BOUNDS.w / 2 - 12, 0.8, -LOT_BOUNDS.h / 2 + 12),
    new THREE.Vector3(LOT_BOUNDS.w / 2 - 12, 0.8, LOT_BOUNDS.h / 2 - 12),
    new THREE.Vector3(-LOT_BOUNDS.w / 2 + 12, 0.8, LOT_BOUNDS.h / 2 - 12)
  ]),
  stripeMat
);
scene.add(perimeterLine);

// Groups for dynamic 3D entities
const pickables = [];
const obstacleGroup = new THREE.Group();
const guideGroup = new THREE.Group();
const replayGroup = new THREE.Group();
scene.add(obstacleGroup, guideGroup, replayGroup);

// Floating Text Badge Helper (Sprite)
function createBadgeSprite(text, bgHex, fgHex, borderHex) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = bgHex;
  g.strokeStyle = borderHex;
  g.lineWidth = 4;
  g.beginPath();
  g.roundRect(10, 10, 236, 44, 14);
  g.fill();
  g.stroke();
  g.fillStyle = fgHex;
  g.font = 'bold 21px "Geist Mono", monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 33);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(78, 20, 1);
  return sp;
}

// Detailed 3D Car Builder (Used for both Player Tonna Coupe & Parked Obstacle Cars)
function build3DCarMesh({ length = 82, width = 40, bodyColor = '#c81d25', isPlayer = false }) {
  const carGroup = new THREE.Group();
  const sX = length / 82;
  const sZ = width / 40;

  // Chassis base
  const chassisMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.28,
    metalness: 0.55
  });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(80 * sX, 13, 38 * sZ), chassisMat);
  chassis.position.set(0, 9.5, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  chassis.userData.isBody = true;
  carGroup.add(chassis);

  // Sporty Cabin Greenhouse
  const cabinMat = new THREE.MeshStandardMaterial({
    color: '#111622',
    roughness: 0.14,
    metalness: 0.8
  });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(42 * sX, 11, 32 * sZ), cabinMat);
  cabin.position.set(-4 * sX, 20.5, 0);
  cabin.castShadow = true;
  carGroup.add(cabin);

  // Roof cap
  const roof = new THREE.Mesh(new THREE.BoxGeometry(30 * sX, 2.5, 29 * sZ), chassisMat);
  roof.position.set(-5 * sX, 26.2, 0);
  roof.userData.isBody = true;
  carGroup.add(roof);

  // Front Bumper Gold Trim (helps orient front vs rear instantly in 3D)
  const trimMat = new THREE.MeshStandardMaterial({ color: isPlayer ? '#ffc570' : '#94a3b8', metalness: 0.7, roughness: 0.3 });
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 36 * sZ), trimMat);
  splitter.position.set(39.5 * sX, 4.5, 0);
  carGroup.add(splitter);

  // 4 Wheels (Front two sit inside pivot groups for steering animation)
  const tireGeo = new THREE.CylinderGeometry(7.2, 7.2, 5, 18);
  tireGeo.rotateX(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: '#111114', roughness: 0.9 });
  const rimGeo = new THREE.CylinderGeometry(4.2, 4.2, 5.4, 12);
  rimGeo.rotateX(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({ color: isPlayer ? '#facc15' : '#cbd5e1', metalness: 0.85, roughness: 0.25 });

  const makeWheel = () => {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(tireGeo, tireMat);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    tire.castShadow = true;
    w.add(tire, rim);
    return w;
  };

  const frontPivots = [];
  const wheelCoords = [
    { x: 25 * sX, z: -18.5 * sZ, front: true },
    { x: 25 * sX, z: 18.5 * sZ, front: true },
    { x: -26 * sX, z: -18.5 * sZ, front: false },
    { x: -26 * sX, z: 18.5 * sZ, front: false }
  ];
  wheelCoords.forEach((wc) => {
    const pivot = new THREE.Group();
    pivot.position.set(wc.x, 7.2, wc.z);
    pivot.add(makeWheel());
    carGroup.add(pivot);
    if (wc.front) frontPivots.push(pivot);
  });

  // Headlights & Taillights
  const headMat = new THREE.MeshBasicMaterial({ color: '#fff8e7' });
  const tailMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
  [-12 * sZ, 12 * sZ].forEach((zOff) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4, 7 * sZ), headMat);
    hl.position.set(40.2 * sX, 11, zOff);
    carGroup.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4, 8 * sZ), tailMat);
    tl.position.set(-40.2 * sX, 11.5, zOff);
    tl.userData.isTailLight = true;
    carGroup.add(tl);
  });

  if (isPlayer) {
    // Volumetric Night Headlight Beams (meshes + real Three.js SpotLight)
    const beamMat = new THREE.MeshBasicMaterial({
      color: '#fff3d6',
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const beamGeo = new THREE.ConeGeometry(42, 165, 24, 1, true);
    beamGeo.rotateZ(-Math.PI / 2);
    beamGeo.translate(82, 0, 0);
    const leftBeam = new THREE.Mesh(beamGeo, beamMat);
    leftBeam.position.set(40, 10, -12);
    const rightBeam = new THREE.Mesh(beamGeo, beamMat.clone());
    rightBeam.position.set(40, 10, 12);
    carGroup.add(leftBeam, rightBeam);

    const headSpot = new THREE.SpotLight('#fff4de', 0, 320, Math.PI * 0.24, 0.55, 1.2);
    headSpot.position.set(40, 18, 0);
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(220, 0, 0);
    carGroup.add(headSpot, spotTarget);
    headSpot.target = spotTarget;

    carGroup.userData.frontPivots = frontPivots;
    carGroup.userData.headSpot = headSpot;
    carGroup.userData.beams = [leftBeam, rightBeam];
  }

  return carGroup;
}

// Player 3D Car
let playerCarMesh = build3DCarMesh({ length: CAR.length, width: CAR.width, bodyColor: CAR.bodyColor || '#c81d25', isPlayer: true });
scene.add(playerCarMesh);

function rebuildPlayerBuilderMesh() {
  if (playerCarMesh) scene.remove(playerCarMesh);
  playerCarMesh = build3DCarMesh({ length: CAR.length, width: CAR.width, bodyColor: CAR.bodyColor || '#c81d25', isPlayer: true });
  scene.add(playerCarMesh);
}

// 3D Rain Particles & Rear Reverse Camera
const RAIN_COUNT = 750;
const rainPosArr = new Float32Array(RAIN_COUNT * 3);
for (let i = 0; i < RAIN_COUNT; i++) {
  rainPosArr[i * 3] = (Math.random() - 0.5) * LOT_BOUNDS.w;
  rainPosArr[i * 3 + 1] = Math.random() * 260 + 10;
  rainPosArr[i * 3 + 2] = (Math.random() - 0.5) * LOT_BOUNDS.h;
}
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPosArr, 3));
const rainPoints = new THREE.Points(
  rainGeo,
  new THREE.PointsMaterial({ color: '#bae6fd', size: 2.2, transparent: true, opacity: 0.65 })
);
rainPoints.visible = false;
scene.add(rainPoints);

const reverseCamera = new THREE.PerspectiveCamera(68, 1.6, 2, 1600);

// Start Ghost Pad ("MY CAR START" marker on the lot so player can drag where car begins!)
const startMarkerGroup = new THREE.Group();
const startPadMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(CAR.length + 14, CAR.width + 14),
  new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.24, side: THREE.DoubleSide })
);
startPadMesh.rotation.x = -Math.PI / 2;
startPadMesh.position.y = 0.6;
const startBorder = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-(CAR.length + 14) / 2, 1.0, -(CAR.width + 14) / 2),
    new THREE.Vector3((CAR.length + 14) / 2, 1.0, -(CAR.width + 14) / 2),
    new THREE.Vector3((CAR.length + 14) / 2, 1.0, (CAR.width + 14) / 2),
    new THREE.Vector3(-(CAR.length + 14) / 2, 1.0, (CAR.width + 14) / 2)
  ]),
  new THREE.LineBasicMaterial({ color: '#38bdf8' })
);
const startSprite = createBadgeSprite('MY CAR START', 'rgba(8,24,42,0.9)', '#7dd3fc', '#38bdf8');
startSprite.position.set(0, 44, 0);
startMarkerGroup.add(startPadMesh, startBorder, startSprite);
startMarkerGroup.userData.pickItem = { kind: 'start' };
scene.add(startMarkerGroup);

// Target Park Box ("TARGET PARK" illuminated 3D bay)
const targetBayGroup = new THREE.Group();
const targetFillMat = new THREE.MeshBasicMaterial({
  color: '#ffc570',
  transparent: true,
  opacity: 0.22,
  side: THREE.DoubleSide
});
const targetFillMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), targetFillMat);
targetFillMesh.rotation.x = -Math.PI / 2;
targetFillMesh.position.y = 0.7;

const targetEdgeMat = new THREE.LineBasicMaterial({ color: '#ffc570' });
const targetEdgeLoop = new THREE.LineLoop(new THREE.BufferGeometry(), targetEdgeMat);
targetEdgeLoop.position.y = 1.2;

const targetBeaconGroup = new THREE.Group();
const targetSprite = createBadgeSprite('🅿️ TARGET PARK', 'rgba(20,14,8,0.9)', '#ffe4a3', '#ffc570');
targetSprite.position.set(0, 42, 0);
targetBayGroup.add(targetFillMesh, targetEdgeLoop, targetBeaconGroup, targetSprite);
targetBayGroup.userData.pickItem = { kind: 'target' };
scene.add(targetBayGroup);

// Selection Ring Highlighter in 3D Build Mode
const selectionRingMesh = new THREE.Mesh(
  new THREE.RingGeometry(46, 52, 40),
  new THREE.MeshBasicMaterial({ color: '#4ade80', side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
);
selectionRingMesh.rotation.x = -Math.PI / 2;
selectionRingMesh.position.y = 1.8;
scene.add(selectionRingMesh);

function updateTargetBayGeometry() {
  const { h, w, x, y, angle } = customEnv.target;
  targetFillMesh.scale.set(h, w, 1);

  const hw = h / 2;
  const hh = w / 2;
  targetEdgeLoop.geometry.dispose();
  targetEdgeLoop.geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-hw, 0, -hh),
    new THREE.Vector3(hw, 0, -hh),
    new THREE.Vector3(hw, 0, hh),
    new THREE.Vector3(-hw, 0, hh)
  ]);

  // Rebuild 4 corner illuminated pylon LEDs
  while (targetBeaconGroup.children.length) targetBeaconGroup.remove(targetBeaconGroup.children[0]);
  const pylonGeo = new THREE.CylinderGeometry(2.5, 3, 12, 12);
  const pylonMat = new THREE.MeshBasicMaterial({ color: '#ffc570' });
  [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh]
  ].forEach(([cx, cz]) => {
    const p = new THREE.Mesh(pylonGeo, pylonMat);
    p.position.set(cx, 6, cz);
    targetBeaconGroup.add(p);
  });

  targetBayGroup.position.set(x, 0, y);
  targetBayGroup.rotation.y = -angle;
}

// Build 3D Mesh for Any Obstacle Type
function create3DObstacle(obs) {
  const grp = new THREE.Group();
  grp.userData.pickItem = { kind: 'obstacle', id: obs.id };

  if (obs.type === 'pedestrian') {
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 5.5, 14, 14),
      new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.5 })
    );
    torso.position.y = 17;
    torso.castShadow = true;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(4, 14, 14),
      new THREE.MeshStandardMaterial({ color: '#fcd34d', roughness: 0.6 })
    );
    head.position.y = 28;
    const legs = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.2, 11, 12),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.85 })
    );
    legs.position.y = 5.5;
    grp.add(legs, torso, head);
  } else if (obs.type === 'cone') {
    const r = obs.r || 10;
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 1.1, r * 1.25, 3, 16),
      new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.6 })
    );
    base.position.y = 1.5;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(r, 26, 18),
      new THREE.MeshStandardMaterial({ color: '#ff6d3b', roughness: 0.45 })
    );
    cone.position.y = 14;
    cone.castShadow = true;
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.44, r * 0.66, 6.5, 18),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 })
    );
    collar.position.y = 15;
    grp.add(base, cone, collar);
  } else if (obs.type === 'car') {
    const car = build3DCarMesh({
      length: obs.w || 82,
      width: obs.h || 40,
      bodyColor: obs.color || '#3e4a59',
      isPlayer: false
    });
    grp.add(car);
  } else if (obs.type === 'pillar') {
    const pw = obs.w || 36;
    const pd = obs.h || 36;
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(pw, 72, pd),
      new THREE.MeshStandardMaterial({ color: '#645c58', roughness: 0.85 })
    );
    col.position.y = 36;
    col.castShadow = true;
    col.receiveShadow = true;
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(pw + 2, 12, pd + 2),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.45 })
    );
    band.position.y = 16;
    grp.add(col, band);
  } else if (obs.type === 'wall') {
    const ww = obs.w || 160;
    const wd = obs.h || 24;
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(ww, 38, wd),
      new THREE.MeshStandardMaterial({ color: '#443d3a', roughness: 0.85 })
    );
    wall.position.y = 19;
    wall.castShadow = true;
    wall.receiveShadow = true;
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(ww + 2, 5, wd + 2),
      new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.5 })
    );
    cap.position.y = 39;
    grp.add(wall, cap);
  } else {
    // curb
    const cw = obs.w || 180;
    const cd = obs.h || 22;
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(cw, 11, cd),
      new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.78 })
    );
    curb.position.y = 5.5;
    curb.castShadow = true;
    curb.receiveShadow = true;
    grp.add(curb);
  }

  grp.userData.obsRef = obs;
  grp.position.set(obs.x, 0, obs.y);
  grp.rotation.y = -(obs.angle || 0);
  return grp;
}

function rebuild3DEnvironmentMeshes() {
  while (obstacleGroup.children.length) obstacleGroup.remove(obstacleGroup.children[0]);
  pickables.length = 0;

  startMarkerGroup.position.set(customEnv.start.x, 0, customEnv.start.y);
  startMarkerGroup.rotation.y = -customEnv.start.angle;
  pickables.push(startMarkerGroup);

  updateTargetBayGeometry();
  pickables.push(targetBayGroup);

  customEnv.obstacles.forEach((obs) => {
    const mesh = create3DObstacle(obs);
    obstacleGroup.add(mesh);
    pickables.push(mesh);
  });

  if (appMode === 'build') {
    CAR.x = customEnv.start.x;
    CAR.y = customEnv.start.y;
    CAR.angle = customEnv.start.angle;
    CAR.speed = 0;
    CAR.steer = 0;
  }

  const countLabel = document.getElementById('obsCountLabel');
  if (countLabel) countLabel.textContent = String(customEnv.obstacles.length);
  syncInspectorUI();
}

// ============================================================================
// 4. COLLISION GEOMETRY, PROXIMITY LIGHTS & [P] PARK GRADING
// ============================================================================
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
    return Math.hypot(px - obs.x, py - obs.y) - (obs.r || 10);
  }
  if (obs.type === 'pedestrian') {
    return Math.hypot(px - obs.x, py - obs.y) - 9;
  }
  const a = obs.angle || 0;
  const dx = px - obs.x;
  const dy = py - obs.y;
  const lx = dx * Math.cos(-a) - dy * Math.sin(-a);
  const ly = dx * Math.sin(-a) + dy * Math.cos(-a);
  const dxEdge = Math.abs(lx) - obs.w / 2;
  const dyEdge = Math.abs(ly) - obs.h / 2;
  if (dxEdge <= 0 && dyEdge <= 0) {
    return Math.max(dxEdge, dyEdge);
  }
  return Math.hypot(Math.max(dxEdge, 0), Math.max(dyEdge, 0));
}

function getCarClearance(carX, carY, carAngle) {
  const corners = getRectCorners(carX, carY, CAR.length, CAR.width, carAngle);
  const cos = Math.cos(carAngle);
  const sin = Math.sin(carAngle);
  const samples = [
    ...corners,
    { x: carX + cos * (CAR.length / 2), y: carY + sin * (CAR.length / 2) },
    { x: carX - cos * (CAR.length / 2), y: carY - sin * (CAR.length / 2) },
    { x: carX + sin * (CAR.width / 2), y: carY - cos * (CAR.width / 2) },
    { x: carX - sin * (CAR.width / 2), y: carY + cos * (CAR.width / 2) }
  ];

  // Check lot boundary walls as well
  let minDist = Infinity;
  let nearestObs = null;
  const halfW = LOT_BOUNDS.w / 2 - 10;
  const halfH = LOT_BOUNDS.h / 2 - 10;
  for (const pt of samples) {
    const wallDist = Math.min(halfW - Math.abs(pt.x), halfH - Math.abs(pt.y));
    if (wallDist < minDist) {
      minDist = wallDist;
      nearestObs = { id: 'lot-wall', type: 'wall' };
    }
  }

  for (const obs of customEnv.obstacles) {
    for (const pt of samples) {
      const d = pointToObsDist(pt.x, pt.y, obs);
      if (d < minDist) {
        minDist = d;
        nearestObs = obs;
      }
    }
    if (obs.type !== 'cone') {
      const obsCorners = getRectCorners(obs.x, obs.y, obs.w, obs.h, obs.angle || 0);
      for (const oc of obsCorners) {
        const d = pointToObsDist(oc.x, oc.y, { x: carX, y: carY, w: CAR.length, h: CAR.width, angle: carAngle });
        if (d < minDist) {
          minDist = d;
          nearestObs = obs;
        }
      }
    }
  }
  return { dist: minDist, obs: nearestObs };
}

function getProximityLightInfo(clearancePx) {
  if (clearancePx < 16) {
    return { level: 'red', hex: '#ef4444', label: 'RED · TOO CLOSE!' };
  }
  if (clearancePx < 42) {
    return { level: 'orange', hex: '#f97316', label: 'ORANGE · GETTING CLOSER' };
  }
  return { level: 'green', hex: '#22c55e', label: 'GREEN · SAFE' };
}

function updateProximityHUD(light) {
  const pill = document.getElementById('proxLightPill');
  const txt = document.getElementById('proxLightText');
  const bG = document.getElementById('bulbGreen');
  const bO = document.getElementById('bulbOrange');
  const bR = document.getElementById('bulbRed');
  if (!pill || !txt) return;
  pill.style.color = light.hex;
  pill.style.borderColor = light.hex;
  txt.textContent = light.label;
  bG?.classList.toggle('lit', light.level === 'green');
  bO?.classList.toggle('lit', light.level === 'orange');
  bR?.classList.toggle('lit', light.level === 'red');
}

function setCoachCue(text, state = 'neutral') {
  const cue = document.getElementById('coachCue');
  const txt = document.getElementById('coachCueText');
  if (!cue || !txt) return;
  txt.textContent = text;
  cue.classList.remove('ok', 'warn');
  if (state === 'ok') cue.classList.add('ok');
  if (state === 'warn') cue.classList.add('warn');
}

function checkParked(forceParkClick = false) {
  const t = customEnv.target;
  const dx = CAR.x - t.x;
  const dy = CAR.y - t.y;
  const lx = dx * Math.cos(-t.angle) - dy * Math.sin(-t.angle);
  const ly = dx * Math.sin(-t.angle) + dy * Math.cos(-t.angle);

  const rawAngleDiff = Math.abs(Math.atan2(Math.sin(CAR.angle - t.angle), Math.cos(CAR.angle - t.angle)));
  const angleDiff = Math.min(rawAngleDiff, Math.abs(rawAngleDiff - Math.PI));
  const aligned = angleDiff < 0.18;
  const centered = Math.abs(lx) < Math.max(8, (t.h - CAR.length) / 2 + 12) && Math.abs(ly) < Math.max(6, (t.w - CAR.width) / 2 + 8);
  const insideRoughly = Math.abs(lx) < t.h / 2 + 14 && Math.abs(ly) < t.w / 2 + 12;
  const stopped = Math.abs(CAR.speed) < 15;
  const gearPBtn = document.getElementById('gearP');

  if (aligned && centered) {
    bayPosState = 'aligned';
    if (!bayCleared) gearPBtn?.classList.add('ready-to-park');
    if ((forceParkClick || activeGear === 'P') && stopped && !bayCleared) {
      gearPBtn?.classList.remove('ready-to-park');
      completeCustomDrive(angleDiff, Math.hypot(lx, ly));
    } else {
      setCoachCue('✓ Box is GREEN! Click [P] PARK (or press P) to lock brakes & grade your maneuver!', 'ok');
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
        label: `Off-Center (${degOff}°, ${cmOff}cm)`,
        fix: `Mistake: Parked ${degOff}° crooked / ${cmOff}cm off-center. Straighten steering before clicking [P].`
      });
      completeCustomDrive(angleDiff, Math.hypot(lx, ly));
    } else {
      setCoachCue('Inside target box — center car & straighten wheels, then click [P] PARK to grade.', 'neutral');
    }
  } else {
    bayPosState = 'outside';
    gearPBtn?.classList.remove('ready-to-park');
  }
}

function saveDriveSnapshot() {
  if (driveHistory.length < 2) return;
  const last = driveHistory[driveHistory.length - 1];
  lastSavedDrive = {
    samples: driveHistory.map((s) => ({ ...s })),
    mistakes: driveMistakes.map((m) => ({ ...m })),
    totalTime: Math.max(0.5, last.t)
  };
}

function completeCustomDrive(angleDiff, offsetPx) {
  bayCleared = true;
  bayPosState = 'passed';
  document.getElementById('gearP')?.classList.remove('ready-to-park');

  const finalRelT = Math.max(0.2, (performance.now() - startTime) / 1000);
  driveHistory.push({
    t: finalRelT,
    x: CAR.x,
    y: CAR.y,
    angle: CAR.angle,
    steer: CAR.steer,
    speed: 0,
    gear: 'P',
    clearance: getCarClearance(CAR.x, CAR.y, CAR.angle).dist
  });
  saveDriveSnapshot();

  const stars = collisions === 0 && reversals <= 4 && angleDiff < 0.18 ? 3 : collisions <= 1 ? 2 : 1;
  const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('passSignTitle').textContent = `${starStr} · CUSTOM LOT GRADED`;
  document.body.classList.add('bay-passed');
  sfx.playSuccess();

  const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(1);
  const alignPct = Math.max(55, Math.round(100 - angleDiff * 140 - offsetPx * 0.6));
  const penalty = collisions * 12;
  const finalScore = Math.max(45, Math.min(100, alignPct - penalty));
  const grade = finalScore >= 94 ? 'A+' : finalScore >= 86 ? 'A' : finalScore >= 75 ? 'B' : 'C';

  document.getElementById('shGrade').textContent = grade;
  document.getElementById('shSub').textContent = `${customEnv.obstacles.length} OBSTACLES · 3D SANDBOX`;
  document.getElementById('shTitle').innerHTML = `Custom <b>Maneuver</b>`;
  document.getElementById('shScoreText').textContent = `${finalScore}% PARKING PRECISION`;

  document.getElementById('shFacts').innerHTML = `
    <div><dt>TIME ELAPSED</dt><i></i><dd><b>${elapsedSec} s</b></dd></div>
    <div><dt>ALIGNMENT</dt><i></i><dd><b>${(angleDiff * 57.3).toFixed(1)}°</b></dd></div>
    <div><dt>CENTER OFFSET</dt><i></i><dd><b>${Math.round(offsetPx * 4.5)} cm</b></dd></div>
    <div><dt>GEAR SHIFTS</dt><i></i><dd><b>${reversals}</b></dd></div>
    <div><dt>OBSTACLE HITS</dt><i></i><dd><b>${collisions}</b></dd></div>
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
      ? 'Clean 3D exit & park with zero hits! Replay your drive or jump back into Build Mode to make an even tighter challenge.'
      : `Recorded ${driveMistakes.length} mistake(s) / close call(s). Click "↺ REPLAY MY DRIVE" to review the exact 3D spots on the lot.`;
  document.getElementById('shTip').innerHTML = `<b>Tip:</b> Watch the 3D Green / Orange / Red guide lights when pivoting past tight bumpers & pillars.`;

  document.body.classList.add('is-detail');
}

// ============================================================================
// 5. 3D TRAJECTORY GUIDES & 3D REPLAY VISUALIZER
// ============================================================================
function clearThreeGroup(group) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    if (child.traverse) {
      child.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose());
          else node.material.dispose();
        }
      });
    }
  }
}

function update3DGuidesMesh() {
  clearThreeGroup(guideGroup);
  const liveClearance = getCarClearance(CAR.x, CAR.y, CAR.angle).dist;
  let worstClearance = liveClearance;

  if (!showGuides || appMode === 'build') {
    updateProximityHUD(getProximityLightInfo(liveClearance));
    return;
  }

  const steps = 20;
  const stepDt = 0.075;
  const dir = activeGear === 'R' || keys.down || CAR.speed < -2 ? -1 : 1;
  const simSpeed = dir * 95;

  let sx = CAR.x;
  let sy = CAR.y;
  let sa = CAR.angle;

  const leftPts = [];
  const rightPts = [];
  const stepLights = [];

  for (let i = 0; i < steps; i++) {
    const w = (simSpeed / CAR.wheelbase) * Math.tan(CAR.steer);
    sa += w * stepDt;
    sx += Math.cos(sa) * simSpeed * stepDt;
    sy += Math.sin(sa) * simSpeed * stepDt;

    const stepClearance = getCarClearance(sx, sy, sa).dist;
    if (i < 12 && stepClearance < worstClearance) worstClearance = stepClearance;
    const light = getProximityLightInfo(Math.min(liveClearance, stepClearance));
    stepLights.push(light);

    const rearOff = dir < 0 ? -CAR.length / 2 : CAR.length / 2;
    const rx = sx + Math.cos(sa) * rearOff;
    const ry = sy + Math.sin(sa) * rearOff;
    const nx = -Math.sin(sa) * (CAR.width / 2 - 4);
    const ny = Math.cos(sa) * (CAR.width / 2 - 4);
    leftPts.push(new THREE.Vector3(rx + nx, 2.2, ry + ny));
    rightPts.push(new THREE.Vector3(rx - nx, 2.2, ry - ny));
  }

  const activeLight = getProximityLightInfo(worstClearance);
  updateProximityHUD(activeLight);

  // Colored rail segments
  [leftPts, rightPts].forEach((pts) => {
    for (let i = 1; i < pts.length; i++) {
      const segGeo = new THREE.BufferGeometry().setFromPoints([pts[i - 1], pts[i]]);
      const segMat = new THREE.LineBasicMaterial({ color: stepLights[i].hex });
      guideGroup.add(new THREE.Line(segGeo, segMat));
    }
  });

  // Glowing 3D LED beacon spheres & distance crossbars
  const orbGeo = new THREE.SphereGeometry(2.6, 10, 10);
  [3, 8, 13, 18].forEach((idx) => {
    const l = leftPts[idx];
    const r = rightPts[idx];
    const light = stepLights[idx];
    if (!l || !r || !light) return;

    const barGeo = new THREE.BufferGeometry().setFromPoints([l, r]);
    guideGroup.add(new THREE.Line(barGeo, new THREE.LineBasicMaterial({ color: light.hex })));

    const orbMat = new THREE.MeshBasicMaterial({ color: light.hex });
    const oL = new THREE.Mesh(orbGeo, orbMat);
    oL.position.copy(l);
    const oR = new THREE.Mesh(orbGeo, orbMat);
    oR.position.copy(r);
    guideGroup.add(oL, oR);
  });
}

function rebuild3DReplayMarkers() {
  clearThreeGroup(replayGroup);
  if (!replayPlan) return;

  // Color-coded 3D trail line of the user's recorded drive
  const pts = replayPlan.samples;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const info = getProximityLightInfo(b.clearance ?? 60);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.x, 3.0, a.y),
      new THREE.Vector3(b.x, 3.0, b.y)
    ]);
    replayGroup.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: info.hex })));
  }

  // Ideal A* / Demo route (cyan) if available
  if (replayPlan.idealSamples && replayPlan.idealSamples.length > 1) {
    const idealPts = replayPlan.idealSamples.map((p) => new THREE.Vector3(p.x, 2.5, p.y));
    replayGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(idealPts),
        new THREE.LineBasicMaterial({ color: '#38bdf8' })
      )
    );
  }

  // Floating 3D Mistake Markers
  (replayPlan.mistakes || []).forEach((m, idx) => {
    const dia = new THREE.Mesh(
      new THREE.OctahedronGeometry(7, 0),
      new THREE.MeshBasicMaterial({ color: '#ef4444' })
    );
    dia.position.set(m.x, 26, m.y);
    const sp = createBadgeSprite(`⚠ #${idx + 1} ${m.label}`, 'rgba(42,8,10,0.92)', '#fca5a5', '#ef4444');
    sp.position.set(m.x, 48, m.y);
    replayGroup.add(dia, sp);
  });
}

// ============================================================================
// 6. HYBRID GRID PATHFINDER FOR DEMO BUTTON (SOLVES CUSTOM ENVIRONMENTS!)
// ============================================================================
function buildCustomDemoPath() {
  const cellSize = 36;
  const cols = Math.floor(LOT_BOUNDS.w / cellSize);
  const rows = Math.floor(LOT_BOUNDS.h / cellSize);
  const toGrid = (wx, wy) => ({
    gx: Math.max(0, Math.min(cols - 1, Math.floor((wx + LOT_BOUNDS.w / 2) / cellSize))),
    gy: Math.max(0, Math.min(rows - 1, Math.floor((wy + LOT_BOUNDS.h / 2) / cellSize)))
  });
  const toWorld = (gx, gy) => ({
    x: -LOT_BOUNDS.w / 2 + (gx + 0.5) * cellSize,
    y: -LOT_BOUNDS.h / 2 + (gy + 0.5) * cellSize
  });

  const isCellBlocked = (gx, gy) => {
    const w = toWorld(gx, gy);
    for (const obs of customEnv.obstacles) {
      if (pointToObsDist(w.x, w.y, obs) < 28) return true;
    }
    return false;
  };

  const s = toGrid(customEnv.start.x, customEnv.start.y);
  const g = toGrid(customEnv.target.x, customEnv.target.y);
  const key = (gx, gy) => `${gx},${gy}`;

  const open = [{ gx: s.gx, gy: s.gy, gCost: 0, f: Math.hypot(g.gx - s.gx, g.gy - s.gy) }];
  const cameFrom = new Map();
  const bestG = new Map([[key(s.gx, s.gy), 0]]);
  const dirs = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41]
  ];

  let found = null;
  let guard = 0;
  while (open.length && guard++ < 4000) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    if (cur.gx === g.gx && cur.gy === g.gy) {
      found = cur;
      break;
    }
    for (const [dx, dy, cost] of dirs) {
      const nx = cur.gx + dx;
      const ny = cur.gy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      if ((nx !== g.gx || ny !== g.gy) && isCellBlocked(nx, ny)) continue;
      const ng = cur.gCost + cost;
      const nk = key(nx, ny);
      if (ng < (bestG.get(nk) ?? Infinity)) {
        bestG.set(nk, ng);
        cameFrom.set(nk, cur);
        open.push({ gx: nx, gy: ny, gCost: ng, f: ng + Math.hypot(g.gx - nx, g.gy - ny) });
      }
    }
  }

  if (!found) return null;

  const waypoints = [];
  let trace = found;
  while (trace) {
    waypoints.unshift(toWorld(trace.gx, trace.gy));
    trace = cameFrom.get(key(trace.gx, trace.gy));
  }
  waypoints[0] = { x: customEnv.start.x, y: customEnv.start.y };
  waypoints[waypoints.length - 1] = { x: customEnv.target.x, y: customEnv.target.y };

  // Build smooth interpolated samples from waypoints
  const samples = [];
  let tAccum = 0;
  let prevAng = customEnv.start.angle;
  for (let i = 0; i < waypoints.length; i++) {
    const curr = waypoints[i];
    const next = waypoints[Math.min(waypoints.length - 1, i + 1)];
    const prev = waypoints[Math.max(0, i - 1)];
    const dist = i > 0 ? Math.hypot(curr.x - prev.x, curr.y - prev.y) : 0;
    tAccum += dist / 76;
    const ang =
      i === waypoints.length - 1
        ? customEnv.target.angle
        : i === 0
          ? customEnv.start.angle
          : Math.atan2(next.y - prev.y, next.x - prev.x);
    const dot = Math.cos(ang - prevAng);
    const gear = dot < -0.25 ? 'R' : 'D';
    samples.push({ t: tAccum, x: curr.x, y: curr.y, angle: ang, steer: 0, speed: gear === 'R' ? -68 : 76, gear });
    prevAng = ang;
  }
  samples.push({
    t: tAccum + 0.1,
    x: customEnv.target.x,
    y: customEnv.target.y,
    angle: customEnv.target.angle,
    steer: 0,
    speed: 0,
    gear: 'P'
  });

  return { samples, totalTime: tAccum + 0.1 };
}

function startCustomDemo() {
  if (appMode === 'build') setMode('drive');
  if (autoDemo) {
    autoDemo = false;
    document.getElementById('demoBtn')?.classList.remove('demo-on');
    setCoachCue('Demo paused — you have manual control.', 'neutral');
    return;
  }
  resetDriveState();
  const plan = buildCustomDemoPath();
  if (!plan) {
    setCoachCue('⚠ No clear path exists between Start and Target Park! Switch to BUILD LOT and widen a gap.', 'warn');
    return;
  }
  demoPlan = plan;
  demoTime = 0;
  autoDemo = true;
  demoDone = false;
  document.getElementById('demoBtn')?.classList.add('demo-on');
  setCoachCue('3D AUTO-ROUTE DEMO · Following clear path from Start to Target Park…', 'ok');
}

// ============================================================================
// 7. MODE SWITCHING, BUILDER INTERACTION (3D RAYCASTER DRAG & INSPECTOR)
// ============================================================================
function setActiveGear(gear, silent = false) {
  const prev = activeGear;
  activeGear = gear;
  document.querySelectorAll('.gear-btn').forEach((btn) => {
    const match = btn.dataset.gear === gear;
    btn.classList.toggle('on', match);
    btn.setAttribute('aria-checked', String(match));
  });
  if (gear === 'P') {
    CAR.speed = 0;
    document.getElementById('gearP')?.classList.remove('ready-to-park');
  }
  if (!silent && prev !== gear) {
    if (sfx.enabled) sfx.init();
    sfx.playGearShift();
  }
  if (gear === 'P' && !silent && appMode === 'drive' && !bayCleared && !autoDemo && !isReplaying) {
    checkParked(true);
    if (!bayCleared && bayPosState === 'outside') {
      setCoachCue('Drive into the Target Park box first, then click [P] PARK to grade.', 'warn');
    }
  }
}

function resetDriveState() {
  CAR.x = customEnv.start.x;
  CAR.y = customEnv.start.y;
  CAR.angle = customEnv.start.angle;
  CAR.speed = 0;
  CAR.steer = 0;
  bayCleared = false;
  bayPosState = 'outside';
  startTime = performance.now();
  collisions = 0;
  reversals = 0;
  lastGear = 'N';
  autoDemo = false;
  demoDone = false;
  isReplaying = false;
  replayPlan = null;
  hitObsId = null;
  driveHistory = [
    { t: 0, x: CAR.x, y: CAR.y, angle: CAR.angle, steer: 0, speed: 0, gear: 'D', clearance: 80 }
  ];
  driveMistakes = [];
  lastReplaySampleAt = performance.now();
  lastCloseCallAt = 0;
  while (replayGroup.children.length) replayGroup.remove(replayGroup.children[0]);
  document.body.classList.remove('is-detail', 'bay-passed');
  document.getElementById('demoBtn')?.classList.remove('demo-on');
  document.getElementById('replayBtn')?.classList.remove('replay-on');
  document.getElementById('gearP')?.classList.remove('ready-to-park');
  setActiveGear('D', true);
}

function setMode(nextMode) {
  appMode = nextMode;
  document.body.classList.toggle('mode-build', nextMode === 'build');
  document.body.classList.toggle('mode-drive', nextMode === 'drive');
  document.getElementById('btnModeBuild')?.classList.toggle('on', nextMode === 'build');
  document.getElementById('btnModeDrive')?.classList.toggle('on', nextMode === 'drive');

  const mobileFabText = document.getElementById('mobileModeFabText');
  if (mobileFabText) {
    mobileFabText.textContent = nextMode === 'build' ? '🚗 DRIVE' : '🛠 BUILD';
  }

  resetDriveState();
  if (nextMode === 'build') {
    orbitControls.enabled = true;
    selectionRingMesh.visible = true;
    setCoachCue('3D BUILD MODE: Drag objects directly on the 3D lot (drag empty space to orbit camera).', 'neutral');
    document.getElementById('dockTelemetry').textContent = 'MODE: 3D BUILD · DRAG CAR START, TARGET PARK, OR OBSTACLES';
  } else {
    selectionRingMesh.visible = false;
    setCoachCue('3D DRIVE MODE: Maneuver out of your parked spot & park inside Target Park, then click [P]!', 'ok');
  }
}

function startReplay() {
  if (appMode === 'build') setMode('drive');
  if (isReplaying) {
    isReplaying = false;
    document.getElementById('replayBtn')?.classList.remove('replay-on');
    setCoachCue('Replay stopped — manual control active.', 'neutral');
    return;
  }
  autoDemo = false;
  if (driveHistory.length >= 2) saveDriveSnapshot();
  const source =
    lastSavedDrive && lastSavedDrive.samples.length >= 2
      ? lastSavedDrive
      : {
          samples: [
            { t: 0, x: customEnv.start.x, y: customEnv.start.y, angle: customEnv.start.angle, steer: 0, speed: 0, gear: 'D', clearance: 60 },
            { t: 1.0, x: CAR.x, y: CAR.y, angle: CAR.angle, steer: CAR.steer, speed: 0, gear: activeGear, clearance: 60 }
          ],
          mistakes: [...driveMistakes],
          totalTime: 1.0
        };

  const norm = [];
  let acc = 0;
  for (let i = 0; i < source.samples.length; i++) {
    if (i > 0) acc += Math.max(0.02, Math.min(0.24, source.samples[i].t - source.samples[i - 1].t));
    norm.push({ ...source.samples[i], t: acc });
  }
  const ideal = buildCustomDemoPath();
  replayPlan = {
    samples: norm,
    mistakes: source.mistakes || [],
    idealSamples: ideal ? ideal.samples : [],
    totalTime: Math.max(0.7, acc)
  };
  document.body.classList.remove('is-detail', 'bay-passed');
  bayCleared = false;
  isReplaying = true;
  replayTime = 0;
  rebuild3DReplayMarkers();
  document.getElementById('replayBtn')?.classList.add('replay-on');
  setCoachCue(`REPLAYING 3D MANEUVER · ${replayPlan.mistakes.length} mistake(s) marked on the lot…`, replayPlan.mistakes.length ? 'warn' : 'ok');
}

// Selection & Inspector Logic
function getSelectedObject() {
  if (selectedRef.kind === 'start') return { ...customEnv.start, kind: 'start', label: 'MY CAR START' };
  if (selectedRef.kind === 'target') return { ...customEnv.target, kind: 'target', label: 'TARGET PARK' };
  const obs = customEnv.obstacles.find((o) => o.id === selectedRef.id);
  return obs ? { ...obs, ref: obs, kind: 'obstacle', label: obs.label || obs.type.toUpperCase() } : null;
}

function updateSelectionRing() {
  const sel = getSelectedObject();
  if (!sel || appMode !== 'build') {
    selectionRingMesh.visible = false;
    return;
  }
  selectionRingMesh.visible = true;
  selectionRingMesh.position.set(sel.x, 1.8, sel.y);
  const rad = sel.type === 'cone' ? 24 : Math.max(sel.w || 82, sel.h || 42) * 0.68;
  const baseScale = rad / 49;
  selectionRingMesh.scale.set(baseScale, baseScale, 1);
}

function syncInspectorUI() {
  const sel = getSelectedObject();
  document.getElementById('selectStartCarBtn')?.classList.toggle('active', selectedRef.kind === 'start');
  document.getElementById('selectTargetBayBtn')?.classList.toggle('active', selectedRef.kind === 'target');

  const nameEl = document.getElementById('inspSelectedName');
  const angleSlider = document.getElementById('inspAngleSlider');
  const angleVal = document.getElementById('inspAngleVal');
  const wRow = document.getElementById('inspWidthRow');
  const hRow = document.getElementById('inspHeightRow');
  const wSlider = document.getElementById('inspWidthSlider');
  const hSlider = document.getElementById('inspHeightSlider');
  const wVal = document.getElementById('inspWidthVal');
  const hVal = document.getElementById('inspHeightVal');
  const colorRow = document.getElementById('inspColorRow');
  const actionRow = document.getElementById('inspActionRow');

  if (!sel) {
    if (nameEl) nameEl.textContent = 'NONE SELECTED';
    updateSelectionRing();
    return;
  }

  if (nameEl) nameEl.textContent = sel.label;
  const deg = Math.round((((sel.angle || 0) * 180) / Math.PI + 540) % 360 - 180);
  if (angleSlider) angleSlider.value = String(deg);
  if (angleVal) angleVal.textContent = `${deg}°`;

  const isObs = sel.kind === 'obstacle';
  const isBoxObs = isObs && sel.type !== 'cone';
  const isTarget = sel.kind === 'target';

  if (wRow) wRow.style.display = isBoxObs || isTarget ? 'flex' : 'none';
  if (hRow) hRow.style.display = isBoxObs || isTarget ? 'flex' : 'none';
  if (colorRow) colorRow.style.display = isObs && sel.type === 'car' ? 'flex' : 'none';
  if (actionRow) actionRow.style.display = isObs ? 'flex' : 'none';

  if (isBoxObs && wSlider && hSlider && wVal && hVal) {
    wSlider.value = String(Math.round(sel.w));
    hSlider.value = String(Math.round(sel.h));
    wVal.textContent = `${Math.round(sel.w)}px`;
    hVal.textContent = `${Math.round(sel.h)}px`;
  } else if (isTarget && wSlider && hSlider && wVal && hVal) {
    wSlider.value = String(Math.round(sel.h));
    hSlider.value = String(Math.round(sel.w));
    wVal.textContent = `${Math.round(sel.h)}px`;
    hVal.textContent = `${Math.round(sel.w)}px`;
  }

  document.querySelectorAll('#inspSwatches .bs-swatch').forEach((sw) => {
    sw.classList.toggle('on', sw.dataset.color === sel.color);
  });

  updateSelectionRing();
}

// 3D Raycaster Object Dragging on Ground Plane (y = 0)
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const rayHit = new THREE.Vector3();
let draggingItem = null;
let dragOffset = { x: 0, y: 0 };

function updatePointerNDC(e) {
  const rect = canvasEl.getBoundingClientRect();
  pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

canvasEl.addEventListener('pointerdown', (e) => {
  if (appMode !== 'build' || e.button !== 0) return;
  updatePointerNDC(e);
  raycaster.setFromCamera(pointerNDC, camera);

  // Pick among start car, target bay, and obstacle meshes
  const hits = raycaster.intersectObjects(pickables, true);
  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj && !obj.userData.pickItem) obj = obj.parent;
    if (obj?.userData?.pickItem) {
      const ref = obj.userData.pickItem;
      selectedRef = ref.kind === 'obstacle' ? { kind: 'obstacle', id: ref.id } : { kind: ref.kind, id: null };
      syncInspectorUI();

      // Compute ground offset for smooth zero-jump 3D dragging
      if (raycaster.ray.intersectPlane(groundPlane, rayHit)) {
        const targetObj =
          ref.kind === 'start'
            ? customEnv.start
            : ref.kind === 'target'
              ? customEnv.target
              : customEnv.obstacles.find((o) => o.id === ref.id);
        if (targetObj) {
          draggingItem = { ref, obj, targetObj };
          dragOffset.x = targetObj.x - rayHit.x;
          dragOffset.y = targetObj.y - rayHit.z;
          orbitControls.enabled = false;
          canvasEl.setPointerCapture(e.pointerId);
        }
      }
    }
  }
});

canvasEl.addEventListener('pointermove', (e) => {
  if (!draggingItem || appMode !== 'build') return;
  updatePointerNDC(e);
  raycaster.setFromCamera(pointerNDC, camera);
  if (raycaster.ray.intersectPlane(groundPlane, rayHit)) {
    const nx = Math.max(-LOT_BOUNDS.w / 2 + 45, Math.min(LOT_BOUNDS.w / 2 - 45, rayHit.x + dragOffset.x));
    const ny = Math.max(-LOT_BOUNDS.h / 2 + 45, Math.min(LOT_BOUNDS.h / 2 - 45, rayHit.z + dragOffset.y));
    draggingItem.targetObj.x = Math.round(nx);
    draggingItem.targetObj.y = Math.round(ny);
    if ('baseX' in draggingItem.targetObj || draggingItem.targetObj.patrolDx) {
      draggingItem.targetObj.baseX = draggingItem.targetObj.x;
      draggingItem.targetObj.baseY = draggingItem.targetObj.y;
    }
    draggingItem.obj.position.set(draggingItem.targetObj.x, 0, draggingItem.targetObj.y);

    if (draggingItem.ref.kind === 'start') {
      CAR.x = customEnv.start.x;
      CAR.y = customEnv.start.y;
    }
    updateSelectionRing();
  }
});

const endBuilderDrag = () => {
  if (draggingItem) {
    draggingItem = null;
    orbitControls.enabled = true;
  }
};
canvasEl.addEventListener('pointerup', endBuilderDrag);
canvasEl.addEventListener('pointercancel', endBuilderDrag);

// Compact Minimize / Expand Drawer Logic
const builderSidebarEl = document.getElementById('builderSidebar');
const builderMinBtn = document.getElementById('builderMinBtn');
const builderMinLabel = document.getElementById('builderMinLabel');

function setBuilderMinimized(minimized) {
  if (!builderSidebarEl) return;
  builderSidebarEl.classList.toggle('is-minimized', minimized);
  if (builderMinBtn) builderMinBtn.setAttribute('aria-expanded', String(!minimized));
  if (builderMinLabel) builderMinLabel.textContent = minimized ? '▾ EXPAND' : '▴ MINIMIZE';
}

builderMinBtn?.addEventListener('click', () => {
  const isMin = builderSidebarEl?.classList.contains('is-minimized');
  setBuilderMinimized(!isMin);
});

if (window.innerWidth <= 760) {
  setBuilderMinimized(true);
}

// Add Obstacle Palette Buttons (clicking small icon drops obstacle & expands Inspector)
document.querySelectorAll('[data-add-obs]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (appMode !== 'build') setMode('build');
    setBuilderMinimized(false);
    const kind = btn.dataset.addObs;
    const jitterX = Math.round((Math.random() - 0.5) * 90);
    const jitterY = Math.round((Math.random() - 0.5) * 90);
    const templates = {
      sedan: { type: 'car', label: 'Sedan', w: 82, h: 40, color: '#2c5282' },
      suv: { type: 'car', label: 'SUV', w: 96, h: 44, color: '#285e61' },
      wall: { type: 'wall', label: 'Wall', w: 160, h: 24 },
      curb: { type: 'curb', label: 'Curb', w: 180, h: 22 },
      pillar: { type: 'pillar', label: 'Pillar', w: 36, h: 36 },
      cone: { type: 'cone', label: 'Cone', r: 10 },
      traffic: { type: 'car', label: 'Moving Car', w: 82, h: 40, color: '#6366f1', patrolDx: 150, patrolSpeed: 0.85 },
      walker: { type: 'pedestrian', label: 'Walker', w: 18, h: 18, patrolDx: 110, patrolSpeed: 0.9 }
    };
    const spec = templates[kind] || templates.sedan;
    const newObs = {
      id: `obs-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      ...spec,
      x: jitterX,
      y: jitterY,
      baseX: jitterX,
      baseY: jitterY,
      angle: 0
    };
    customEnv.obstacles.push(newObs);
    selectedRef = { kind: 'obstacle', id: newObs.id };
    rebuild3DEnvironmentMeshes();
    setBuilderMinimized(false);
    setCoachCue(`Added ${spec.label} to the 3D lot — drag it into place or rotate below!`, 'neutral');
  });
});

document.getElementById('selectStartCarBtn')?.addEventListener('click', () => {
  selectedRef = { kind: 'start', id: null };
  setBuilderMinimized(false);
  syncInspectorUI();
});
document.getElementById('selectTargetBayBtn')?.addEventListener('click', () => {
  selectedRef = { kind: 'target', id: null };
  setBuilderMinimized(false);
  syncInspectorUI();
});

// Inspector Controls
function applyAngleChange(newDeg) {
  const normDeg = ((newDeg + 540) % 360) - 180;
  const rad = (normDeg * Math.PI) / 180;
  if (selectedRef.kind === 'start') {
    customEnv.start.angle = rad;
    CAR.angle = rad;
  } else if (selectedRef.kind === 'target') {
    customEnv.target.angle = rad;
  } else {
    const obs = customEnv.obstacles.find((o) => o.id === selectedRef.id);
    if (obs) obs.angle = rad;
  }
  rebuild3DEnvironmentMeshes();
}

document.getElementById('inspAngleSlider')?.addEventListener('input', (e) => applyAngleChange(Number(e.target.value)));
document.querySelectorAll('[data-rot-delta]').forEach((b) => {
  b.addEventListener('click', () => {
    const cur = Number(document.getElementById('inspAngleSlider')?.value || 0);
    applyAngleChange(cur + Number(b.dataset.rotDelta));
  });
});
document.querySelectorAll('[data-rot-abs]').forEach((b) => {
  b.addEventListener('click', () => applyAngleChange(Number(b.dataset.rotAbs)));
});

document.getElementById('inspWidthSlider')?.addEventListener('input', (e) => {
  const val = Number(e.target.value);
  if (selectedRef.kind === 'target') {
    customEnv.target.h = val;
  } else if (selectedRef.kind === 'obstacle') {
    const obs = customEnv.obstacles.find((o) => o.id === selectedRef.id);
    if (obs && obs.type !== 'cone') obs.w = val;
  }
  rebuild3DEnvironmentMeshes();
});

document.getElementById('inspHeightSlider')?.addEventListener('input', (e) => {
  const val = Number(e.target.value);
  if (selectedRef.kind === 'target') {
    customEnv.target.w = val;
  } else if (selectedRef.kind === 'obstacle') {
    const obs = customEnv.obstacles.find((o) => o.id === selectedRef.id);
    if (obs && obs.type !== 'cone') obs.h = val;
  }
  rebuild3DEnvironmentMeshes();
});

document.querySelectorAll('#inspSwatches .bs-swatch').forEach((sw) => {
  sw.addEventListener('click', () => {
    const obs = customEnv.obstacles.find((o) => o.id === selectedRef.id);
    if (obs && obs.type === 'car') {
      obs.color = sw.dataset.color;
      rebuild3DEnvironmentMeshes();
    }
  });
});

document.getElementById('inspDuplicateBtn')?.addEventListener('click', () => {
  const obs = customEnv.obstacles.find((o) => o.id === selectedRef.id);
  if (!obs) return;
  const copy = {
    ...obs,
    id: `obs-${Date.now()}`,
    x: Math.min(LOT_BOUNDS.w / 2 - 50, obs.x + 32),
    y: Math.min(LOT_BOUNDS.h / 2 - 50, obs.y + 32)
  };
  customEnv.obstacles.push(copy);
  selectedRef = { kind: 'obstacle', id: copy.id };
  rebuild3DEnvironmentMeshes();
});

function deleteSelectedObstacle() {
  if (selectedRef.kind !== 'obstacle') return;
  customEnv.obstacles = customEnv.obstacles.filter((o) => o.id !== selectedRef.id);
  selectedRef = { kind: 'start', id: null };
  rebuild3DEnvironmentMeshes();
}
document.getElementById('inspDeleteBtn')?.addEventListener('click', deleteSelectedObstacle);

// Templates & Save/Load
document.getElementById('presetSelect')?.addEventListener('change', (e) => {
  const key = e.target.value;
  if (key === 'custom_saved') {
    const raw = localStorage.getItem(CUSTOM_LOT_STORAGE_KEY);
    if (!raw) {
      setCoachCue('No saved custom lot found yet — arrange your lot and click 💾 SAVE MY LOT first!', 'warn');
      return;
    }
    customEnv = cloneEnv(JSON.parse(raw));
  } else if (PRESETS[key]) {
    customEnv = cloneEnv(PRESETS[key]);
  }
  document.getElementById('dockTitle').innerHTML = `<b>SANDBOX</b>${customEnv.name}`;
  selectedRef = { kind: 'start', id: null };
  rebuild3DEnvironmentMeshes();
  if (appMode === 'drive') resetDriveState();
});

document.getElementById('saveCustomLotBtn')?.addEventListener('click', () => {
  customEnv.name = 'My Saved Custom Lot';
  localStorage.setItem(CUSTOM_LOT_STORAGE_KEY, JSON.stringify(customEnv));
  const selEl = document.getElementById('presetSelect');
  if (selEl) selEl.value = 'custom_saved';
  document.getElementById('dockTitle').innerHTML = `<b>SANDBOX</b>My Saved Custom Lot`;
  setCoachCue('✓ Saved your 3D custom lot locally! You can reload it anytime.', 'ok');
});

document.getElementById('shareCustomLotBtn')?.addEventListener('click', () => {
  try {
    const json = JSON.stringify(customEnv);
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    const encoded = btoa(bin);
    const shareUrl = `${location.origin}${location.pathname}#lot=${encodeURIComponent(encoded)}`;
    history.replaceState(null, '', `#lot=${encodeURIComponent(encoded)}`);
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCoachCue('🔗 Shareable 3D Lot Link copied! Paste it to friends so they can drive your setup.', 'ok');
  } catch {
    setCoachCue('Could not encode share link.', 'warn');
  }
});

document.getElementById('builderVehicleBtn')?.addEventListener('click', () => {
  vehIdx = (vehIdx + 1) % VEHICLE_PROFILES.length;
  const p = VEHICLE_PROFILES[vehIdx];
  CAR.length = p.length;
  CAR.width = p.width;
  CAR.wheelbase = p.wheelbase;
  CAR.maxSteer = p.maxSteer;
  CAR.maxFwd = p.maxFwd;
  CAR.maxRev = p.maxRev;
  CAR.bodyColor = p.bodyColor;
  const lbl = document.getElementById('builderVehicleLabel');
  if (lbl) lbl.textContent = `🚗 ${p.short}`;
  rebuildPlayerBuilderMesh();
  setCoachCue(`Switched to ${p.short} (${p.length}px length · ${p.wheelbase}px wheelbase)!`, 'ok');
});

document.getElementById('weatherBtn')?.addEventListener('click', () => {
  weatherMode = weatherMode === 'dry' ? 'rain' : 'dry';
  const isRain = weatherMode === 'rain';
  const wBtn = document.getElementById('weatherBtn');
  if (wBtn) {
    wBtn.dataset.weather = weatherMode;
    wBtn.classList.toggle('rain-on', isRain);
    wBtn.setAttribute('aria-pressed', String(isRain));
  }
  groundMat.roughness = isRain ? 0.24 : 0.88;
  groundMat.metalness = isRain ? 0.28 : 0.08;
  groundMat.needsUpdate = true;
  setCoachCue(isRain ? '🌧 RAIN & WET ASPHALT ACTIVE in 3D Builder!' : '☀ DRY ASPHALT restored.', 'neutral');
});

document.getElementById('clearObstaclesBtn')?.addEventListener('click', () => {
  customEnv.obstacles = [];
  selectedRef = { kind: 'start', id: null };
  rebuild3DEnvironmentMeshes();
  setCoachCue('Cleared all obstacles from the lot.', 'neutral');
});

// ============================================================================
// 8. KEYBOARD, STEERING WHEEL, CAMERA MODES & HUD BUTTONS
// ============================================================================
const keys = { up: false, down: false, left: false, right: false, brake: false, gas: false };

document.getElementById('btnModeBuild')?.addEventListener('click', () => setMode('build'));
document.getElementById('btnModeDrive')?.addEventListener('click', () => setMode('drive'));
document.getElementById('quickDriveToggleBtn')?.addEventListener('click', () => setMode('drive'));
document.getElementById('mobileModeFab')?.addEventListener('click', () => setMode(appMode === 'build' ? 'drive' : 'build'));
document.getElementById('startDriveCtaBtn')?.addEventListener('click', () => setMode('drive'));
document.getElementById('shEditLotBtn')?.addEventListener('click', () => setMode('build'));
document.getElementById('shReplayBtn')?.addEventListener('click', startReplay);
document.getElementById('shRetryBtn')?.addEventListener('click', resetDriveState);
document.getElementById('replayBtn')?.addEventListener('click', startReplay);
document.getElementById('demoBtn')?.addEventListener('click', startCustomDemo);
document.getElementById('resetHudBtn')?.addEventListener('click', resetDriveState);

// Camera Switcher
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
    if (btn.dataset.cam === 'wide') {
      camera.position.set(0, 560, 380);
      orbitControls.target.set(0, 0, 0);
    }
  });
});

// Guides & Day/Night & Audio
const guideBtn = document.getElementById('guideBtn');
guideBtn?.addEventListener('click', () => {
  showGuides = !showGuides;
  guideBtn.classList.toggle('active', showGuides);
  guideBtn.setAttribute('aria-pressed', String(showGuides));
  guideBtn.querySelector('span').textContent = showGuides ? 'GUIDE: ON' : 'GUIDE: OFF';
});

const ambBtn = document.getElementById('ambBtn');
ambBtn?.addEventListener('click', () => {
  const night = document.body.classList.toggle('amb-on');
  ambBtn.dataset.mode = night ? 'night' : 'day';
  scene.background.set(night ? '#050814' : '#161417');
  scene.fog.color.set(night ? '#050814' : '#161417');
  sunLight.intensity = night ? 0.55 : 2.1;
  hemiLight.intensity = night ? 0.38 : 0.95;
  const spot = playerCarMesh.userData.headSpot;
  if (spot) spot.intensity = night ? 6.5 : 0;
  (playerCarMesh.userData.beams || []).forEach((b) => {
    b.material.opacity = night ? 0.22 : 0.0;
  });
});

const soundBtn = document.getElementById('sound2');
soundBtn?.addEventListener('click', () => {
  sfx.setEnabled(!sfx.enabled);
  soundBtn.setAttribute('aria-pressed', String(sfx.enabled));
  document.getElementById('soundWaves').style.opacity = sfx.enabled ? '1' : '0.2';
});

['keydown', 'pointerdown'].forEach((evt) => {
  window.addEventListener(evt, () => {
    if (sfx.enabled) sfx.init();
  }, { once: true });
});

// Keyboard Drive + Delete Shortcut
window.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const k = e.key.toLowerCase();

  if (appMode === 'build' && (e.key === 'Delete' || e.key === 'Backspace')) {
    deleteSelectedObstacle();
    return;
  }

  if (appMode === 'build' && ['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
    return;
  }

  if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
    if (autoDemo) autoDemo = false;
    if (isReplaying) isReplaying = false;
  }
  if (k === 'w' || e.key === 'ArrowUp') { keys.up = true; setActiveGear('D', true); e.preventDefault(); }
  if (k === 's' || e.key === 'ArrowDown') { keys.down = true; setActiveGear('R', true); e.preventDefault(); }
  if (k === 'a' || e.key === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
  if (k === 'd' || e.key === 'ArrowRight') { keys.right = true; e.preventDefault(); }
  if (k === 'p') { setActiveGear('P', false); e.preventDefault(); }
  if (e.code === 'Space') { keys.brake = true; e.preventDefault(); }
  if (k === 'r') resetDriveState();
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || e.key === 'ArrowUp') keys.up = false;
  if (k === 's' || e.key === 'ArrowDown') keys.down = false;
  if (k === 'a' || e.key === 'ArrowLeft') keys.left = false;
  if (k === 'd' || e.key === 'ArrowRight') keys.right = false;
  if (e.code === 'Space') keys.brake = false;
});

// Rotational Steering Wheel & Pedals
let analogueSteer = null;
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
  let cachedRect = null;

  const getPointerInfo = (e) => {
    const rect = cachedRect || steerWheelEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    return { angle: Math.hypot(dx, dy) >= 10 ? Math.atan2(dy, dx) : null, radius: Math.max(28, rect.width / 2) };
  };

  steerWheelEl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (appMode !== 'drive') setMode('drive');
    cachedRect = steerWheelEl.getBoundingClientRect();
    steerWheelEl.setPointerCapture(e.pointerId);
    steerWheelEl.classList.add('dragging');
    wheelLockNorm = CAR.steer / CAR.maxSteer;
    analogueSteer = wheelLockNorm;
    const info = getPointerInfo(e);
    lastPointerAngle = info.angle;
    lastPointerX = e.clientX;
  });

  steerWheelEl.addEventListener('pointermove', (e) => {
    if (analogueSteer === null) return;
    const info = getPointerInfo(e);
    const dx = e.clientX - lastPointerX;
    lastPointerX = e.clientX;
    if (info.angle !== null && lastPointerAngle !== null) {
      let dAngle = info.angle - lastPointerAngle;
      while (dAngle > Math.PI) dAngle -= Math.PI * 2;
      while (dAngle < -Math.PI) dAngle += Math.PI * 2;
      lastPointerAngle = info.angle;
      wheelLockNorm = Math.max(-1, Math.min(1, wheelLockNorm + dAngle / (Math.PI * 0.85)));
    } else {
      lastPointerAngle = info.angle;
      wheelLockNorm = Math.max(-1, Math.min(1, wheelLockNorm + dx / info.radius));
    }
    analogueSteer = wheelLockNorm;
    CAR.steer = analogueSteer * CAR.maxSteer;
    syncStickVisual(analogueSteer);
  });

  const rel = () => {
    analogueSteer = null;
    cachedRect = null;
    lastPointerAngle = null;
    steerWheelEl.classList.remove('dragging');
  };
  steerWheelEl.addEventListener('pointerup', rel);
  steerWheelEl.addEventListener('pointercancel', rel);
  steerWheelEl.addEventListener('dblclick', () => {
    CAR.steer = 0;
    syncStickVisual(0);
  });
}

document.querySelectorAll('.gear-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (appMode !== 'drive') setMode('drive');
    setActiveGear(btn.dataset.gear);
  });
});

function bindPadBtn(id, keyProp) {
  const el = document.getElementById(id);
  if (!el) return;
  const on = (e) => {
    e.preventDefault();
    if (appMode !== 'drive') setMode('drive');
    keys[keyProp] = true;
    el.classList.add('active');
  };
  const off = () => {
    keys[keyProp] = false;
    el.classList.remove('active');
  };
  el.addEventListener('pointerdown', on);
  window.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('pointerleave', off);
}
bindPadBtn('btnBrake', 'brake');
bindPadBtn('btnGas', 'gas');

// ============================================================================
// 9. PHYSICS & 3D RENDER LOOP
// ============================================================================
function updatePhysics(dt) {
  if (appMode !== 'drive' || bayCleared) return;

  // Step moving lane traffic & crossing pedestrians
  for (const obs of customEnv.obstacles) {
    if (!obs.patrolDx && !obs.patrolDy) continue;
    const distToCar = Math.hypot(CAR.x - obs.x, CAR.y - obs.y);
    if (distToCar < 60) continue; // Yield cleanly when player car is close
    obs.patrolClock = (obs.patrolClock || 0) + dt;
    const ph = obs.patrolClock * (obs.patrolSpeed || 0.85);
    const prevOx = obs.x;
    const prevOy = obs.y;
    obs.x = (obs.baseX ?? obs.x) + Math.sin(ph) * (obs.patrolDx || 0);
    obs.y = (obs.baseY ?? obs.y) + Math.sin(ph) * (obs.patrolDy || 0);
    const dvx = obs.x - prevOx;
    const dvy = obs.y - prevOy;
    if (Math.hypot(dvx, dvy) > 0.02) {
      obs.angle = Math.atan2(dvy, dvx);
    }
  }

  if (isReplaying && replayPlan) {
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
      isReplaying = false;
      document.getElementById('replayBtn')?.classList.remove('replay-on');
      setCoachCue('REPLAY COMPLETE · Click Reset (↺) to retry or 🛠 BUILD LOT to adjust obstacles.', 'ok');
      return;
    }
    let idx = 0;
    while (idx < list.length - 2 && list[idx + 1].t < replayTime) idx++;
    const a = list[idx];
    const b = list[idx + 1] || a;
    const u = Math.max(0, Math.min(1, (replayTime - a.t) / Math.max(0.0001, b.t - a.t)));
    CAR.x = a.x + (b.x - a.x) * u;
    CAR.y = a.y + (b.y - a.y) * u;
    CAR.angle = a.angle + Math.atan2(Math.sin(b.angle - a.angle), Math.cos(b.angle - a.angle)) * u;
    CAR.steer = (a.steer || 0) + ((b.steer || 0) - (a.steer || 0)) * u;
    CAR.speed = (a.speed || 0) + ((b.speed || 0) - (a.speed || 0)) * u;
    setActiveGear(b.gear || 'D', true);
    const activeMistake = replayPlan.mistakes.find((m) => Math.hypot(CAR.x - m.x, CAR.y - m.y) < 36);
    if (activeMistake) setCoachCue(`⚠ ${activeMistake.fix}`, 'warn');
    syncStickVisual();
    return;
  }

  if (autoDemo && demoPlan) {
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
      autoDemo = false;
      demoDone = true;
      bayPosState = 'aligned';
      document.getElementById('demoBtn')?.classList.remove('demo-on');
      sfx.playSuccess();
      setCoachCue('3D DEMO COMPLETE! Click Reset (↺) to drive this route yourself.', 'ok');
      return;
    }
    let idx = 0;
    while (idx < list.length - 2 && list[idx + 1].t < demoTime) idx++;
    const a = list[idx];
    const b = list[idx + 1] || a;
    const u = Math.max(0, Math.min(1, (demoTime - a.t) / Math.max(0.0001, b.t - a.t)));
    CAR.x = a.x + (b.x - a.x) * u;
    CAR.y = a.y + (b.y - a.y) * u;
    CAR.angle = a.angle + Math.atan2(Math.sin(b.angle - a.angle), Math.cos(b.angle - a.angle)) * u;
    CAR.speed = b.speed;
    setActiveGear(b.gear, true);
    syncStickVisual();
    return;
  }

  // Manual Ackermann Controls
  const steerRate = 2.6;
  if (analogueSteer !== null) {
    CAR.steer += (analogueSteer * CAR.maxSteer - CAR.steer) * Math.min(1, 18 * dt);
  } else if (keys.left) {
    CAR.steer = Math.max(-CAR.maxSteer, CAR.steer - steerRate * dt);
  } else if (keys.right) {
    CAR.steer = Math.min(CAR.maxSteer, CAR.steer + steerRate * dt);
  } else if (Math.abs(CAR.speed) > 10) {
    CAR.steer *= Math.pow(0.25, dt);
  }
  syncStickVisual();

  const isRain = weatherMode === 'rain';
  const accel = isRain ? 230 : 260;
  const drag = isRain ? 130 : 190;
  const brakeDecel = isRain ? 305 : 460;
  const wantFwd = keys.up || (keys.gas && activeGear === 'D');
  const wantRev = keys.down || (keys.gas && activeGear === 'R');
  if (keys.brake) {
    if (Math.abs(CAR.speed) < 18) CAR.speed = 0;
    else CAR.speed -= Math.sign(CAR.speed) * brakeDecel * dt;
  } else if (keys.gas && activeGear === 'P') {
    CAR.speed = 0;
    setCoachCue('Car is in PARK (P) — click D or R to drive.', 'neutral');
  } else if (wantFwd) {
    CAR.speed = Math.min(CAR.maxFwd, CAR.speed + accel * dt);
  } else if (wantRev) {
    CAR.speed = Math.max(CAR.maxRev, CAR.speed - accel * dt);
  } else {
    if (Math.abs(CAR.speed) < 6) CAR.speed = 0;
    else CAR.speed -= Math.sign(CAR.speed) * drag * dt;
  }

  const gear = keys.brake || activeGear === 'P' ? 'P' : CAR.speed > 5 ? 'D' : CAR.speed < -5 ? 'R' : activeGear;
  if (gear !== 'N' && gear !== 'P' && gear !== lastGear) {
    if (lastGear !== 'N') reversals++;
    lastGear = gear;
    sfx.playGearShift();
  }
  sfx.updateEngine(CAR.speed, keys.up || keys.down || keys.gas);

  const prevX = CAR.x;
  const prevY = CAR.y;
  const prevAngle = CAR.angle;

  const wetGrip = isRain && Math.abs(CAR.speed) > 90 ? 0.85 : 1.0;
  const angularVel = (CAR.speed / CAR.wheelbase) * Math.tan(CAR.steer * wetGrip);
  CAR.angle += angularVel * dt;
  CAR.x += Math.cos(CAR.angle) * CAR.speed * dt;
  CAR.y += Math.sin(CAR.angle) * CAR.speed * dt;

  const { dist: clearance, obs: hitObs } = getCarClearance(CAR.x, CAR.y, CAR.angle);
  const nowPerf = performance.now();
  const relT = (nowPerf - startTime) / 1000;

  if (clearance <= 0.5) {
    CAR.x = prevX;
    CAR.y = prevY;
    CAR.angle = prevAngle;
    CAR.speed = 0;
    hitObsId = hitObs?.id || null;
    hitObsUntil = nowPerf + 550;
    if (nowPerf - lastCollisionBump > 550) {
      collisions++;
      lastCollisionBump = nowPerf;
      sfx.playBump();
      const obsName = hitObs?.label || hitObs?.type || 'Obstacle';
      driveMistakes.push({
        t: relT,
        x: CAR.x,
        y: CAR.y,
        label: `Hit ${obsName}`,
        fix: `Mistake: Hit ${obsName} in ${activeGear}. Stop on Red, shift gear, and counter-steer clear.`
      });
      saveDriveSnapshot();
      setCoachCue(`Hit ${obsName}! Shift opposite gear & steer clear (or click ↺ Replay).`, 'warn');
    }
  } else {
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
      saveDriveSnapshot();
    }
    if (clearance < 14 && Math.abs(CAR.speed) > 10 && nowPerf - lastCloseCallAt > 2000) {
      lastCloseCallAt = nowPerf;
      const cm = Math.max(1, Math.round(clearance * 4.5));
      driveMistakes.push({
        t: relT,
        x: CAR.x,
        y: CAR.y,
        label: `Too Close (${cm}cm)`,
        fix: `Close Call (${cm}cm from obstacle). Begin turn earlier on Orange light.`
      });
      saveDriveSnapshot();
    }
    sfx.updateRadar(clearance, CAR.speed < -4);
    checkParked(false);
  }

  const kmh = Math.round(Math.abs(CAR.speed) * 0.12);
  const steerDeg = Math.round((CAR.steer * 180) / Math.PI);
  const radarCm = clearance === Infinity ? 'CLEAR' : `${Math.max(0, Math.round(clearance * 4.5))} CM`;
  document.getElementById('dockTelemetry').textContent =
    `GEAR: ${gear} · ${kmh} KM/H · STEER: ${steerDeg > 0 ? '+' : ''}${steerDeg}° · RADAR: ${radarCm}`;
}

function update3DSceneSync(dt) {
  // Update Player 3D Car transform & wheel steering + tail lights
  playerCarMesh.position.set(CAR.x, 0, CAR.y);
  playerCarMesh.rotation.y = -CAR.angle;
  (playerCarMesh.userData.frontPivots || []).forEach((p) => {
    p.rotation.y = -CAR.steer;
  });

  const isRev = CAR.speed < -3 || activeGear === 'R';
  playerCarMesh.traverse((child) => {
    if (child.userData?.isTailLight) {
      child.material.color.set(isRev ? '#ffffff' : '#ff2d2d');
    }
  });

  // Sync moving patrol traffic & walking pedestrians
  for (const child of obstacleGroup.children) {
    const obs = child.userData?.obsRef;
    if (obs && (obs.patrolDx || obs.patrolDy)) {
      child.position.set(obs.x, 0, obs.y);
      child.rotation.y = -(obs.angle || 0);
    }
  }

  // Animate 3D rain streaks when Rain/Wet weather is enabled
  if (weatherMode === 'rain') {
    rainPoints.visible = true;
    const pos = rainPoints.geometry.attributes.position.array;
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3 + 1] -= 5.8;
      pos[i * 3] -= 0.7;
      if (pos[i * 3 + 1] < 2) {
        pos[i * 3 + 1] = 260;
        pos[i * 3] = (Math.random() - 0.5) * LOT_BOUNDS.w;
      }
    }
    rainPoints.geometry.attributes.position.needsUpdate = true;
  } else {
    rainPoints.visible = false;
  }

  // Update Target Park Box color state (Gold -> Amber -> Emerald Green)
  const bayColor =
    bayCleared || bayPosState === 'aligned'
      ? '#4ade80'
      : bayPosState === 'partial'
        ? '#f97316'
        : '#ffc570';
  targetFillMat.color.set(bayColor);
  targetEdgeMat.color.set(bayColor);

  // Camera follow in Drive mode (unless Wide 3D overview is active)
  const camMode = document.body.dataset.cam || 'follow';
  if (appMode === 'drive' && camMode !== 'wide') {
    const chaseDist = camMode === 'tight' ? 145 : 225;
    const chaseHeight = camMode === 'tight' ? 88 : 165;
    const idealPos = new THREE.Vector3(
      CAR.x - Math.cos(CAR.angle) * chaseDist,
      chaseHeight,
      CAR.y - Math.sin(CAR.angle) * chaseDist
    );
    const idealTarget = new THREE.Vector3(
      CAR.x + Math.cos(CAR.angle) * 35,
      10,
      CAR.y + Math.sin(CAR.angle) * 35
    );
    camera.position.lerp(idealPos, Math.min(1, 5.2 * dt));
    orbitControls.target.lerp(idealTarget, Math.min(1, 7.0 * dt));
  }

  orbitControls.update();
  update3DGuidesMesh();
}

function resizeRenderer() {
  const isMobile = window.innerWidth <= 760 || window.innerWidth < window.innerHeight;
  const uiScale = isMobile
    ? 1
    : Math.max(0.76, Math.min(1.12, Math.min(window.innerWidth / 1568, window.innerHeight / 913)));
  document.documentElement.style.setProperty('--ui', uiScale.toFixed(4));
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  updateViewThumb();
}
window.addEventListener('resize', resizeRenderer);

function renderReverseCameraPIP() {
  const hudEl = document.getElementById('reverseCamHud');
  const slotEl = document.getElementById('reverseCamSlot');
  if (!hudEl || !slotEl) return;

  const isRevActive = appMode === 'drive' && (activeGear === 'R' || CAR.speed < -3) && !isReplaying && !bayCleared;
  hudEl.classList.toggle('is-active', isRevActive);
  hudEl.setAttribute('aria-hidden', String(!isRevActive));
  if (!isRevActive) return;

  const liveClearance = getCarClearance(CAR.x, CAR.y, CAR.angle).dist;
  const info = getProximityLightInfo(liveClearance);
  const badgeEl = document.getElementById('revCamDistBadge');
  if (badgeEl) {
    badgeEl.textContent = liveClearance === Infinity ? 'CLEAR' : `${Math.max(0, Math.round(liveClearance * 4.5))} CM`;
    badgeEl.style.color = info.hex;
  }
  const guideL = document.getElementById('revCamGuideL');
  const guideR = document.getElementById('revCamGuideR');
  if (guideL) guideL.setAttribute('stroke', info.hex);
  if (guideR) guideR.setAttribute('stroke', info.hex);

  const rect = slotEl.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;

  const cos = Math.cos(CAR.angle);
  const sin = Math.sin(CAR.angle);
  const bumperX = CAR.x - cos * (CAR.length * 0.48);
  const bumperZ = CAR.y - sin * (CAR.length * 0.48);
  reverseCamera.position.set(bumperX, 18, bumperZ);
  reverseCamera.lookAt(
    CAR.x - cos * 190 - Math.sin(CAR.steer) * 28,
    5,
    CAR.y - sin * 190 + Math.cos(CAR.steer) * 28
  );
  reverseCamera.aspect = rect.width / rect.height;
  reverseCamera.updateProjectionMatrix();

  const x = Math.round(rect.left);
  const yBottom = Math.round(window.innerHeight - rect.bottom);
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);

  renderer.setScissorTest(true);
  renderer.setViewport(x, yBottom, w, h);
  renderer.setScissor(x, yBottom, w, h);
  renderer.clearDepth();
  renderer.render(scene, reverseCamera);
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
}

// Main Animation Loop
let lastTime = performance.now();
function animate(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  updatePhysics(dt);
  update3DSceneSync(dt);
  renderer.render(scene, camera);
  renderReverseCameraPIP();
  requestAnimationFrame(animate);
}

// Decode Shared Community Lot URL Hash (#lot=...) if present
let openedSharedLot = false;
if (location.hash.startsWith('#lot=')) {
  try {
    const rawEnc = decodeURIComponent(location.hash.slice(5));
    const bin = atob(rawEnc);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (parsed && parsed.start && parsed.target && Array.isArray(parsed.obstacles)) {
      customEnv = cloneEnv(parsed);
      document.getElementById('dockTitle').innerHTML = `<b>SHARED LOT</b>${customEnv.name || 'Shared Custom Lot'}`;
      openedSharedLot = true;
    }
  } catch {
    // Ignore malformed shared lot hash
  }
}

// Initialize Builder & Start 3D Loop
rebuild3DEnvironmentMeshes();
resizeRenderer();
setMode(openedSharedLot ? 'drive' : 'build');
if (openedSharedLot) {
  setCoachCue('🔗 Loaded Shared 3D Community Lot! Drive & park inside the green zone or click 🛠 BUILD LOT to tweak.', 'ok');
}
requestAnimationFrame(animate);
