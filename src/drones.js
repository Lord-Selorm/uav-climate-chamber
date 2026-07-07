import * as THREE from 'three';
import { centers, colors } from './constants.js';
import { makeBox } from './utils.js';
import { drones, droneShadows, droneTelemetry, telemetryData } from './state.js';

function makeProp(color, radius) {
  const g = new THREE.Group();
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.7, roughness: 0.3 });
  const bladeMat = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.6, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.025, 12), hubMat);
  hub.position.y = 0.012;
  g.add(hub);
  for (let i = 0; i < 2; i++) {
    const blade = makeBox(radius * 0.85, 0.006, radius * 0.18, bladeMat);
    blade.position.set(radius * 0.45, 0, 0);
    blade.rotation.y = i * Math.PI;
    g.add(blade);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.09, 6, 6), bladeMat);
    tip.position.set(radius * 0.85, 0, 0);
    tip.rotation.y = i * Math.PI;
    g.add(tip);
  }
  return g;
}

function createSurveyorQuad(accentColor) {
  const g = new THREE.Group();
  const bm = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.7, roughness: 0.3 });
  const am = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, metalness: 0.6, roughness: 0.4 });
  const dm = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.8, roughness: 0.2 });
  const sm = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.5, roughness: 0.5 });
  const lm = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.6 });
  const body = makeBox(0.45, 0.18, 0.45, bm);
  body.position.y = 0.09;
  g.add(body);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), dm);
  dome.position.y = 0.18;
  g.add(dome);
  const armLen = 0.45, armR = 0.35;
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => {
    const a = new THREE.Mesh(new THREE.BoxGeometry(armLen, 0.035, 0.035), am);
    a.position.set(sx * armR, 0.05, sz * armR);
    a.rotation.y = Math.atan2(sz, sx);
    g.add(a);
  });
  const props = [];
  [[armR, armR], [-armR, armR], [armR, -armR], [-armR, -armR]].forEach(([dx, dz]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.08, 12), dm);
    m.position.set(dx, 0.04, dz);
    g.add(m);
    const p = makeProp(accentColor, 0.28);
    p.position.set(dx, 0.1, dz);
    g.add(p);
    props.push(p);
  });
  const camMount = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8), sm);
  camMount.position.set(0, -0.05, 0.08);
  g.add(camMount);
  const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.1), sm);
  camBody.position.set(0, -0.12, 0.08);
  g.add(camBody);
  const camLens = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.02, 10), dm);
  camLens.rotation.x = Math.PI / 2;
  camLens.position.set(0, -0.12, 0.13);
  g.add(camLens);
  [-0.2, 0.2].forEach(x => {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), dm);
    strut.position.set(x, -0.06, 0.2);
    g.add(strut);
    const skid = makeBox(0.08, 0.008, 0.12, sm);
    skid.position.set(x, -0.1, 0.2);
    g.add(skid);
  });
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.005, 0.15, 4), dm);
  ant.position.set(0, 0.24, -0.15);
  g.add(ant);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.006, 4, 4), new THREE.MeshStandardMaterial({ color: 0xff4444 }));
  antTip.position.set(0, 0.31, -0.15);
  g.add(antTip);
  const leds = [];
  [-0.2, 0.2].forEach(x => {
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.04), lm);
    led.position.set(x, 0.2, 0.2);
    g.add(led);
    leds.push(led);
  });
  return { group: g, props, leds, type: 'quad' };
}

function createFreightHex(accentColor) {
  const g = new THREE.Group();
  const bm = new THREE.MeshStandardMaterial({ color: 0x3a3a2a, metalness: 0.6, roughness: 0.4 });
  const am = new THREE.MeshStandardMaterial({ color: 0x4a4a3a, metalness: 0.5, roughness: 0.5 });
  const dm = new THREE.MeshStandardMaterial({ color: 0x2a2a1a, metalness: 0.7, roughness: 0.3 });
  const cm = new THREE.MeshStandardMaterial({ color: 0x554433, metalness: 0.4, roughness: 0.6 });
  const lm = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.6 });
  const body = makeBox(0.55, 0.25, 0.55, bm);
  body.position.y = 0.12;
  g.add(body);
  const topDome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), dm);
  topDome.position.y = 0.25;
  g.add(topDome);
  const armLen = 0.5, armR = 0.38;
  const props = [];
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    const ax = Math.cos(angle) * armR;
    const az = Math.sin(angle) * armR;
    const a = new THREE.Mesh(new THREE.BoxGeometry(armLen, 0.04, 0.04), am);
    a.position.set(ax * 0.5, 0.06, az * 0.5);
    a.rotation.y = -angle;
    g.add(a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.09, 10), dm);
    m.position.set(ax, 0.05, az);
    g.add(m);
    const p = makeProp(accentColor, 0.3);
    p.position.set(ax, 0.12, az);
    g.add(p);
    props.push(p);
  }
  const cargo = makeBox(0.35, 0.2, 0.35, cm);
  cargo.position.set(0, -0.05, 0);
  g.add(cargo);
  [-0.15, 0.15].forEach(x => {
    const strap = makeBox(0.01, 0.21, 0.36, dm);
    strap.position.set(x, -0.05, 0);
    g.add(strap);
  });
  for (let x of [-0.25, 0.25]) {
    for (let z of [-0.25, 0.25]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.15, 6), dm);
      leg.position.set(x, -0.1, z);
      g.add(leg);
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), dm);
      foot.position.set(x, -0.17, z);
      g.add(foot);
    }
  }
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.05), lm);
  led.position.set(0, 0.3, 0);
  g.add(led);
  return { group: g, props, leds: [led], type: 'hex' };
}

function createRacerX(accentColor) {
  const g = new THREE.Group();
  const bm = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.8, roughness: 0.2 });
  const am = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.7, roughness: 0.3 });
  const dm = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, metalness: 0.9, roughness: 0.1 });
  const lm = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.8 });
  const body = makeBox(0.3, 0.12, 0.5, bm);
  body.position.y = 0.06;
  g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.12, 8), dm);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.06, 0.31);
  g.add(nose);
  const armLen = 0.4, armR = 0.28;
  const props = [];
  [[1, 1.2], [-1, 1.2], [1.2, -1], [-1.2, -1]].forEach(([sx, sz]) => {
    const len = 0.5;
    const a = new THREE.Mesh(new THREE.BoxGeometry(len, 0.03, 0.025), am);
    const angle = Math.atan2(sz, sx);
    a.position.set(sx * armR * 0.5, 0.04, sz * armR * 0.5);
    a.rotation.y = -angle;
    g.add(a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.07, 10), dm);
    m.position.set(sx * armR, 0.035, sz * armR);
    g.add(m);
    const p = makeProp(accentColor, 0.24);
    p.position.set(sx * armR, 0.09, sz * armR);
    g.add(p);
    props.push(p);
  });
  const batt = makeBox(0.15, 0.06, 0.1, bm);
  batt.position.set(0, 0.03, -0.32);
  g.add(batt);
  [-0.1, 0.1].forEach(x => {
    const skid = makeBox(0.04, 0.008, 0.06, dm);
    skid.position.set(x, -0.05, 0.25);
    g.add(skid);
  });
  const leds = [];
  const led = makeBox(0.06, 0.015, 0.01, lm);
  led.position.set(0, 0.06, -0.25);
  g.add(led);
  leds.push(led);
  const fLed = makeBox(0.03, 0.015, 0.01, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 }));
  fLed.position.set(0, 0.06, 0.3);
  g.add(fLed);
  leds.push(fLed);
  return { group: g, props, leds, type: 'race' };
}

export function buildDrones(scene) {
  const droneTypes = [
    { fn: createFreightHex, color: colors[0], label: 'Freight Hex' },
    { fn: createSurveyorQuad, color: colors[1], label: 'Surveyor Quad' },
    { fn: createRacerX, color: colors[2], label: 'Racer X' },
    { fn: createSurveyorQuad, color: colors[3], label: 'Surveyor Quad' },
  ];

  function makeDroneFX(count, color, size, spread, velFn, blending) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = [];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = Math.random() * 0.1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
      vel.push({ x: 0, y: 0, z: 0, life: Math.random() });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color, size, transparent: true, opacity: 0,
      blending: blending || THREE.AdditiveBlending,
      depthWrite: false, sizeAttenuation: true
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    return { points, pos, vel, count, spread, opacity: 0, velFn };
  }

  centers.forEach((cx, i) => {
    const type = droneTypes[i];
    const { group, props, leds } = type.fn(type.color);
    group.position.set(cx, 3.0, 0);
    scene.add(group);
    const blinkLight = new THREE.PointLight(type.color, 0, 1.5);
    blinkLight.position.set(0, 0.3, 0);
    group.add(blinkLight);
    const sparks = makeDroneFX(30, 0xffcc44, 0.04, 0.4,
      (v, stress) => { v.x = (Math.random() - 0.5) * 3 * stress; v.y = 0.5 + Math.random() * 2 * stress; v.z = (Math.random() - 0.5) * 3 * stress; },
      THREE.AdditiveBlending);
    const smoke = makeDroneFX(20, 0x444455, 0.12, 0.3,
      (v, stress) => { v.x = (Math.random() - 0.5) * 0.3; v.y = 0.3 + Math.random() * 0.5 * stress; v.z = (Math.random() - 0.5) * 0.3; },
      THREE.NormalBlending);
    const driftPhase = Math.random() * 6.28;
    drones.push({
      group, props, leds, blinkLight, phase: i * Math.PI / 2, baseY: 3.0, baseX: cx,
      windOffset: 0, windVel: 0, wobblePhase: Math.random() * 6.28,
      targetX: cx, sparks, smoke, type: type.label, driftPhase,
      blinkPhase: i * Math.PI / 3
    });
  });

  // Drone floor shadows
  drones.forEach(d => {
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 });
    const shadow = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.45, 20), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(d.group.position.x, 0.015, d.group.position.z);
    scene.add(shadow);
    droneShadows.push(shadow);
  });
}
