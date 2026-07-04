import * as THREE from 'three';
import { centers, DEPTH } from './constants.js';
import { particleSystems } from './state.js';

export const particleSpeedMult = [1.0, 1.0, 1.0, 1.0, 0.3];
export const particleOpacity = [1.0, 1.0, 1.0, 1.0, 0.15, 0.15, 0.5, 0.0];

function createParticleSystem(count, color, size, opts = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = [];
  const { spreadX = 4, spreadZ = 3, yMin = 0, yMax = 5 } = opts;
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spreadX;
    pos[i * 3 + 1] = yMin + Math.random() * (yMax - yMin);
    pos[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;
    vel.push({ x: 0, y: 0, z: 0 });
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color, size, transparent: true, opacity: opts.opacity || 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  });
  return { points: new THREE.Points(geo, mat), pos, vel, count, opts: { ...opts, spreadX, spreadZ, yMin, yMax } };
}

function updateParticles(sys, dt) {
  const { points, pos, vel, count, opts } = sys;
  for (let i = 0; i < count; i++) {
    pos[i * 3] += (vel[i].x || 0) * dt;
    pos[i * 3 + 1] += (vel[i].y || 0) * dt;
    pos[i * 3 + 2] += (vel[i].z || 0) * dt;
    if (pos[i * 3 + 1] < opts.yMin) { pos[i * 3 + 1] = opts.yMax; pos[i * 3] = (Math.random() - 0.5) * opts.spreadX; pos[i * 3 + 2] = (Math.random() - 0.5) * opts.spreadZ; }
    if (pos[i * 3 + 1] > opts.yMax) { pos[i * 3 + 1] = opts.yMin; pos[i * 3] = (Math.random() - 0.5) * opts.spreadX; pos[i * 3 + 2] = (Math.random() - 0.5) * opts.spreadZ; }
  }
  points.geometry.attributes.position.needsUpdate = true;
}

function addParticleSection(scene, sectionIdx, count, color, size, opts, velocityFn) {
  const sys = createParticleSystem(count, color, size, opts);
  sys.points.position.set(centers[sectionIdx], 0, opts.centerZ || 0);
  scene.add(sys.points);
  particleSystems.push({
    sys,
    updateFn: (s, dt) => {
      velocityFn(s, dt);
      updateParticles(s, dt);
    }
  });
}

export function buildParticles(scene) {
  addParticleSection(scene, 0, 300, 0xff6633, 0.10, { spreadX: 5, spreadZ: 4, yMin: 0.2, yMax: 5.5, opacity: 0.5, centerZ: -2.5 },
    (s) => { const m = particleSpeedMult[0]; for (let j = 0; j < s.count; j++) { s.vel[j].y = (0.8 + Math.random() * 0.5) * m; s.vel[j].x = (Math.random() - 0.5) * 0.3 * m; } });

  addParticleSection(scene, 1, 400, 0xaaddff, 0.08, { spreadX: 6, spreadZ: 4, yMin: 0, yMax: 6, opacity: 0.7 },
    (s) => { const m = particleSpeedMult[1]; for (let j = 0; j < s.count; j++) { s.vel[j].y = (-0.2 - Math.random() * 0.3) * m; s.vel[j].x = (Math.random() - 0.5) * 0.15 * m; } });

  addParticleSection(scene, 2, 200, 0x88ffee, 0.12, { spreadX: 5, spreadZ: 4, yMin: 0.5, yMax: 5.5, opacity: 0.4 },
    (s) => { const m = particleSpeedMult[2]; for (let j = 0; j < s.count; j++) { s.vel[j].x = (2.0 + Math.random() * 1.5) * m; s.vel[j].y = (Math.random() - 0.5) * 0.2; s.vel[j].z = (Math.random() - 0.5) * 0.3; if (s.pos[j * 3] > s.opts.spreadX / 2) { s.pos[j * 3] = -s.opts.spreadX / 2; s.pos[j * 3 + 1] = s.opts.yMin + Math.random() * (s.opts.yMax - s.opts.yMin); } } });

  addParticleSection(scene, 3, 500, 0x6699ff, 0.05, { spreadX: 6, spreadZ: 4, yMin: 0, yMax: 6, opacity: 0.5 },
    (s) => { const m = particleSpeedMult[3]; for (let j = 0; j < s.count; j++) { s.vel[j].y = (-3.0 - Math.random() * 2.0) * m; s.vel[j].x = (Math.random() - 0.5) * 0.2; } });

  // Heat shimmer
  addParticleSection(scene, 0, 80, 0xff8833, 0.30, { spreadX: 5, spreadZ: 3, yMin: 0.2, yMax: 5.0, opacity: 0.15, centerZ: 0 },
    (s) => { const m = particleSpeedMult[0] * 0.3; for (let j = 0; j < s.count; j++) { s.vel[j].y = (0.3 + Math.random() * 0.4) * m; s.vel[j].x = (Math.random() - 0.5) * 0.08; } });

  // Cold fog
  addParticleSection(scene, 1, 150, 0xccddff, 0.40, { spreadX: 6, spreadZ: 4, yMin: 0.05, yMax: 1.5, opacity: 0.12, centerZ: 0 },
    (s) => { const m = particleSpeedMult[1] * 0.2; for (let j = 0; j < s.count; j++) { s.vel[j].x = (Math.random() - 0.5) * 0.15 * (m + 0.3); s.vel[j].z = (Math.random() - 0.5) * 0.1; s.vel[j].y = (Math.random() - 0.5) * 0.02; } });

  // Rain splashes
  const splashCount = 120;
  const splashGeo = new THREE.BufferGeometry();
  const splashPos = new Float32Array(splashCount * 3);
  const splashVel = [];
  for (let i = 0; i < splashCount; i++) {
    splashPos[i * 3] = (Math.random() - 0.5) * 6;
    splashPos[i * 3 + 1] = Math.random() * 0.01;
    splashPos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    splashVel.push({ x: (Math.random() - 0.5) * 2, y: 0.5 + Math.random() * 1.0, z: (Math.random() - 0.5) * 2 });
  }
  splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPos, 3));
  const splashMat = new THREE.PointsMaterial({
    color: 0x88ccff, size: 0.03, transparent: true, opacity: 0.0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  });
  const splashPoints = new THREE.Points(splashGeo, splashMat);
  splashPoints.position.set(centers[3], 0, 0);
  scene.add(splashPoints);
  particleSystems.push({
    sys: { points: splashPoints, pos: splashPos, vel: splashVel, count: splashCount },
    updateFn: (s, dt) => {
      const rainNorm = particleSpeedMult[3] / 2.8;
      s.points.material.opacity = rainNorm * 0.5;
      for (let j = 0; j < s.count; j++) {
        s.pos[j * 3] += s.vel[j].x * dt;
        s.pos[j * 3 + 1] += s.vel[j].y * dt;
        s.pos[j * 3 + 2] += s.vel[j].z * dt;
        s.vel[j].y -= 2.0 * dt;
        if (s.pos[j * 3 + 1] < 0 || s.pos[j * 3 + 1] > 0.8) {
          s.pos[j * 3 + 1] = 0.01;
          s.pos[j * 3] = (Math.random() - 0.5) * 4;
          s.pos[j * 3 + 2] = (Math.random() - 0.5) * 3;
          s.vel[j].x = (Math.random() - 0.5) * 2;
          s.vel[j].y = 0.5 + Math.random() * 1.5 * (0.3 + rainNorm);
          s.vel[j].z = (Math.random() - 0.5) * 2;
        }
      }
      s.points.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Vent steam
  const ventSteamPos = new THREE.Vector3(centers[0] - 1.5, 2.2, -DEPTH / 2 - 0.6);
  const steamCount = 100;
  const steamGeo = new THREE.BufferGeometry();
  const steamPos = new Float32Array(steamCount * 3);
  const steamVel = [];
  for (let i = 0; i < steamCount; i++) {
    steamPos[i * 3] = ventSteamPos.x + (Math.random() - 0.5) * 0.3;
    steamPos[i * 3 + 1] = ventSteamPos.y + Math.random() * 0.2;
    steamPos[i * 3 + 2] = ventSteamPos.z + (Math.random() - 0.5) * 0.3;
    steamVel.push({ x: (Math.random() - 0.5) * 0.3, y: 0.4 + Math.random() * 0.6, z: (Math.random() - 0.5) * 0.3 });
  }
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
  const steamMat = new THREE.PointsMaterial({
    color: 0xccbbaa, size: 0.25, transparent: true, opacity: 0,
    blending: THREE.NormalBlending, depthWrite: false, sizeAttenuation: true
  });
  const steamPoints = new THREE.Points(steamGeo, steamMat);
  scene.add(steamPoints);
  particleSystems.push({
    sys: { points: steamPoints, pos: steamPos, vel: steamVel, count: steamCount, baseSize: 0.25 },
    updateFn: (s, dt) => {
      const intensity = particleOpacity[7];
      s.points.material.opacity = intensity * 0.25;
      s.points.material.size = s.baseSize * (0.8 + intensity * 1.2);
      for (let j = 0; j < s.count; j++) {
        s.pos[j * 3] += s.vel[j].x * dt;
        s.pos[j * 3 + 1] += s.vel[j].y * dt;
        s.pos[j * 3 + 2] += s.vel[j].z * dt;
        s.vel[j].y += 0.15 * dt;
        s.vel[j].x += (Math.random() - 0.5) * 0.05 * dt;
        s.vel[j].z += (Math.random() - 0.5) * 0.05 * dt;
        if (s.pos[j * 3 + 1] > ventSteamPos.y + 4.0 || s.pos[j * 3 + 1] > 6.5) {
          s.pos[j * 3] = ventSteamPos.x + (Math.random() - 0.5) * 0.3;
          s.pos[j * 3 + 1] = ventSteamPos.y + Math.random() * 0.2;
          s.pos[j * 3 + 2] = ventSteamPos.z + (Math.random() - 0.5) * 0.3;
          s.vel[j].x = (Math.random() - 0.5) * 0.3;
          s.vel[j].y = 0.4 + Math.random() * 0.6;
          s.vel[j].z = (Math.random() - 0.5) * 0.3;
        }
      }
      s.points.geometry.attributes.position.needsUpdate = true;
    }
  });
}
