import * as THREE from 'three';
import { SECTION_W, HEIGHT, DEPTH, WALL_T, _totalW, _wallOff, _bwW, centers } from './constants.js';
import { makeBox, steel, darkSteel, frameMat, floorTextures } from './utils.js';
import { sectionFloors, doorPanels, doorFrames, beacons } from './state.js';

export function buildChamber(scene) {
  const chamber = new THREE.Group();
  scene.add(chamber);

  // Floor base
  const floorW = _totalW + 2;
  const floor = makeBox(floorW, 0.3, DEPTH + 3, new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.2, roughness: 0.8 }));
  floor.position.set(0, -0.15, 0);
  chamber.add(floor);

  // Section floors with markings
  centers.forEach((cx, i) => {
    const mat = new THREE.MeshStandardMaterial({ map: floorTextures[i], metalness: 0.1, roughness: 0.9 });
    const f = makeBox(SECTION_W - 0.2, 0.05, DEPTH - 0.2, mat);
    f.position.set(cx, 0.025, 0);
    chamber.add(f);
    sectionFloors.push(f);
  });

  // Floor divider stripes
  const dividerColors = [0xff4444, 0x4488ff, 0xffdd44];
  const dividerXs = [-7, 0, 7];
  dividerColors.forEach((col, i) => {
    const dm = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.4 });
    const stripe = makeBox(0.06, 0.01, DEPTH - 0.4, dm);
    stripe.position.set(dividerXs[i], 0.01, 0);
    chamber.add(stripe);
  });

  // Back wall
  const bw = makeBox(_bwW, HEIGHT, WALL_T, steel);
  bw.position.set(0, HEIGHT / 2, -DEPTH / 2);
  chamber.add(bw);

  // Front wall — sliding glass doors
  centers.forEach((cx) => {
    const frameMat2 = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, emissive: 0x5a7a9a, emissiveIntensity: 0.25, metalness: 0.8, roughness: 0.3 });
    const frameW = 0.08;
    const fw = SECTION_W - 0.2;
    const fh = HEIGHT - 0.4;
    const topRail = makeBox(fw, frameW, WALL_T + 0.04, frameMat2);
    topRail.position.set(cx, HEIGHT - 0.04, DEPTH / 2);
    chamber.add(topRail);
    doorFrames.push(topRail);
    const botRail = makeBox(fw, frameW, WALL_T + 0.04, frameMat2);
    botRail.position.set(cx, 0.04, DEPTH / 2);
    chamber.add(botRail);
    doorFrames.push(botRail);
    [-fw / 2 + frameW / 2, fw / 2 - frameW / 2].forEach(xOff => {
      const jamb = makeBox(frameW, fh, WALL_T + 0.04, frameMat2);
      jamb.position.set(cx + xOff, HEIGHT / 2, DEPTH / 2);
      chamber.add(jamb);
      doorFrames.push(jamb);
    });
    const doorW = fw / 2 - 0.04;
    const panelMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff, metalness: 0, roughness: 0.05,
      transparent: true, opacity: 0.12, side: THREE.DoubleSide
    });
    const leftDoor = makeBox(doorW, fh - 0.12, WALL_T + 0.02, panelMat);
    leftDoor.position.set(cx - doorW / 2 - 0.02, HEIGHT / 2, DEPTH / 2);
    chamber.add(leftDoor);
    const rightDoor = makeBox(doorW, fh - 0.12, WALL_T + 0.02, panelMat);
    rightDoor.position.set(cx + doorW / 2 + 0.02, HEIGHT / 2, DEPTH / 2);
    chamber.add(rightDoor);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x889999, metalness: 0.7, roughness: 0.3 });
    [-1, 1].forEach(side => {
      const handle = makeBox(0.01, 0.06, 0.05, handleMat);
      handle.position.set(cx + side * 0.02, HEIGHT * 0.4, DEPTH / 2 + 0.04);
      chamber.add(handle);
    });
    doorPanels.push({ left: leftDoor, right: rightDoor, cx, doorW, open: false, target: 0 });
  });

  // Side walls
  const swl = makeBox(WALL_T, HEIGHT, DEPTH, steel);
  swl.position.set(-_wallOff, HEIGHT / 2, 0);
  chamber.add(swl);
  const swr = makeBox(WALL_T, HEIGHT, DEPTH, steel);
  swr.position.set(_wallOff, HEIGHT / 2, 0);
  chamber.add(swr);

  // Ceiling
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x5a6a7a, metalness: 0.7, roughness: 0.3 });
  const ceil = makeBox(_bwW, WALL_T, DEPTH, ceilMat);
  ceil.position.set(0, HEIGHT, 0);
  chamber.add(ceil);

  // Dividers
  [-SECTION_W, 0, SECTION_W].forEach(x => {
    const div = makeBox(WALL_T, HEIGHT - 0.1, DEPTH - 0.1, darkSteel);
    div.position.set(x, HEIGHT / 2, 0);
    chamber.add(div);
  });

  // Steel frame beams
  function addBeam(x, y, z, w, h, d) {
    const b = makeBox(w, h, d, frameMat);
    b.position.set(x, y, z);
    chamber.add(b);
  }
  [-_wallOff, _wallOff].forEach(x => {
    [-DEPTH / 2, DEPTH / 2].forEach(z => addBeam(x, HEIGHT / 2, z, 0.2, HEIGHT, 0.2));
  });
  [-_wallOff, _wallOff].forEach(x => addBeam(x, HEIGHT, 0, 0.2, 0.1, DEPTH + 0.2));
  [-DEPTH / 2, DEPTH / 2].forEach(z => addBeam(0, HEIGHT, z, _bwW + 0.4, 0.1, 0.2));

  return chamber;
}

export function buildVents(scene) {
  const ventGroup = new THREE.Group();
  scene.add(ventGroup);

  const ventMat = new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.6, roughness: 0.4 });
  const ventDarkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a });
  const ventAccentMat = new THREE.MeshStandardMaterial({ color: 0x556677, metalness: 0.5, roughness: 0.3 });

  // Hot zone exhaust vent
  const ventBox = makeBox(1.2, 1.4, 0.2, ventMat.clone());
  ventBox.position.set(centers[0] - 1.5, 1.6, -DEPTH / 2 + 0.1);
  ventGroup.add(ventBox);
  for (let j = 0; j < 7; j++) {
    const slat = makeBox(1.0, 0.05, 0.02, ventDarkMat);
    slat.position.set(centers[0] - 1.5, 0.7 + j * 0.18, -DEPTH / 2 + 0.2);
    ventGroup.add(slat);
  }
  const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.6, 16), ventAccentMat);
  duct.rotation.x = Math.PI / 2;
  duct.position.set(centers[0] - 1.5, 2.2, -DEPTH / 2 - 0.3);
  ventGroup.add(duct);
  const ductRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 16), ventAccentMat.clone());
  ductRing.position.set(centers[0] - 1.5, 2.2, -DEPTH / 2 - 0.6);
  ventGroup.add(ductRing);

  // Cold zone return air grill
  const grillBox = makeBox(1.2, 1.0, 0.15, ventMat.clone());
  grillBox.position.set(centers[1] + 1.2, 1.6, -DEPTH / 2 + 0.08);
  ventGroup.add(grillBox);
  for (let j = 0; j < 8; j++) {
    const bar = makeBox(0.03, 0.7, 0.02, ventDarkMat);
    bar.position.set(centers[1] + 1.2 - 0.45 + j * 0.13, 1.6, -DEPTH / 2 + 0.15);
    ventGroup.add(bar);
  }
  const grillBorder = makeBox(1.3, 1.1, 0.02, ventAccentMat);
  grillBorder.position.set(centers[1] + 1.2, 1.6, -DEPTH / 2 + 0.18);
  ventGroup.add(grillBorder);

  // Windy zone intake louver
  const louverBox = makeBox(0.15, 1.2, 1.2, ventMat);
  louverBox.position.set(centers[2] + SECTION_W / 2 + 0.1, 1.5, 0);
  ventGroup.add(louverBox);
  for (let j = 0; j < 6; j++) {
    const blade = makeBox(0.03, 0.04, 1.0, ventDarkMat);
    blade.position.set(centers[2] + SECTION_W / 2 + 0.17, 0.7 + j * 0.18, 0);
    blade.rotation.y = 0.4;
    ventGroup.add(blade);
  }
  const louverFrame = makeBox(0.02, 1.3, 1.3, ventAccentMat);
  louverFrame.position.set(centers[2] + SECTION_W / 2 + 0.08, 1.5, 0);
  ventGroup.add(louverFrame);

  // Rainy zone floor drains
  const drainMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, metalness: 0.5, roughness: 0.4 });
  const drainFrameMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.4, roughness: 0.5 });
  const drainWater = [];
  [-1.2, 1.2].forEach(offset => {
    const df = makeBox(0.6, 0.03, 0.6, drainFrameMat);
    df.position.set(centers[3] + offset, 0.04, 0.8);
    ventGroup.add(df);
    for (let k = 0; k < 5; k++) {
      const bar = makeBox(0.5, 0.025, 0.025, drainMat);
      bar.position.set(centers[3] + offset, 0.055, 0.8 - 0.2 + k * 0.1);
      ventGroup.add(bar);
    }
    const hole = makeBox(0.45, 0.01, 0.45, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    hole.position.set(centers[3] + offset, 0.01, 0.8);
    ventGroup.add(hole);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.5, 8), new THREE.MeshStandardMaterial({
      color: 0x4488cc, transparent: true, opacity: 0, emissive: 0x4488ff, emissiveIntensity: 0.2
    }));
    water.position.set(centers[3] + offset, 0.04, 0.8);
    ventGroup.add(water);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.5, roughness: 0.4 });
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.3, 8), tubeMat);
    tube.position.set(centers[3] + offset, 0.0, 0.8);
    ventGroup.add(tube);
    drainWater.push(water);
  });

  return { ventBox, ductRing, grillBox, drainWater };
}
