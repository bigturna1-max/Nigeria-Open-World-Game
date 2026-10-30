import * as THREE from 'three';

const canvas = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bd0ed);
scene.fog = new THREE.Fog(0x9bd0ed, 100, 420);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.add(new THREE.HemisphereLight(0xcceaff, 0x556044, 2.0));
const sun = new THREE.DirectionalLight(0xffedc4, 2.2);
sun.position.set(-70, 100, 45);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const materials = {
  grass: new THREE.MeshStandardMaterial({ color: 0x6b9b4d, roughness: 1 }),
  asphalt: new THREE.MeshStandardMaterial({ color: 0x373b3e, roughness: 1 }),
  roadMark: new THREE.MeshStandardMaterial({ color: 0xf4d35e }),
  concrete: new THREE.MeshStandardMaterial({ color: 0xb8b4a9, roughness: 1 }),
  window: new THREE.MeshStandardMaterial({ color: 0x78b9cf, metalness: 0.15, roughness: 0.35 }),
  roof: new THREE.MeshStandardMaterial({ color: 0x9b4d36, roughness: 1 }),
  skin: new THREE.MeshStandardMaterial({ color: 0x8a5438 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0x16a085 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x25282b }),
  danfo: new THREE.MeshStandardMaterial({ color: 0xf3c623 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf4f1e8 })
};

function box(w,h,d, material, x,y,z, parent=scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
  mesh.position.set(x,y,z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// Ground and long roads
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), materials.grass);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.08;
ground.receiveShadow = true;
scene.add(ground);

box(18, 0.08, 760, materials.asphalt, 0, 0, 0);
box(760, 0.08, 18, materials.asphalt, 0, 0, 0);
for (let i=-360; i<=360; i+=18) {
  box(0.22, 0.03, 7, materials.roadMark, 0, 0.06, i);
  box(7, 0.03, 0.22, materials.roadMark, i, 0.06, 0);
}
for (const side of [-1,1]) {
  box(1.1, 0.18, 760, materials.concrete, side*10, 0.04, 0);
  box(760, 0.18, 1.1, materials.concrete, 0, 0.04, side*10);
}

// Buildings arranged along the streets, with simple windows and red roofs
let seed = 8421;
function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const buildingColors = [0xd8c8a9, 0xc6b8a4, 0xe2d8c8, 0xbcae9b, 0xd5c4a2];
for (let i=0; i<120; i++) {
  const sideX = rand() < .5 ? -1 : 1;
  const sideZ = rand() < .5 ? -1 : 1;
  const x = sideX * (17 + rand()*125);
  const z = sideZ * (17 + rand()*125);
  const w = 7 + rand()*11, d = 7 + rand()*10, h = 4 + rand()*rand()*19;
  const wallMat = new THREE.MeshStandardMaterial({ color: buildingColors[Math.floor(rand()*buildingColors.length)], roughness: .95 });
  box(w,h,d, wallMat, x, h/2, z);
  box(w+0.3, 0.45, d+0.3, materials.roof, x, h+0.18, z);
  // Front windows on the side facing the central road
  const frontZ = z - Math.sign(z)*(d/2 + .035);
  const rows = Math.max(1, Math.floor(h/3.2));
  const cols = Math.max(1, Math.floor(w/2.8));
  for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
    box(.85, .95, .07, materials.window,
      x - w/2 + (c+0.7)*(w/(cols+0.2)),
      1.5 + r*2.5,
      frontZ);
  }
}

// A small market cluster
for (let i=0; i<8; i++) {
  const x = -42 + i*12;
  box(7, 3.2, 6, new THREE.MeshStandardMaterial({color: i%2 ? 0x4e9c68 : 0xd8a04d}), x, 1.6, 28);
  box(7.6, .35, 6.6, materials.roof, x, 3.35, 28);
}

// Park trees
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x65432b });
const leafMats = [0x287a43, 0x3b8e4e, 0x4a984c].map(c => new THREE.MeshStandardMaterial({color:c, roughness:1}));
function tree(x,z,s=1) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.22*s,.34*s,2.2*s,7), trunkMat);
  trunk.position.set(x,1.1*s,z); trunk.castShadow = true; scene.add(trunk);
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.35*s,8,7), leafMats[Math.floor(rand()*leafMats.length)]);
  leaves.position.set(x,2.8*s,z); leaves.castShadow = true; scene.add(leaves);
}
for(let i=0;i<55;i++) {
  let x, z;
  do { x=(rand()-.5)*280; z=(rand()-.5)*280; } while(Math.abs(x)<16 || Math.abs(z)<16);
  tree(x,z,.7+rand()*.7);
}

// Parked fictional yellow minibus / danfo
function makeBus(x,z,rot=0) {
  const bus = new THREE.Group();
  box(3.2,2.5,6.3,materials.danfo,0,1.35,0,bus);
  box(2.8,.7,5.5,materials.white,0,2.35,0,bus);
  box(2.85,.9,.08,materials.window,0,1.95,-3.17,bus);
  for (const wx of [-1.15,1.15]) {
    for (const wz of [-1.9,-.1,1.7]) box(.08,.85,.95,materials.window,wx,1.8,wz,bus);
    for (const wz of [-2,2]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.25,12),materials.dark);
      wheel.rotation.z = Math.PI/2; wheel.position.set(wx*1.25,.5,wz); bus.add(wheel);
    }
  }
  bus.position.set(x,0,z); bus.rotation.y=rot; scene.add(bus);
}
makeBus(14, 24, Math.PI/2);
makeBus(-24,-14, 0);

// Player character, original fictional character
const player = new THREE.Group();
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.48,.9,4,8), materials.shirt);
torso.position.y=1.45; torso.castShadow=true; player.add(torso);
const head = new THREE.Mesh(new THREE.SphereGeometry(.34,12,10),materials.skin);
head.position.y=2.35; head.castShadow=true; player.add(head);
const legs = box(.7,.75,.42,materials.dark,0,.55,0,player);
scene.add(player);
player.position.set(0,0,0);

// Tiny landmark sign
box(0.18,3.5,.18,materials.dark,-8,1.75,-8);
box(5.5,1.25,.22,new THREE.MeshStandardMaterial({color:0x176b45}),-8,3.7,-8);
const sign = document.createElement('canvas');
sign.width=512; sign.height=128;
const ctx=sign.getContext('2d');
ctx.fillStyle='#176b45'; ctx.fillRect(0,0,512,128);
ctx.fillStyle='#ffffff'; ctx.font='bold 42px Arial'; ctx.textAlign='center';
ctx.fillText('LAGOS DISTRICT',256,78);
const signTex = new THREE.CanvasTexture(sign);
const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(5.4,1.2),new THREE.MeshBasicMaterial({map:signTex}));
signBoard.position.set(-8,3.7,-7.86); scene.add(signBoard);

// Controls
const keys = {};
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
let yaw = 0, pitch = -0.22, pointerLocked = false;
canvas.addEventListener('click', () => canvas.requestPointerLock?.());
document.addEventListener('pointerlockchange', () => { pointerLocked = document.pointerLockElement === canvas; });
document.addEventListener('mousemove', e => {
  if (!pointerLocked) return;
  yaw -= e.movementX * .0022;
  pitch = Math.max(-.65, Math.min(.2, pitch - e.movementY*.0018));
});
const status = document.querySelector('#status');

function animate() {
  requestAnimationFrame(animate);
  const forward = (keys.w || keys.arrowup ? 1:0) - (keys.s || keys.arrowdown ? 1:0);
  const sideways = (keys.d || keys.arrowright ? 1:0) - (keys.a || keys.arrowleft ? 1:0);
  const speed = (keys.shift ? 0.28 : 0.15);
  const dx = Math.sin(yaw)*forward + Math.cos(yaw)*sideways;
  const dz = Math.cos(yaw)*forward - Math.sin(yaw)*sideways;
  player.position.x += dx*speed;
  player.position.z += dz*speed;
  if (Math.abs(forward)+Math.abs(sideways)>0) player.rotation.y = Math.atan2(dx,dz);
  const target = new THREE.Vector3(player.position.x, 1.6, player.position.z);
  const distance = 10;
  camera.position.set(
    player.position.x - Math.sin(yaw)*distance,
    player.position.y + 5.5 + pitch*8,
    player.position.z - Math.cos(yaw)*distance
  );
  camera.lookAt(target);
  const nearMarket = Math.abs(player.position.x)<70 && player.position.z>12 && player.position.z<42;
  status.textContent = nearMarket ? 'You are near the local market.' : 'Explore the streets.';
  renderer.render(scene,camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
