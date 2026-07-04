import * as THREE from 'three';
import { centers, HEIGHT, SECTION_W, DEPTH, colors } from './constants.js';
import { makeBox } from './utils.js';
import { accentLights, beacons } from './state.js';

export function buildLights(scene) {
  const al = new THREE.AmbientLight(0x8899bb, 0.7);
  scene.add(al);
  const dl = new THREE.DirectionalLight(0xffeedd, 2.5);
  dl.position.set(12, 18, 8);
  dl.castShadow = true;
  dl.shadow.mapSize.width = 2048;
  dl.shadow.mapSize.height = 2048;
  scene.add(dl);
  const fl = new THREE.DirectionalLight(0x99bbff, 0.6);
  fl.position.set(-8, 6, -10);
  scene.add(fl);
  centers.forEach((cx) => {
    const fill = new THREE.PointLight(0xccddff, 1.5, 12);
    fill.position.set(cx, HEIGHT * 0.5, DEPTH * 0.2);
    scene.add(fill);
  });
  centers.forEach((cx) => {
    const bl = new THREE.PointLight(0x99aacc, 0.8, 10);
    bl.position.set(cx, HEIGHT * 0.4, -DEPTH * 0.35);
    scene.add(bl);
  });
  const hemi = new THREE.HemisphereLight(0x8899cc, 0x223355, 0.6);
  scene.add(hemi);

  // Accent lights
  centers.forEach((cx, i) => {
    const pl = new THREE.PointLight(colors[i], 2.0, 15);
    pl.position.set(cx, HEIGHT - 1.5, 0);
    scene.add(pl);
    accentLights.push(pl);
  });

  // LED panel lights
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffdd, emissiveIntensity: 5.0 });
  const lightFrameMat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.7, roughness: 0.3 });
  const chamberLights = [];
  centers.forEach((cx) => {
    const frame = makeBox(1.2, 0.04, 2.4, lightFrameMat);
    frame.position.set(cx, HEIGHT - 0.02, 0);
    chamberLights.push(frame);
    const panel = makeBox(1.0, 0.02, 2.2, lightMat);
    panel.position.set(cx, HEIGHT - 0.04, 0);
    chamberLights.push(panel);
    const pl = new THREE.PointLight(0xffffee, 7.0, 18);
    pl.position.set(cx, HEIGHT - 0.3, 0);
    scene.add(pl);
  });

  // Zone LED strips
  const ledColors = [0xff2222, 0x2266ff, 0xffdd22, 0x22ddff];
  const stripMat = centers.map((cx, i) => new THREE.MeshStandardMaterial({
    color: ledColors[i], emissive: ledColors[i], emissiveIntensity: 1.2, transparent: true, opacity: 0.9
  }));
  centers.forEach((cx, i) => {
    const sl = 1.2;
    const gap = SECTION_W * 0.1;
    for (let z = -DEPTH / 2 + 0.5; z <= DEPTH / 2 - 0.5; z += sl + gap) {
      const seg = makeBox(sl, 0.03, 0.06, stripMat[i]);
      seg.position.set(cx - SECTION_W / 2 + 0.05, HEIGHT - 0.02, z);
      scene.add(seg);
      const seg2 = makeBox(sl, 0.03, 0.06, stripMat[i]);
      seg2.position.set(cx + SECTION_W / 2 - 0.05, HEIGHT - 0.02, z);
      scene.add(seg2);
    }
  });

  // Warning beacons
  centers.forEach((cx, i) => {
    const bg = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.5, roughness: 0.5 });
    const lensMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0, transparent: true, opacity: 0.9 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.04, 10), baseMat);
    base.position.y = 0.02;
    bg.add(base);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), lensMat);
    lens.position.y = 0.06;
    bg.add(lens);
    const bl = new THREE.PointLight(0xff4400, 0, 2);
    bl.position.y = 0.08;
    bg.add(bl);
    bg.position.set(cx, HEIGHT - 0.1, 0);
    scene.add(bg);
    beacons.push({ group: bg, lens, light: bl, flashTimer: Math.random() * 10, state: false });
  });

  return { ambientLight: al };
}
