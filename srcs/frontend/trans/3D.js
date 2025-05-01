// === 3D Pong on XZ Plane Using Three.js ===
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

// === Setup Scene ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(-800, 350, 0);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === Sound Effect ===

const growlSound = new Audio('./assets/growl.mp3');

// === Texture Loader ===
const textureLoader = new THREE.TextureLoader();

// Load game textures
const tableTexture = textureLoader.load('./assets/3Dtable.png');
const wallTexture = textureLoader.load('./assets/wall.png');
const ballTexture = textureLoader.load('./assets/3Dball.png');
const paddleTexture = textureLoader.load('./assets/paddle.png');
const backgroundTexture = textureLoader.load('./assets/background.png');

// === Add Table Surface ===
const tableMaterial = new THREE.MeshStandardMaterial({ map: tableTexture });
const tableGeometry = new THREE.PlaneGeometry(3460, 1460);
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.rotation.x = -Math.PI / 2;
table.position.y = -21;
scene.add(table);

// === Wall Textures ===
wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(10, 10);

const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });
const wallGeometry = new THREE.BoxGeometry(9000, 4000, 0);

const wallTop = new THREE.Mesh(wallGeometry, wallMaterial);
wallTop.position.set(0, 0, 250);
scene.add(wallTop);

const wallBottom = new THREE.Mesh(wallGeometry, wallMaterial);
wallBottom.position.set(0, 0, -250);
scene.add(wallBottom);

// === Add Background Wall Between Side Walls ===
const backWallGeometry = new THREE.PlaneGeometry(500, 900);
const backWallMaterial = new THREE.MeshStandardMaterial({
  map: backgroundTexture,
  side: THREE.DoubleSide
});
const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
backWall.position.set(750, 350, 0);
backWall.rotation.y = -Math.PI / 2;
scene.add(backWall);

// === Lights ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(0, 300, 0);
scene.add(pointLight);

// === Paddle Geometry ===
const paddleGeometry = new THREE.CapsuleGeometry(10, 100, 4, 8);
const paddleMaterial = new THREE.MeshStandardMaterial({ map: paddleTexture });


const paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterial);
paddle1.position.set(-400, 0, 0);
paddle1.rotation.x = Math.PI / 2;
scene.add(paddle1);;

const paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterial);
paddle2.position.set(400, 0, 0);
paddle2.rotation.x = Math.PI / 2;
scene.add(paddle2);

// === Ball Geometry ===
const ballGeometry = new THREE.SphereGeometry(15, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ map: ballTexture });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 0, 0);
scene.add(ball);

// === Game State ===
let ballVelocity = new THREE.Vector2(4, 4);
const paddleSpeed = 8;

// === Input ===
let keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function movePaddles() {
  if (keys['a']) paddle1.position.z -= paddleSpeed;
  if (keys['d']) paddle1.position.z += paddleSpeed;
  paddle1.position.z = Math.max(-190, Math.min(190, paddle1.position.z));
}

let aiTargetZ = 0;
let nextAIUpdateTime = Date.now();
const aiSmoothingFactor = 0.1;

function moveAI() {
  const now = Date.now();
  const updateInterval = 1000;

  if (now >= nextAIUpdateTime) {
    nextAIUpdateTime = now + updateInterval;

    if (ballVelocity.x > 0) {
      const distanceToAI = paddle2.position.x - ball.position.x;
      const timeToReach = distanceToAI / ballVelocity.x;
      let predictedZ = ball.position.z + ballVelocity.y * timeToReach;

      const wallLimit = 250;
      while (predictedZ > wallLimit || predictedZ < -wallLimit) {
        if (predictedZ > wallLimit) predictedZ = wallLimit - (predictedZ - wallLimit);
        if (predictedZ < -wallLimit) predictedZ = -wallLimit - (predictedZ + wallLimit);
      }

      aiTargetZ = predictedZ;
    } else {
      aiTargetZ = 0;
    }
  }

  const dz = aiTargetZ - paddle2.position.z;
  paddle2.position.z += dz * aiSmoothingFactor;
  paddle2.position.z = Math.max(-190, Math.min(190, paddle2.position.z));
}

function checkPaddleCollision(paddle) {
  const withinZ = ball.position.z < paddle.position.z + 60 &&
                  ball.position.z > paddle.position.z - 60;
  const hit = paddle === paddle1
    ? ball.position.x <= paddle.position.x + 20
    : ball.position.x >= paddle.position.x - 20;

  if (hit && withinZ) {
    const deltaZ = ball.position.z - paddle.position.z;
    const normalizedZ = deltaZ / 60;
    const angle = normalizedZ * 0.4;

    const speed = ballVelocity.length();
    const dirX = paddle === paddle1 ? 1 : -1;

    ballVelocity = new THREE.Vector2(speed * dirX, speed * angle);
  }
}

function animate() {
  // Animate background wall (eye creepiness)
  backWall.rotation.y = -Math.PI / 2 + Math.sin(Date.now() * 0.001) * 0.05;
  requestAnimationFrame(animate);

  movePaddles();
  moveAI();

  ball.position.x += ballVelocity.x;
  ball.position.z += ballVelocity.y;

  const wallLimit = 250;
  if (ball.position.z >= wallLimit || ball.position.z <= -wallLimit) {
    ballVelocity.y *= -1;
  }

  checkPaddleCollision(paddle1);
  checkPaddleCollision(paddle2);

  const scoreLimitX = 450;
  if (ball.position.x < -scoreLimitX || ball.position.x > scoreLimitX) {
    if (ball.position.x > scoreLimitX) {
      growlSound.currentTime = 0;
      growlSound.play();
    }
    ball.position.set(0, 0, 0);
    const angle = (Math.random() * 0.6 - 0.3);
    const speed = 5;
    const dirX = Math.random() > 0.5 ? 1 : -1;
    ballVelocity = new THREE.Vector2(speed * dirX, speed * angle);
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});