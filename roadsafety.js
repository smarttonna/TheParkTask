import * as THREE from 'three';

/* ============================================================================
   TONNA SAFETY — NIGERIAN FRSC ROAD SIGNS & 3D INTERACTIVE ROADWAY SIMULATOR
   32 Official Nigeria Highway Code Signs across 7 Drivable 3D Road Corridors
   ============================================================================ */

// ----------------------------------------------------------------------------
// 1. SVG HELPERS & COMPLETE NIGERIAN FRSC ROAD SIGNS CATALOG
// ----------------------------------------------------------------------------
const svgCircleProhib = (inner, fill = '#ffffff') => `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="54" fill="${fill}" stroke="#dc2626" stroke-width="11"/>
  ${inner}
</svg>`;

const svgCircleMand = (inner) => `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="55" fill="#1d4ed8" stroke="#ffffff" stroke-width="4"/>
  ${inner}
</svg>`;

const svgTriangleWarn = (inner, inverted = false, fill = '#ffffff') => `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <polygon points="${inverted ? '12,18 108,18 60,104' : '60,14 108,100 12,100'}" fill="${fill}" stroke="#dc2626" stroke-width="10" stroke-linejoin="round"/>
  ${inner}
</svg>`;

const svgRectInfo = (bg, inner) => `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="104" height="104" rx="14" fill="${bg}" stroke="#ffffff" stroke-width="4"/>
  ${inner}
</svg>`;

const SLASH = `<line x1="25" y1="25" x2="95" y2="95" stroke="#dc2626" stroke-width="9" stroke-linecap="round"/>`;

export const NIGERIAN_SIGNS = [
  // === CATEGORY 1: REGULATORY — PROHIBITORY ("MUST NOT") ===
  {
    id: 'stop',
    cat: 'prohibitory',
    title: 'STOP Sign (Complete Halt)',
    sub: 'FRSC REGULATORY · OCTAGONAL HALT',
    meaning: 'Orders every driver to bring their vehicle to a 100% standstill at or before the painted white STOP line.',
    action: 'Come to a full stop (not a rolling crawl). Scan left and right for cross traffic, danfo buses, and okada riders before moving.'
  },
  {
    id: 'no_entry',
    cat: 'prohibitory',
    title: 'NO ENTRY',
    sub: 'FRSC REGULATORY · ONE-WAY RESTRICTION',
    meaning: 'Forbids all vehicles from entering this street, lane, or estate gate from your direction.',
    action: 'Never drive past this red disc with a white bar — driving "One-Way" in Nigeria carries heavy FRSC/VIO/LASTMA impound penalties.'
  },
  {
    id: 'speed_50',
    cat: 'prohibitory',
    title: 'Maximum Speed Limit: 50 km/h',
    sub: 'FRSC REGULATORY · URBAN / BUILT-UP LIMIT',
    meaning: 'Caps maximum vehicle speed at 50 km/h through towns, markets, residential streets, and school corridors.',
    action: 'Ease off the throttle immediately. Watch for sudden roadside trading, buses pulling out, and pedestrians stepping off curbs.'
  },
  {
    id: 'speed_80',
    cat: 'prohibitory',
    title: 'Maximum Speed Limit: 80 km/h',
    sub: 'FRSC REGULATORY · TRUNK HIGHWAY LIMIT',
    meaning: 'Indicates the legal maximum speed of 80 km/h on single-carriageway federal trunk highways across Nigeria.',
    action: 'Keep within 80 km/h for private cars (lower for trucks/buses) and leave double braking space before crests or villages.'
  },
  {
    id: 'speed_100',
    cat: 'prohibitory',
    title: 'Maximum Speed Limit: 100 km/h',
    sub: 'FRSC REGULATORY · EXPRESSWAY MAX LIMIT',
    meaning: 'Sets the top legal ceiling of 100 km/h for private passenger vehicles on divided dual expressways.',
    action: 'Stay below 100 km/h even on open expressways like Lagos–Ibadan or Abuja–Kaduna, and reduce below 70 km/h in rain or Harmattan haze.'
  },
  {
    id: 'no_overtaking',
    cat: 'prohibitory',
    title: 'No Overtaking',
    sub: 'FRSC REGULATORY · BLIND ZONE RESTRICTION',
    meaning: 'Prohibits passing another motor vehicle ahead due to short sightlines, curves, bridges, or oncoming traffic risk.',
    action: 'Hold your lane behind slower trucks or tankers until the continuous center line ends or the No Overtaking restriction clears.'
  },
  {
    id: 'no_uturn',
    cat: 'prohibitory',
    title: 'No U-Turn',
    sub: 'FRSC REGULATORY · MEDIAN CROSSING BAN',
    meaning: 'Bans reversing direction via a U-turn across the roadway or median break.',
    action: 'Continue straight to the next designated roundabout, interchange, or permitted U-turn bay further ahead.'
  },
  {
    id: 'no_left',
    cat: 'prohibitory',
    title: 'No Left Turn',
    sub: 'FRSC REGULATORY · TURNING PROHIBITION',
    meaning: 'Forbids turning left at the upcoming junction, usually because the side street carries opposing one-way flow.',
    action: 'Proceed straight ahead or follow an alternative signed route around the block.'
  },
  {
    id: 'no_right',
    cat: 'prohibitory',
    title: 'No Right Turn',
    sub: 'FRSC REGULATORY · TURNING PROHIBITION',
    meaning: 'Prohibits turning right across opposing lanes at this junction to prevent gridlock and T-bone crashes.',
    action: 'Keep moving forward or loop via the next permitted roundabout.'
  },
  {
    id: 'no_parking',
    cat: 'prohibitory',
    title: 'No Waiting / No Parking',
    sub: 'FRSC REGULATORY · CURB CLEARANCE',
    meaning: 'Prohibits leaving your vehicle parked or waiting along this roadside kerb (quick passenger drop-off only where safe).',
    action: 'Use an official [P] parking lot off the main carriageway so you do not choke traffic or risk towing.'
  },
  {
    id: 'no_stopping',
    cat: 'prohibitory',
    title: 'No Stopping (Clearway)',
    sub: 'FRSC REGULATORY · RED X CLEARWAY',
    meaning: 'Strictest curb rule: you may NOT stop even briefly to drop off or pick up passengers unless halted by traffic signals.',
    action: 'Keep rolling smoothly through bridges, roundabouts, and BRT/expressway bottlenecks marked with the red cross.'
  },
  {
    id: 'no_horn',
    cat: 'prohibitory',
    title: 'No Horn (Silence Zone)',
    sub: 'FRSC REGULATORY · HOSPITAL / SCHOOL ZONE',
    meaning: 'Prohibits sounding car horns unnecessarily near hospitals, courts, examination centers, and places of worship.',
    action: 'Avoid blaring your horn; rely on cautious speed and headlamp flash if urgent warning is needed.'
  },

  // === CATEGORY 2: REGULATORY — MANDATORY ("MUST DO") ===
  {
    id: 'roundabout',
    cat: 'mandatory',
    title: 'Roundabout Ahead (Compulsory)',
    sub: 'FRSC MANDATORY · ANTI-CLOCKWISE FLOW',
    meaning: 'Compels all approaching vehicles to circulate anti-clockwise (on Nigeria’s right-hand drive system) around the island.',
    action: 'Slow down before the entrance line, yield to traffic ALREADY circulating from your left, signal your exit right, and enter safely.'
  },
  {
    id: 'keep_right',
    cat: 'mandatory',
    title: 'Keep Right',
    sub: 'FRSC MANDATORY · MEDIAN / ISLAND PASS',
    meaning: 'Instructs drivers to pass strictly to the right side of a road divider, concrete bollard, or construction island.',
    action: 'Stay firmly in the right carriageway beside the concrete median; never cross into oncoming traffic on the left.'
  },
  {
    id: 'ahead_only',
    cat: 'mandatory',
    title: 'Ahead Only',
    sub: 'FRSC MANDATORY · SINGLE DIRECTION',
    meaning: 'Requires traffic to travel straight forward at the intersection — no left or right turns allowed.',
    action: 'Hold your straight course across the junction until the next permitted turning point.'
  },
  {
    id: 'turn_right',
    cat: 'mandatory',
    title: 'Turn Right Ahead (Compulsory)',
    sub: 'FRSC MANDATORY · COMPULSORY CHANNEL',
    meaning: 'Compels drivers in this lane to turn right ahead (commonly before one-way diversions or flyover ramps).',
    action: 'Indicate right early, check right mirrors for cyclists/keke, and follow the right-hand channel.'
  },
  {
    id: 'ped_only',
    cat: 'mandatory',
    title: 'Pedestrian Track Only',
    sub: 'FRSC MANDATORY · NON-MOTORIZED PATH',
    meaning: 'Reserves this paved walkway strictly for people on foot — cars, motorcycles (okada), and tricycles are banned.',
    action: 'Never mount pedestrian walkways during traffic jams; leave footpaths safe for schoolchildren and commuters.'
  },

  // === CATEGORY 3: WARNING / DANGER SIGNS ===
  {
    id: 'give_way',
    cat: 'warning',
    title: 'Give Way / Yield',
    sub: 'FRSC PRIORITY · INVERTED TRIANGLE',
    meaning: 'Unique upside-down triangle telling drivers to slow down and yield right-of-way to vehicles on the major road ahead.',
    action: 'Slow before the dashed yield line, check both directions along the main road, and merge only when there is a safe gap.'
  },
  {
    id: 'ped_crossing',
    cat: 'warning',
    title: 'Pedestrian / Zebra Crossing Ahead',
    sub: 'FRSC WARNING · VULNERABLE ROAD USERS',
    meaning: 'Alerts drivers that painted white Zebra stripes cross the carriageway ahead where pedestrians hold legal priority.',
    action: 'Slow down early and come to a complete stop whenever anyone steps onto or waits at the Zebra crossing.'
  },
  {
    id: 'children',
    cat: 'warning',
    title: 'Children / School Crossing',
    sub: 'FRSC WARNING · HIGH ALERT SCHOOL ZONE',
    meaning: 'Warns of a primary or secondary school gate ahead where students may dash across the road unexpectedly.',
    action: 'Drop speed well below 30–50 km/h during school hours (7–9 AM & 1–3 PM), stay extra alert, and watch parked buses.'
  },
  {
    id: 'speed_bump',
    cat: 'warning',
    title: 'Road Bumps / Speed Breaker Ahead',
    sub: 'FRSC WARNING · RAISED HUMPS',
    meaning: 'Warns of raised asphalt or yellow rubber speed breakers placed to slow vehicles entering towns or crossings.',
    action: 'Brake BEFORE reaching the bump (release brake just as tires roll over) to protect suspension, oil pan, and control.'
  },
  {
    id: 'sharp_bend',
    cat: 'warning',
    title: 'Dangerous Sharp Bend Ahead',
    sub: 'FRSC WARNING · GEOMETRIC CURVE',
    meaning: 'Signals a tight highway bend ahead where high entry speed can throw your vehicle across the centerline or shoulder.',
    action: 'Brake BEFORE entering the curve, avoid overtaking, and steer smoothly around the apex inside your lane.'
  },
  {
    id: 't_junction',
    cat: 'warning',
    title: 'T-Junction Ahead',
    sub: 'FRSC WARNING · ROAD TERMINATES',
    meaning: 'Alerts that your current road ends ahead at a perpendicular T-intersection requiring a left or right turn.',
    action: 'Slow down early, choose your turning lane, and watch for fast cross-traffic along the main road.'
  },
  {
    id: 'crossroads',
    cat: 'warning',
    title: 'Crossroads Ahead',
    sub: 'FRSC WARNING · 4-WAY INTERSECTION',
    meaning: 'Warns of a 4-way road crossing ahead where priority must be respected carefully.',
    action: 'Cover the brake pedal approaching the junction, look both ways even on green, and never block the box.'
  },
  {
    id: 'road_work',
    cat: 'warning',
    title: 'Men at Work / Road Construction',
    sub: 'FRSC WARNING · FERMA / WORK ZONE',
    meaning: 'Warns of highway repair crews, open excavations, lane closures, and traffic cones along the carriageway ahead.',
    action: 'Slow to 30–40 km/h, obey flagmen and temporary orange cones, and give road workers plenty of clearance.'
  },
  {
    id: 'slippery',
    cat: 'warning',
    title: 'Slippery Road Surface',
    sub: 'FRSC WARNING · SKID & AQUAPLANE HAZARD',
    meaning: 'Alerts that worn asphalt, wet tropical rain, mud, or spilled diesel ahead reduces tire grip dramatically.',
    action: 'Avoid sudden braking or sharp jerks on the wheel; keep steady speed and test wet-weather toggle (🌧) to feel longer stops.'
  },
  {
    id: 'narrow_bridge',
    cat: 'warning',
    title: 'Narrow Bridge / Bottleneck Ahead',
    sub: 'FRSC WARNING · WIDTH RESTRICTION',
    meaning: 'Indicates the road narrows onto a bridge or culvert with tight guardrails and little or no shoulder space.',
    action: 'Never overtake near a bridge; yield if a wide truck or trailer is already committed from the opposite side.'
  },
  {
    id: 'rail_crossing',
    cat: 'warning',
    title: 'Railway Level Crossing Ahead',
    sub: 'FRSC WARNING · NRC RAIL TRACKS',
    meaning: 'Warns of an intersecting Nigerian Railway Corporation (NRC) train line crossing the motor road ahead.',
    action: 'Slow, wind down window/listen, look BOTH left and right before crossing steel rails, and NEVER queue stopped on the tracks!'
  },
  {
    id: 'cattle',
    cat: 'warning',
    title: 'Cattle / Livestock Crossing',
    sub: 'FRSC WARNING · INTERSTATE HERDER ROUTE',
    meaning: 'Common on Nigerian trunk roads — alerts that cattle or livestock herds regularly cross the highway ahead.',
    action: 'Drop speed gently without startling animals with loud horns; be ready to stop cleanly until herders clear the lane.'
  },

  // === CATEGORY 4: INFORMATIVE & NIGERIAN EMERGENCY GUIDANCE ===
  {
    id: 'highway_dir',
    cat: 'informative',
    title: 'Expressway Directional Board',
    sub: 'FRSC INFORMATIVE · ROUTE & DISTANCE',
    meaning: 'Green highway boards guide long-distance motorists to major cities and interchanges with kilometre distances.',
    action: 'Read route boards early and move smoothly into your exit lane well ahead instead of cutting across chevrons last second.'
  },
  {
    id: 'hospital',
    cat: 'informative',
    title: 'Hospital / First Aid Station',
    sub: 'FRSC INFORMATIVE · MEDICAL FACILITY',
    meaning: 'Informs drivers of an emergency hospital or FRSC Zebra Medical Clinic ahead for urgent trauma care.',
    action: 'Give way to ambulances with sirens, silence horns near the entrance, and keep hospital access gates completely clear.'
  },
  {
    id: 'fuel',
    cat: 'informative',
    title: 'Filling / Fuel Station Ahead',
    sub: 'FRSC INFORMATIVE · SERVICE STATION',
    meaning: 'Shows a petrol/CNG service station and rest bay ahead along the highway.',
    action: 'Indicate right well ahead before turning off, never queue across active express lanes, and switch off your engine while refuelling.'
  },
  {
    id: 'parking_p',
    cat: 'informative',
    title: 'Designated Parking Zone [P]',
    sub: 'FRSC INFORMATIVE · SAFE BAY',
    meaning: 'Marks a legal public car park or highway rest pull-off where you can park safely clear of moving traffic.',
    action: 'Always pull into a marked [P] bay for phone calls, cargo checks, or rest instead of parking on expressway shoulders.'
  },
  {
    id: 'frsc_122',
    cat: 'informative',
    title: 'FRSC Emergency Helpline: 122',
    sub: 'FRSC NIGERIA · TOLL-FREE RESCUE',
    meaning: 'Identifies an FRSC Patrol corridor and reminds all motorists of Nigeria’s free national road crash & emergency number: 122.',
    action: 'If you witness a crash, obstruction, or medical emergency on any Nigerian highway, pull off safely and dial 122 immediately.'
  }
];

// Attach crisp tailored SVG graphics to every single sign in NIGERIAN_SIGNS
const SIGN_SVGS = {
  stop: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <polygon points="38,8 82,8 112,38 112,82 82,112 38,112 8,82 8,38" fill="#dc2626" stroke="#ffffff" stroke-width="5"/>
    <text x="60" y="70" text-anchor="middle" fill="#ffffff" font-family="Arial Black,sans-serif" font-weight="900" font-size="27" letter-spacing="1">STOP</text>
  </svg>`,
  no_entry: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="54" fill="#dc2626" stroke="#ffffff" stroke-width="4"/>
    <rect x="20" y="50" width="80" height="20" rx="3" fill="#ffffff"/>
  </svg>`,
  speed_50: svgCircleProhib(`<text x="60" y="74" text-anchor="middle" fill="#111827" font-family="Arial Black,sans-serif" font-weight="900" font-size="44">50</text>`),
  speed_80: svgCircleProhib(`<text x="60" y="74" text-anchor="middle" fill="#111827" font-family="Arial Black,sans-serif" font-weight="900" font-size="44">80</text>`),
  speed_100: svgCircleProhib(`<text x="60" y="73" text-anchor="middle" fill="#111827" font-family="Arial Black,sans-serif" font-weight="900" font-size="34">100</text>`),
  no_overtaking: svgCircleProhib(`
    <rect x="28" y="46" width="22" height="30" rx="5" fill="#dc2626"/>
    <rect x="68" y="46" width="22" height="30" rx="5" fill="#111827"/>
    <circle cx="33" cy="78" r="4" fill="#111827"/><circle cx="45" cy="78" r="4" fill="#111827"/>
    <circle cx="73" cy="78" r="4" fill="#111827"/><circle cx="85" cy="78" r="4" fill="#111827"/>
    ${SLASH}
  `),
  no_uturn: svgCircleProhib(`
    <path d="M42 84 V52 A18 18 0 0 1 78 52 V76" fill="none" stroke="#111827" stroke-width="10" stroke-linecap="round"/>
    <polygon points="78,86 67,70 89,70" fill="#111827"/>
    ${SLASH}
  `),
  no_left: svgCircleProhib(`
    <path d="M72 86 V54 Q72 44 60 44 H40" fill="none" stroke="#111827" stroke-width="10" stroke-linecap="round"/>
    <polygon points="28,44 45,33 45,55" fill="#111827"/>
    ${SLASH}
  `),
  no_right: svgCircleProhib(`
    <path d="M48 86 V54 Q48 44 60 44 H80" fill="none" stroke="#111827" stroke-width="10" stroke-linecap="round"/>
    <polygon points="92,44 75,33 75,55" fill="#111827"/>
    ${SLASH}
  `),
  no_parking: svgCircleProhib(`${SLASH}`, '#1d4ed8'),
  no_stopping: svgCircleProhib(`
    <line x1="25" y1="25" x2="95" y2="95" stroke="#dc2626" stroke-width="10" stroke-linecap="round"/>
    <line x1="95" y1="25" x2="25" y2="95" stroke="#dc2626" stroke-width="10" stroke-linecap="round"/>
  `, '#1d4ed8'),
  no_horn: svgCircleProhib(`
    <path d="M30 62 L52 62 L76 46 V74 L52 62 Z" fill="#111827"/>
    <path d="M84 48 Q94 60 84 72" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round"/>
    ${SLASH}
  `),
  roundabout: svgCircleMand(`
    <path d="M60 28 A30 30 0 0 1 88 55" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
    <polygon points="88,62 79,48 96,49" fill="#ffffff"/>
    <path d="M84 74 A30 30 0 0 1 40 82" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
    <polygon points="34,76 49,73 40,89" fill="#ffffff"/>
    <path d="M32 62 A30 30 0 0 1 54 29" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
    <polygon points="60,26 48,36 47,20" fill="#ffffff"/>
  `),
  keep_right: svgCircleMand(`
    <line x1="40" y1="40" x2="77" y2="77" stroke="#ffffff" stroke-width="11" stroke-linecap="round"/>
    <polygon points="84,84 62,80 80,62" fill="#ffffff"/>
  `),
  ahead_only: svgCircleMand(`
    <line x1="60" y1="88" x2="60" y2="38" stroke="#ffffff" stroke-width="11" stroke-linecap="round"/>
    <polygon points="60,24 42,46 78,46" fill="#ffffff"/>
  `),
  turn_right: svgCircleMand(`
    <path d="M44 86 V54 Q44 44 58 44 H76" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
    <polygon points="90,44 70,31 70,57" fill="#ffffff"/>
  `),
  ped_only: svgCircleMand(`
    <circle cx="60" cy="30" r="8" fill="#ffffff"/>
    <path d="M60 40 L54 64 L44 88 M56 64 L72 88 M44 54 L76 48" stroke="#ffffff" stroke-width="7" stroke-linecap="round" fill="none"/>
  `),
  give_way: svgTriangleWarn(
    `<text x="60" y="48" text-anchor="middle" fill="#111827" font-family="Arial Black,sans-serif" font-weight="900" font-size="14">GIVE WAY</text>`,
    true
  ),
  ped_crossing: svgTriangleWarn(`
    <circle cx="60" cy="48" r="5" fill="#111827"/>
    <path d="M60 54 L56 71 L49 84 M58 70 L69 84 M49 62 L71 58" stroke="#111827" stroke-width="5" stroke-linecap="round" fill="none"/>
    <rect x="33" y="88" width="12" height="5" fill="#111827"/><rect x="54" y="88" width="12" height="5" fill="#111827"/><rect x="75" y="88" width="12" height="5" fill="#111827"/>
  `),
  children: svgTriangleWarn(`
    <circle cx="48" cy="52" r="5" fill="#111827"/><circle cx="71" cy="57" r="4.5" fill="#111827"/>
    <path d="M48 58 L46 74 L40 90 M47 73 L55 90 M38 66 L58 63" stroke="#111827" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M71 62 L70 76 L64 90 M71 76 L78 90 M62 69 L79 68" stroke="#111827" stroke-width="4.5" stroke-linecap="round" fill="none"/>
  `),
  speed_bump: svgTriangleWarn(`
    <path d="M26 88 H42 Q60 64 78 88 H94" fill="#111827"/>
  `),
  sharp_bend: svgTriangleWarn(`
    <path d="M52 90 V68 Q52 54 70 50" fill="none" stroke="#111827" stroke-width="8" stroke-linecap="round"/>
    <polygon points="78,48 63,40 66,58" fill="#111827"/>
  `),
  t_junction: svgTriangleWarn(`
    <path d="M60 90 V52 M36 52 H84" stroke="#111827" stroke-width="9" stroke-linecap="round"/>
  `),
  crossroads: svgTriangleWarn(`
    <path d="M60 42 V90 M36 66 H84" stroke="#111827" stroke-width="9" stroke-linecap="round"/>
  `),
  road_work: svgTriangleWarn(`
    <circle cx="54" cy="48" r="5.5" fill="#111827"/>
    <path d="M54 55 L48 76 L42 90 M50 75 L60 90 M43 65 L68 74" stroke="#111827" stroke-width="5" stroke-linecap="round" fill="none"/>
    <polygon points="68,78 84,89 60,90" fill="#111827"/>
  `, false, '#fef08a'),
  slippery: svgTriangleWarn(`
    <rect x="46" y="42" width="28" height="16" rx="4" fill="#111827"/>
    <path d="M46 64 Q36 74 52 82 T44 93 M72 64 Q82 74 66 82 T74 93" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round"/>
  `),
  narrow_bridge: svgTriangleWarn(`
    <path d="M40 42 V58 L48 70 V90 M80 42 V58 L72 70 V90" fill="none" stroke="#111827" stroke-width="7" stroke-linecap="round"/>
  `),
  rail_crossing: svgTriangleWarn(`
    <rect x="34" y="64" width="52" height="16" rx="3" fill="#111827"/>
    <rect x="38" y="54" width="12" height="12" fill="#111827"/>
    <circle cx="44" cy="86" r="5" fill="#111827"/><circle cx="74" cy="86" r="5" fill="#111827"/>
    <line x1="28" y1="93" x2="92" y2="93" stroke="#111827" stroke-width="4"/>
  `),
  cattle: svgTriangleWarn(`
    <rect x="40" y="62" width="34" height="16" rx="4" fill="#111827"/>
    <rect x="70" y="54" width="14" height="11" rx="3" fill="#111827"/>
    <line x1="44" y1="78" x2="44" y2="91" stroke="#111827" stroke-width="4.5"/>
    <line x1="69" y1="78" x2="69" y2="91" stroke="#111827" stroke-width="4.5"/>
    <path d="M77 54 L82 46 M73 54 L69 47" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
  `),
  highway_dir: svgRectInfo('#15803d', `
    <text x="60" y="42" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-weight="800" font-size="14">LAGOS 18</text>
    <text x="60" y="65" text-anchor="middle" fill="#fef08a" font-family="Arial,sans-serif" font-weight="800" font-size="13">IBADAN 124</text>
    <path d="M60 98 V76 M48 86 L60 74 L72 86" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  `),
  hospital: svgRectInfo('#1d4ed8', `
    <rect x="26" y="26" width="68" height="68" rx="8" fill="#ffffff"/>
    <rect x="52" y="34" width="16" height="52" fill="#dc2626"/>
    <rect x="34" y="52" width="52" height="16" fill="#dc2626"/>
  `),
  fuel: svgRectInfo('#1d4ed8', `
    <rect x="36" y="32" width="38" height="56" rx="4" fill="#ffffff"/>
    <rect x="42" y="38" width="26" height="18" fill="#1d4ed8"/>
    <path d="M74 44 H84 V78 H76" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  `),
  parking_p: svgRectInfo('#1d4ed8', `
    <text x="60" y="84" text-anchor="middle" fill="#ffffff" font-family="Arial Black,sans-serif" font-weight="900" font-size="68">P</text>
  `),
  frsc_122: svgRectInfo('#1e293b', `
    <rect x="14" y="14" width="92" height="92" rx="10" fill="#14532d" stroke="#facc15" stroke-width="4"/>
    <text x="60" y="42" text-anchor="middle" fill="#fde047" font-family="Arial Black,sans-serif" font-weight="900" font-size="16">FRSC SOS</text>
    <text x="60" y="80" text-anchor="middle" fill="#ffffff" font-family="Arial Black,sans-serif" font-weight="900" font-size="36">122</text>
    <text x="60" y="96" text-anchor="middle" fill="#86efac" font-family="Arial,sans-serif" font-weight="700" font-size="10">TOLL FREE</text>
  `)
};

NIGERIAN_SIGNS.forEach((s) => {
  s.svg = SIGN_SVGS[s.id];
});

const SIGN_BY_ID = Object.fromEntries(NIGERIAN_SIGNS.map((s) => [s.id, s]));

// ----------------------------------------------------------------------------
// 2. 7 DRIVABLE NIGERIAN 3D ROAD SCENES (ALL 32 SIGNS PLACED IN CONTEXT)
// ----------------------------------------------------------------------------
// Note: Road runs along X-axis from x = -480 to x = +520 (centered around z = 0)
// Car starts near x = -430 facing +X (angle = 0).
export const SCENES = [
  {
    id: '01',
    name: 'Urban Intersection',
    kicker: 'SCENE 01 · CITY JUNCTION & STOP CONTROL',
    envType: 'urban',
    signs: [
      { signId: 'speed_50', x: -290, z: 78, yaw: 0 },
      { signId: 'no_horn', x: -130, z: 78, yaw: 0 },
      { signId: 'no_parking', x: 30, z: 78, yaw: 0 },
      { signId: 'stop', x: 205, z: 78, yaw: 0 },
      { signId: 'no_entry', x: 325, z: -78, yaw: 0 },
      { signId: 'give_way', x: 390, z: 78, yaw: 0 }
    ]
  },
  {
    id: '02',
    name: 'Expressway Merge',
    kicker: 'SCENE 02 · DUAL CARRIAGEWAY & MEDIAN',
    envType: 'express',
    signs: [
      { signId: 'keep_right', x: -290, z: 8, yaw: 0 },
      { signId: 'speed_100', x: -135, z: 82, yaw: 0 },
      { signId: 'no_overtaking', x: 35, z: 82, yaw: 0 },
      { signId: 'no_uturn', x: 205, z: 10, yaw: 0 },
      { signId: 'highway_dir', x: 375, z: 82, yaw: 0 }
    ]
  },
  {
    id: '03',
    name: 'School & Zebra',
    kicker: 'SCENE 03 · SCHOOL GATE & ZEBRA CROSSING',
    envType: 'school',
    signs: [
      { signId: 'children', x: -280, z: 78, yaw: 0 },
      { signId: 'speed_bump', x: -110, z: 78, yaw: 0 },
      { signId: 'ped_crossing', x: 65, z: 78, yaw: 0 },
      { signId: 'ped_only', x: 235, z: -80, yaw: 0 }
    ]
  },
  {
    id: '04',
    name: 'Roundabout Loop',
    kicker: 'SCENE 04 · ROUNDABOUT & DIVERSION RULES',
    envType: 'roundabout',
    signs: [
      { signId: 'roundabout', x: -280, z: 78, yaw: 0 },
      { signId: 'no_stopping', x: -115, z: 78, yaw: 0 },
      { signId: 'no_left', x: 55, z: 78, yaw: 0 },
      { signId: 'turn_right', x: 225, z: 78, yaw: 0 },
      { signId: 'ahead_only', x: 380, z: 78, yaw: 0 },
      { signId: 'no_right', x: 380, z: -78, yaw: 0 }
    ]
  },
  {
    id: '05',
    name: 'Road Works & Bridge',
    kicker: 'SCENE 05 · CONSTRUCTION CONES & WET HAZARD',
    envType: 'roadwork',
    signs: [
      { signId: 'road_work', x: -275, z: 78, yaw: 0 },
      { signId: 'slippery', x: -95, z: 78, yaw: 0 },
      { signId: 'narrow_bridge', x: 115, z: 78, yaw: 0 },
      { signId: 'sharp_bend', x: 325, z: 78, yaw: 0 }
    ]
  },
  {
    id: '06',
    name: 'Trunk & Rail',
    kicker: 'SCENE 06 · TRUNK HIGHWAY, NRC RAIL & CATTLE',
    envType: 'rural',
    signs: [
      { signId: 'speed_80', x: -275, z: 78, yaw: 0 },
      { signId: 'cattle', x: -90, z: 78, yaw: 0 },
      { signId: 'rail_crossing', x: 105, z: 78, yaw: 0 },
      { signId: 't_junction', x: 270, z: 78, yaw: 0 },
      { signId: 'crossroads', x: 405, z: 78, yaw: 0 }
    ]
  },
  {
    id: '07',
    name: 'Services & FRSC 122',
    kicker: 'SCENE 07 · HOSPITAL, FUEL BAY & EMERGENCY 122',
    envType: 'services',
    signs: [
      { signId: 'fuel', x: -260, z: 78, yaw: 0 },
      { signId: 'parking_p', x: -80, z: 78, yaw: 0 },
      { signId: 'hospital', x: 110, z: 78, yaw: 0 },
      { signId: 'frsc_122', x: 310, z: 78, yaw: 0 }
    ]
  }
];

// ----------------------------------------------------------------------------
// 3. STATE, AUDIO & PERSISTENCE
// ----------------------------------------------------------------------------
const DISCOVERED_KEY = 'tonnaRoadSafetyDiscovered_v1';
let discoveredIds = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(DISCOVERED_KEY) || '[]');
  if (Array.isArray(saved)) saved.forEach((id) => SIGN_BY_ID[id] && discoveredIds.add(id));
} catch {}

function persistDiscovered() {
  try {
    localStorage.setItem(DISCOVERED_KEY, JSON.stringify([...discoveredIds]));
  } catch {}
}

let currentSceneIdx = 0;
let activeSignId = null;
let weatherState = 'dry'; // 'dry' | 'rain' | 'harmattan'
let autoCruise = false;
let cruisePauseTimer = 0;
let cruiseLastStoppedSign = null;
let activeGear = 'D';
let analogueSteer = null;

const CAR = {
  x: -420,
  y: 26, // Right-hand lane in 3D world z = 26 (facing +X)
  angle: 0,
  speed: 0,
  steer: 0,
  length: 84,
  width: 39,
  wheelbase: 56,
  maxSteer: 0.62,
  maxFwd: 155,
  maxRev: -80
};

const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  gas: false,
  brake: false
};

class SafetyAudio {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
  }
  playDiscover() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);
      gain.gain.setValueAtTime(0.08, now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.25);
    });
  }
}
const sfx = new SafetyAudio();

// ----------------------------------------------------------------------------
// 4. THREE.JS 3D CORRIDOR SCENE & PROCEDURAL NIGERIAN PROPS
// ----------------------------------------------------------------------------
const canvasEl = document.getElementById('safetyCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0d1117');
scene.fog = new THREE.Fog('#0d1117', 580, 1450);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 1, 2600);
camera.position.set(-590, 130, 80);

const hemiLight = new THREE.HemisphereLight('#fff4e4', '#161b26', 0.92);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight('#fff5e6', 2.0);
sunLight.position.set(-220, 420, 260);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -650;
sunLight.shadow.camera.right = 650;
sunLight.shadow.camera.top = 340;
sunLight.shadow.camera.bottom = -340;
sunLight.shadow.camera.far = 1400;
scene.add(sunLight);

// Ground Terrain & Road Bed
const terrainMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(2400, 1600),
  new THREE.MeshStandardMaterial({ color: '#171c19', roughness: 0.96 })
);
terrainMesh.rotation.x = -Math.PI / 2;
terrainMesh.position.y = -0.6;
terrainMesh.receiveShadow = true;
scene.add(terrainMesh);

const asphaltMat = new THREE.MeshStandardMaterial({ color: '#22262e', roughness: 0.88, metalness: 0.06 });
const asphaltRoad = new THREE.Mesh(new THREE.PlaneGeometry(1180, 144), asphaltMat);
asphaltRoad.rotation.x = -Math.PI / 2;
asphaltRoad.receiveShadow = true;
scene.add(asphaltRoad);

// Left & Right Concrete Shoulders / Curbs
const curbMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.85 });
const northCurb = new THREE.Mesh(new THREE.BoxGeometry(1180, 4, 14), curbMat);
northCurb.position.set(0, 2, -79);
const southCurb = new THREE.Mesh(new THREE.BoxGeometry(1180, 4, 14), curbMat);
southCurb.position.set(0, 2, 79);
scene.add(northCurb, southCurb);

// Center Dashed Lane Markings
const laneStripeGroup = new THREE.Group();
const dashMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
for (let x = -540; x <= 540; x += 48) {
  const dash = new THREE.Mesh(new THREE.PlaneGeometry(24, 3), dashMat);
  dash.rotation.x = -Math.PI / 2;
  dash.position.set(x, 0.25, 0);
  laneStripeGroup.add(dash);
}
scene.add(laneStripeGroup);

// 3D Rain Particles
const RAIN_COUNT = 800;
const rainArr = new Float32Array(RAIN_COUNT * 3);
for (let i = 0; i < RAIN_COUNT; i++) {
  rainArr[i * 3] = (Math.random() - 0.5) * 1200;
  rainArr[i * 3 + 1] = Math.random() * 240 + 8;
  rainArr[i * 3 + 2] = (Math.random() - 0.5) * 420;
}
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainArr, 3));
const rainPoints = new THREE.Points(
  rainGeo,
  new THREE.PointsMaterial({ color: '#bae6fd', size: 2.3, transparent: true, opacity: 0.7 })
);
rainPoints.visible = false;
scene.add(rainPoints);

// Build Player 3D Sedan Mesh
function buildPlayerSedan() {
  const carGrp = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(84, 14, 38),
    new THREE.MeshPhysicalMaterial({ color: '#c81d25', roughness: 0.25, metalness: 0.15, clearcoat: 0.9 })
  );
  body.position.y = 11;
  body.castShadow = true;

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(44, 12, 31),
    new THREE.MeshPhysicalMaterial({ color: '#0f172a', roughness: 0.15, metalness: 0.25, clearcoat: 1.0 })
  );
  cabin.position.set(-4, 22, 0);
  cabin.castShadow = true;

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(34, 2.2, 29),
    new THREE.MeshPhysicalMaterial({ color: '#c81d25', roughness: 0.25, clearcoat: 0.9 })
  );
  roof.position.set(-4, 28.5, 0);

  // Headlights & Taillights
  const headMat = new THREE.MeshStandardMaterial({ color: '#fef9c3', emissive: '#fde047', emissiveIntensity: 1.2 });
  const tailMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#dc2626', emissiveIntensity: 1.1 });
  [-13, 13].forEach((zOff) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 7), headMat);
    hl.position.set(42, 12, zOff);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 8), tailMat);
    tl.position.set(-42, 12, zOff);
    carGrp.add(hl, tl);
  });

  // Wheels + Front Steering Pivots
  const frontPivots = [];
  const tireMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.85 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.85, roughness: 0.22 });
  [
    { x: 26, z: 19, front: true },
    { x: 26, z: -19, front: true },
    { x: -26, z: 19, front: false },
    { x: -26, z: -19, front: false }
  ].forEach((wp) => {
    const pivot = new THREE.Group();
    pivot.position.set(wp.x, 7.5, wp.z);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 5.5, 16), tireMat);
    wheel.rotation.x = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 5.8, 10), rimMat);
    hub.rotation.x = Math.PI / 2;
    pivot.add(wheel, hub);
    carGrp.add(pivot);
    if (wp.front) frontPivots.push(pivot);
  });

  carGrp.userData.frontPivots = frontPivots;
  carGrp.userData.tailMat = tailMat;
  carGrp.add(body, cabin, roof);
  return carGrp;
}

const playerCarMesh = buildPlayerSedan();
scene.add(playerCarMesh);

// Signpost Texture Cache (SVG rendered cleanly onto 256x256 CanvasTexture)
const signTextureCache = new Map();
function getSignTexture(signDef) {
  if (signTextureCache.has(signDef.id)) return signTextureCache.get(signDef.id);

  const cvs = document.createElement('canvas');
  cvs.width = 256;
  cvs.height = 256;
  const ctx = cvs.getContext('2d');
  // Immediate fallback face while SVG rasterizes
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = signDef.cat === 'mandatory' ? '#1d4ed8' : signDef.cat === 'informative' ? '#15803d' : '#dc2626';
  ctx.lineWidth = 14;
  ctx.strokeRect(12, 12, 232, 232);

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  signTextureCache.set(signDef.id, tex);

  const blob = new Blob([signDef.svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 256, 256);
    ctx.drawImage(img, 8, 8, 240, 240);
    tex.needsUpdate = true;
    URL.revokeObjectURL(url);
  };
  img.src = url;
  return tex;
}

// Dynamic Scene Groups
const scenePropsGroup = new THREE.Group();
const sceneSignsGroup = new THREE.Group();
scene.add(scenePropsGroup, sceneSignsGroup);

let activeSceneSigns = []; // [{ placement, signDef, group, haloMat, beaconMesh }]
let animatedWalkers = []; // Pedestrians / Cattle in current scene
let currentExitX = 470;

function clearGroup(grp) {
  while (grp.children.length) grp.remove(grp.children[0]);
}

function build3DRoadSignPost(placement) {
  const signDef = SIGN_BY_ID[placement.signId];
  const grp = new THREE.Group();
  grp.position.set(placement.x, 0, placement.z);

  // Steel Pole & Concrete Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(7, 8, 5, 12),
    new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.9 })
  );
  base.position.y = 2.5;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 64, 10),
    new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.75, roughness: 0.25 })
  );
  pole.position.y = 32;
  pole.castShadow = true;

  // Reflective Backing Plate + Facing Front Signboard (facing -X oncoming cars)
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 36, 36),
    [
      new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.6 }), // +x back
      new THREE.MeshStandardMaterial({ map: getSignTexture(signDef), roughness: 0.35 }), // -x facing approaching cars!
      new THREE.MeshStandardMaterial({ color: '#94a3b8' }),
      new THREE.MeshStandardMaterial({ color: '#94a3b8' }),
      new THREE.MeshStandardMaterial({ color: '#94a3b8' }),
      new THREE.MeshStandardMaterial({ color: '#94a3b8' })
    ]
  );
  board.position.y = 56;
  board.castShadow = true;

  // Floating Glow Discovery Halo on the adjacent asphalt lane (z = 26 if sign is on +z side, or z = -26 if on -z)
  const laneZ = placement.z >= 0 ? 28 : -28;
  const isAlreadySeen = discoveredIds.has(signDef.id);
  const haloMat = new THREE.MeshBasicMaterial({
    color: isAlreadySeen ? '#4ade80' : '#ffc570',
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });
  const haloRing = new THREE.Mesh(new THREE.RingGeometry(24, 30, 32), haloMat);
  haloRing.rotation.x = -Math.PI / 2;
  haloRing.position.set(0, 0.5, laneZ - placement.z);

  const beaconMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(5.5, 0),
    new THREE.MeshStandardMaterial({
      color: isAlreadySeen ? '#4ade80' : '#ffc570',
      emissive: isAlreadySeen ? '#22c55e' : '#ffa92c',
      emissiveIntensity: 0.85
    })
  );
  beaconMesh.position.set(0, 84, 0);

  grp.add(base, pole, board, haloRing, beaconMesh);
  sceneSignsGroup.add(grp);

  return { placement, signDef, group: grp, haloMat, beaconMesh, triggerZ: laneZ };
}

function buildNigerianSceneProps(envType) {
  clearGroup(scenePropsGroup);
  animatedWalkers = [];

  // Roadside Trees / Tropical Palms & Street Lamps along both shoulders
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#5c3a21', roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.85 });
  for (let x = -460; x <= 480; x += 145) {
    [-125, 125].forEach((zSide) => {
      const palm = new THREE.Group();
      palm.position.set(x, 0, zSide);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 5, 48, 8), trunkMat);
      trunk.position.y = 24;
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(18, 1), leafMat);
      crown.position.y = 50;
      crown.scale.set(1.2, 0.65, 1.2);
      palm.add(trunk, crown);
      scenePropsGroup.add(palm);
    });
  }

  if (envType === 'urban') {
    // Painted white STOP bar at x = 210 & Cross street crossing
    const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(120, 440), asphaltMat);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.set(275, 0.08, 0);
    const stopBar = new THREE.Mesh(new THREE.PlaneGeometry(8, 68), dashMat);
    stopBar.rotation.x = -Math.PI / 2;
    stopBar.position.set(205, 0.32, 34);
    scenePropsGroup.add(crossRoad, stopBar);
    // City shopfronts
    [
      { x: -180, z: -155, w: 90, h: 65, d: 60, c: '#334155' },
      { x: 40, z: -160, w: 110, h: 90, d: 65, c: '#475569' },
      { x: -40, z: 160, w: 95, h: 58, d: 60, c: '#3f2e21' }
    ].forEach((b) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), new THREE.MeshStandardMaterial({ color: b.c, roughness: 0.85 }));
      m.position.set(b.x, b.h / 2, b.z);
      m.castShadow = true;
      scenePropsGroup.add(m);
    });
  } else if (envType === 'express') {
    // Concrete Jersey Divider down center line + Green Expressway Gantry
    const jerseyMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.8 });
    for (let x = -350; x <= 440; x += 65) {
      if (Math.abs(x - 205) < 28) continue; // Median gap for No U-Turn showcase
      const divider = new THREE.Mesh(new THREE.BoxGeometry(58, 14, 8), jerseyMat);
      divider.position.set(x, 7, 0);
      divider.castShadow = true;
      scenePropsGroup.add(divider);
    }
  } else if (envType === 'school') {
    // Raised Yellow & Black Speed Breaker Bump at x = -40 & Zebra Crossing at x = 95
    const bump = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 140, 12, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.7 })
    );
    bump.rotation.set(0, Math.PI / 2, -Math.PI / 2);
    bump.position.set(-40, 0, 0);
    scenePropsGroup.add(bump);

    for (let z = -60; z <= 60; z += 18) {
      const zebra = new THREE.Mesh(new THREE.PlaneGeometry(34, 9), dashMat);
      zebra.rotation.x = -Math.PI / 2;
      zebra.position.set(100, 0.35, z);
      scenePropsGroup.add(zebra);
    }

    // Crossing School Students
    [-22, 18].forEach((zStart, idx) => {
      const stu = new THREE.Group();
      const torso = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 8), new THREE.MeshStandardMaterial({ color: idx ? '#f59e0b' : '#2563eb' }));
      torso.position.y = 14;
      const head = new THREE.Mesh(new THREE.SphereGeometry(4, 10, 10), new THREE.MeshStandardMaterial({ color: '#78350f' }));
      head.position.y = 24;
      stu.add(torso, head);
      stu.position.set(100 + idx * 14, 0, zStart);
      stu.userData = { baseZ: zStart, amp: 48, phase: idx * 1.9 };
      scenePropsGroup.add(stu);
      animatedWalkers.push(stu);
    });
  } else if (envType === 'roundabout') {
    // Central Landscaped Roundabout Island at x = 140
    const island = new THREE.Mesh(
      new THREE.CylinderGeometry(52, 56, 8, 28),
      new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.9 })
    );
    island.position.set(140, 4, 0);
    const kerbRing = new THREE.Mesh(
      new THREE.RingGeometry(52, 60, 28),
      new THREE.MeshStandardMaterial({ color: '#eab308', side: THREE.DoubleSide })
    );
    kerbRing.rotation.x = -Math.PI / 2;
    kerbRing.position.set(140, 0.35, 0);
    scenePropsGroup.add(island, kerbRing);
  } else if (envType === 'roadwork') {
    // Construction Cones + Narrow Bridge Guardrails at x = 115..260
    const coneMat = new THREE.MeshStandardMaterial({ color: '#f97316', emissive: '#ea580c', emissiveIntensity: 0.3 });
    for (let x = -230; x <= -110; x += 35) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(6, 16, 12), coneMat);
      cone.position.set(x, 8, -16);
      scenePropsGroup.add(cone);
    }
    const railMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.65, roughness: 0.3 });
    [-46, 46].forEach((zOff) => {
      const bridgeRail = new THREE.Mesh(new THREE.BoxGeometry(165, 16, 4), railMat);
      bridgeRail.position.set(185, 8, zOff);
      bridgeRail.castShadow = true;
      scenePropsGroup.add(bridgeRail);
    });
  } else if (envType === 'rural') {
    // Steel NRC Railway Tracks intersecting at x = 145
    const sleeperMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.9 });
    const railMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.9, roughness: 0.2 });
    for (let z = -190; z <= 190; z += 18) {
      const sleeper = new THREE.Mesh(new THREE.BoxGeometry(24, 2.5, 6), sleeperMat);
      sleeper.position.set(145, 1, z);
      scenePropsGroup.add(sleeper);
    }
    [-7, 7].forEach((xOff) => {
      const track = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 420), railMat);
      track.position.set(145 + xOff, 2.5, 0);
      scenePropsGroup.add(track);
    });
    // Roadside Cattle figure near x = -45
    const cow = new THREE.Group();
    const cowBody = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 11), new THREE.MeshStandardMaterial({ color: '#f8fafc' }));
    cowBody.position.y = 11;
    const cowHead = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), new THREE.MeshStandardMaterial({ color: '#3f2e21' }));
    cowHead.position.set(14, 14, 0);
    cow.add(cowBody, cowHead);
    cow.position.set(-45, 0, 92);
    cow.userData = { baseZ: 92, amp: 14, phase: 0 };
    scenePropsGroup.add(cow);
    animatedWalkers.push(cow);
  } else if (envType === 'services') {
    // Filling Station Canopy + Hospital Bay
    const fuelRoof = new THREE.Mesh(new THREE.BoxGeometry(110, 6, 65), new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.4 }));
    fuelRoof.position.set(-220, 48, 122);
    const fuelCol = new THREE.Mesh(new THREE.BoxGeometry(10, 48, 10), new THREE.MeshStandardMaterial({ color: '#ef4444' }));
    fuelCol.position.set(-220, 24, 122);
    const hospBox = new THREE.Mesh(new THREE.BoxGeometry(120, 56, 65), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6 }));
    hospBox.position.set(140, 28, 130);
    scenePropsGroup.add(fuelRoof, fuelCol, hospBox);
  }
}

function buildExitPortalGantry(exitX, nextScene) {
  const portal = new THREE.Group();
  portal.position.set(exitX, 0, 0);

  const postMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.75, roughness: 0.28 });
  [-74, 74].forEach((zPos) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.8, 92, 10), postMat);
    leg.position.set(0, 46, zPos);
    leg.castShadow = true;
    portal.add(leg);
  });

  // Highway Gantry Banner Canvas Texture ("NEXT STAGE -> ...")
  const cvs = document.createElement('canvas');
  cvs.width = 512;
  cvs.height = 96;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = '#ffc570';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, 502, 86);
  ctx.fillStyle = '#ffc570';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`NEXT STAGE → ${nextScene.id} · ${nextScene.name.toUpperCase()}`, 256, 44);
  ctx.fillStyle = '#dcfce7';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText('KEEP DRIVING FORWARD TO ENTER', 256, 74);

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(5, 28, 152),
    [
      new THREE.MeshStandardMaterial({ color: '#14532d' }),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 }),
      new THREE.MeshStandardMaterial({ color: '#14532d' }),
      new THREE.MeshStandardMaterial({ color: '#14532d' }),
      new THREE.MeshStandardMaterial({ color: '#14532d' }),
      new THREE.MeshStandardMaterial({ color: '#14532d' })
    ]
  );
  board.position.set(0, 82, 0);
  board.castShadow = true;

  // Glowing Emerald Threshold Strip across the asphalt
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 138),
    new THREE.MeshBasicMaterial({ color: '#4ade80', transparent: true, opacity: 0.52, side: THREE.DoubleSide })
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(0, 0.45, 0);

  portal.add(board, strip);
  scenePropsGroup.add(portal);
}

function loadRoadScene(idx, entrySpeed = 0) {
  currentSceneIdx = (idx + SCENES.length) % SCENES.length;
  const sc = SCENES[currentSceneIdx];
  const nextSc = SCENES[(currentSceneIdx + 1) % SCENES.length];

  const maxSignX = Math.max(...sc.signs.map((s) => s.x));
  currentExitX = Math.min(495, maxSignX + 48);

  document.getElementById('hudSceneKicker').textContent = sc.kicker;

  clearGroup(sceneSignsGroup);
  activeSceneSigns = sc.signs.map((pl) => build3DRoadSignPost(pl));
  buildNigerianSceneProps(sc.envType);
  buildExitPortalGantry(currentExitX, nextSc);

  resetCarToSceneStart(entrySpeed);
  renderSceneTabs();
  renderSceneSignChips();
  updateDiscoveryProgressHUD();
}

function resetCarToSceneStart(entrySpeed = 0) {
  CAR.x = -425;
  CAR.y = 28;
  CAR.angle = 0;
  CAR.speed = entrySpeed;
  CAR.steer = 0;
  activeGear = 'D';
  cruisePauseTimer = 0;
  cruiseLastStoppedSign = null;
  document.querySelectorAll('.gear-btn').forEach((b) => {
    const isD = b.dataset.gear === 'D';
    b.classList.toggle('on', isD);
    b.setAttribute('aria-checked', String(isD));
  });
  hideSignCard();
}

// ----------------------------------------------------------------------------
// 5. SIGN DISCOVERY CARD, CATALOG MODAL, HIGHWAY CODE & INTERACTIVE QUIZ
// ----------------------------------------------------------------------------
function showSignCard(signDef) {
  activeSignId = signDef.id;
  const card = document.getElementById('signDiscoveryCard');
  if (!card) return;

  document.getElementById('sdSvgFrame').innerHTML = signDef.svg;
  const catPill = document.getElementById('sdCategoryPill');
  catPill.dataset.cat = signDef.cat;
  catPill.textContent = signDef.cat.toUpperCase();
  document.getElementById('sdTitle').textContent = signDef.title;
  document.getElementById('sdSub').textContent = signDef.sub;
  document.getElementById('sdMeaning').textContent = signDef.meaning;
  document.getElementById('sdAction').textContent = signDef.action;

  card.classList.add('is-visible');
}

function hideSignCard() {
  document.getElementById('signDiscoveryCard')?.classList.remove('is-visible');
}

function markSignDiscovered(signObj) {
  const isNew = !discoveredIds.has(signObj.signDef.id);
  if (isNew) {
    discoveredIds.add(signObj.signDef.id);
    persistDiscovered();
    sfx.playDiscover();
    signObj.haloMat.color.set('#4ade80');
    signObj.beaconMesh.material.color.set('#4ade80');
    signObj.beaconMesh.material.emissive.set('#22c55e');
    renderSceneTabs();
    renderSceneSignChips();
    updateDiscoveryProgressHUD();
  }
}

function updateDiscoveryProgressHUD() {
  const total = NIGERIAN_SIGNS.length;
  const badge = document.getElementById('discoveredCount');
  if (badge) badge.textContent = `${discoveredIds.size}/${total}`;

  const sc = SCENES[currentSceneIdx];
  const scSeen = sc.signs.filter((s) => discoveredIds.has(s.signId)).length;
  const scBadge = document.getElementById('sceneProgressBadge');
  if (scBadge) scBadge.textContent = `SCENE ${scSeen}/${sc.signs.length}`;
}

function renderSceneTabs() {
  const strip = document.getElementById('sceneStrip');
  if (!strip) return;
  strip.innerHTML = SCENES.map((sc, i) => {
    const seen = sc.signs.filter((s) => discoveredIds.has(s.signId)).length;
    return `
      <button type="button" class="rs-scene-tab ${i === currentSceneIdx ? 'is-active' : ''}" data-scene-idx="${i}">
        <strong>${sc.id} · ${sc.name}</strong>
        <span>${seen}/${sc.signs.length} SIGNS</span>
      </button>
    `;
  }).join('');

  strip.querySelectorAll('[data-scene-idx]').forEach((btn) => {
    btn.addEventListener('click', () => loadRoadScene(Number(btn.dataset.sceneIdx)));
  });
}

function renderSceneSignChips() {
  const holder = document.getElementById('sceneSignChips');
  if (!holder) return;
  holder.innerHTML = activeSceneSigns
    .map((obj) => {
      const seen = discoveredIds.has(obj.signDef.id);
      return `
        <button type="button" class="rs-chip ${seen ? 'is-seen' : ''}" data-jump-sign="${obj.signDef.id}" data-sign-x="${obj.placement.x}" data-sign-z="${obj.triggerZ}">
          ${seen ? '✓' : '●'} ${obj.signDef.title.split('(')[0].trim()}
        </button>
      `;
    })
    .join('');

  holder.querySelectorAll('[data-jump-sign]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sId = btn.dataset.jumpSign;
      const sx = Number(btn.dataset.signX);
      const sz = Number(btn.dataset.signZ);
      CAR.x = sx - 58;
      CAR.y = sz;
      CAR.angle = 0;
      CAR.speed = 0;
      const found = activeSceneSigns.find((o) => o.signDef.id === sId);
      if (found) {
        markSignDiscovered(found);
        showSignCard(found.signDef);
      }
    });
  });
}

// Catalog Modal Renderer
let catalogFilter = 'all';
function renderCatalogGrid() {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  const list = catalogFilter === 'all' ? NIGERIAN_SIGNS : NIGERIAN_SIGNS.filter((s) => s.cat === catalogFilter);
  grid.innerHTML = list
    .map((s) => {
      const seen = discoveredIds.has(s.id);
      return `
        <article class="rs-cat-card ${seen ? 'is-seen' : ''}">
          <div class="rs-cat-top">
            <div class="rs-cat-svg" aria-hidden="true">${s.svg}</div>
            <div>
              <span class="sd-cat-pill" data-cat="${s.cat}">${s.cat}</span>
              <h3 class="rs-cat-name">${s.title}</h3>
              <span style="font-family:'Geist Mono',monospace;font-size:9.5px;color:${seen ? '#86efac' : '#94a3b8'}">${seen ? '✓ DISCOVERED ON ROAD' : 'NOT YET VISITED'}</span>
            </div>
          </div>
          <p class="rs-cat-desc">${s.meaning}</p>
          <button type="button" class="rs-cat-go" data-drive-sign="${s.id}">🚗 DRIVE TO SIGN IN 3D →</button>
        </article>
      `;
    })
    .join('');

  grid.querySelectorAll('[data-drive-sign]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.driveSign;
      const targetScIdx = SCENES.findIndex((sc) => sc.signs.some((pl) => pl.signId === id));
      if (targetScIdx >= 0) {
        loadRoadScene(targetScIdx);
        const found = activeSceneSigns.find((o) => o.signDef.id === id);
        if (found) {
          CAR.x = found.placement.x - 62;
          CAR.y = found.triggerZ;
          CAR.angle = 0;
          CAR.speed = 0;
          markSignDiscovered(found);
          showSignCard(found.signDef);
        }
      }
      document.getElementById('catalogModal')?.close();
    });
  });
}

document.getElementById('catalogFilterBar')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  catalogFilter = btn.dataset.filter;
  document.querySelectorAll('.rs-filter-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
  renderCatalogGrid();
});

document.getElementById('openCatalogBtn')?.addEventListener('click', () => {
  renderCatalogGrid();
});

// Interactive 10-Question Quiz
let quizQuestions = [];
let quizIdx = 0;
let quizScore = 0;
let quizAnswered = false;

function startSafetyQuiz() {
  const shuffled = [...NIGERIAN_SIGNS].sort(() => Math.random() - 0.5).slice(0, 10);
  quizQuestions = shuffled.map((sign) => {
    const distractors = NIGERIAN_SIGNS.filter((s) => s.id !== sign.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [sign, ...distractors].sort(() => Math.random() - 0.5);
    return { sign, options };
  });
  quizIdx = 0;
  quizScore = 0;
  renderQuizQuestion();
  document.getElementById('quizModal')?.showModal();
}

function renderQuizQuestion() {
  quizAnswered = false;
  const q = quizQuestions[quizIdx];
  document.getElementById('quizProgressKicker').textContent = `NIGERIAN HIGHWAY CODE TEST · Q ${quizIdx + 1} / ${quizQuestions.length}`;
  document.getElementById('quizSvgFrame').innerHTML = q.sign.svg;
  document.getElementById('quizCatLabel').textContent = `CATEGORY: ${q.sign.cat.toUpperCase()}`;
  document.getElementById('quizQuestionText').textContent = `While driving on a Nigerian road you spot this sign. What is its meaning?`;
  document.getElementById('quizFeedbackText').textContent = '';
  document.getElementById('quizScoreLabel').textContent = `SCORE: ${quizScore} / ${quizQuestions.length}`;
  document.getElementById('quizNextBtn').textContent = quizIdx === quizQuestions.length - 1 ? 'FINISH TEST ✓' : 'NEXT QUESTION →';

  const optsEl = document.getElementById('quizOptionsContainer');
  optsEl.innerHTML = q.options
    .map(
      (opt) => `
      <button type="button" class="rs-quiz-opt" data-opt-id="${opt.id}">
        <strong>${opt.title}</strong> — <span style="opacity:.82">${opt.meaning}</span>
      </button>
    `
    )
    .join('');

  optsEl.querySelectorAll('.rs-quiz-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (quizAnswered) return;
      quizAnswered = true;
      const chosen = btn.dataset.optId;
      const isRight = chosen === q.sign.id;
      if (isRight) {
        quizScore++;
        sfx.playDiscover();
        btn.classList.add('is-correct');
        document.getElementById('quizFeedbackText').style.color = '#86efac';
        document.getElementById('quizFeedbackText').textContent = `✓ Correct! ${q.sign.action}`;
      } else {
        btn.classList.add('is-wrong');
        optsEl.querySelector(`[data-opt-id="${q.sign.id}"]`)?.classList.add('is-correct');
        document.getElementById('quizFeedbackText').style.color = '#fca5a5';
        document.getElementById('quizFeedbackText').textContent = `✕ Not quite — that is "${q.sign.title}".`;
      }
      optsEl.querySelectorAll('.rs-quiz-opt').forEach((b) => {
        b.disabled = true;
      });
      document.getElementById('quizScoreLabel').textContent = `SCORE: ${quizScore} / ${quizQuestions.length}`;
    });
  });
}

document.getElementById('openQuizBtn')?.addEventListener('click', startSafetyQuiz);
document.getElementById('quizNextBtn')?.addEventListener('click', () => {
  if (quizIdx < quizQuestions.length - 1) {
    quizIdx++;
    renderQuizQuestion();
  } else {
    document.getElementById('quizModal')?.close();
  }
});

// ----------------------------------------------------------------------------
// 6. HUD EVENT BINDINGS (CAMERA, WEATHER, TOUR, CONTROLS)
// ----------------------------------------------------------------------------
document.getElementById('sdCloseBtn')?.addEventListener('click', hideSignCard);

document.getElementById('sdPrevBtn')?.addEventListener('click', () => {
  const curIdx = activeSceneSigns.findIndex((o) => o.signDef.id === activeSignId);
  const prevObj = activeSceneSigns[(curIdx <= 0 ? activeSceneSigns.length : curIdx) - 1];
  if (prevObj) {
    CAR.x = prevObj.placement.x - 58;
    CAR.y = prevObj.triggerZ;
    CAR.angle = 0;
    CAR.speed = 0;
    markSignDiscovered(prevObj);
    showSignCard(prevObj.signDef);
  }
});

document.getElementById('sdNextBtn')?.addEventListener('click', () => {
  const curIdx = activeSceneSigns.findIndex((o) => o.signDef.id === activeSignId);
  const nextObj = activeSceneSigns[curIdx + 1];
  if (nextObj) {
    CAR.x = nextObj.placement.x - 58;
    CAR.y = nextObj.triggerZ;
    CAR.angle = 0;
    CAR.speed = 0;
    markSignDiscovered(nextObj);
    showSignCard(nextObj.signDef);
  } else {
    loadRoadScene(currentSceneIdx + 1);
  }
});

// Guided Auto-Cruise Toggle
function setAutoCruise(on) {
  autoCruise = on;
  const btn = document.getElementById('autoCruiseBtn');
  if (btn) {
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? '⏸ PAUSE TOUR' : '▶ TOUR';
  }
}

document.getElementById('autoCruiseBtn')?.addEventListener('click', () => {
  setAutoCruise(!autoCruise);
});

// Weather Toggle: Dry -> Rain -> Harmattan Dust Haze
document.getElementById('weatherBtn')?.addEventListener('click', () => {
  weatherState = weatherState === 'dry' ? 'rain' : weatherState === 'rain' ? 'harmattan' : 'dry';
  const btn = document.getElementById('weatherBtn');
  const glyph = document.getElementById('weatherGlyph');

  if (weatherState === 'rain') {
    if (glyph) glyph.textContent = '🌧';
    if (btn) btn.classList.add('rain-on');
    scene.background.set('#0a0f1a');
    scene.fog.color.set('#0a0f1a');
    scene.fog.near = 420;
    scene.fog.far = 1100;
    asphaltMat.roughness = 0.22;
    asphaltMat.metalness = 0.3;
    document.getElementById('nextSignHint').textContent = '🌧 WET RAIN: Longer braking distance!';
  } else if (weatherState === 'harmattan') {
    if (glyph) glyph.textContent = '🌫';
    if (btn) btn.classList.remove('rain-on');
    scene.background.set('#3d2c1e');
    scene.fog.color.set('#59412d');
    scene.fog.near = 180;
    scene.fog.far = 680;
    asphaltMat.roughness = 0.92;
    asphaltMat.metalness = 0.04;
    document.getElementById('nextSignHint').textContent = '🌫 HARMATTAN HAZE: Reduced visibility!';
  } else {
    if (glyph) glyph.textContent = '☀';
    if (btn) btn.classList.remove('rain-on');
    scene.background.set('#0d1117');
    scene.fog.color.set('#0d1117');
    scene.fog.near = 580;
    scene.fog.far = 1450;
    asphaltMat.roughness = 0.88;
    asphaltMat.metalness = 0.06;
    document.getElementById('nextSignHint').textContent = 'Drive ahead to spot signs';
  }
  asphaltMat.needsUpdate = true;
});

document.getElementById('resetCarBtn')?.addEventListener('click', resetCarToSceneStart);
document.getElementById('resetSceneLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  resetCarToSceneStart();
});

// Camera Views Thumb
function updateViewThumb() {
  const seg = document.getElementById('views');
  const thumb = document.getElementById('viewThumb');
  const active = seg?.querySelector('.rn-opt.on');
  if (!seg || !thumb || !active) return;
  thumb.style.width = `${active.offsetWidth}px`;
  thumb.style.transform = `translateX(${active.offsetLeft - 3}px)`;
}

document.getElementById('views')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.rn-opt');
  if (!btn) return;
  document.querySelectorAll('#views .rn-opt').forEach((b) => b.classList.remove('on'));
  btn.classList.add('on');
  document.body.dataset.cam = btn.dataset.cam;
  updateViewThumb();
});

// Gear Buttons
document.querySelectorAll('.gear-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    setAutoCruise(false);
    activeGear = btn.dataset.gear;
    document.querySelectorAll('.gear-btn').forEach((b) => {
      b.classList.toggle('on', b === btn);
      b.setAttribute('aria-checked', String(b === btn));
    });
  });
});

// Pedals
function bindPadBtn(id, prop) {
  const el = document.getElementById(id);
  if (!el) return;
  const on = (e) => {
    e.preventDefault();
    setAutoCruise(false);
    keys[prop] = true;
    el.classList.add('active');
  };
  const off = () => {
    keys[prop] = false;
    el.classList.remove('active');
  };
  el.addEventListener('pointerdown', on);
  window.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('pointerleave', off);
}
bindPadBtn('btnBrake', 'brake');
bindPadBtn('btnGas', 'gas');

// Rotational Steering Wheel
const steerWheel = document.getElementById('steerWheel');
const steerRotor = document.getElementById('steerWheelRotor');
const stickReadout = document.getElementById('stickReadout');
let wheelDragActive = false;
let prevPointerAng = 0;
let wheelRawDeg = 0;

function syncWheelUI() {
  const deg = Math.round((CAR.steer / CAR.maxSteer) * 42);
  if (steerRotor) steerRotor.style.transform = `rotate(${deg * 2.2}deg)`;
  if (stickReadout) stickReadout.textContent = `${deg > 0 ? '+' : ''}${deg}°`;
}

if (steerWheel) {
  steerWheel.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    setAutoCruise(false);
    wheelDragActive = true;
    steerWheel.setPointerCapture(e.pointerId);
    const r = steerWheel.getBoundingClientRect();
    prevPointerAng = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    wheelRawDeg = (CAR.steer / CAR.maxSteer) * 90;
  });
  steerWheel.addEventListener('pointermove', (e) => {
    if (!wheelDragActive) return;
    const r = steerWheel.getBoundingClientRect();
    const ang = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    let delta = ang - prevPointerAng;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    prevPointerAng = ang;
    wheelRawDeg = Math.max(-90, Math.min(90, wheelRawDeg + (delta * 180) / Math.PI));
    analogueSteer = wheelRawDeg / 90;
  });
  const endWheel = () => {
    wheelDragActive = false;
    analogueSteer = null;
  };
  steerWheel.addEventListener('pointerup', endWheel);
  steerWheel.addEventListener('pointercancel', endWheel);
}

// Keyboard Controls
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
    setAutoCruise(false);
    keys.up = true;
  }
  if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
    setAutoCruise(false);
    keys.down = true;
  }
  if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
    setAutoCruise(false);
    keys.left = true;
  }
  if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
    setAutoCruise(false);
    keys.right = true;
  }
  if (e.key === ' ') {
    setAutoCruise(false);
    keys.brake = true;
  }
  if (e.key === 'r' || e.key === 'R') resetCarToSceneStart();
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.up = false;
  if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.down = false;
  if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = false;
  if (e.key === ' ') keys.brake = false;
});

// ----------------------------------------------------------------------------
// 7. PHYSICS, AUTO-TOUR & 3D RENDER LOOP
// ----------------------------------------------------------------------------
function updatePhysics(dt) {
  if (document.querySelector('dialog[open]')) return;

  // Step animated pedestrians / livestock
  const clockT = performance.now() / 1000;
  for (const w of animatedWalkers) {
    const newZ = Math.sin(clockT * 1.15 + w.userData.phase) * w.userData.amp;
    w.position.z = newZ;
  }

  // Optional Guided Auto-Cruise from sign to sign along the scene corridor
  if (autoCruise) {
    if (cruisePauseTimer > 0) {
      cruisePauseTimer -= dt;
      CAR.speed = 0;
    } else {
      const lastSceneSign = activeSceneSigns[activeSceneSigns.length - 1];
      const targetSign =
        lastSceneSign && cruiseLastStoppedSign === lastSceneSign.signDef.id
          ? null
          : activeSceneSigns.find((o) => o.signDef.id !== cruiseLastStoppedSign && o.placement.x >= CAR.x - 10) ||
            lastSceneSign;

      if (targetSign) {
        const dx = targetSign.placement.x - 42 - CAR.x;
        const dz = targetSign.triggerZ - CAR.y;
        const dist = Math.hypot(dx, dz);
        if (dist < 18) {
          CAR.speed = 0;
          cruisePauseTimer = 2.6;
          cruiseLastStoppedSign = targetSign.signDef.id;
          markSignDiscovered(targetSign);
          showSignCard(targetSign.signDef);
        } else {
          const desiredAngle = Math.atan2(dz, dx);
          const angErr = Math.atan2(Math.sin(desiredAngle - CAR.angle), Math.cos(desiredAngle - CAR.angle));
          CAR.steer = Math.max(-CAR.maxSteer, Math.min(CAR.maxSteer, angErr * 1.8));
          CAR.speed = Math.min(115, CAR.speed + 200 * dt);
        }
      } else {
        // After inspecting the final sign, cruise straight into the Next Stage portal
        const dx = currentExitX + 25 - CAR.x;
        const dz = 28 - CAR.y;
        const desiredAngle = Math.atan2(dz, dx);
        const angErr = Math.atan2(Math.sin(desiredAngle - CAR.angle), Math.cos(desiredAngle - CAR.angle));
        CAR.steer = Math.max(-CAR.maxSteer, Math.min(CAR.maxSteer, angErr * 1.8));
        CAR.speed = Math.min(115, CAR.speed + 200 * dt);
      }
    }
  } else {
    // Manual Ackermann Driving Controls
    const steerRate = 2.6;
    if (analogueSteer !== null) {
      CAR.steer += (analogueSteer * CAR.maxSteer - CAR.steer) * Math.min(1, 18 * dt);
    } else if (keys.left) {
      CAR.steer = Math.max(-CAR.maxSteer, CAR.steer - steerRate * dt);
    } else if (keys.right) {
      CAR.steer = Math.min(CAR.maxSteer, CAR.steer + steerRate * dt);
    } else if (Math.abs(CAR.speed) > 10) {
      CAR.steer *= Math.pow(0.22, dt);
    }

    const isRain = weatherState === 'rain';
    const accel = isRain ? 210 : 250;
    const brakeDecel = isRain ? 270 : 440;
    const drag = isRain ? 120 : 180;
    const wantFwd = keys.up || (keys.gas && activeGear === 'D');
    const wantRev = keys.down || (keys.gas && activeGear === 'R');

    if (keys.brake) {
      CAR.speed = Math.abs(CAR.speed) < 16 ? 0 : CAR.speed - Math.sign(CAR.speed) * brakeDecel * dt;
    } else if (keys.gas && activeGear === 'P') {
      CAR.speed = 0;
    } else if (wantFwd) {
      CAR.speed = Math.min(CAR.maxFwd, CAR.speed + accel * dt);
    } else if (wantRev) {
      CAR.speed = Math.max(CAR.maxRev, CAR.speed - accel * dt);
    } else {
      CAR.speed = Math.abs(CAR.speed) < 6 ? 0 : CAR.speed - Math.sign(CAR.speed) * drag * dt;
    }
  }

  syncWheelUI();

  // Kinematics + Corridor Guardrail Clamping
  const wetGrip = weatherState === 'rain' && Math.abs(CAR.speed) > 95 ? 0.84 : 1.0;
  CAR.angle += (CAR.speed / CAR.wheelbase) * Math.tan(CAR.steer * wetGrip) * dt;
  CAR.x += Math.cos(CAR.angle) * CAR.speed * dt;
  CAR.y += Math.sin(CAR.angle) * CAR.speed * dt;

  CAR.x = Math.max(-530, Math.min(540, CAR.x));
  CAR.y = Math.max(-52, Math.min(52, CAR.y));

  // Entering the Next Stage portal at the end of a corridor immediately advances!
  if (CAR.x >= currentExitX && (CAR.speed > 2 || keys.up || (keys.gas && activeGear === 'D') || autoCruise)) {
    const carry = Math.max(45, Math.min(90, CAR.speed * 0.75));
    sfx.playDiscover();
    loadRoadScene(currentSceneIdx + 1, carry);
    return;
  }

  // Proximity Detection to Every 3D Signpost
  let nearestObj = null;
  let nearestDist = Infinity;
  let nextAhead = null;
  let nextAheadDist = Infinity;

  for (const obj of activeSceneSigns) {
    const d = Math.hypot(CAR.x - obj.placement.x, CAR.y - obj.triggerZ);
    if (d < nearestDist) {
      nearestDist = d;
      nearestObj = obj;
    }
    if (!discoveredIds.has(obj.signDef.id) && obj.placement.x >= CAR.x - 40 && d < nextAheadDist) {
      nextAheadDist = d;
      nextAhead = obj;
    }
  }

  // Trigger explanation card cleanly when driver pulls near any sign
  if (nearestObj && nearestDist < 74) {
    markSignDiscovered(nearestObj);
    if (activeSignId !== nearestObj.signDef.id) {
      showSignCard(nearestObj.signDef);
    }
  }

  const hintEl = document.getElementById('nextSignHint');
  if (hintEl && weatherState === 'dry') {
    if (nextAhead) {
      hintEl.textContent = `AHEAD: ${nextAhead.signDef.title.split('(')[0].trim()} · ${Math.max(1, Math.round(nextAheadDist * 0.35))}m`;
    } else {
      const nextSc = SCENES[(currentSceneIdx + 1) % SCENES.length];
      hintEl.textContent = `Keep driving past the gate → to enter Stage ${nextSc.id}: ${nextSc.name}`;
    }
  }
}

function update3DScene(dt) {
  // Sync Car Pose
  playerCarMesh.position.set(CAR.x, 0, CAR.y);
  playerCarMesh.rotation.y = -CAR.angle;
  (playerCarMesh.userData.frontPivots || []).forEach((p) => {
    p.rotation.y = -CAR.steer;
  });

  if (playerCarMesh.userData.tailMat) {
    const rev = CAR.speed < -3 || activeGear === 'R';
    playerCarMesh.userData.tailMat.color.set(rev ? '#ffffff' : '#ef4444');
    playerCarMesh.userData.tailMat.emissive.set(rev ? '#ffffff' : keys.brake ? '#ff5555' : '#dc2626');
    playerCarMesh.userData.tailMat.emissiveIntensity = keys.brake || rev ? 2.2 : 0.9;
  }

  // Gentle Beacon Spin above Road Signs
  const spinT = performance.now() / 1000;
  for (const obj of activeSceneSigns) {
    obj.beaconMesh.rotation.y = spinT * 1.8;
    obj.beaconMesh.position.y = 84 + Math.sin(spinT * 3 + obj.placement.x * 0.02) * 3;
  }

  // Rain Drops Animation
  if (weatherState === 'rain') {
    rainPoints.visible = true;
    const pos = rainPoints.geometry.attributes.position.array;
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3 + 1] -= 5.5;
      pos[i * 3] -= 0.8;
      if (pos[i * 3 + 1] < 2) {
        pos[i * 3 + 1] = 240;
        pos[i * 3] = (Math.random() - 0.5) * 1200;
      }
    }
    rainPoints.geometry.attributes.position.needsUpdate = true;
  } else {
    rainPoints.visible = false;
  }

  // Camera Rig (3D CHASE / WIDE 3D / CABIN VIEW)
  const camMode = document.body.dataset.cam || 'follow';
  const cos = Math.cos(CAR.angle);
  const sin = Math.sin(CAR.angle);
  const idealPos = new THREE.Vector3();
  const idealLook = new THREE.Vector3();

  if (camMode === 'driver') {
    idealPos.set(CAR.x + cos * 6, 30, CAR.y + sin * 6);
    idealLook.set(CAR.x + cos * 220, 24, CAR.y + sin * 220);
  } else if (camMode === 'wide') {
    idealPos.set(CAR.x - 40, 320, 360);
    idealLook.set(CAR.x + 80, 12, 0);
  } else {
    idealPos.set(CAR.x - cos * 155, 76, CAR.y - sin * 155 + 14);
    idealLook.set(CAR.x + cos * 115, 22, CAR.y + sin * 115);
  }

  camera.position.lerp(idealPos, Math.min(1, 6.2 * dt));
  camera.lookAt(idealLook);
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
  updateViewThumb();
}
window.addEventListener('resize', resizeRenderer);

let lastTime = performance.now();
function animate(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  updatePhysics(dt);
  update3DScene(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Initialize Scene 01 & Start 3D Engine
loadRoadScene(0);
resizeRenderer();
requestAnimationFrame(animate);
