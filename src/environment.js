import * as THREE from 'three';
import { makeBox } from './utils.js';
import { _wallOff, DEPTH, HEIGHT } from './constants.js';

export function buildEnvironment(scene) {
  const envGroup = new THREE.Group();
  scene.add(envGroup);

  // ---- Grass ground ----
  function makeGrassTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#3a7a2a';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2000; i++) {
      const shade = 40 + Math.random() * 60;
      ctx.fillStyle = `rgb(${shade-10},${shade+30},${shade-20})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 2 + Math.random() * 3);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 15);
    return tex;
  }
  const grassMat = new THREE.MeshStandardMaterial({
    map: makeGrassTexture(), roughness: 0.9, metalness: 0,
  });
  const ground = makeBox(80, 0.15, 60, grassMat);
  ground.position.set(0, -0.15, 5);
  ground.receiveShadow = true;
  envGroup.add(ground);

  // ---- Walkway (kept as requested) ----
  const walkMat = new THREE.MeshStandardMaterial({ color: 0x7a8a8a, metalness: 0.05, roughness: 0.85 });
  const walkway = makeBox(36, 0.04, 6, walkMat);
  walkway.position.set(0, 0.02, 8.5);
  walkway.receiveShadow = true;
  envGroup.add(walkway);
  // Walkway edges
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xccaa00, emissive: 0x886600, emissiveIntensity: 0.05 });
  [-18, 18].forEach(x => {
    const edge = makeBox(0.04, 0.05, 6, edgeMat);
    edge.position.set(x, 0.04, 8.5);
    envGroup.add(edge);
  });

  // ---- Trees (fixed positions, well away from chamber) ----
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3a9a2a, roughness: 0.8 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x4aaa3a, roughness: 0.8 });
  function makeTree(x, z, scale) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.6 * scale, 6), trunkMat);
    trunk.position.y = 0.3 * scale;
    trunk.castShadow = true;
    g.add(trunk);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.4 * scale, 6, 6), leafMat);
    crown.position.y = 0.8 * scale + 0.1 * scale;
    crown.castShadow = true;
    g.add(crown);
    const crown2 = new THREE.Mesh(new THREE.SphereGeometry(0.3 * scale, 6, 6), leafMat2);
    crown2.position.set(0.15 * scale, 1.0 * scale, 0.1 * scale);
    crown2.castShadow = true;
    g.add(crown2);
    g.position.set(x, 0, z);
    return g;
  }
  // Fixed tree positions far from chamber (chamber spans x:-14..14, z:-5..5)
  const treePositions = [
    [-30, -8, 1.2], [30, -8, 1.2], [-28, 0, 0.8], [28, 0, 0.8],
    [-32, 10, 1.0], [32, 10, 1.0], [-30, 16, 1.3], [30, 16, 1.3],
    [-24, -12, 0.9], [24, -12, 0.9], [-26, 18, 1.1], [26, 18, 1.1],
    [-34, 4, 0.7], [34, 4, 0.7], [-22, -10, 1.0], [22, -10, 1.0],
  ];
  treePositions.forEach(([x, z, s]) => envGroup.add(makeTree(x, z + 5, s)));

  // ---- Bushes (far from chamber) ----
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x2a8a1a, roughness: 0.85 });
  const bushPositions = [
    [-26, 6], [26, 6], [-24, 14], [24, 14], [-20, -6], [20, -6],
    [-18, 18], [18, 18], [-16, -10], [16, -10], [-28, 12], [28, 12],
  ];
  bushPositions.forEach(([x, z]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.25 + Math.random() * 0.15, 5, 5), bushMat);
    b.position.set(x, 0.1, z + 5);
    b.castShadow = true;
    envGroup.add(b);
  });

  // ---- Sky dome (distant backdrop) ----
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x87bbff, side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 16, 12), skyMat);
  sky.position.set(0, 0, 5);
  envGroup.add(sky);

  // ---- Distant hills (ring) ----
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x4a8a3a, roughness: 0.9 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(32, 38, 32), hillMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, -0.1, 5);
  envGroup.add(ring);

  // ---- Background color ----
  scene.background = new THREE.Color(0x8ab8e6);

  // ---- Sunlight ----
  const sun = new THREE.DirectionalLight(0xffeedd, 1.8);
  sun.position.set(20, 30, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  const d = 30;
  sun.shadow.camera.left = -d;
  sun.shadow.camera.right = d;
  sun.shadow.camera.top = d;
  sun.shadow.camera.bottom = -d;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
  fill.position.set(-20, 10, -20);
  scene.add(fill);

  // ---- Walkway perimeter barriers with belt ----
  const postMat = new THREE.MeshStandardMaterial({ color: 0xccaa00, emissive: 0x886600, emissiveIntensity: 0.03 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, emissive: 0x881111, emissiveIntensity: 0.02 });
  const beltWhite = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
  const walkHalf = 16;
  function addBeltPost(x, z) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8), postMat);
    post.position.set(x, 0.35, z);
    post.castShadow = true;
    envGroup.add(post);
    for (let b = 0; b < 2; b++) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.06, 8), new THREE.MeshBasicMaterial({ color: 0x222222 }));
      band.position.set(x, 0.15 + b * 0.35, z);
      envGroup.add(band);
    }
    return post;
  }
  function addBeltSegment(x1, x2, z) {
    const beltLen = x2 - x1;
    const segs = Math.max(4, Math.round(beltLen * 2));
    for (let seg = 0; seg < segs; seg++) {
      const segMat = seg % 2 === 0 ? beltMat : beltWhite;
      const segW = beltLen / segs;
      const segMesh = makeBox(segW - 0.02, 0.005, 0.04, segMat);
      segMesh.position.set(x1 + seg * segW + segW / 2, 0.55, z);
      envGroup.add(segMesh);
    }
  }
  // Front walkway edge (z = 11.5)
  const beltPosts = [];
  for (let x = -walkHalf; x <= walkHalf; x += 4) {
    addBeltPost(x, 11.5);
    beltPosts.push(x);
  }
  beltPosts.forEach((x, i) => {
    if (i < beltPosts.length - 1) addBeltSegment(x, beltPosts[i + 1], 11.5);
  });
  // Side walkway edges
  [[-walkHalf, 11.5, 5.5], [walkHalf, 11.5, 5.5]].forEach(([x, z1, z2]) => {
    const len = z1 - z2;
    const segs = Math.max(3, Math.round(len * 2));
    for (let seg = 0; seg < segs; seg++) {
      const segMat = seg % 2 === 0 ? beltMat : beltWhite;
      const segW = len / segs;
      const segMesh = makeBox(0.005, 0.005, segW - 0.02, segMat);
      segMesh.position.set(x, 0.55, z2 + seg * segW + segW / 2);
      envGroup.add(segMesh);
    }
  });
  // Side corner posts
  [[-walkHalf, 11.5], [-walkHalf, 5.5], [walkHalf, 11.5], [walkHalf, 5.5]].forEach(([x, z]) => {
    addBeltPost(x, z);
  });
}

export function buildControlRoom(scene, flags) {
  const room = new THREE.Group();
  room.position.set(0, 0, 15);
  scene.add(room);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, metalness: 0.4, roughness: 0.6 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.6, roughness: 0.4 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaddff, metalness: 0, roughness: 0.05,
    transparent: true, opacity: 0.12, side: THREE.DoubleSide
  });
  const frameMatL = new THREE.MeshStandardMaterial({ color: 0x4a4a5a, metalness: 0.7, roughness: 0.3 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0xffaa33, emissiveIntensity: 0.8 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.7 });
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x4a4a3a, metalness: 0.3, roughness: 0.6 });
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x222233 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xddbb99 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0x334466 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.2, roughness: 0.8 });

  // Make control room bigger: 8m wide, 5m deep, 4m tall
  const CR_W = 8, CR_D = 5, CR_H = 4;

  // Floor
  const floor = makeBox(CR_W, 0.15, CR_D, floorMat);
  floor.position.set(0, 0.075, 0);
  room.add(floor);

  // Back wall
  const back = makeBox(CR_W, CR_H, 0.15, wallMat);
  back.position.set(0, CR_H / 2, -CR_D / 2);
  room.add(back);

  // Left wall
  const left = makeBox(0.15, CR_H, CR_D, wallMat);
  left.position.set(-CR_W / 2, CR_H / 2, 0);
  room.add(left);

  // Right wall
  const right = makeBox(0.15, CR_H, CR_D, wallMat);
  right.position.set(CR_W / 2, CR_H / 2, 0);
  room.add(right);

  // Front wall — full glass with frame
  const frontFrame = makeBox(CR_W, CR_H, 0.1, frameMatL);
  frontFrame.position.set(0, CR_H / 2, CR_D / 2);
  room.add(frontFrame);
  // Large glass panels
  for (let i = -1; i <= 1; i += 2) {
    const panel = makeBox(3.2, CR_H - 0.6, 0.04, glassMat);
    panel.position.set(i * 1.8, CR_H / 2, CR_D / 2 + 0.07);
    room.add(panel);
  }
  // Window divider
  const divider = makeBox(0.06, CR_H - 0.6, 0.04, frameMatL);
  divider.position.set(0, CR_H / 2, CR_D / 2 + 0.07);
  room.add(divider);

  // Roof with overhang
  const roof = makeBox(CR_W + 0.6, 0.12, CR_D + 0.4, roofMat);
  roof.position.set(0, CR_H, 0);
  room.add(roof);

  // Ceiling light panel
  const lightPanel = makeBox(1.2, 0.02, 0.6, glowMat);
  lightPanel.position.set(0, CR_H - 0.1, 0);
  room.add(lightPanel);

  // Interior glow
  const interiorLight = new THREE.PointLight(0xff8844, 2, 8);
  interiorLight.position.set(0, CR_H - 0.5, 0);
  room.add(interiorLight);

  // ---- Desk ----
  const desk = makeBox(5, 0.06, 1.2, deskMat);
  desk.position.set(0, 0.75, -0.8);
  room.add(desk);

  // Monitor screens on desk
  for (let i = -1; i <= 1; i += 1) {
    const screen = makeBox(0.7, 0.45, 0.05, screenMat);
    screen.position.set(i * 1.4, 1.05, -0.4);
    room.add(screen);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.3, 6), wallMat);
    stand.position.set(i * 1.4, 0.9, -0.4);
    room.add(stand);
  }

  // ---- Human figures ----
  function makePerson(x, z) {
    const g = new THREE.Group();
    // Body / torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.5, 8), clothMat);
    torso.position.y = 0.65;
    g.add(torso);
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), skinMat);
    head.position.y = 1.0;
    g.add(head);
    // Arms
    for (let side = -1; side <= 1; side += 2) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.4, 6), skinMat);
      arm.position.set(side * 0.22, 0.75, 0);
      arm.rotation.z = side * 0.2;
      g.add(arm);
    }
    // Legs
    for (let side = -1; side <= 1; side += 2) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0x222244 }));
      leg.position.set(side * 0.08, 0.25, 0);
      g.add(leg);
    }
    g.position.set(x, 0, z);
    return g;
  }

  // Place people inside the control room
  room.add(makePerson(-1.8, 0));
  room.add(makePerson(1.8, 0.5));
  room.add(makePerson(-0.5, -1.2));

  // ---- Step / platform at entrance ----
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x5a5a6a, metalness: 0.3, roughness: 0.7 });
  const step = makeBox(CR_W * 0.6, 0.1, 0.5, stepMat);
  step.position.set(0, 0.05, CR_D / 2 + 0.3);
  room.add(step);

  // ---- Fluorescent Lights on Chamber Exterior ----
  const housingMat = new THREE.MeshStandardMaterial({ color: 0x556666, metalness: 0.6, roughness: 0.4 });
  const tubeOnMat = new THREE.MeshStandardMaterial({ color: 0xeeeeff, emissive: 0xaaccff, emissiveIntensity: 1.5 });
  const tubeOffMat = new THREE.MeshStandardMaterial({ color: 0x666677 });

  function makeFluorescentTube() {
    const g = new THREE.Group();
    const housing = makeBox(1.2, 0.04, 0.08, housingMat);
    g.add(housing);
    const tube = makeBox(1.0, 0.025, 0.04, tubeOnMat);
    tube.position.z = -0.025;
    g.add(tube);
    return { group: g, tube, tubeOnMat, tubeOffMat };
  }

  // Tube is now along x-axis (horizontal), housing above tube

  // Front wall (z = DEPTH/2, above glass) — horizontal along x-axis
  const frontTubes = [];
  for (let i = -1; i <= 1; i++) {
    const ft = makeFluorescentTube();
    ft.group.position.set(i * 6, HEIGHT - 0.2, DEPTH / 2 + 0.15);
    scene.add(ft.group);
    frontTubes.push(ft);
  }

  // Back wall (z = -DEPTH/2) — horizontal along x-axis
  const backTubes = [];
  for (let i = -1; i <= 1; i++) {
    const bt = makeFluorescentTube();
    bt.group.position.set(i * 6, HEIGHT - 0.2, -DEPTH / 2 - 0.15);
    bt.group.rotation.y = Math.PI;
    scene.add(bt.group);
    backTubes.push(bt);
  }

  // Left side wall (x = -_wallOff) — horizontal along z-axis
  const leftTubes = [];
  for (let i = -1; i <= 1; i += 2) {
    const lt = makeFluorescentTube();
    lt.group.position.set(-_wallOff - 0.15, HEIGHT - 0.2, i * 3);
    lt.group.rotation.y = -Math.PI / 2;
    scene.add(lt.group);
    leftTubes.push(lt);
  }

  // Right side wall (x = _wallOff) — horizontal along z-axis
  const rightTubes = [];
  for (let i = -1; i <= 1; i += 2) {
    const rt = makeFluorescentTube();
    rt.group.position.set(_wallOff + 0.15, HEIGHT - 0.2, i * 3);
    rt.group.rotation.y = Math.PI / 2;
    scene.add(rt.group);
    rightTubes.push(rt);
  }

  const allTubes = [...frontTubes, ...backTubes, ...leftTubes, ...rightTubes];

  // ---- Main Switch Box on Control Room Wall ----
  const switchBoxMat = new THREE.MeshStandardMaterial({ color: 0x444466, metalness: 0.6, roughness: 0.3 });
  const swOnMat = new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: 0x00ff44, emissiveIntensity: 1.0 });
  const swOffMat = new THREE.MeshStandardMaterial({ color: 0x661100 });
  const labelMat = new THREE.MeshStandardMaterial({ color: 0x999988, emissive: 0x999988, emissiveIntensity: 0.15 });

  function makeSwitch() {
    const g = new THREE.Group();
    // Switch box body
    const box = makeBox(0.35, 0.5, 0.12, switchBoxMat);
    g.add(box);
    // Toggle lever (bigger)
    const lever = makeBox(0.02, 0.15, 0.02, new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    lever.position.set(0, 0.12, 0.09);
    g.add(lever);
    // Toggle base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.02, 8), new THREE.MeshStandardMaterial({ color: 0x888888 }));
    base.position.set(0, 0.05, 0.09);
    g.add(base);
    // Indicator light (bigger)
    const ind = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), swOnMat);
    ind.position.set(0, 0.22, 0.09);
    g.add(ind);
    // Label plate
    const lbl = makeBox(0.3, 0.04, 0.015, labelMat);
    lbl.position.set(0, -0.15, 0.09);
    g.add(lbl);
    return { group: g, lever, ind, swOnMat, swOffMat };
  }

  const mainSwitch = makeSwitch();
  mainSwitch.group.position.set(CR_W / 2 - 0.2, 2.2, -CR_D / 2 + 0.8);
  mainSwitch.group.rotation.y = Math.PI;
  room.add(mainSwitch.group);

  return { allTubes, mainSwitch };
}
