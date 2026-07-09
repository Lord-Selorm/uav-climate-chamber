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
    color: 0x88ccff, metalness: 0, roughness: 0.05,
    transparent: true, opacity: 0.15, side: THREE.DoubleSide
  });
  const interiorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xff8800, emissiveIntensity: 0.5 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.6 });
  const frameMatL = new THREE.MeshStandardMaterial({ color: 0x4a4a5a, metalness: 0.7, roughness: 0.3 });

  // Floor
  const floor = makeBox(5, 0.15, 4, new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.2, roughness: 0.8 }));
  floor.position.set(0, 0.075, 0);
  room.add(floor);

  // Back wall
  const back = makeBox(5, 3, 0.15, wallMat);
  back.position.set(0, 1.5, -2);
  room.add(back);

  // Left wall
  const left = makeBox(0.15, 3, 4, wallMat);
  left.position.set(-2.5, 1.5, 0);
  room.add(left);

  // Right wall
  const right = makeBox(0.15, 3, 4, wallMat);
  right.position.set(2.5, 1.5, 0);
  room.add(right);

  // Front wall (facing chamber) — glass panels with frame
  const frontFrame = makeBox(5, 3, 0.1, frameMatL);
  frontFrame.position.set(0, 1.5, 2);
  room.add(frontFrame);
  const frontGlass = makeBox(4.4, 2.4, 0.04, glassMat);
  frontGlass.position.set(0, 1.5, 2.07);
  room.add(frontGlass);

  // Roof
  const roof = makeBox(5.4, 0.12, 4.4, roofMat);
  roof.position.set(0, 3, 0.2);
  room.add(roof);

  // Interior warm glow light
  const interiorLight = new THREE.PointLight(0xff8844, 1.5, 6);
  interiorLight.position.set(0, 2.5, 0);
  room.add(interiorLight);

  // Interior glow plane (ceiling light panel)
  const lightPanel = makeBox(0.5, 0.02, 0.3, glowMat);
  lightPanel.position.set(0, 2.9, 0);
  room.add(lightPanel);

  // Monitor screens inside (visible through glass)
  for (let i = -1; i <= 1; i += 2) {
    const screen = makeBox(0.6, 0.4, 0.05, screenMat);
    screen.position.set(i * 1.2, 1.3, -1.85);
    screen.rotation.y = 0;
    room.add(screen);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.3, 6), wallMat);
    stand.position.set(i * 1.2, 0.35, -1.85);
    room.add(stand);
    const base = makeBox(0.15, 0.03, 0.12, wallMat);
    base.position.set(i * 1.2, 0.05, -1.85);
    room.add(base);
  }

  // Desk
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x4a4a3a, metalness: 0.3, roughness: 0.6 });
  const desk = makeBox(3.5, 0.06, 1.0, deskMat);
  desk.position.set(0, 0.7, -1.2);
  room.add(desk);

  // Chairs
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x222233 });
  for (let i = -1; i <= 1; i += 2) {
    const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 6), frameMatL);
    chairBase.position.set(i * 1.0, 0.2, -1.2);
    room.add(chairBase);
    const seat = makeBox(0.3, 0.04, 0.3, chairMat);
    seat.position.set(i * 1.0, 0.42, -1.2);
    room.add(seat);
  }

  // ---- Outside Fluorescent Lights on Chamber Exterior ----
  const housingMat = new THREE.MeshStandardMaterial({ color: 0x556666, metalness: 0.6, roughness: 0.4 });
  const tubeOnMat = new THREE.MeshStandardMaterial({ color: 0xeeeeff, emissive: 0xaaccff, emissiveIntensity: 1.2 });
  const tubeOffMat = new THREE.MeshStandardMaterial({ color: 0x666677 });

  function makeFluorescentTube() {
    const g = new THREE.Group();
    const housing = makeBox(0.08, 0.04, 1.2, housingMat);
    g.add(housing);
    const tube = makeBox(0.04, 0.025, 1.0, tubeOnMat);
    tube.position.y = -0.025;
    g.add(tube);
    return { group: g, tube, tubeOnMat, tubeOffMat };
  }

  // Front wall (z = DEPTH/2, above glass doors)
  const frontTubes = [];
  for (let i = -1; i <= 1; i++) {
    const ft = makeFluorescentTube();
    ft.group.position.set(i * 8, HEIGHT - 0.3, DEPTH / 2 + 0.15);
    ft.group.rotation.x = Math.PI / 2;
    scene.add(ft.group);
    frontTubes.push(ft);
  }

  // Back wall (z = -DEPTH/2)
  const backTubes = [];
  for (let i = -1; i <= 1; i++) {
    const bt = makeFluorescentTube();
    bt.group.position.set(i * 8, HEIGHT - 0.3, -DEPTH / 2 - 0.15);
    bt.group.rotation.x = -Math.PI / 2;
    scene.add(bt.group);
    backTubes.push(bt);
  }

  // Left side wall (x = -_wallOff)
  const leftTubes = [];
  for (let i = -1; i <= 1; i += 2) {
    const lt = makeFluorescentTube();
    lt.group.position.set(-_wallOff - 0.15, HEIGHT - 0.3, i * 3);
    lt.group.rotation.z = Math.PI / 2;
    scene.add(lt.group);
    leftTubes.push(lt);
  }

  // Right side wall (x = _wallOff)
  const rightTubes = [];
  for (let i = -1; i <= 1; i += 2) {
    const rt = makeFluorescentTube();
    rt.group.position.set(_wallOff + 0.15, HEIGHT - 0.3, i * 3);
    rt.group.rotation.z = -Math.PI / 2;
    scene.add(rt.group);
    rightTubes.push(rt);
  }

  const allTubes = [...frontTubes, ...backTubes, ...leftTubes, ...rightTubes];

  // ---- Main Switch Box on Control Room Wall ----
  const switchBoxMat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.5, roughness: 0.4 });
  const swOnMat = new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: 0x00ff44, emissiveIntensity: 0.6 });
  const swOffMat = new THREE.MeshStandardMaterial({ color: 0x442200 });
  const labelMat = new THREE.MeshStandardMaterial({ color: 0x888888, emissive: 0x888888, emissiveIntensity: 0.1 });

  function makeSwitch() {
    const g = new THREE.Group();
    const box = makeBox(0.25, 0.35, 0.1, switchBoxMat);
    g.add(box);
    const toggle = makeBox(0.015, 0.07, 0.015, new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    toggle.position.set(0, 0.05, 0.07);
    g.add(toggle);
    const ind = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), swOnMat);
    ind.position.set(0, 0.18, 0.07);
    g.add(ind);
    const lbl = makeBox(0.2, 0.03, 0.015, labelMat);
    lbl.position.set(0, -0.1, 0.07);
    g.add(lbl);
    return { group: g, toggle, ind, swOnMat, swOffMat };
  }

  const mainSwitch = makeSwitch();
  mainSwitch.group.position.set(2.6, 2.0, 0.4);
  mainSwitch.group.rotation.y = -Math.PI / 2;
  room.add(mainSwitch.group);

  return { allTubes, mainSwitch };
}
