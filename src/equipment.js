import * as THREE from 'three';
import { centers, HEIGHT, SECTION_W, DEPTH } from './constants.js';
import { makeBox } from './utils.js';
import { equipIndicators, equipmentRefs, equipmentState, equipmentFailed } from './state.js';

export function buildEquipment(scene) {
  function createHeater() {
    const g = new THREE.Group();
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x555544, metalness: 0.6, roughness: 0.5 });
    const coilMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.8 });
    const ventMat = new THREE.MeshStandardMaterial({ color: 0x333322, metalness: 0.4, roughness: 0.7 });
    const body = makeBox(1.0, 1.4, 0.8, boxMat);
    body.position.y = 0.7;
    g.add(body);
    const coils = [];
    for (let i = 0; i < 4; i++) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16), coilMat);
      coil.position.set(0, 0.4 + i * 0.25, 0.45);
      g.add(coil);
      coils.push(coil);
    }
    const vent = makeBox(0.8, 0.15, 0.05, ventMat);
    vent.position.set(0, 0.1, 0.45);
    g.add(vent);
    const chimney = makeBox(0.15, 0.6, 0.15, new THREE.MeshStandardMaterial({ color: 0x4a5a6a, metalness: 0.75, roughness: 0.35 }));
    chimney.position.set(0.5, 1.5, 0);
    g.add(chimney);
    const pl = new THREE.PointLight(0xff4400, 0.8, 3);
    pl.position.set(0, 0.7, 0.8);
    g.add(pl);
    return { group: g, coils, light: pl };
  }

  function createACUnit() {
    const g = new THREE.Group();
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.5, roughness: 0.5 });
    const ventMat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.3, roughness: 0.6 });
    const iceMat = new THREE.MeshStandardMaterial({ color: 0x88ddff, emissive: 0x2288ff, emissiveIntensity: 0.3, transparent: true, opacity: 0.7 });
    const body = makeBox(1.0, 1.6, 0.8, boxMat);
    body.position.y = 0.8;
    g.add(body);
    for (let i = 0; i < 3; i++) {
      const v = makeBox(0.7, 0.1, 0.05, ventMat);
      v.position.set(0, 0.35 + i * 0.35, 0.45);
      g.add(v);
    }
    const ice = makeBox(0.3, 0.3, 0.3, iceMat);
    ice.position.set(0, 1.4, 0.4);
    g.add(ice);
    const pl = new THREE.PointLight(0x4488ff, 0.6, 3);
    pl.position.set(0, 0.8, 0.8);
    g.add(pl);
    return { group: g, ice, light: pl };
  }

  function createFan() {
    const g = new THREE.Group();
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, metalness: 0.6, roughness: 0.5 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x887766, metalness: 0.7, roughness: 0.3 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xbbaacc, metalness: 0.4, roughness: 0.4, side: THREE.DoubleSide });
    const cageMat = new THREE.MeshStandardMaterial({ color: 0x887766, metalness: 0.5, roughness: 0.4 });
    const frame = makeBox(0.06, 1.2, 1.2, darkMat);
    frame.position.set(0, 0.6, -0.6);
    g.add(frame);
    [[-0.5, 1.1], [0.5, 1.1], [-0.5, 0.1], [0.5, 0.1]].forEach(([x, y]) => {
      const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), metalMat);
      bolt.position.set(x, y, -0.57);
      g.add(bolt);
    });
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.35, 16), metalMat);
    motor.rotation.x = Math.PI / 2;
    motor.position.set(0, 0.6, -0.3);
    g.add(motor);
    for (let i = 0; i < 8; i++) {
      const fin = new THREE.Mesh(new THREE.TorusGeometry(0.22 + i * 0.005, 0.008, 6, 12), darkMat);
      fin.position.set(0, 0.6, -0.3 + i * 0.04);
      g.add(fin);
    }
    const hub = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.08, 8), metalMat);
    hub.rotation.x = -Math.PI / 2;
    hub.position.set(0, 0.6, -0.08);
    g.add(hub);
    const bladeGroup = new THREE.Group();
    bladeGroup.position.set(0, 0.6, -0.06);
    for (let i = 0; i < 4; i++) {
      const bg = new THREE.Group();
      const blade = makeBox(0.32, 0.012, 0.1, bladeMat);
      blade.position.set(0.22, 0, 0);
      bg.add(blade);
      const root = makeBox(0.08, 0.025, 0.03, darkMat);
      root.position.set(0.06, 0, 0);
      bg.add(root);
      bg.rotation.y = i * Math.PI / 2;
      bladeGroup.add(bg);
    }
    g.add(bladeGroup);
    const cageGroup = new THREE.Group();
    cageGroup.position.set(0, 0.6, 0.02);
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.025, 8, 20), cageMat);
    cageGroup.add(outerRing);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 6, 12), cageMat);
    cageGroup.add(innerRing);
    for (let i = 0; i < 8; i++) {
      const bar = makeBox(0.3, 0.008, 0.008, cageMat);
      bar.position.set(Math.cos(i * Math.PI / 4) * 0.3, Math.sin(i * Math.PI / 4) * 0.3, 0);
      bar.rotation.z = -i * Math.PI / 4;
      cageGroup.add(bar);
    }
    g.add(cageGroup);
    const jbox = makeBox(0.1, 0.08, 0.06, darkMat);
    jbox.position.set(0.35, 0.2, -0.57);
    g.add(jbox);
    return { group: g, bladeGroup };
  }

  function createSprinklers() {
    const g = new THREE.Group();
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x667788, metalness: 0.7, roughness: 0.3 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0x889999, metalness: 0.6, roughness: 0.4 });
    const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5, 8), pipeMat);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(0, 4.2, 0);
    g.add(pipe1);
    for (let z of [-1, 0, 1]) {
      const down = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), pipeMat);
      down.position.set(0, 3.9, z * 1.2);
      g.add(down);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), headMat);
      head.position.set(0, 3.7, z * 1.2);
      g.add(head);
    }
    const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5, 8), pipeMat);
    pipe2.rotation.x = Math.PI / 2;
    pipe2.position.set(0, 4.2, 0);
    g.add(pipe2);
    return g;
  }

  function addIndicator(group, color) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: 0x00ff44, emissiveIntensity: 0.5 });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), mat);
    led.position.set(0, 0.5, 0.3);
    group.add(led);
    return led;
  }

  centers.forEach((cx, i) => {
    if (i === 0) {
      const { group, coils, light } = createHeater();
      group.scale.set(1.5, 1.5, 1.5);
      group.position.set(cx - 2.0, 0, -3.0);
      scene.add(group);
      const ind = addIndicator(group, 0x00ff44);
      equipmentRefs.heater = { coils, light, group, indicator: ind };
      equipIndicators.push(ind);
    } else if (i === 1) {
      const { group, ice, light } = createACUnit();
      group.scale.set(1.5, 1.5, 1.5);
      group.position.set(cx - 2.0, 0, -3.0);
      scene.add(group);
      const ind = addIndicator(group, 0x00ff44);
      equipmentRefs.ac = { ice, light, group, indicator: ind };
      equipIndicators.push(ind);
    } else if (i === 2) {
      const { group, bladeGroup } = createFan();
      group.scale.set(2.0, 2.0, 2.0);
      group.position.set(cx - 2.2, 2.2, -DEPTH / 2 + 0.6);
      group.rotation.y = Math.PI / 8;
      scene.add(group);
      const ind = addIndicator(group, 0x00ff44);
      equipmentRefs.fan = { bladeGroup, group, indicator: ind };
      equipIndicators.push(ind);
    } else {
      const eq = createSprinklers();
      eq.scale.set(1.5, 1.5, 1.5);
      eq.position.set(cx, 0, 0);
      scene.add(eq);
      const ind = addIndicator(eq, 0x00ff44);
      equipmentRefs.sprinklers = { group: eq, indicator: ind };
      equipIndicators.push(ind);
    }
  });

  // Equipment damage particles
  function makeEquipFX(count, color, size, spread, velFn) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = [];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = Math.random() * 0.3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
      vel.push({ x: 0, y: 0, z: 0, life: Math.random() });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color, size, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    return { points, pos, vel, count, spread, opacity: 0, velFn };
  }

  const equipFX = [];
  const heaterFX = makeEquipFX(25, 0xffaa00, 0.04, 0.5,
    (v, str) => { v.x = (Math.random() - 0.5) * 2 * str; v.y = 0.5 + Math.random() * 1.5 * str; v.z = (Math.random() - 0.5) * 2 * str; });
  heaterFX.points.position.set(centers[0] - 2.0, 1.5, -3.0);
  const acFX = makeEquipFX(20, 0x88ddff, 0.03, 0.4,
    (v, str) => { v.x = (Math.random() - 0.5) * 1.5 * str; v.y = -0.3 - Math.random() * 0.5 * str; v.z = (Math.random() - 0.5) * 1.5 * str; });
  acFX.points.position.set(centers[1] - 2.0, 1.5, -3.0);
  const fanFX = makeEquipFX(15, 0x886644, 0.02, 0.3,
    (v, str) => { v.x = (Math.random() - 0.5) * 0.5 * str; v.y = (Math.random() - 0.5) * 0.5 * str; v.z = (Math.random() - 0.5) * 0.5 * str; });
  fanFX.points.position.set(centers[2] - 2.2, 2.5, -DEPTH / 2 + 0.6);
  const rainFX = makeEquipFX(30, 0x88ccff, 0.025, 0.6,
    (v, str) => { v.x = (Math.random() - 0.5) * 2 * str; v.y = -0.5 - Math.random() * 1.0 * str; v.z = (Math.random() - 0.5) * 2 * str; });
  rainFX.points.position.set(centers[3], 3.5, 0);
  equipFX.push(heaterFX, acFX, fanFX, rainFX);

  // Failure spark effects
  const failPositions = [
    new THREE.Vector3(centers[0] - 2.0, 1.5, -3.0),
    new THREE.Vector3(centers[1] - 2.0, 1.5, -3.0),
    new THREE.Vector3(centers[2] - 2.2, 2.5, -DEPTH / 2 + 0.6),
    new THREE.Vector3(centers[3], 3.5, 0)
  ];
  const failFX = failPositions.map(p => {
    const fx = makeEquipFX(30, 0xff3300, 0.05, 0.5,
      (v, str) => { v.x = (Math.random() - 0.5) * 3 * str; v.y = 0.5 + Math.random() * 2 * str; v.z = (Math.random() - 0.5) * 3 * str; });
    fx.points.position.copy(p);
    return fx;
  });
  failFX.forEach(fx => { fx.points.material.opacity = 0; });

  return { equipFX, failFX };
}

export function buildCameras(scene) {
  const mountMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
  const domeMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.6 });
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x111122, emissive: 0x334466, emissiveIntensity: 0.15 });
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.4 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.3 });

  function makeCam() {
    const g = new THREE.Group();
    const mount = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.08), mountMat);
    mount.position.set(0, 0, -0.1);
    g.add(mount);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.12, 8), mountMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(0, 0, 0);
    g.add(arm);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.set(0, 0, 0.07);
    g.add(dome);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14), ringMat);
    ring.position.set(0, 0, 0.12);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), lensMat);
    lens.position.set(0, 0, 0.15);
    g.add(lens);
    const recLed = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), redMat);
    recLed.position.set(0.06, 0.03, 0.1);
    g.add(recLed);
    return g;
  }

  centers.forEach((cx, i) => {
    const cam1 = makeCam();
    cam1.position.set(cx - 2.0, HEIGHT - 0.8, -DEPTH / 2 + 0.3);
    cam1.rotation.y = i % 2 === 0 ? 0.3 : -0.3;
    scene.add(cam1);
    const cam2 = makeCam();
    cam2.position.set(cx + 2.0, HEIGHT - 0.8, -DEPTH / 2 + 0.3);
    cam2.rotation.y = i % 2 === 0 ? -0.3 : 0.3;
    scene.add(cam2);
  });
}
