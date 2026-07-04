import * as THREE from 'three';

let camera, controls, scene, pipCamera, pipRenderer;

export function initCamera(cam, ctrl, scn, pipCam, pipRen) {
  camera = cam;
  controls = ctrl;
  scene = scn;
  pipCamera = pipCam;
  pipRenderer = pipRen;
}

export const camTargets = {
  overview: { pos: new THREE.Vector3(22, 14, 24), target: new THREE.Vector3(0, 3.0, 0) },
  hot: { pos: new THREE.Vector3(-16, 6, 10), target: new THREE.Vector3(-10.5, 3.0, 0) },
  cold: { pos: new THREE.Vector3(-9, 6, 10), target: new THREE.Vector3(-3.5, 3.0, 0) },
  windy: { pos: new THREE.Vector3(-2, 5, 8), target: new THREE.Vector3(3.5, 3.0, 0) },
  rainy: { pos: new THREE.Vector3(5, 6, 10), target: new THREE.Vector3(10.5, 3.0, 0) },
  top: { pos: new THREE.Vector3(0, 18, 0.01), target: new THREE.Vector3(0, 1.5, 0) },
};

let camLerp = 1, camFrom = new THREE.Vector3(), camTo = new THREE.Vector3();
let targetFrom = new THREE.Vector3(), targetTo = new THREE.Vector3();
let isOrbiting = false;

export function setCameraView(id) {
  const t = camTargets[id];
  if (!t) return;
  isOrbiting = (id === 'orbit');
  if (isOrbiting) {
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;
    return;
  }
  controls.autoRotate = false;
  camFrom.copy(camera.position);
  camTo.copy(t.pos);
  targetFrom.copy(controls.target);
  targetTo.copy(t.target);
  camLerp = 0;
}

export function updateCameraTransitions(dt) {
  if (camLerp < 1) {
    camLerp = Math.min(1, camLerp + dt * 2);
    const ease = 1 - Math.pow(1 - camLerp, 3);
    camera.position.lerpVectors(camFrom, camTo, ease);
    controls.target.lerpVectors(targetFrom, targetTo, ease);
  }
}

export function updateFollowCam(dt, followCam, followIdx, drones) {
  if (followCam) {
    const targetDrone = drones[followIdx];
    if (targetDrone) {
      const target = new THREE.Vector3();
      targetDrone.group.getWorldPosition(target);
      const offset = new THREE.Vector3(followIdx === 0 ? -3 : followIdx === 3 ? 3 : 0, 2.5, 4);
      const targetPos = target.clone().add(offset);
      camera.position.lerp(targetPos, dt * 2);
      controls.target.lerp(target, dt * 3);
    }
  }
}

export function renderPIP(pipActive, pipDroneIdx, drones) {
  if (pipActive && drones[pipDroneIdx]) {
    const d = drones[pipDroneIdx].group;
    pipCamera.position.copy(d.position);
    pipCamera.position.y += 0.1;
    const dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), d.rotation.y);
    const lookTarget = pipCamera.position.clone().add(dir.multiplyScalar(2));
    pipCamera.lookAt(lookTarget);
    pipRenderer.render(scene, pipCamera);
  }
}
