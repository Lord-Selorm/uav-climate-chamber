import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { centers, HEIGHT, DEPTH, colors, names, equipLabels, droneNames } from './constants.js';
import { equipLabels3D, droneTelemetry } from './state.js';

export function buildLabels(scene) {
  centers.forEach((cx, i) => {
    const div = document.createElement('div');
    div.className = 'label-2d';
    div.textContent = names[i];
    div.style.color = '#' + colors[i].toString(16).padStart(6, '0');
    const sub = document.createElement('span');
    sub.className = 'label-sub';
    sub.textContent = equipLabels[i];
    div.appendChild(sub);
    const label = new CSS2DObject(div);
    label.position.set(cx, HEIGHT + 0.6, 0);
    scene.add(label);
  });

  const eqLabelData = [
    { name: 'Heater', zone: 0 },
    { name: 'AC Unit', zone: 1 },
    { name: 'Fan', zone: 2 },
    { name: 'Sprinklers', zone: 3 },
  ];
  eqLabelData.forEach((d, i) => {
    const div = document.createElement('div');
    div.className = 'label-2d';
    div.style.fontSize = '8px';
    div.style.background = 'rgba(0,0,0,0.35)';
    div.style.padding = '1px 5px';
    div.style.opacity = '0.7';
    div.style.pointerEvents = 'none';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = d.name;
    nameSpan.style.color = '#aaa';
    div.appendChild(nameSpan);
    const statusSpan = document.createElement('span');
    statusSpan.style.color = '#0f0';
    statusSpan.style.marginLeft = '4px';
    statusSpan.style.fontSize = '7px';
    statusSpan.textContent = '● ON';
    div.appendChild(statusSpan);
    const label = new CSS2DObject(div);
    const cx = centers[d.zone];
    const yPos = i === 2 ? 3.5 : i === 3 ? 5.0 : 2.5;
    const zPos = i === 0 ? -3.5 : i === 1 ? -3.5 : i === 2 ? -DEPTH / 2 + 1.0 : 0.6;
    const xPos = i === 0 ? cx - 2.8 : i === 1 ? cx - 2.8 : i === 2 ? cx - 3.0 : cx + 0.8;
    label.position.set(xPos, yPos, zPos);
    scene.add(label);
    equipLabels3D.push({ label, statusSpan, key: ['heater', 'ac', 'fan', 'sprinklers'][i] });
  });

  centers.forEach((cx, i) => {
    const div = document.createElement('div');
    div.className = 'tele-label';
    div.innerHTML = `
      <div class="t-name">${droneNames[i]}</div>
      <div class="t-row">
        <span class="t-item"><span class="t-icon">🔋</span><span class="t-val" data-tel="batt-${i}">87%</span></span>
        <span class="t-item"><span class="t-icon">⬆</span><span class="t-val" data-tel="alt-${i}">2.0m</span></span>
        <span class="t-item"><span class="t-icon">⏱</span><span class="t-val" data-tel="rpm-${i}">2400</span></span>
      </div>
      <div class="t-status" data-tel="status-${i}" style="color:#66dd88">STABLE</div>
    `;
    const label = new CSS2DObject(div);
    label.position.set(cx, 3.4, -0.5);
    scene.add(label);
    droneTelemetry.push(label);
  });

  sensors.forEach((txt, i) => {
    const div = document.createElement('div');
    div.style.cssText = 'color:#8af;font-size:10px;font-weight:600;text-shadow:0 2px 8px rgba(0,0,0,0.8);background:rgba(0,0,0,0.5);padding:2px 8px;border-radius:4px;border:1px solid rgba(255,255,255,0.08);text-align:center;pointer-events:none;';
    div.innerHTML = ['<span style="color:#f64">🔥 TEMP</span><br><span class="sval" id="sv-0">65°C</span>',
      '<span style="color:#48f">❄ TEMP</span><br><span class="sval" id="sv-1">-5°C</span>',
      '<span style="color:#4fa">💨 WIND</span><br><span class="sval" id="sv-2">0 km/h</span>',
      '<span style="color:#6af">🌧 RAIN</span><br><span class="sval" id="sv-3">0%</span>'][i];
    const label = new CSS2DObject(div);
    label.position.set(centers[i], 2.4, -DEPTH / 2 + 1.5);
    scene.add(label);
  });
}

const sensors = [0, 1, 2, 3];
