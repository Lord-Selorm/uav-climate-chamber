import * as THREE from 'three';
import { centers, DEPTH } from './constants.js';
import { makeBox } from './utils.js';
import { sensorGroups } from './state.js';

export function buildInstruments(scene) {
  const sensorMatPole = new THREE.MeshStandardMaterial({ color: 0x5a6a7a, metalness: 0.6, roughness: 0.3 });
  const sensorMatBase = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, metalness: 0.5, roughness: 0.5 });

  function makeThermoBar(color) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.8, 6), sensorMatPole);
    pole.position.y = 0.9;
    g.add(pole);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 8), sensorMatBase);
    g.add(base);
    const barMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3, transparent: true, opacity: 1 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.06), barMat);
    bar.position.y = 0.04;
    g.add(bar);
    const dispMat = new THREE.MeshStandardMaterial({ color: 0x111122, emissive: 0x222244, emissiveIntensity: 0.2 });
    const disp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), dispMat);
    disp.position.y = 1.85;
    g.add(disp);
    return { group: g, bar, barMat, disp };
  }

  function makeAnemometer() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.0, 6), sensorMatPole);
    pole.position.y = 1.0;
    g.add(pole);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 8), sensorMatBase);
    g.add(base);
    const spinner = new THREE.Group();
    spinner.position.y = 2.0;
    const armMat = new THREE.MeshStandardMaterial({ color: 0x667788 });
    const cupMat = new THREE.MeshStandardMaterial({ color: 0x99aabb });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.01), armMat);
      arm.position.set(Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15);
      arm.rotation.y = -a;
      spinner.add(arm);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.08, 8), cupMat);
      cup.position.set(Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32);
      cup.rotation.x = Math.PI / 2;
      cup.rotation.z = -a;
      spinner.add(cup);
    }
    g.add(spinner);
    return { group: g, spinner };
  }

  function makeRainGauge() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.8, 6), sensorMatPole);
    pole.position.y = 0.9;
    g.add(pole);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 8), sensorMatBase);
    g.add(base);
    const tubeMat = new THREE.MeshPhysicalMaterial({ color: 0x88bbdd, metalness: 0, roughness: 0.1, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.3, 8), tubeMat);
    tube.position.y = 0.75;
    g.add(tube);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, emissive: 0x3377bb, emissiveIntensity: 0.1, transparent: true, opacity: 0.7 });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.01, 8), waterMat);
    water.position.y = 0.04;
    g.add(water);
    const scaleMat = new THREE.MeshBasicMaterial({ color: 0x445566, transparent: true, opacity: 0.3 });
    for (let i = 0; i < 5; i++) {
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.005, 0.005), scaleMat);
      mark.position.set(0, 0.15 + i * 0.25, 0.07);
      g.add(mark);
    }
    return { group: g, water, waterMat };
  }

  centers.forEach((cx, i) => {
    let obj;
    if (i === 0) obj = makeThermoBar(0xff4400);
    else if (i === 1) obj = makeThermoBar(0x4488ff);
    else if (i === 2) obj = makeAnemometer();
    else obj = makeRainGauge();
    obj.group.position.set(cx, 0, -DEPTH / 2 + 1.5);
    obj.group.rotation.y = Math.PI;
    scene.add(obj.group);
    sensorGroups.push(obj);
  });
}
