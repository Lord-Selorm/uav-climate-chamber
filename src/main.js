import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { centers, HEIGHT, DEPTH, SECTION_W, colors, _totalW, _bwW, _wallOff } from './constants.js';
import { makeBox, steel, darkSteel, frameMat } from './utils.js';
import { buildChamber, buildVents } from './chamber.js';
import { buildEnvironment } from './environment.js';
import { buildLights } from './lights.js';
import { buildEquipment, buildCameras } from './equipment.js';
import { buildDrones } from './drones.js';
import { buildParticles, particleSpeedMult, particleOpacity } from './particles.js';
import { buildInstruments } from './instruments.js';
import { buildLabels } from './labels.js';
import { initAudio, updateAudio } from './audio.js';
import { setCameraView, updateCameraTransitions, updateFollowCam, renderPIP, initCamera } from './camera.js';
import { flags, equipmentState, equipmentFailed, equipmentFailTimer, equipmentRefs, equipIndicators, telemetryData, drones, doorPanels, doorFrames, droneShadows, sectionFloors, accentLights, beacons, sensorGroups, equipFX, failFX, icePieces, equipLabels3D, droneTelemetry, particleSystems, doorsOpen, exportSamples, audioState, audioNodes } from './state.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080816);
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(22, 14, 24);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;
document.body.prepend(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.prepend(labelRenderer.domElement);

const pipCanvas = document.getElementById('pip-canvas');
const pipRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
pipRenderer.setSize(240, 160);
pipRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
pipRenderer.toneMapping = THREE.ACESFilmicToneMapping;
pipRenderer.toneMappingExposure = 1.0;
pipCanvas.appendChild(pipRenderer.domElement);
const pipCamera = new THREE.PerspectiveCamera(70, 240 / 160, 0.1, 30);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 3.0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2.05;
controls.minDistance = 2;
controls.maxDistance = 50;

initCamera(camera, controls, scene, pipCamera, pipRenderer);

// Build scene
buildChamber(scene);
const vents = buildVents(scene);
buildEnvironment(scene);
buildLights(scene);
const { equipFX: eqFX, failFX: flFX } = buildEquipment(scene);
eqFX.forEach(fx => equipFX.push(fx));
flFX.forEach(fx => failFX.push(fx));
buildDrones(scene);
buildCameras(scene);
buildParticles(scene);
buildInstruments(scene);
buildLabels(scene);

// Ice
const iceMat = new THREE.MeshStandardMaterial({ color: 0xccddff, emissive: 0x4488ff, emissiveIntensity: 0, transparent: true, opacity: 0 });
const coldCx = centers[1];
const iceMeshes = [];
for (let i = 0; i < 20; i++) {
  const icicle = new THREE.Mesh(new THREE.ConeGeometry(0.02 + Math.random() * 0.03, 0.05 + Math.random() * 0.12, 4), iceMat.clone());
  icicle.position.set(coldCx + (Math.random() - 0.5) * 5, HEIGHT - 0.1, (Math.random() - 0.5) * 7);
  icicle.rotation.z = (Math.random() - 0.5) * 0.2;
  icicle.rotation.x = (Math.random() - 0.5) * 0.2;
  scene.add(icicle);
  icePieces.push(icicle);
}
for (let i = 0; i < 30; i++) {
  const frost = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.08, 4, 4), iceMat.clone());
  frost.position.set(coldCx + (Math.random() - 0.5) * 5.5, 0.03, (Math.random() - 0.5) * 8);
  frost.scale.y = 0.2 + Math.random() * 0.3;
  scene.add(frost);
  icePieces.push(frost);
}
for (let i = 0; i < 15; i++) {
  const crystal = new THREE.Mesh(new THREE.BoxGeometry(0.02 + Math.random() * 0.04, 0.02 + Math.random() * 0.06, 0.02 + Math.random() * 0.04), iceMat.clone());
  crystal.position.set(coldCx - 1.5 + (Math.random() - 0.5) * 1.5, 0.05 + Math.random() * 0.3, -2.5 + (Math.random() - 0.5) * 1.5);
  scene.add(crystal);
  icePieces.push(crystal);
}
[-1, 1].forEach(side => {
  for (let i = 0; i < 10; i++) {
    const fw = new THREE.Mesh(new THREE.BoxGeometry(0.02 + Math.random() * 0.04, 0.02 + Math.random() * 0.06, 0.02 + Math.random() * 0.04), iceMat.clone());
    fw.position.set(coldCx + side * 3.3, 0.5 + Math.random() * 3, (Math.random() - 0.5) * 7);
    scene.add(fw);
    icePieces.push(fw);
  }
});

// Flight path
const flightPath = new THREE.Group();
flightPath.visible = false;
scene.add(flightPath);
const pathPoints = [
  new THREE.Vector3(-16, 1.5, 6.0), new THREE.Vector3(-12.5, 3.0, 1.5), new THREE.Vector3(-10.5, 4.0, -0.5),
  new THREE.Vector3(-7.0, 2.5, -1.5), new THREE.Vector3(-3.5, 3.5, 0.5), new THREE.Vector3(0, 2.0, -1.0),
  new THREE.Vector3(3.5, 3.5, 1.5), new THREE.Vector3(7.0, 2.5, -0.5), new THREE.Vector3(10.5, 4.5, 0.0),
  new THREE.Vector3(12.5, 3.0, 2.0), new THREE.Vector3(16, 2.0, 5.5),
];
const curve = new THREE.CatmullRomCurve3(pathPoints);
const curvePoints = curve.getPoints(100);
const pathLineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
const pathLineMat = new THREE.LineBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.3, depthTest: false });
const pathLine = new THREE.Line(pathLineGeo, pathLineMat);
flightPath.add(pathLine);
const trailMat = new THREE.LineDashedMaterial({ color: 0x00f5d4, dashSize: 0.15, gapSize: 0.1, transparent: true, opacity: 0.15, depthTest: false });
const trailLine = new THREE.Line(pathLineGeo.clone(), trailMat);
trailLine.computeLineDistances();
flightPath.add(trailLine);
const wpMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.25 });
pathPoints.forEach((p, i) => {
  if (i > 0 && i < pathPoints.length - 1 && i % 2 === 0) {
    const wp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), wpMat);
    wp.position.copy(p);
    flightPath.add(wp);
  }
});
const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
const follower = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), glowMat);
const glowLight = new THREE.PointLight(0x00f5d4, 0.5, 2);
follower.add(glowLight);
flightPath.add(follower);
const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
const ring = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.28, 24), ringMat);
ring.rotation.x = Math.PI / 2;
follower.add(ring);

// Chart
const chartCanvas = document.getElementById('chart');
const chartCtx = chartCanvas.getContext('2d');
const chartW = 424, chartH = 80;
const chartData = { hot: [], cold: [], wind: [], rain: [] };
const maxPoints = 120;
let chartTimer = 0;

function drawChart() {
  chartCtx.clearRect(0, 0, chartW, chartH);
  const pad = 4;
  const drawW = chartW - pad * 2, drawH = chartH - pad * 2;
  const series = [
    { key: 'hot', color: '#ff6b35', data: chartData.hot },
    { key: 'cold', color: '#00b4d8', data: chartData.cold },
    { key: 'wind', color: '#00f5d4', data: chartData.wind },
    { key: 'rain', color: '#4a6fa5', data: chartData.rain },
  ];
  series.forEach(s => {
    if (s.data.length < 2) return;
    chartCtx.beginPath();
    chartCtx.strokeStyle = s.color;
    chartCtx.lineWidth = 1.5;
    chartCtx.globalAlpha = 0.7;
    for (let i = 0; i < s.data.length; i++) {
      const x = pad + (i / (maxPoints - 1)) * drawW;
      const y = pad + drawH - s.data[i] * drawH;
      i === 0 ? chartCtx.moveTo(x, y) : chartCtx.lineTo(x, y);
    }
    chartCtx.stroke();
  });
  chartCtx.globalAlpha = 1;
}

function pushChartData() {
  const cards = document.querySelectorAll('.section-card');
  const getVal = (idx, rowIdx) => {
    const slider = cards[idx]?.querySelectorAll('.slider')[rowIdx];
    return slider ? parseFloat(slider.value) : 0;
  };
  const normalize = (v, min, max) => Math.max(0, Math.min(1, (v - min) / (max - min)));
  chartData.hot.push(normalize(getVal(0, 0), 25, 85));
  chartData.cold.push(normalize(getVal(1, 0), -20, 10));
  chartData.wind.push(normalize(getVal(2, 0), 0, 60));
  chartData.rain.push(normalize(getVal(3, 0), 0, 100));
  if (chartData.hot.length > maxPoints) {
    chartData.hot.shift(); chartData.cold.shift();
    chartData.wind.shift(); chartData.rain.shift();
  }
  drawChart();
}

// UI Event bindings
const sliderConfig = [
  { idx: 0, key: 'temp', unit: '°C', min: 25, max: 85, update: (v) => {
    const enabled = equipmentState.heater && !equipmentFailed.heater;
    const norm = enabled ? (v - 25) / 60 : 0;
    particleSpeedMult[0] = norm * 1.5 + 0.2;
    accentLights[0].intensity = 0.3 + norm * 0.9;
    accentLights[0].color.setHSL(0.07 - norm * 0.04, 1, 0.5);
    if (equipmentRefs.heater) {
      equipmentRefs.heater.coils.forEach(c => c.material.emissiveIntensity = 0.2 + norm * 1.0);
      equipmentRefs.heater.light.intensity = 0.2 + norm * 1.2;
    }
    particleOpacity[4] = norm * 0.15;
    particleOpacity[7] = norm * 0.8;
    particleSpeedMult[4] = 0.1 + norm * 0.6;
    vents.ventBox.material.emissive = new THREE.Color(0xff6600);
    vents.ventBox.material.emissiveIntensity = norm * 0.8;
    vents.ductRing.material.emissive = new THREE.Color(0xff4400);
    vents.ductRing.material.emissiveIntensity = norm * 0.6;
    audioState.drones[0] = norm;
    updateAudio();
    document.querySelector('[data-sensor="0-temp"]').textContent = v + '°C';
    document.querySelector('[data-sensor="0-humidity"]').textContent = Math.round(25 + norm * 25) + '%';
  }},
  { idx: 0, key: 'glow', unit: '%', min: 0, max: 100, update: (v) => {
    const norm = v / 100;
    if (equipmentRefs.heater) {
      equipmentRefs.heater.coils.forEach(c => c.material.emissiveIntensity = norm * 1.2);
      equipmentRefs.heater.light.intensity = norm * 1.4;
    }
  }},
  { idx: 1, key: 'temp', unit: '°C', min: -20, max: 10, update: (v) => {
    const enabled = equipmentState.ac && !equipmentFailed.ac;
    const norm = enabled ? (v + 20) / 30 : 0;
    particleSpeedMult[1] = 0.3 + norm * 1.2;
    accentLights[1].intensity = 0.2 + (1 - norm) * 0.8;
    accentLights[1].color.setHSL(0.56 + (1 - norm) * 0.03, 0.8, 0.5);
    if (equipmentRefs.ac) {
      equipmentRefs.ac.ice.material.emissiveIntensity = 0.1 + (1 - norm) * 0.5;
      equipmentRefs.ac.light.intensity = 0.2 + (1 - norm) * 0.8;
    }
    const coldness = enabled ? 1 - norm : 0;
    particleOpacity[5] = coldness * 0.18;
    vents.grillBox.material.emissive = new THREE.Color(0x4488ff);
    vents.grillBox.material.emissiveIntensity = coldness * 0.5;
    audioState.drones[1] = coldness;
    updateAudio();
    document.querySelector('[data-sensor="1-temp"]').textContent = v + '°C';
    document.querySelector('[data-sensor="1-humidity"]').textContent = Math.round(10 + (1 - norm) * 20) + '%';
  }},
  { idx: 1, key: 'snow', unit: '%', min: 0, max: 100, update: (v) => {
    const norm = v / 100;
    particleOpacity[1] = norm;
    particleSpeedMult[1] = 0.3 + norm * 1.0;
    particleSystems[1].sys.points.material.opacity = 0.1 + norm * 0.6;
  }},
  { idx: 2, key: 'wind', unit: 'km/h', min: 0, max: 60, update: (v) => {
    const enabled = equipmentState.fan && !equipmentFailed.fan;
    const norm = enabled ? v / 60 : 0;
    particleSpeedMult[2] = norm * 2.0 + 0.1;
    accentLights[2].intensity = 0.2 + norm * 0.8;
    particleSystems[2].sys.points.material.opacity = 0.08 + norm * 0.5;
    flags.fanSpeedTarget = 1.0 + norm * 8.0;
    audioState.drones[2] = norm;
    audioState.whoosh = norm;
    updateAudio();
    document.querySelector('[data-sensor="2-wind"]').textContent = v + 'km/h';
    document.querySelector('[data-sensor="2-gust"]').textContent = Math.round(v * 1.4) + 'km/h';
  }},
  { idx: 3, key: 'rain', unit: '%', min: 0, max: 100, update: (v) => {
    const enabled = equipmentState.sprinklers && !equipmentFailed.sprinklers;
    const norm = enabled ? v / 100 : 0;
    particleSpeedMult[3] = 0.3 + norm * 2.5;
    accentLights[3].intensity = 0.2 + norm * 0.6;
    particleSystems[3].sys.points.material.opacity = 0.1 + norm * 0.6;
    if (sectionFloors[3]) {
      sectionFloors[3].material.roughness = 0.9 - norm * 0.85;
      sectionFloors[3].material.metalness = 0.1 + norm * 0.7;
      sectionFloors[3].material.color.setHSL(0.62, 0.15 + norm * 0.3, 0.1 + norm * 0.08);
    }
    audioState.drones[3] = norm;
    audioState.hiss = norm;
    updateAudio();
    document.querySelector('[data-sensor="3-rain"]').textContent = v + '%';
    document.querySelector('[data-sensor="3-humidity"]').textContent = Math.round(70 + norm * 28) + '%';
  }},
];

document.querySelectorAll('.slider').forEach(slider => {
  slider.addEventListener('input', (e) => {
    const card = e.target.closest('.section-card');
    const idx = parseInt(card.dataset.idx);
    const val = parseFloat(e.target.value);
    const display = card.querySelector('.ctrl-value');
    const rows = card.querySelectorAll('.ctrl-row');
    const rowIdx = Array.from(rows).findIndex(r => r.contains(e.target));
    const cfg = sliderConfig.filter(c => c.idx === idx)[rowIdx];
    if (!cfg) return;
    display.textContent = val + cfg.unit;
    cfg.update(val);
    // Persist
    try { localStorage.setItem(`slider_${idx}_${rowIdx}`, val); } catch {}
  });
  const card = slider.closest('.section-card');
  const idx = parseInt(card.dataset.idx);
  const val = parseFloat(slider.value);
  const rows = card.querySelectorAll('.ctrl-row');
  const rowIdx = Array.from(rows).findIndex(r => r.contains(slider));
  const cfg = sliderConfig.filter(c => c.idx === idx)[rowIdx];
  if (cfg) cfg.update(val);
});

// Restore persisted slider values
try {
  document.querySelectorAll('.section-card').forEach(card => {
    const idx = card.dataset.idx;
    card.querySelectorAll('.slider').forEach((sl, ri) => {
      const saved = localStorage.getItem(`slider_${idx}_${ri}`);
      if (saved !== null) {
        sl.value = saved;
        const display = card.querySelectorAll('.ctrl-value')[ri];
        if (display) {
          const val = parseFloat(saved);
          const cfg = sliderConfig.filter(c => c.idx === parseInt(idx))[ri];
          display.textContent = val + (cfg ? cfg.unit : '');
          if (cfg) cfg.update(val);
        }
      }
    });
  });
} catch {}

// Drone commands
document.querySelectorAll('[data-cmd]').forEach(btn => {
  btn.addEventListener('click', () => {
    const [idxStr, action] = btn.dataset.cmd.split('-');
    const idx = parseInt(idxStr);
    const d = drones[idx];
    if (!d) return;
    if (action === 'up') d.baseY = Math.min(5.0, d.baseY + 0.3);
    if (action === 'down') d.baseY = Math.max(0.3, d.baseY - 0.3);
    if (action === 'reset') d.baseY = 3.0;
    if (action === 'charge') { telemetryData[idx].batt = 100; audioState.drones[idx] = 0; updateAudio(); }
    btn.classList.add('active-cmd');
    setTimeout(() => btn.classList.remove('active-cmd'), 200);
  });
});

// Global controls
document.getElementById('pause-btn').addEventListener('click', () => {
  flags.paused = !flags.paused;
  document.getElementById('pause-indicator').style.display = flags.paused ? 'inline' : 'none';
});
document.getElementById('siren-btn').addEventListener('click', () => {
  flags.sirenActive = !flags.sirenActive;
  const el = document.getElementById('siren-btn');
  el.style.color = flags.sirenActive ? '#ff4444' : '#888';
  el.style.borderColor = flags.sirenActive ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.08)';
});
document.getElementById('isolate-btn').addEventListener('click', () => {
  flags.isolatedZone = flags.isolatedZone < 0 ? 0 : flags.isolatedZone >= 3 ? -1 : flags.isolatedZone + 1;
  const el = document.getElementById('isolate-btn');
  el.textContent = flags.isolatedZone >= 0 ? `🔲 Zone ${flags.isolatedZone + 1}` : '🔲 Isolate';
  el.style.color = flags.isolatedZone >= 0 ? '#ffaa44' : '#888';
});
document.getElementById('screenshot-btn').addEventListener('click', () => {
  renderer.render(scene, camera);
  const link = document.createElement('a');
  link.download = `chamber-${Date.now()}.png`;
  link.href = renderer.domElement.toDataURL('image/png');
  link.click();
});
document.getElementById('help-btn').addEventListener('click', () => {
  const h = document.getElementById('help-overlay');
  h.style.display = h.style.display === 'flex' ? 'none' : 'flex';
});
document.getElementById('reset-view-btn').addEventListener('click', () => {
  controls.target.set(0, 3.0, 0);
  camera.position.set(22, 14, 24);
  controls.update();
});

// PIP button
document.getElementById('pip-btn').addEventListener('click', (e) => {
  flags.pipActive = !flags.pipActive;
  pipCanvas.style.display = flags.pipActive ? 'block' : 'none';
  e.target.style.color = flags.pipActive ? '#00f5d4' : '#888';
  e.target.style.borderColor = flags.pipActive ? 'rgba(0,245,212,0.3)' : 'rgba(255,255,255,0.08)';
});
pipCanvas.addEventListener('click', () => {
  if (!flags.pipActive) return;
  flags.pipDroneIdx = (flags.pipDroneIdx + 1) % drones.length;
});

// Flight path toggle
document.getElementById('fp-toggle').addEventListener('click', (e) => {
  flightPath.visible = !flightPath.visible;
  e.target.textContent = flightPath.visible ? '◆ Path' : '◇ Path';
  e.target.classList.toggle('active');
});

// Spec sheet
document.getElementById('spec-btn').addEventListener('click', () => document.getElementById('spec-overlay').classList.add('open'));
document.getElementById('spec-close').addEventListener('click', () => document.getElementById('spec-overlay').classList.remove('open'));
document.getElementById('spec-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) document.getElementById('spec-overlay').classList.remove('open');
});

// Camera select
document.getElementById('cam-select').addEventListener('change', (e) => {
  if (e.target.value) setCameraView(e.target.value);
  e.target.value = '';
});

// Thermal
let thermalMode = false;
const thermalOverlay = document.getElementById('thermal-overlay');
const origSceneBg = scene.background.clone();
const origAmbientIntensity = scene.children.find(c => c.isAmbientLight)?.intensity || 0.7;
const origExposure = renderer.toneMappingExposure;
document.getElementById('thermal-btn').addEventListener('click', (e) => {
  thermalMode = !thermalMode;
  e.target.style.color = thermalMode ? '#ff4444' : '#888';
  e.target.style.borderColor = thermalMode ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.08)';
  thermalOverlay.classList.toggle('active');
  if (thermalMode) {
    scene.background = new THREE.Color(0x000811);
    const al = scene.children.find(c => c.isAmbientLight);
    if (al) al.intensity = 0.05;
    renderer.toneMappingExposure = 0.6;
  } else {
    scene.background.copy(origSceneBg);
    const al = scene.children.find(c => c.isAmbientLight);
    if (al) al.intensity = origAmbientIntensity;
    renderer.toneMappingExposure = origExposure;
  }
});

// Presets
document.getElementById('preset-select').addEventListener('change', (e) => {
  const p = ({
    desert: { sliders: [[0, 80], [0, 90], [1, -15], [1, 10], [2, 15], [3, 5]] },
    arctic: { sliders: [[0, 25], [0, 0], [1, -18], [1, 90], [2, 30], [3, 10]] },
    monsoon: { sliders: [[0, 30], [0, 20], [1, 5], [1, 10], [2, 40], [3, 95]] },
    template: { sliders: [[0, 50], [0, 50], [1, -5], [1, 50], [2, 25], [3, 50]] },
  })[e.target.value];
  if (!p) return;
  p.sliders.forEach(([sectionIdx, val]) => {
    const cards = document.querySelectorAll('.section-card');
    const card = cards[sectionIdx];
    const rows = card.querySelectorAll('.ctrl-row');
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const slider = rows[rowIdx].querySelector('.slider');
      if (!slider) continue;
      const min = parseFloat(slider.min), max = parseFloat(slider.max);
      if (val >= min && val <= max) {
        slider.value = val;
        const display = rows[rowIdx].querySelector('.ctrl-value');
        const unit = display.textContent.replace(/[\d.-]/g, '');
        display.textContent = val + unit;
        const cfg = sliderConfig.filter(c => c.idx === sectionIdx)[rowIdx];
        if (cfg) cfg.update(val);
        break;
      }
    }
  });
  e.target.value = '';
});

// Follow cam
document.getElementById('follow-btn').addEventListener('click', (e) => {
  if (!flags.followCam) {
    flags.followIdx = (flags.followIdx + 1) % 4;
    flags.followCam = true;
    controls.autoRotate = false;
    e.target.textContent = `◎ UAV-${String(flags.followIdx + 1).padStart(2, '0')}`;
    e.target.style.color = '#00f5d4';
    e.target.style.borderColor = 'rgba(0,245,212,0.3)';
    document.getElementById('follow-indicator').textContent = `● FOLLOW UAV-${String(flags.followIdx + 1).padStart(2, '0')}`;
    document.getElementById('follow-indicator').style.display = 'block';
  } else {
    flags.followIdx = (flags.followIdx + 1) % 4;
    e.target.textContent = `◎ UAV-${String(flags.followIdx + 1).padStart(2, '0')}`;
    document.getElementById('follow-indicator').textContent = `● FOLLOW UAV-${String(flags.followIdx + 1).padStart(2, '0')}`;
  }
});
document.getElementById('follow-btn').addEventListener('dblclick', (e) => {
  flags.followCam = false;
  e.target.textContent = '◎ Follow';
  e.target.style.color = '#888';
  e.target.style.borderColor = 'rgba(255,255,255,0.08)';
  document.getElementById('follow-indicator').style.display = 'none';
});

// Formation
document.getElementById('formation-btn').addEventListener('click', (e) => {
  flags.formationMode = !flags.formationMode;
  e.target.style.color = flags.formationMode ? '#00f5d4' : '#888';
  e.target.style.borderColor = flags.formationMode ? 'rgba(0,245,212,0.3)' : 'rgba(255,255,255,0.08)';
  if (flags.formationMode) {
    if (!flightPath.visible) {
      flightPath.visible = true;
      document.getElementById('fp-toggle').textContent = '◆ Path';
      document.getElementById('fp-toggle').classList.add('active');
    }
    drones.forEach((d) => { d.baseY = 2.0; });
  }
});

// Mute
document.getElementById('mute-btn').addEventListener('click', (e) => {
  flags.audioMuted = !flags.audioMuted;
  e.target.textContent = flags.audioMuted ? '🔇 Muted' : '🔊 Sound';
  e.target.style.color = flags.audioMuted ? '#ff4444' : '#888';
  e.target.style.borderColor = flags.audioMuted ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.08)';
  const ctx = window.__audioCtx;
  if (ctx) flags.audioMuted ? ctx.suspend() : ctx.resume();
});

// Test sequences
const sequences = {
  heat: {
    name: 'Heat Stress Test',
    steps: [
      { time: 0, msg: 'Starting heat test...', fn: () => setSlider(0, 0, 30) },
      { time: 3, msg: 'Raising temperature to 50°C', fn: () => setSlider(0, 0, 50) },
      { time: 6, msg: 'Raising temperature to 70°C', fn: () => setSlider(0, 0, 70) },
      { time: 9, msg: 'Max heat — 85°C', fn: () => setSlider(0, 0, 85) },
      { time: 12, msg: 'Increasing heat glow', fn: () => setSlider(0, 1, 100) },
      { time: 15, msg: 'Cooling down...', fn: () => setSlider(0, 0, 40) },
      { time: 18, msg: 'Test complete', fn: () => setSlider(0, 0, 25) },
    ],
    duration: 20,
  },
  cold: {
    name: 'Cold Start Test',
    steps: [
      { time: 0, msg: 'Starting cold test...', fn: () => setSlider(1, 0, 5) },
      { time: 3, msg: 'Dropping to -5°C', fn: () => setSlider(1, 0, -5) },
      { time: 6, msg: 'Dropping to -12°C', fn: () => setSlider(1, 0, -12) },
      { time: 9, msg: 'Maximum cold -20°C', fn: () => setSlider(1, 0, -20) },
      { time: 12, msg: 'Increasing snowfall', fn: () => setSlider(1, 1, 90) },
      { time: 15, msg: 'Warming up...', fn: () => setSlider(1, 0, -2) },
      { time: 18, msg: 'Test complete', fn: () => { setSlider(1, 0, 5); setSlider(1, 1, 0); } },
    ],
    duration: 20,
  },
  wind: {
    name: 'Crosswind Landing',
    steps: [
      { time: 0, msg: 'Starting wind test...', fn: () => setSlider(2, 0, 5) },
      { time: 2, msg: 'Wind 20 km/h', fn: () => setSlider(2, 0, 20) },
      { time: 5, msg: 'Wind 35 km/h', fn: () => setSlider(2, 0, 35) },
      { time: 8, msg: 'Max crosswind 60 km/h', fn: () => setSlider(2, 0, 60) },
      { time: 11, msg: 'Wind subsiding...', fn: () => setSlider(2, 0, 25) },
      { time: 14, msg: 'Test complete', fn: () => setSlider(2, 0, 0) },
    ],
    duration: 15,
  },
  rain: {
    name: 'Water Resistance',
    steps: [
      { time: 0, msg: 'Starting rain test...', fn: () => setSlider(3, 0, 10) },
      { time: 2, msg: 'Light rain 30%', fn: () => setSlider(3, 0, 30) },
      { time: 5, msg: 'Moderate rain 60%', fn: () => setSlider(3, 0, 60) },
      { time: 8, msg: 'Heavy downpour 100%', fn: () => setSlider(3, 0, 100) },
      { time: 11, msg: 'Rain easing...', fn: () => setSlider(3, 0, 40) },
      { time: 14, msg: 'Test complete', fn: () => setSlider(3, 0, 0) },
    ],
    duration: 15,
  },
  sweep: {
    name: 'Full Climate Sweep',
    steps: [
      { time: 0, msg: 'Starting climate sweep...', fn: () => { setSlider(0, 0, 30); setSlider(1, 0, 5); setSlider(2, 0, 0); setSlider(3, 0, 0); } },
      { time: 3, msg: '🔥 Entering hot zone — 60°C', fn: () => setSlider(0, 0, 60) },
      { time: 6, msg: '🔥 Max heat — 80°C', fn: () => setSlider(0, 0, 80) },
      { time: 9, msg: '❄️ Transition to cold — -10°C', fn: () => { setSlider(0, 0, 25); setSlider(1, 0, -10); } },
      { time: 12, msg: '❄️ Deep freeze — -18°C with snow', fn: () => { setSlider(1, 0, -18); setSlider(1, 1, 80); } },
      { time: 15, msg: '🌬 Entering wind — 40 km/h', fn: () => { setSlider(1, 0, 0); setSlider(2, 0, 40); } },
      { time: 18, msg: '🌬 Max crosswind — 60 km/h', fn: () => setSlider(2, 0, 60) },
      { time: 21, msg: '🌧 Final zone — heavy rain', fn: () => { setSlider(2, 0, 0); setSlider(3, 0, 80); } },
      { time: 24, msg: '🌧 Downpour max intensity', fn: () => setSlider(3, 0, 100) },
      { time: 27, msg: 'All clear — returning to ambient', fn: () => { setSlider(3, 0, 0); setSlider(0, 0, 25); setSlider(1, 0, 5); setSlider(2, 0, 0); } },
      { time: 30, msg: 'Full climate sweep complete', fn: () => {} },
    ],
    duration: 32,
  },
};

function setSlider(sectionIdx, rowIdx, val) {
  const cards = document.querySelectorAll('.section-card');
  const card = cards[sectionIdx];
  if (!card) return;
  const rows = card.querySelectorAll('.ctrl-row');
  const row = rows[rowIdx];
  if (!row) return;
  const slider = row.querySelector('.slider');
  const display = row.querySelector('.ctrl-value');
  if (!slider) return;
  slider.value = val;
  const unit = display.textContent.replace(/[\d.-]/g, '');
  display.textContent = val + unit;
  const cfg = sliderConfig.filter(c => c.idx === sectionIdx)[rowIdx];
  if (cfg) cfg.update(val);
}

let testRunning = false;
let testTimer = 0;
let testSteps = [];
let testCurrentStep = 0;
let testDuration = 0;
let testAnimId = null;

function runTest(id) {
  if (testRunning) { stopTest(); return; }
  const seq = sequences[id];
  if (!seq) return;
  testRunning = true;
  testTimer = 0;
  testSteps = [...seq.steps].sort((a, b) => a.time - b.time);
  testCurrentStep = 0;
  testDuration = seq.duration;
  const btn = document.getElementById('test-btn');
  btn.textContent = '■ Stop';
  btn.classList.add('running');
  document.getElementById('test-select').disabled = true;
  document.getElementById('test-label').textContent = '0% — ' + seq.steps[0].msg;
  document.getElementById('test-progress-bar').style.width = '0%';
  testSteps[0].fn();
  testCurrentStep++;
}

function stopTest() {
  testRunning = false;
  const btn = document.getElementById('test-btn');
  btn.textContent = '▶ Run';
  btn.classList.remove('running');
  document.getElementById('test-select').disabled = false;
  document.getElementById('test-label').textContent = 'Ready';
  document.getElementById('test-progress-bar').style.width = '0%';
  if (testAnimId) { cancelAnimationFrame(testAnimId); testAnimId = null; }
}

function updateTest(dt) {
  if (!testRunning) return;
  testTimer += dt;
  const progress = Math.min(testTimer / testDuration, 1);
  document.getElementById('test-progress-bar').style.width = (progress * 100) + '%';
  document.getElementById('test-label').textContent = Math.round(progress * 100) + '%';
  while (testCurrentStep < testSteps.length && testSteps[testCurrentStep].time <= testTimer) {
    testSteps[testCurrentStep].fn();
    document.getElementById('test-label').textContent = Math.round(progress * 100) + '% — ' + testSteps[testCurrentStep].msg;
    testCurrentStep++;
  }
  if (testTimer >= testDuration) stopTest();
}

document.getElementById('test-btn').addEventListener('click', () => {
  if (testRunning) { stopTest(); return; }
  const sel = document.getElementById('test-select');
  const val = sel.value;
  if (!val) return;
  runTest(val);
});

// Export
function exportCSV() {
  const now = new Date();
  const filename = `climate-test-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.csv`;
  const headers = 'Time(s),Hot_Temp(°C),Cold_Temp(°C),Wind_Speed(km/h),Rain_Intensity(%)\n';
  const rows = exportSamples.map(s => `${s.t.toFixed(1)},${s.hot},${s.cold},${s.wind},${s.rain}`).join('\n');
  const csv = headers + rows;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click(); URL.revokeObjectURL(url);
}
document.getElementById('export-btn').addEventListener('click', () => {
  const dialog = document.getElementById('export-dialog');
  const content = document.getElementById('export-content');
  const now = new Date().toLocaleString();
  const maxRows = Math.min(exportSamples.length, 30);
  let rows = '';
  for (let i = Math.max(0, exportSamples.length - maxRows); i < exportSamples.length; i++) {
    const s = exportSamples[i];
    rows += `${s.t.toFixed(1)}s  │ Hot: ${s.hot}°C  │ Cold: ${s.cold}°C  │ Wind: ${s.wind}km/h  │ Rain: ${s.rain}%\n`;
  }
  content.textContent = `Test Run — ${now}\n${'─'.repeat(50)}\n${rows || 'No data collected yet.'}`;
  dialog.classList.add('open');
});
document.getElementById('export-close').addEventListener('click', () => document.getElementById('export-dialog').classList.remove('open'));
document.getElementById('export-download').addEventListener('click', exportCSV);
document.getElementById('export-dialog').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.target.classList.remove('open');
});

// Raycaster for equipment click
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const eqMeshes = [];
const eqNames = ['Industrial Heater — Chromalox CXN-480-60', 'AC Cooling Unit — Copeland ZR61KCE-TFD', 'High-Velocity Fan — Howden Buffalo AP-24-150', 'Ceiling Sprinkler Array — 12-nozzle system'];
const eqDescs = ['60 kW electric resistance heater · 25–85°C range', '52,000 BTU/h refrigeration · -20–10°C range', '18,000 CFM axial fan · 0–60 km/h range', '0.5–8.0 L/min per nozzle · 2–6 bar pressure'];
scene.children.forEach(child => {
  if (child.isGroup && child.children.length > 5) {
    child.children.forEach(m => { if (m.isMesh) eqMeshes.push(m); });
  }
});
renderer.domElement.addEventListener('click', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(eqMeshes, false);
  const tooltip = document.getElementById('eq-tooltip');
  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const eqIdx = centers.findIndex((c, i) => Math.abs(hit.position.x - centers[i]) < 3);
    const idx = eqIdx >= 0 ? eqIdx : 0;
    const key = ['heater', 'ac', 'fan', 'sprinklers'][idx];
    const wasFailed = equipmentFailed[key];
    const wasOn = equipmentState[key];
    equipmentState[key] = !equipmentState[key];
    const isOn = equipmentState[key];
    if (wasFailed && isOn && !wasOn) {
      equipmentFailed[key] = false;
      equipmentFailTimer[idx] = 0;
    }
    const ref = equipmentRefs[key];
    if (ref && ref.indicator) {
      let ledColor;
      if (isOn && !equipmentFailed[key]) ledColor = 0x00ff44;
      else if (equipmentFailed[key]) ledColor = 0xff8800;
      else ledColor = 0xff2200;
      ref.indicator.material.color.setHex(ledColor);
      ref.indicator.material.emissive.setHex(ledColor);
      ref.indicator.material.emissiveIntensity = 0.8;
    }
    const card = document.querySelector(`.section-card[data-idx="${idx}"]`);
    if (card) {
      card.querySelectorAll('.slider').forEach((sl, si) => {
        const cfg = sliderConfig.filter(c => c.idx === idx)[si];
        if (cfg) cfg.update(parseFloat(sl.value));
      });
    }
    const failStatus = wasFailed ? ' ⚠ FAILED' : '';
    document.querySelector('#eq-tooltip .tt-name').textContent = (eqNames[idx] || 'Equipment') + failStatus;
    document.querySelector('#eq-tooltip .tt-desc').textContent = (equipmentFailed[key] ? '⚠ FAILED' : (isOn ? '🟢 ON' : '🔴 OFF')) + ' — ' + (eqDescs[idx] || '');
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX + 12) + 'px';
    tooltip.style.top = (e.clientY - 10) + 'px';
    setTimeout(() => { tooltip.style.display = 'none'; }, 1500);
  }
});
renderer.domElement.addEventListener('mousemove', (e) => {
  const tooltip = document.getElementById('eq-tooltip');
  if (tooltip.style.display === 'block') {
    tooltip.style.left = (e.clientX + 12) + 'px';
    tooltip.style.top = (e.clientY - 10) + 'px';
  }
});

// Keyboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D') { doorsOpen.state = !doorsOpen.state; }
  if (e.key === 'm' || e.key === 'M') { document.getElementById('mute-btn')?.click(); }
  if (e.key === 't' || e.key === 'T') { document.getElementById('thermal-btn')?.click(); }
  if (e.key === 'p' || e.key === 'P') { document.getElementById('follow-btn')?.click(); }
  if (e.key === 'f' || e.key === 'F') { document.getElementById('formation-btn')?.click(); }
  if (e.key === '?') {
    const h = document.getElementById('help-overlay');
    h.style.display = h.style.display === 'flex' ? 'none' : 'flex';
  }
  if (e.key === 'Escape') {
    document.getElementById('help-overlay').style.display = 'none';
    if (flags.followCam) document.getElementById('follow-btn')?.dispatchEvent(new Event('dblclick'));
  }
  if (e.key >= '0' && e.key <= '4') {
    const sel = document.getElementById('cam-select');
    if (sel) { sel.value = ['orbit', 'hot', 'cold', 'windy', 'rainy'][parseInt(e.key)]; sel.dispatchEvent(new Event('change')); }
  }
  if ((e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'r' || e.key === 'R') && drones.length) {
    const activeZone = document.activeElement?.closest('.section-card')?.dataset?.idx;
    const idx = flags.followCam ? flags.followIdx : (activeZone !== undefined ? parseInt(activeZone) : 0);
    const cmd = e.key === 'ArrowUp' ? 'up' : e.key === 'ArrowDown' ? 'down' : 'reset';
    document.querySelector(`[data-cmd="${idx}-${cmd}"]`)?.click();
  }
  if (e.key === ' ') { e.preventDefault(); document.getElementById('pause-btn')?.click(); }
  if (e.key === '+' || e.key === '=') { flags.speedMul = Math.min(4, flags.speedMul + 0.25); }
  if (e.key === '-') { flags.speedMul = Math.max(0.25, flags.speedMul - 0.25); }
});

// Audio init on first interaction
document.addEventListener('click', () => { if (!window.__audioCtx) { initAudio(); updateAudio(); } }, { once: true });
document.addEventListener('touchstart', () => { if (!window.__audioCtx) { initAudio(); updateAudio(); } }, { once: true });

// Welcome toast
(function() {
  if (localStorage.getItem('uav_welcomed')) return;
  const toast = document.getElementById('welcome-toast');
  let dismissed = false;
  toast.style.display = 'block';
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    toast.style.animation = 'toastOut 0.3s ease-in forwards';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
    localStorage.setItem('uav_welcomed', 'true');
  };
  document.getElementById('toast-dismiss').addEventListener('click', dismiss);
  setTimeout(dismiss, 8000);
  const firstSlider = document.querySelector('.section-card .slider');
  if (firstSlider) firstSlider.classList.add('slider-pulse');
})();

// Resize
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
});

// ============ ANIMATION LOOP ============
const clock = new THREE.Clock();
let fanAngle = 0;

function animate() {
  requestAnimationFrame(animate);
  if (!animate._loaded) {
    animate._loaded = true;
    const ls = document.getElementById('loading-screen');
    if (ls) { ls.classList.add('hidden'); setTimeout(() => ls.remove(), 600); }
  }
  let dt = Math.min(clock.getDelta(), 0.05);
  if (flags.paused) { clock.elapsedTime += dt; dt = 0; }
  dt *= flags.speedMul;
  const t = clock.elapsedTime;

  const cards = document.querySelectorAll('.section-card');
  const hotSlider = cards[0]?.querySelectorAll('.slider')[0];
  const hotVal = hotSlider ? (parseFloat(hotSlider.value) - 25) / 60 : 0.5;
  const coldTempSlider = cards[1]?.querySelectorAll('.slider')[0];
  const coldVal = coldTempSlider ? 1 - (parseFloat(coldTempSlider.value) + 20) / 30 : 0.5;
  const windSlider = cards[2]?.querySelectorAll('.slider')[0];
  const windVal = windSlider ? parseFloat(windSlider.value) / 60 : 0;
  const rainSlider = cards[3]?.querySelectorAll('.slider')[0];
  const rainVal = rainSlider ? parseFloat(rainSlider.value) / 100 : 0.5;

  // Drone physics
  drones.forEach((d, i) => {
    let hoverAmp = 0.12;
    let windForce = 0;
    let extraWobble = 0;
    let battMult = 1.0;
    const typeStab = d.type === 'Freight Hex' ? 0.6 : d.type === 'Racer X' ? 1.8 : 1.0;
    hoverAmp *= typeStab;

    if (i === 0) { hoverAmp += hotVal * 0.15; battMult += hotVal * 0.6; }
    if (i === 1) { battMult += coldVal * 2.0; hoverAmp += coldVal * 0.05; }
    if (i === 2) {
      windForce = windVal * 2.5 * typeStab;
      d.group.rotation.x = -windVal * 0.4;
      d.group.rotation.z = windVal * 0.15;
      battMult += windVal * 0.3;
    }
    if (i === 3) {
      extraWobble = rainVal * 0.08 * typeStab;
      d.group.position.y -= rainVal * 0.02 * dt;
      battMult += rainVal * 0.2;
    }

    const driftAmp = d.type === 'Freight Hex' ? 0.15 : d.type === 'Racer X' ? 0.6 : 0.3;
    const driftSpeed = d.type === 'Freight Hex' ? 0.2 : d.type === 'Racer X' ? 0.7 : 0.4;
    d.driftPhase += dt * driftSpeed;
    const driftX = Math.sin(d.driftPhase) * driftAmp;
    const driftZ = Math.cos(d.driftPhase * 0.7 + 1.2) * driftAmp * 0.5;

    if (i === 2) {
      d.windVel += (windForce - d.windOffset) * dt * 3;
      d.windVel *= 0.95;
      d.windOffset += d.windVel * dt;
    }
    d.group.position.x = d.baseX + (i === 2 ? d.windOffset : 0) + driftX;
    d.group.position.z = driftZ;

    const hoverY = Math.sin(t * 1.2 + d.phase) * hoverAmp;
    const wobbleY = Math.sin(t * 3.7 + d.wobblePhase) * extraWobble;
    d.group.position.y = d.baseY + hoverY + wobbleY;

    const zoneMin = d.baseX - SECTION_W / 2 + 0.15;
    const zoneMax = d.baseX + SECTION_W / 2 - 0.15;
    d.group.position.x = Math.min(zoneMax, Math.max(zoneMin, d.group.position.x));
    d.group.position.z = Math.min(DEPTH / 2 - 0.3, Math.max(-DEPTH / 2 + 0.3, d.group.position.z));

    if (i !== 2) {
      d.group.rotation.x = Math.sin(t * 0.5 + i * 1.5) * 0.02 + Math.sin(t * 1.3 + d.phase) * 0.015;
      d.group.rotation.z = Math.sin(t * 0.7 + i * 2.3) * 0.02 + Math.cos(t * 1.1 + d.driftPhase) * 0.015;
    }
    d.group.rotation.y = t * 0.3 + i * Math.PI / 2 + Math.sin(t * 0.2 + d.phase) * 0.05;
    const propMul = d.type === 'Freight Hex' ? 0.8 : d.type === 'Racer X' ? 1.4 : 1.0;
    d.props.forEach((p) => { p.rotation.y += dt * 30 * propMul; });

    // Blinking lights
    const blink = Math.sin(t * 6 + d.blinkPhase) > 0.3;
    d.leds.forEach(led => { led.material.emissiveIntensity = blink ? 1.5 : 0; });
    d.blinkLight.intensity = blink ? 0.8 : 0;

    // Telemetry
    const battEl = document.querySelector(`[data-tel="batt-${i}"]`);
    const altEl = document.querySelector(`[data-tel="alt-${i}"]`);
    const rpmEl = document.querySelector(`[data-tel="rpm-${i}"]`);
    const statusEl = document.querySelector(`[data-tel="status-${i}"]`);
    if (battEl) {
      telemetryData[i].batt = Math.max(5, telemetryData[i].batt - dt * 0.15 * battMult);
      battEl.textContent = Math.round(telemetryData[i].batt) + '%';
    }
    if (altEl) altEl.textContent = (d.group.position.y).toFixed(1) + 'm';
    if (rpmEl) {
      telemetryData[i].rpm = (2300 + Math.sin(t * 0.7 + i) * 200 + Math.sin(t * 2.3 + i * 2) * 50) * (i === 1 ? (1 - coldVal * 0.15) : 1);
      rpmEl.textContent = Math.round(telemetryData[i].rpm);
    }
    if (statusEl) {
      const bp = telemetryData[i].batt;
      if (bp < 15) { statusEl.textContent = 'CRITICAL'; statusEl.style.color = '#ff2222'; }
      else if (bp < 30) { statusEl.textContent = 'LOW BATTERY'; statusEl.style.color = '#ff4444'; }
      else if (bp < 50) { statusEl.textContent = 'CAUTION'; statusEl.style.color = '#ff9944'; }
      else { statusEl.textContent = 'STABLE'; statusEl.style.color = '#66dd88'; }
    }

    // Damage FX
    const battPct = telemetryData[i].batt;
    const zoneStress = [hotVal, coldVal, windVal, rainVal][i];
    const stress = Math.max(0, Math.min(1, (1 - battPct / 100) * 1.5 + zoneStress * 0.5 - 0.2));
    const sparkFrac = Math.min(1, stress * 1.5);
    const smokeFrac = Math.min(1, stress * 1.2);
    const dp = d.group.position;
    [d.sparks, d.smoke].forEach((fx, fi) => {
      const frac = fi === 0 ? sparkFrac : smokeFrac;
      fx.opacity += (frac - fx.opacity) * dt * 3;
      fx.points.material.opacity = fx.opacity * 0.5;
      fx.points.position.copy(dp);
      for (let j = 0; j < fx.count; j++) {
        fx.pos[j * 3] += fx.vel[j].x * dt;
        fx.pos[j * 3 + 1] += fx.vel[j].y * dt;
        fx.pos[j * 3 + 2] += fx.vel[j].z * dt;
        fx.vel[j].life += dt;
        if (fx.vel[j].life > (fi === 0 ? 0.3 : 1.0)) {
          fx.vel[j].life = 0;
          fx.pos[j * 3] = (Math.random() - 0.5) * fx.spread;
          fx.pos[j * 3 + 1] = Math.random() * 0.1;
          fx.pos[j * 3 + 2] = (Math.random() - 0.5) * fx.spread;
          fx.velFn(fx.vel[j], frac);
        }
      }
      fx.points.geometry.attributes.position.needsUpdate = true;
    });

    // Telemetry label follows drone
    droneTelemetry[i].position.y = d.group.position.y + 1.4;
    droneTelemetry[i].position.x = d.group.position.x;
    if (droneShadows[i]) {
      droneShadows[i].position.x = d.group.position.x;
      droneShadows[i].position.z = d.group.position.z;
      droneShadows[i].material.opacity = Math.max(0.05, 0.35 - d.group.position.y * 0.04);
    }
  });

  // Equipment labels
  equipLabels3D.forEach((el) => {
    if (equipmentFailed[el.key]) {
      el.statusSpan.textContent = '● FAIL';
      el.statusSpan.style.color = '#f80';
    } else {
      el.statusSpan.textContent = equipmentState[el.key] ? '● ON' : '● OFF';
      el.statusSpan.style.color = equipmentState[el.key] ? '#0f0' : '#f44';
    }
  });

  // Instruments
  sensorGroups.forEach((s, i) => {
    const sv = document.getElementById(`sv-${i}`);
    if (sv) {
      if (i === 0) sv.textContent = Math.round(25 + hotVal * 60) + '°C';
      else if (i === 1) sv.textContent = Math.round(-20 + (1 - coldVal) * 30) + '°C';
      else if (i === 2) sv.textContent = Math.round(windVal * 60) + ' km/h';
      else sv.textContent = Math.round(rainVal * 100) + '%';
    }
    if (i === 0) {
      const h = 0.01 + hotVal * 1.2;
      s.bar.scale.y = h / 0.01;
      s.bar.position.y = 0.04 + h / 2;
      s.barMat.emissiveIntensity = 0.2 + hotVal * 0.8;
      const hue = 0.07 - hotVal * 0.05;
      s.barMat.color.setHSL(hue, 1, 0.5);
      s.barMat.emissive.setHSL(hue, 1, 0.5);
    } else if (i === 1) {
      const h = 0.01 + (1 - coldVal) * 1.2;
      s.bar.scale.y = h / 0.01;
      s.bar.position.y = 0.04 + h / 2;
      s.barMat.emissiveIntensity = 0.2 + (1 - coldVal) * 0.6;
    } else if (i === 2) {
      s.spinner.rotation.y += dt * (0.5 + windVal * 8);
    } else if (i === 3) {
      const h = 0.01 + rainVal * 1.0;
      s.water.scale.y = h / 0.01;
      s.water.position.y = 0.04 + h / 2;
      s.waterMat.opacity = 0.3 + rainVal * 0.6;
    }
  });

  // Equipment damage particles
  const eqNorms = [hotVal, coldVal, windVal, rainVal];
  const eqKeys = ['heater', 'ac', 'fan', 'sprinklers'];
  const failThresholds = [20, 18, 22, 25];

  eqKeys.forEach((k, i) => {
    const ref = equipmentRefs[k];
    const fxIdx = i;
    if (equipmentState[k] && !equipmentFailed[k]) {
      const s = eqNorms[i];
      if (s > 0.7) {
        equipmentFailTimer[i] += dt * (s - 0.7) * 5;
        if (equipmentFailTimer[i] > failThresholds[i] + Math.sin(i * 2.7) * 5) {
          equipmentFailed[k] = true;
          equipmentFailTimer[i] = 0;
          const card = document.querySelector(`.section-card[data-idx="${i}"]`);
          if (card) {
            card.querySelectorAll('.slider').forEach((sl) => {
              const evt = new Event('input', { bubbles: true });
              sl.dispatchEvent(evt);
            });
          }
        }
      }
    }
  });

  // Fan rotation
  flags.fanCurrentSpeed += (flags.fanSpeedTarget - flags.fanCurrentSpeed) * dt * 2;
  fanAngle += dt * flags.fanCurrentSpeed;
  if (equipmentRefs.fan) equipmentRefs.fan.bladeGroup.rotation.y = fanAngle;

  // Flight path follower
  if (flightPath.visible) {
    flags.pathProgress += dt * 0.08;
    if (flags.pathProgress > 1) flags.pathProgress = 0;
    const pos = curve.getPoint(flags.pathProgress);
    follower.position.copy(pos);
    ring.rotation.z = flags.pathProgress * Math.PI * 8;
    pathLineMat.opacity = 0.15 + Math.sin(t * 0.5) * 0.1;
  }

  // Chart
  chartTimer += dt;
  if (chartTimer >= 0.5) { chartTimer = 0; pushChartData(); }

  // Follow cam
  updateFollowCam(dt, flags.followCam, flags.followIdx, drones);

  // Formation
  if (flags.formationMode) {
    flags.formationProgress += dt * 0.06;
    if (flags.formationProgress > 1) flags.formationProgress = 0;
    drones.forEach((d, i) => {
      const offset = (i - 1.5) * 0.06;
      const t2 = Math.max(0, Math.min(1, flags.formationProgress + offset));
      const pos = curve.getPoint(t2);
      d.group.position.x = pos.x;
      d.group.position.z = pos.z;
      d.group.position.y = pos.y;
      const zMin = d.baseX - SECTION_W / 2 + 0.15;
      const zMax = d.baseX + SECTION_W / 2 - 0.15;
      d.group.position.x = Math.min(zMax, Math.max(zMin, d.group.position.x));
      d.group.position.z = Math.min(DEPTH / 2 - 0.3, Math.max(-DEPTH / 2 + 0.3, d.group.position.z));
    });
  }

  updateCameraTransitions(dt);
  updateTest(dt);

  // Doors
  doorsOpen.anim += (doorsOpen.state ? 1 : -1) * dt * 1.5;
  doorsOpen.anim = Math.max(0, Math.min(1, doorsOpen.anim));
  doorPanels.forEach(dp => {
    const slide = dp.doorW * 0.6 * doorsOpen.anim;
    dp.left.position.x = dp.cx - dp.doorW / 2 - 0.02 - slide;
    dp.right.position.x = dp.cx + dp.doorW / 2 + 0.02 + slide;
  });

  // Warning beacons
  [hotVal, coldVal, windVal, rainVal].forEach((norm, i) => {
    const b = beacons[i];
    if (!b) return;
    const thresholds = [0.5, 0.5, 0.3, 0.4];
    const severity = Math.max(0, (norm - thresholds[i]) / (1 - thresholds[i]));
    const flash = Math.sin(t * 6 + b.flashTimer) > 0;
    const intensity = severity * (flash ? 1.2 : 0);
    b.light.intensity = flags.sirenActive ? (Math.sin(t * 10) > 0 ? 0.8 : 0) : intensity;
    const hue = severity > 0.6 ? 0.0 : 0.08;
    b.light.color.setHSL(hue, 1, 0.5);
    b.lens.material.emissiveIntensity = flags.sirenActive ? (Math.sin(t * 10) > 0 ? 2 : 0) : (intensity * 0.8);
    b.lens.material.color.setHSL(hue, 1, 0.5 + intensity * 0.3);
  });

  // Ice
  const iceIntensity = coldVal;
  icePieces.forEach(p => {
    p.material.opacity = iceIntensity * 0.6;
    p.material.emissiveIntensity = iceIntensity * 0.3;
    p.scale.setScalar(0.3 + iceIntensity * 0.7);
  });

  // Particles
  particleSystems.forEach((ps, i) => {
    ps.sys.points.material.opacity = particleOpacity[i];
    ps.updateFn(ps.sys, dt);
  });

  // Equipment health bars
  eqKeys.forEach((k, i) => {
    const bar = document.querySelector(`[data-health="${i}"] div`);
    if (!bar) return;
    const h = equipmentFailed[k] ? 100 : Math.min(100, equipmentFailTimer[i] / 20 * 100);
    bar.style.width = h + '%';
    bar.style.background = equipmentFailed[k] ? '#ff4444' : (h > 70 ? '#ff8800' : ['#ff6b35', '#00b4d8', '#00f5d4', '#4a6fa5'][i]);
  });

  // Zone isolation
  centers.forEach((_, i) => {
    if (flags.isolatedZone >= 0 && i !== flags.isolatedZone) accentLights[i].intensity *= 0.97;
  });

  // Failure LED blink
  eqKeys.forEach((k, i) => {
    if (equipmentFailed[k] && equipmentRefs[k]?.indicator) {
      const led = equipmentRefs[k].indicator;
      const blinkOn = Math.sin(t * 6) > 0;
      led.material.color.setHex(blinkOn ? 0xff8800 : 0x442200);
      led.material.emissive.setHex(blinkOn ? 0xff8800 : 0x442200);
    }
  });

  // Failure spark particles
  eqKeys.forEach((k, i) => {
    if (equipmentFailed[k]) {
      const fx = failFX[i];
      fx.opacity += (0.8 - fx.opacity) * dt * 4;
      fx.points.material.opacity = fx.opacity;
      const failStr = 1.0;
      for (let j = 0; j < fx.count; j++) {
        fx.pos[j * 3] += fx.vel[j].x * dt;
        fx.pos[j * 3 + 1] += fx.vel[j].y * dt;
        fx.pos[j * 3 + 2] += fx.vel[j].z * dt;
        fx.vel[j].life += dt;
        if (fx.vel[j].life > 0.3) {
          fx.vel[j].life = 0;
          fx.pos[j * 3] = (Math.random() - 0.5) * 0.5;
          fx.pos[j * 3 + 1] = Math.random() * 0.3;
          fx.pos[j * 3 + 2] = (Math.random() - 0.5) * 0.5;
          fx.velFn(fx.vel[j], failStr);
        }
      }
      fx.points.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Export data samples
  flags.sampleTimer += dt;
  if (flags.sampleTimer >= 0.5) {
    flags.sampleTimer -= 0.5;
    exportSamples.push({
      t: exportSamples.length * 0.5,
      hot: Math.round(25 + hotVal * 60),
      cold: Math.round(-20 + (1 - coldVal) * 30),
      wind: Math.round(windVal * 60),
      rain: Math.round(rainVal * 100),
    });
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  renderPIP(flags.pipActive, flags.pipDroneIdx, drones);
}

animate();
