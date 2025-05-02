import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

export function playPong3D() {
	// Clear existing UI
	document.getElementById('app').innerHTML = '';

	// === Setup Scene ===
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
	camera.position.set(-800, 350, 0);
	camera.lookAt(0, 0, 0);

	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById('app').appendChild(renderer.domElement);

	// === Sound Effect ===
	const growlSound = new Audio('./assets/growl.mp3');

	// === Texture Loader ===
	const loader = new THREE.TextureLoader();
	const tableTexture = loader.load('./assets/3Dtable.png');
	const wallTexture = loader.load('./assets/wall.png');
	const ballTexture = loader.load('./assets/3Dball.png');
	const paddleTexture = loader.load('./assets/paddle.png');
	const backgroundTexture = loader.load('./assets/background.png');

	// === Table ===
	const table = new THREE.Mesh(
		new THREE.PlaneGeometry(3460, 1460),
		new THREE.MeshStandardMaterial({ map: tableTexture })
	);
	table.rotation.x = -Math.PI / 2;
	table.position.y = -21;
	scene.add(table);

	// === Walls ===
	wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
	wallTexture.repeat.set(10, 10);
	const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture });
	const wallGeom = new THREE.BoxGeometry(9000, 4000, 0);

	const wallTop = new THREE.Mesh(wallGeom, wallMat);
	wallTop.position.set(0, 0, 250);
	scene.add(wallTop);

	const wallBottom = new THREE.Mesh(wallGeom, wallMat);
	wallBottom.position.set(0, 0, -250);
	scene.add(wallBottom);

	// === Background Wall ===
	const backWall = new THREE.Mesh(
		new THREE.PlaneGeometry(500, 900),
		new THREE.MeshStandardMaterial({ map: backgroundTexture, side: THREE.DoubleSide })
	);
	backWall.position.set(750, 350, 0);
	backWall.rotation.y = -Math.PI / 2;
	scene.add(backWall);

	// === Lights ===
	scene.add(new THREE.AmbientLight(0xffffff, 0.4));
	const light = new THREE.PointLight(0xffffff, 1);
	light.position.set(0, 300, 0);
	scene.add(light);

	// === Paddles ===
	const paddleGeom = new THREE.CapsuleGeometry(10, 100, 4, 8);
	const paddleMat = new THREE.MeshStandardMaterial({ map: paddleTexture });

	const paddle1 = new THREE.Mesh(paddleGeom, paddleMat);
	paddle1.position.set(-400, 0, 0);
	paddle1.rotation.x = Math.PI / 2;
	scene.add(paddle1);

	const paddle2 = new THREE.Mesh(paddleGeom, paddleMat);
	paddle2.position.set(400, 0, 0);
	paddle2.rotation.x = Math.PI / 2;
	scene.add(paddle2);

	// === Ball ===
	const ball = new THREE.Mesh(
		new THREE.SphereGeometry(15, 32, 32),
		new THREE.MeshStandardMaterial({ map: ballTexture })
	);
	ball.position.set(0, 0, 0);
	scene.add(ball);

	// === Game Logic ===
	let ballVelocity = new THREE.Vector2(4, 4);
	const paddleSpeed = 8;
	let keys = {};

	document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
	document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

	function movePaddles() {
		if (keys['a']) paddle1.position.z -= paddleSpeed;
		if (keys['d']) paddle1.position.z += paddleSpeed;
		paddle1.position.z = Math.max(-190, Math.min(190, paddle1.position.z));
	}

	let aiTargetZ = 0;
	let nextAIUpdate = Date.now();
	const aiSmooth = 0.1;

	function moveAI() {
		const now = Date.now();
		if (now >= nextAIUpdate) {
			nextAIUpdate = now + 1000;
			if (ballVelocity.x > 0) {
				let t = (paddle2.position.x - ball.position.x) / ballVelocity.x;
				let predictedZ = ball.position.z + ballVelocity.y * t;
				while (predictedZ > 250 || predictedZ < -250) {
					if (predictedZ > 250) predictedZ = 250 - (predictedZ - 250);
					if (predictedZ < -250) predictedZ = -250 - (predictedZ + 250);
				}
				aiTargetZ = predictedZ;
			} else {
				aiTargetZ = 0;
			}
		}
		let dz = aiTargetZ - paddle2.position.z;
		paddle2.position.z += dz * aiSmooth;
		paddle2.position.z = Math.max(-190, Math.min(190, paddle2.position.z));
	}

	function checkCollision(paddle) {
		const hitZone = 60;
		const close = paddle === paddle1
			? ball.position.x <= paddle.position.x + 20
			: ball.position.x >= paddle.position.x - 20;

		const aligned = Math.abs(ball.position.z - paddle.position.z) <= hitZone;

		if (close && aligned) {
			const delta = (ball.position.z - paddle.position.z) / hitZone;
			const angle = delta * 0.4;
			const speed = ballVelocity.length();
			const dir = paddle === paddle1 ? 1 : -1;
			ballVelocity = new THREE.Vector2(speed * dir, speed * angle);
		}
	}

	function resetBall() {
		ball.position.set(0, 0, 0);
		const angle = (Math.random() * 0.6) - 0.3;
		const speed = 5;
		const dir = Math.random() > 0.5 ? 1 : -1;
		ballVelocity = new THREE.Vector2(speed * dir, speed * angle);
	}

	function animate() {
		backWall.rotation.y = -Math.PI / 2 + Math.sin(Date.now() * 0.001) * 0.05;

		movePaddles();
		moveAI();

		ball.position.x += ballVelocity.x;
		ball.position.z += ballVelocity.y;

		if (Math.abs(ball.position.z) >= 250) {
			ballVelocity.y *= -1;
		}

		checkCollision(paddle1);
		checkCollision(paddle2);

		if (ball.position.x < -450 || ball.position.x > 450) {
			if (ball.position.x > 450) {
				growlSound.currentTime = 0;
				growlSound.play();
			}
			resetBall();
		}

		renderer.render(scene, camera);
		requestAnimationFrame(animate);
	}

	animate();

	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	});
}
