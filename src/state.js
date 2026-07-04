export const equipmentState = { heater: true, ac: true, fan: true, sprinklers: true };
export const equipmentFailed = { heater: false, ac: false, fan: false, sprinklers: false };
export const equipmentFailTimer = [0, 0, 0, 0];
export const equipmentRefs = { heater: null, ac: null, fan: null, sprinklers: null };
export const equipIndicators = [];

export const telemetryData = [
  { batt: 87, rpm: 2400, temp: 42, status: 'STABLE' },
  { batt: 92, rpm: 2350, temp: -3, status: 'STABLE' },
  { batt: 78, rpm: 2500, temp: 24, status: 'STABLE' },
  { batt: 63, rpm: 2380, temp: 18, status: 'STABLE' },
];

export const drones = [];
export const doorPanels = [];
export const doorFrames = [];
export const droneShadows = [];
export const sectionFloors = [];
export const accentLights = [];
export const beacons = [];
export const sensorGroups = [];
export const equipFX = [];
export const failFX = [];
export const icePieces = [];
export const equipLabels3D = [];
export const droneTelemetry = [];
export const particleSystems = [];
export const louverBlades = [];
export const ventSlats = [];
export const grillBars = [];
export const drainHoles = [];
export const drainWater = [];

export const doorsOpen = { state: false, anim: 0 };
export const exportSamples = [];
export const audioState = { drones: [0, 0, 0, 0], whoosh: 0, hiss: 0 };
export const audioNodes = {};

export const flags = {
  paused: false,
  speedMul: 1,
  isolatedZone: -1,
  sirenActive: false,
  sampleTimer: 0,
  thermalMode: false,
  followCam: false,
  followIdx: 0,
  formationMode: false,
  formationProgress: 0,
  audioMuted: false,
  pipActive: false,
  pipDroneIdx: 0,
  fanSpeedTarget: 3.0,
  fanCurrentSpeed: 3.0,
  pathProgress: 0,
};
