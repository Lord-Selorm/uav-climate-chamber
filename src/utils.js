import * as THREE from 'three';
import { SECTION_W, DEPTH, floorColors } from './constants.js';

export function makeBox(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function makeFloorTexture(zoneName, color, icon) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(256, 0); ctx.lineTo(256, 512); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 256); ctx.lineTo(512, 256); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  [60, 120, 180].forEach(r2 => { ctx.beginPath(); ctx.arc(256, 256, r2, 0, Math.PI * 2); ctx.stroke(); });
  ctx.setLineDash([]);
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText(icon, 256, 200);
  ctx.font = 'bold 28px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText(zoneName, 256, 320);
  return new THREE.CanvasTexture(c);
}

export const floorTextures = [
  makeFloorTexture('HOT ZONE', floorColors[0], '🔥'),
  makeFloorTexture('COLD ZONE', floorColors[1], '❄️'),
  makeFloorTexture('WIND ZONE', floorColors[2], '💨'),
  makeFloorTexture('RAIN ZONE', floorColors[3], '🌧'),
];

export const steel = new THREE.MeshStandardMaterial({ color: 0x7a8a9a, metalness: 0.85, roughness: 0.25 });
export const darkSteel = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, metalness: 0.75, roughness: 0.35 });
export const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, metalness: 0.8, roughness: 0.3 });
