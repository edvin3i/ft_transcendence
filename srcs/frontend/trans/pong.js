//remote === 0 -> remote
//remote === 1 -> local tour
//remote === 2 -> local

export let stopPong = () => {};

export function playPong({ remote = 2, room = "myroom", onGameEnd = null, ai = false } = {}) {

	const canvas = document.getElementById("pongCanvas");
	const status = document.getElementById("pongStatus");
	const label = document.getElementById("playerLabel");
	const nameLabel = document.getElementById("playerNames");
	const timerDisplay = document.getElementById("gameTimer");
	const endBtn = document.getElementById("endGameButton");
	const resetBtn = document.getElementById("resetGameButton");
  
	if (!canvas) {
	  console.error("❌ Canvas not found!");
	  return;
	}
	if (remote === 0) {
		canvas.width = 500;
		canvas.height = 300;
		canvas.scrollIntoView({
			behavior: "smooth",
			block: "center",
			inline: "center"
		  });
	}
	else {
		canvas.width = window.innerWidth * 0.95;
		canvas.height = window.innerHeight * 0.95;canvas.scrollIntoView({
			behavior: "smooth",
			block: "center",
			inline: "center"
		  });
	}
	const ctx = canvas.getContext("2d");
	
	if (remote === 0) {
	  const token = localStorage.getItem("accessToken");
	  const socket = new WebSocket(`wss://${window.location.host}/ws/game/${room}/?token=${token}`);
	
	  const paddleWidth = 12;
	  const paddleHeight = 80;
	  const ballSize = 16;
	
	  const paddle1Img = new Image(); paddle1Img.src = './assets/paddle1.png';
	  const paddle2Img = new Image(); paddle2Img.src = './assets/paddle2.png';
	  const ballImg = new Image();    ballImg.src = './assets/2Dball.png';
	
	  let playerId = null;
	  let paddle1Y = 0, paddle2Y = 0;
	  let ballX = 0, ballY = 0;
	  let score1 = 0, score2 = 0;
	  let keyState = 0;
	
	  const username = localStorage.getItem("username") || "Anonymous";
	
	  socket.onopen = () => {
		socket.send(JSON.stringify({ type: "set_name", name: username }));
	  };
	
	  socket.onmessage = (event) => {
		const data = JSON.parse(event.data);
	
		if (data.type !== "state" && data.type !== "timer") {
		  console.log("📩 Message reçu :", data);
		}
  
		if (data.type === "init") {
		  playerId = data.playerId;
		  label.innerText = playerId === 0 ? "1 (left)" : "2 (right)";
		  status.innerText = "";
		}
	
		if (data.type === "waiting") {
		  status.innerText = "Waiting for opponent...";
		}
	
		if (data.type === "state") {
		  status.innerText = "";
		  paddle1Y = data.paddle1_y;
		  paddle2Y = data.paddle2_y;
		  ballX = data.ball.x;
		  ballY = data.ball.y;
		  score1 = data.score[0];
		  score2 = data.score[1];
		}
	
		if (data.type === "started") {
		  status.innerText = "";
		}
	
		if (data.type === "names") {
		  nameLabel.innerText = `🟦 ${data.names[0]} vs 🟥 ${data.names[1]}`;
		}
	
		if (data.type === "timer") {
		  timerDisplay.innerText = `⏱️ Time left: ${data.value}s`;
		}
	
		if (data.type === "end") {
		  status.innerText = "Game ended.";
		  if (data.winner === "left") {
			nameLabel.innerText = `🏆 Player 1 wins!`;
		  } else if (data.winner === "right") {
			nameLabel.innerText = `🏆 Player 2 wins!`;
		  } else {
			nameLabel.innerText = `🤝 It's a draw!`;
		  }
		  socket.close();
		}
	  };
	
	  const sendDirection = (dir) => {
		if (playerId !== null) {
		  socket.send(JSON.stringify({ type: "move", direction: dir, player: playerId }));
		}
	  };
	
	  document.addEventListener("keydown", (e) => {
		if (playerId === null) return;
	
		const isP1 = playerId === 0;
		const isP2 = playerId === 1;
	
		const dirMap = {
		  w: -1,
		  s: 1,
		  ArrowUp: -1,
		  ArrowDown: 1,
		};
	
		const dir = dirMap[e.key];
	
		if ((isP1 && (e.key === "w" || e.key === "s")) ||
			(isP2 && (e.key === "ArrowUp" || e.key === "ArrowDown"))) {
		  if (keyState !== dir) {
			keyState = dir;
			sendDirection(dir);
		  }
		}
	  });
	
	  document.addEventListener("keyup", (e) => {
		const valid = ["w", "s", "ArrowUp", "ArrowDown"];
		if (valid.includes(e.key) && keyState !== 0) {
		  keyState = 0;
		  sendDirection(0);
		}
	  });
	
	  function drawRemote() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	
		// 🎨 Terrain
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	
		ctx.strokeStyle = "white";
		ctx.lineWidth = 4;
		ctx.strokeRect(0, 0, canvas.width, canvas.height);
	
		ctx.beginPath();
		for (let y = 0; y < canvas.height; y += 20) {
		  ctx.moveTo(canvas.width / 2, y);
		  ctx.lineTo(canvas.width / 2, y + 10);
		}
		ctx.stroke();
	
		// 🏓 Entités
		ctx.drawImage(paddle1Img, 0, paddle1Y, paddleWidth, paddleHeight);
		ctx.drawImage(paddle2Img, canvas.width - paddleWidth, paddle2Y, paddleWidth, paddleHeight);
		ctx.drawImage(ballImg, ballX, ballY, ballSize, ballSize);
	
		// 🎯 Score
		ctx.fillStyle = "white";
		ctx.font = "30px Arial";
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.fillText(score1, canvas.width / 4, 10);
		ctx.fillText(score2, 3 * canvas.width / 4, 10);
	
		requestAnimationFrame(drawRemote);
	  }
	
	  drawRemote();
	
	  window.addEventListener("beforeunload", () => {
		if (socket.readyState === WebSocket.OPEN) {
		  socket.send(JSON.stringify({ type: "end" }));
		  socket.close();
		}
	  });
	
	  document.addEventListener("visibilitychange", () => {
		if (document.hidden && socket.readyState === WebSocket.OPEN) {
		  socket.send(JSON.stringify({ type: "end" }));
		  socket.close();
		  ctx.clearRect(0, 0, canvas.width, canvas.height);
		  status.innerText = "Left the match";
		  nameLabel.innerText = "";
		  timerDisplay.innerText = "";
		  label.innerText = "";
		}
	  });
	}
	
  
	else if (remote === 1) {
	  // -------------------------------------------------------------------------------------------------------------------------- //
	  ////////////////////////////////////////// LOCAL TOURNAMENT MODE ///////////////////////////////////////////////////////////////
	  // -------------------------------------------------------------------------------------------------------------------------- //
	
	  let isPaused = false;
	  let pauseOverlay = null;
	  let isResuming = false;
  
	  canvas.width = window.innerWidth * 0.95;
	  canvas.height = window.innerHeight * 0.95;
	
	  const ctx = canvas.getContext("2d");
	
	  // Game constants
	  const paddleWidth = 120;
	  const paddleHeightRatio = 0.25;
	  let paddleHeight = canvas.height * paddleHeightRatio;
	  const ballSize = 60;
	  const defaultBallSpeed = 4;
	  const maxBounceAngle = Math.PI / 3;
	  const speedIncrement = 0.3;
	  const aiMaxSpeed = 4;
	
	  // Game state
	  let useAI = ai;
	  let gameEnded = false;
	  let rallyInterval = null;
	  let aiThinkInterval = null;
	
	  // Entities
	  let paddle1 = { x: 0, y: 0, width: paddleWidth, height: paddleHeight };
	  let paddle2 = { x: 0, y: 0, width: paddleWidth, height: paddleHeight };
	  let player1Y, player2Y;
	  let player1Speed = 0, player2Speed = 0;
	  let player1Score = 0, player2Score = 0;
	  let ballX, ballY, ballSpeedX = 0, ballSpeedY = 0;
	  let aiTargetY = null;
	
	  const paddle1Img = new Image(); paddle1Img.src = './assets/paddle1.png';
	  const paddle2Img = new Image(); paddle2Img.src = './assets/paddle2.png';
	  const ballImg = new Image();    ballImg.src = './assets/2Dball.png';
	
	  // IA Toggle button
	  const toggleBtn = document.getElementById("toggleAI");
	  if (toggleBtn) {
		toggleBtn.addEventListener("click", () => {
		  useAI = !useAI;
		  console.log("AI is now", useAI ? "ENABLED" : "DISABLED");
		});
	  }
	
	  // Restart button
	  const startBtn = document.getElementById("startBtn");
	  if (startBtn) {
		startBtn.addEventListener("click", () => {
		  stopGame();
		  startGame();
		});
	  }
	
	  function pauseGame(reason = "Paused") {
		if (isPaused || isResuming || gameEnded) return;
		isPaused = true;
		clearInterval(aiThinkInterval);
		aiThinkInterval = null;
		clearInterval(rallyInterval);
		rallyInterval = null;
		showPauseOverlay(reason);
	  }
	  
	  function resumeGame() {
		if (!isPaused || isResuming || gameEnded) return;
		isResuming = true;
	  
		let countdown = 3;
		showPauseOverlay(`Resuming in ${countdown}...`, false);
	  
		const countdownInterval = setInterval(() => {
		  countdown--;
		  if (countdown > 0) {
			showPauseOverlay(`Resuming in ${countdown}...`, false);
		  } else {
			clearInterval(countdownInterval);
			hidePauseOverlay();
			isPaused = false;
			isResuming = false;
			startRallyTimer();
			aiThinkInterval = setInterval(() => {
			  if (!useAI || gameEnded || isPaused) return;
			  aiTargetY = predictBallY();
			}, 1000);
			gameLoop();
		  }
		}, 1000);
	  }
	  
	  function showPauseOverlay(message, showResume = true) {
		if (!pauseOverlay) {
		  pauseOverlay = document.createElement("div");
		  pauseOverlay.style.position = "absolute";
		  pauseOverlay.style.top = "50%";
		  pauseOverlay.style.left = "50%";
		  pauseOverlay.style.transform = "translate(-50%, -50%)";
		  pauseOverlay.style.fontSize = "32px";
		  pauseOverlay.style.fontWeight = "bold";
		  pauseOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
		  pauseOverlay.style.color = "white";
		  pauseOverlay.style.padding = "30px 50px";
		  pauseOverlay.style.borderRadius = "12px";
		  pauseOverlay.style.zIndex = "100";
		  pauseOverlay.style.textAlign = "center";
	  
		  const text = document.createElement("div");
		  text.id = "pauseText";
		  pauseOverlay.appendChild(text);
	  
		  const resumeBtn = document.createElement("button");
		  resumeBtn.textContent = "Resume";
		  resumeBtn.style.marginTop = "20px";
		  resumeBtn.style.padding = "10px 20px";
		  resumeBtn.style.fontSize = "20px";
		  resumeBtn.style.cursor = "pointer";
		  resumeBtn.addEventListener("click", resumeGame);
		  resumeBtn.id = "resumeBtn";
	  
		  pauseOverlay.appendChild(resumeBtn);
		  document.body.appendChild(pauseOverlay);
		}
	  
		document.getElementById("pauseText").textContent = message;
		document.getElementById("resumeBtn").style.display = showResume ? "block" : "none";
		pauseOverlay.style.display = "block";
	  }
	  
	  function hidePauseOverlay() {
		if (pauseOverlay) pauseOverlay.style.display = "none";
	  }
	  
  
	  function predictBallY() {
		let simX = ballX, simY = ballY, simVX = ballSpeedX, simVY = ballSpeedY;
		while (true) {
		  simX += simVX;
		  simY += simVY;
		  if (simY <= 0 || simY + ballSize >= canvas.height) simVY *= -1;
		  if (simVX > 0 && simX + ballSize >= paddle2.x) break;
		  if (simX < 0) return canvas.height / 2;
		}
		return simY + ballSize / 2;
	  }
	
	  function startRallyTimer() {
		clearInterval(rallyInterval);
		rallyInterval = setInterval(() => {
		  ballSpeedX += ballSpeedX > 0 ? speedIncrement : -speedIncrement;
		  ballSpeedY += ballSpeedY > 0 ? speedIncrement : -speedIncrement;
		}, 1000);
	  }
	
	  function resetBallSpeed() {
		clearInterval(rallyInterval);
		let angle;
		do {
		  angle = Math.random() * 2 * Math.PI;
		} while (Math.abs(Math.cos(angle)) < 0.25 || Math.abs(Math.sin(angle)) < 0.15);
		ballSpeedX = defaultBallSpeed * Math.cos(angle);
		ballSpeedY = defaultBallSpeed * Math.sin(angle);
		startRallyTimer();
	  }
	
	  function resetBall() {
		resetBallSpeed();
		ballX = canvas.width / 2 - ballSize / 2;
		ballY = canvas.height / 2 - ballSize / 2;
	  }
	
	  function movePaddles() {
		player1Y += player1Speed;
		player1Y = Math.max(0, Math.min(canvas.height - paddleHeight, player1Y));
	
		if (useAI && aiTargetY !== null) {
		  const paddleCenter = player2Y + paddleHeight / 2;
		  const deltaY = aiTargetY - paddleCenter;
		  player2Speed = Math.sign(deltaY) * Math.min(aiMaxSpeed, Math.abs(deltaY));
		}
	
		player2Y += player2Speed;
		player2Y = Math.max(0, Math.min(canvas.height - paddleHeight, player2Y));
	
		paddle1.y = player1Y;
		paddle2.y = player2Y;
	  }
	
	  function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		paddle2.x = canvas.width - paddleWidth;
		ctx.drawImage(paddle1Img, paddle1.x, paddle1.y, paddle1.width, paddle1.height);
		ctx.drawImage(paddle2Img, paddle2.x, paddle2.y, paddle2.width, paddle2.height);
		ctx.drawImage(ballImg, ballX, ballY, ballSize, ballSize);
		ctx.font = "bold 50px Serif";
		ctx.fillStyle = "white";
		ctx.fillText(player1Score, canvas.width / 3.5, 60);
		ctx.fillText(player2Score, 3 * canvas.width / 4.5, 60);
	  }
	
	  function showVictoryMessage(winner) {
		const overlay = document.createElement("div");
		overlay.id = "victoryMessage";
		overlay.style.position = "absolute";
		overlay.style.top = "50%";
		overlay.style.left = "50%";
		overlay.style.transform = "translate(-50%, -50%)";
		overlay.style.background = "rgba(0, 0, 0, 0.85)";
		overlay.style.padding = "30px 50px";
		overlay.style.borderRadius = "15px";
		overlay.style.color = "white";
		overlay.style.fontSize = "28px";
		overlay.style.fontWeight = "bold";
		overlay.style.zIndex = "100";
		overlay.innerText = `🎉 ${winner} wins! 🎉`;
	  
		const frameContainer = document.getElementById("frameContainer") || document.body;
		frameContainer.appendChild(overlay);
	  
		setTimeout(() => {
		  overlay.remove();
		}, 4000);
	  }
	  
  
	  function moveBall() {
		ballX += ballSpeedX;
		ballY += ballSpeedY;
	
		if (ballY <= 0 || ballY + ballSize >= canvas.height) ballSpeedY *= -1;
	
		// Left paddle
		if (ballX <= paddle1.x + paddleWidth &&
			ballY + ballSize >= paddle1.y && ballY <= paddle1.y + paddleHeight) {
		  const intersect = (ballY + ballSize / 2 - (paddle1.y + paddleHeight / 2)) / (paddleHeight / 2);
		  const bounceAngle = intersect * maxBounceAngle;
		  const speed = Math.hypot(ballSpeedX, ballSpeedY);
		  ballSpeedX = speed * Math.cos(bounceAngle);
		  ballSpeedY = speed * Math.sin(bounceAngle);
		}
	
		// Right paddle
		if (ballX + ballSize >= paddle2.x &&
			ballY + ballSize >= paddle2.y && ballY <= paddle2.y + paddleHeight) {
		  const intersect = (ballY + ballSize / 2 - (paddle2.y + paddleHeight / 2)) / (paddleHeight / 2);
		  const bounceAngle = intersect * maxBounceAngle;
		  const speed = Math.hypot(ballSpeedX, ballSpeedY);
		  ballSpeedX = -speed * Math.cos(bounceAngle);
		  ballSpeedY = speed * Math.sin(bounceAngle);
		}
	
		if (ballX <= 0) {
		  player2Score++;
		  if (player2Score === 2) {
			gameEnded = true;
			showVictoryMessage("Player 2");
			if (typeof onGameEnd === "function") onGameEnd("right");
			return;
		  }
		  resetBall();
		}
	
		if (ballX + ballSize >= canvas.width) {
		  player1Score++;
		  if (player1Score === 2) {
			gameEnded = true;
			showVictoryMessage("Player 1");
			if (typeof onGameEnd === "function") onGameEnd("left");
			return;
		  }
		  resetBall();
		}
	  }
	
	  function gameLoop() {
		if (gameEnded || isPaused) return;
		movePaddles();
		moveBall();
		draw();
		requestAnimationFrame(gameLoop);
	  }
	
	  function stopGame() {
		gameEnded = true;
		clearInterval(rallyInterval);
		clearInterval(aiThinkInterval);
		rallyInterval = null;
		aiThinkInterval = null;
	  }
	
	  function startGame() {
		// ✅ Stop all previous intervals
		clearInterval(rallyInterval);
		clearInterval(aiThinkInterval);
		rallyInterval = null;
		aiThinkInterval = null;
	  
		player1Score = 0;
		player2Score = 0;
		gameEnded = false;
	  
		paddleHeight = canvas.height * paddleHeightRatio;
		player1Y = canvas.height / 2 - paddleHeight / 2;
		player2Y = canvas.height / 2 - paddleHeight / 2;
		paddle1.height = paddleHeight;
		paddle2.height = paddleHeight;
	  
		resetBall();
	  
		aiThinkInterval = setInterval(() => {
		  if (!useAI || gameEnded || isPaused) return;
		  aiTargetY = predictBallY();
		}, 1000);
	  
		gameLoop();
	  }
	  
	
	  // Launch the game initially
	  startGame();
	
	  // Keyboard controls
	  document.addEventListener("keydown", (e) => {
		if (e.key === "w") player1Speed = -5;
		if (e.key === "s") player1Speed = 5;
		if (!useAI) {
		  if (e.key === "ArrowUp") player2Speed = -5;
		  if (e.key === "ArrowDown") player2Speed = 5;
		}
	  });
	
	  document.addEventListener("keyup", (e) => {
		if (e.key === "w" || e.key === "s") player1Speed = 0;
		if (!useAI && (e.key === "ArrowUp" || e.key === "ArrowDown")) player2Speed = 0;
	  });
  
	  document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
		  if (isPaused) {
			resumeGame();
		  } else {
			pauseGame("Paused");
		  }
		}
	  });
	} else {
	
		// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- //
		////////////////////////////////////////////////////////////////////// LOCAL MODE - ENRICHED PONG////////////////////////////////////////////////////////////////////////////////////
		// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- //
		
		////////////////////// GAME VARIABLES ////////////////////////	
		// --- PLAYERS --- ///
		let player1Y, player2Y, ballX, ballY;
		let player1Speed, player2Speed;
		let player1Score, player2Score;
		
		// --- PADDLES --- //
		let paddleWidth = 120;
		let paddleHeight = 10;
		const paddleHeightRatio = 0.25; // 20% of canvas height
		const maxBounceAngle = Math.PI / 3; // 60 degrees
		const paddleHitbox = {
			offsetX: paddleWidth * 0.25,  // 25% empty space left/right
			offsetY: paddleHeight * 0.05, // 5% empty space top/bottom
			width: paddleWidth * 0.5,
			height: paddleHeight * 0.9
		};
		  
		// --- BALL --- //
		let ballSize = 60; // <--
		let defaultBallSpeed = 4;
		let ballSpeedX, ballSpeedY;
		let speedIncrement = 0.3;
		
		const ballHitboxShrink = 0.2; // shrink 20% total = 10% per side
		const adjustedBallSize = ballSize * (1 - ballHitboxShrink);
		const adjustedBallX = ballX + ballSize * (ballHitboxShrink / 2);
		const adjustedBallY = ballY + ballSize * (ballHitboxShrink / 2);
	
	
		////////////////////// ASSETS ///////////////////////////////
		const paddle1Img = new Image();
		paddle1Img.src = './assets/paddle1.png';
		
		const paddle2Img = new Image();
		paddle2Img.src = './assets/paddle2.png';
		
		const ballImg = new Image();
		ballImg.src = './assets/2Dball.png';
		
		/////////////////////// PAUSE VARIABLES /////////////////////
		// -- TIMER --- //
		let gameInterval = null; 
		let timerInterval = null; 
		let secondsElapsed = 0;
		let rallyTime = 0;
		let rallyInterval = null;
			
		let gameStarted = false;
		let gameStopped = false
		let pauseOverlay = null;
		let isPaused = false;
		let pauseTimestamp = null;
		let timerStartTimestamp = null;
		let resumeBtn = null;
		let isResuming = false;
		let isResizing = false; 
		let resumeCountdownInterval = null;
	
		///////////////////////// AI VARIABLES ////////////////////////////////////
		let useAI = true; // ← Set to false to play 2-player manually
		const aiMaxSpeed = 4; // how fast the AI paddle can move
		const aiReactionDelay = 13; // in frames
		let aiDelayCounter = 0;
		let aiTargetY = null;
		let aiThinkInterval = null;
	
		///////////////////////////////////////////////////////////////////////////
	
		const paddle1 = { x: 100, y: 0, width: paddleWidth, height: paddleHeight };
		const paddle2 = { x: 0, y: 0, width: paddleWidth, height: paddleHeight };
	
		function formatTime(seconds) {
			const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
			const secs = String(seconds % 60).padStart(2, '0');
			return `${mins}:${secs}`;
		}
	
		function startTimer(reset = true) {
			if (reset) {
				secondsElapsed = 0;
				timerStartTimestamp = Date.now();
			} else {
				const pauseDuration = Date.now() - pauseTimestamp;
				timerStartTimestamp += pauseDuration;
			}
		
		document.getElementById("timer").textContent = formatTime(secondsElapsed);
		  timer.style.color = "White";
		  timer.style.fontSize = "large bold";
		  timer.style.fontSize = "25px";
		  clearInterval(timerInterval);
		  const tick = () => {
			  const now = Date.now();
			  secondsElapsed = Math.floor((now - timerStartTimestamp) / 1000);
			  document.getElementById("timer").textContent = formatTime(secondsElapsed);
			};
			timerInterval = setInterval(tick, 200); // Tick every 200ms for better responsiveness
		}
		
		function startRallyTimer() {
			rallyTime = 0;
			clearInterval(rallyInterval); // just in case
			rallyInterval = setInterval(() => {
				rallyTime += 1;
				
				if (ballSpeedX > 0) ballSpeedX += speedIncrement;
				else ballSpeedX -= speedIncrement;
				
				if (ballSpeedY > 0) ballSpeedY += speedIncrement;
				else ballSpeedY -= speedIncrement;
			}, 1000);
		}
		
		
		
		function stopTimer() {
			clearInterval(timerInterval);
			clearInterval(aiThinkInterval);
			aiThinkInterval = null;
			
		}
		
		function resizeCanvas() {
			canvas.width = window.innerWidth * 0.95;
			canvas.height = window.innerHeight * 0.95;
			canvas.style.display = 'block';
			canvas.style.margin = 'auto';
			canvas.style.position = 'relative';
			paddleHeight = canvas.height * paddleHeightRatio;
			paddle1.height = paddleHeight;
			paddle2.height = paddleHeight;
		}
		
		////////////////////////////// PAUSE FUNCTIONS //////////////////////////////////////
		
	function pauseGame(reason = '') {
		if (!gameStarted || isPaused || isResuming) return;
		const startBtn = document.getElementById("startBtn");
		if (startBtn) startBtn.disabled = true;
		cancelAnimationFrame(gameInterval);
		stopTimer();
		clearInterval(rallyInterval); //stop rally speed increase
		rallyInterval = null;
		pauseTimestamp = Date.now();
		isPaused = true;
		showPauseOverlay(reason);
		clearInterval(aiThinkInterval);
		aiThinkInterval = null;
		if (toggleBtn) toggleBtn.disabled = true;
	}
	
	
	function resumeGame() {
		if (!gameStarted || gameStopped || isResuming) return; // Prevent overlapping resumes
		isResuming = true;
	  
		let countdown = 3;
		showPauseOverlay(`Resuming in ${countdown}...`);
	  
		const countdownInterval = setInterval(() => {
		  countdown--;
		  if (countdown > 0 && !gameStopped) {
			showPauseOverlay(`Resuming in ${countdown}...`);
		  } else {
			clearInterval(countdownInterval);
			hidePauseOverlay();
			if (toggleBtn) toggleBtn.disabled = false;
			if (startBtn) startBtn.disabled = false;
			isPaused = false;
			isResuming = false; // Reset flag
			startTimer(false); // Resume timer without resetting
			startRallyTimer();
	  
			if (useAI && !aiThinkInterval) {
			  aiThinkInterval = setInterval(() => {
				if (!isPaused && gameStarted) {
				  aiTargetY = predictBallY();
				}
			  }, 1000);
			}
	  
			gameLoop();
		  }
		}, 1000);
	  }
	  
	
	
	
	  function showPauseOverlay(message) {
		if (!pauseOverlay) {
			pauseOverlay = document.createElement("div");
			pauseOverlay.style.position = "absolute";
			pauseOverlay.style.top = "50%";
			pauseOverlay.style.left = "50%";
			pauseOverlay.style.transform = "translate(-50%, -50%)";
			pauseOverlay.style.fontSize = "32px";
			pauseOverlay.style.fontWeight = "bold";
			pauseOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
			pauseOverlay.style.color = "white";
			pauseOverlay.style.padding = "30px 50px";
			pauseOverlay.style.borderRadius = "12px";
			pauseOverlay.style.zIndex = "10";
			pauseOverlay.style.textAlign = "center";
	
			pauseOverlay.style.display = "flex";
			pauseOverlay.style.flexDirection = "column";
			pauseOverlay.style.alignItems = "center";
			pauseOverlay.style.justifyContent = "center";
			
			const text = document.createElement("div");
			text.id = "pauseText";
	
			resumeBtn = document.createElement("button");
			resumeBtn.textContent = "Resume";
			resumeBtn.style.marginTop = "20px";
			resumeBtn.style.padding = "10px 20px";
			resumeBtn.style.fontSize = "20px";
			resumeBtn.style.cursor = "pointer";
			resumeBtn.addEventListener("click", () => {
				if (isResuming) return;
				hidePauseOverlay();
				resumeGame();
			});
			
			pauseOverlay.appendChild(text);
			pauseOverlay.appendChild(resumeBtn);
			document.body.appendChild(pauseOverlay);
		}
	
		// Always update text on every call
		const textElement = pauseOverlay.querySelector("#pauseText");
		if (textElement) {
			textElement.textContent = message;
		}
	
		pauseOverlay.style.display = "flex";
	}
	
	function hidePauseOverlay() {
		if (pauseOverlay) {
			pauseOverlay.style.display = "none";
		}
	}
	
	///////////////////////////////////////////////////
	
	function predictBallY() {
		// Clone ball state
		let simX = ballX;
		let simY = ballY;
		let simVX = ballSpeedX;
		let simVY = ballSpeedY;
		
		// Simulate until it reaches paddle2.x
		while (true) {
			simX += simVX;
			simY += simVY;
			// Bounce off top/bottom
			if (simY <= 0 || simY + ballSize >= canvas.height) {
				simVY *= -1;
			}
			// If the ball reaches or passes AI paddle
			if (simVX > 0 && simX + ballSize >= paddle2.x) {
				break;
			}
			// If the ball goes out on the left side (player scored), just return center
			if (simX < 0) return canvas.height / 2;
		}
		// Return predicted center Y
		return simY + ballSize / 2;
	}
	
	
	
	function resetBallSpeed() {
		clearInterval(rallyInterval);
		
		let angleRad;
		
		// Keep trying until we get an angle not too close to 0, 90, 180, 270°
		while (true) {
			angleRad = Math.random() * 2 * Math.PI; // 0 to 2π radians
			const x = Math.abs(Math.cos(angleRad));
			const y = Math.abs(Math.sin(angleRad));
			
			// Avoid angles that are *too* close to pure vertical or horizontal
			if (x > 0.25 && y > 0.15) break;
		}
		
		ballSpeedX = defaultBallSpeed * Math.cos(angleRad);
		ballSpeedY = defaultBallSpeed * Math.sin(angleRad);
		
		startRallyTimer();
	}
	
	
	function resetBall() {
		resetBallSpeed();
		ballX = canvas.width / 2 - ballSize / 2;
		ballY = canvas.height / 2 - ballSize / 2;
	}
	
	function movePaddles() {
		player1Y += player1Speed;
		
		// Clamp player1 paddle
		if (player1Y < 0) player1Y = 0;
		if (player1Y + paddleHeight > canvas.height) player1Y = canvas.height - paddleHeight;
		
		// AI logic or player 2
		if (useAI && aiTargetY !== null) {
			const paddleCenter = player2Y + paddleHeight / 2;
			const deltaY = aiTargetY - paddleCenter;
			player2Speed = Math.sign(deltaY) * Math.min(aiMaxSpeed, Math.abs(deltaY));
		}
		
		player2Y += player2Speed;
		
		// Clamp player2 paddle
		if (player2Y < 0) 
			player2Y = 0;
		if (player2Y + paddleHeight > canvas.height) player2Y = canvas.height - paddleHeight;
		// Assign Y values to paddles
		paddle1.y = player1Y;
		paddle2.y = player2Y;
	}
	
	
	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		paddle2.x = canvas.width - paddleWidth;
		
		ctx.drawImage(paddle1Img, paddle1.x, paddle1.y, paddle1.width, paddle1.height);
		ctx.drawImage(paddle2Img, paddle2.x, paddle2.y, paddle2.width, paddle2.height);
		
		ctx.drawImage(ballImg, ballX, ballY, ballSize, ballSize);
		
		ctx.font = "bold 50px Serif";
		ctx.fillStyle = "white";
		ctx.fillText(player1Score, canvas.width / 3.5, 60);
		ctx.fillText(player2Score, 3 * canvas.width / 4.5, 60);
	}
	
	function moveBall() {
		// Move the ball
		ballX += ballSpeedX;
		ballY += ballSpeedY;
	  
		// Shrink ball hitbox by 20%
		const ballHitboxShrink = 0.2;
		const adjustedBallSize = ballSize * (1 - ballHitboxShrink);
		const adjustedBallX = ballX + ballSize * (ballHitboxShrink / 2);
		const adjustedBallY = ballY + ballSize * (ballHitboxShrink / 2);
	  
	// Top wall collision
	if (ballY <= 0) {
	  ballY = 0; // snap outside
	  ballSpeedY = Math.abs(ballSpeedY); // force downward
	}
	
	// Bottom wall collision
	if (ballY + ballSize >= canvas.height) {
	  ballY = canvas.height - ballSize; // snap outside
	  ballSpeedY = -Math.abs(ballSpeedY); // force upward
	}
	
	  
		// Paddle hitbox parameters
		const paddleHitbox = {
		  offsetX: paddleWidth * 0.25,
		  offsetY: paddleHeight * 0.05,
		  width: paddleWidth * 0.5,
		  height: paddleHeight * 0.9,
		};
	  
		// Left paddle (Player 1) collision
		const p1x = paddle1.x + paddleHitbox.offsetX;
		const p1y = paddle1.y + paddleHitbox.offsetY;
		const p1w = paddleHitbox.width;
		const p1h = paddleHitbox.height;
	  
		if (
		  adjustedBallX <= p1x + p1w &&
		  adjustedBallX + adjustedBallSize >= p1x &&
		  adjustedBallY + adjustedBallSize >= p1y &&
		  adjustedBallY <= p1y + p1h
		) {
		  const paddleCenter = paddle1.y + paddleHeight / 2;
		  const ballCenter = ballY + ballSize / 2;
		  const relativeIntersectY = ballCenter - paddleCenter;
		  const normalized = relativeIntersectY / (paddleHeight / 2);
		  const bounceAngle = normalized * maxBounceAngle;
	  
		  const speed = Math.sqrt(ballSpeedX ** 2 + ballSpeedY ** 2);
		  ballSpeedX = speed * Math.cos(bounceAngle);
		  ballSpeedY = speed * Math.sin(bounceAngle);
		}
	  
		// Right paddle (Player 2 or AI) collision
		const p2x = paddle2.x + paddleHitbox.offsetX;
		const p2y = paddle2.y + paddleHitbox.offsetY;
		const p2w = paddleHitbox.width;
		const p2h = paddleHitbox.height;
	  
		if (
		  adjustedBallX + adjustedBallSize >= p2x &&
		  adjustedBallX <= p2x + p2w &&
		  adjustedBallY + adjustedBallSize >= p2y &&
		  adjustedBallY <= p2y + p2h
		) {
		  const paddleCenter = paddle2.y + paddleHeight / 2;
		  const ballCenter = ballY + ballSize / 2;
		  const relativeIntersectY = ballCenter - paddleCenter;
		  const normalized = relativeIntersectY / (paddleHeight / 2);
		  const bounceAngle = normalized * maxBounceAngle;
	  
		  const speed = Math.sqrt(ballSpeedX ** 2 + ballSpeedY ** 2);
		  ballSpeedX = -speed * Math.cos(bounceAngle);
		  ballSpeedY = speed * Math.sin(bounceAngle);
		}
	  
		// Scoring
		if (ballX <= 0) {
		  player2Score++;
		  resetBall();
		}
	  
		if (ballX + ballSize >= canvas.width) {
		  player1Score++;
		  resetBall();
		}
	  }
	  
	
	function gameLoop() {
		if (isPaused) return;
		movePaddles();
		moveBall();
		draw();
		gameInterval = requestAnimationFrame(gameLoop);
	}
	
	function startGame() {
		resizeCanvas();
		
		player1Y = canvas.height / 2 - paddleHeight / 2;
		player2Y = canvas.height / 2 - paddleHeight / 2;
		ballX = canvas.width / 2 - ballSize / 2;
		ballY = canvas.height / 2 - ballSize / 2;
		player1Speed = 0;
		player2Speed = 0;
		player1Score = 0;
		player2Score = 0;
		gameStarted = true;
		aiThinkInterval = setInterval(() => 
	  {
		  if (!useAI || isPaused || !gameStarted)
			return;
		aiTargetY = predictBallY(); // updates prediction
	}, 
	1000); // every 1000ms = 1s
	resetBall()
	startRallyTimer();
	gameLoop();
	}
	/////////////////////////// INPUT KEYS LISTENERS ////////////////////////////////////////////
	document.addEventListener("keydown", function (event) {
		// Toggle AI and pause
		if (event.key === "a") {
			if (isPaused || isResuming || !gameStarted) return;
		  
			useAI = !useAI;
			console.log("AI Player is now", useAI ? "ENABLED" : "DISABLED");
		  
			if (!useAI && aiThinkInterval) {
			  clearInterval(aiThinkInterval);
			  aiThinkInterval = null;
			}
		  
			if (gameStarted && !isPaused && !isResuming) {
			  pauseGame(`AI is now ${useAI ? 'enabled' : 'disabled'}`);
			}
		  
			return;
		  }
		  
		  
	// Player 1 movement
	if (event.key === "w") player1Speed = -5;
	if (event.key === "s") player1Speed = 5;
	// Player 2 (only if AI is disabled)
	if (!useAI) {
		if (event.key === "ArrowUp") player2Speed = -5;
		if (event.key === "ArrowDown") player2Speed = 5;
	}
	});
	
	document.addEventListener("keyup", function (event) {
		// Player 1
		if (event.key === "w" || event.key === "s") player1Speed = 0;
		// Player 2 (only if AI is disabled)
		if (!useAI && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
			player2Speed = 0;
		}
	});
	
	// IA Toggle button
	
	const toggleBtn = document.getElementById("toggleAI");
	if (toggleBtn) {
		toggleBtn.addEventListener("click", () => {
			if (isPaused || isResuming || !gameStarted) return;
		  
			useAI = !useAI;
			console.log("AI is now", useAI ? "ENABLED" : "DISABLED");
		  
			if (!useAI && aiThinkInterval) {
			  clearInterval(aiThinkInterval);
			  aiThinkInterval = null;
			}
		  
			if (gameStarted && !isPaused && !isResuming) {
			  pauseGame(`AI is now ${useAI ? 'enabled' : 'disabled'}`);
			}
		  });
		  
		  
		  
	}
	/////////////////////////PAUSE KEY AND RESIZE ////////////////////////////////////////
	
	document.addEventListener("keydown", function (event) {
		if (event.code === "Space") {
			event.preventDefault(); // stops scrolling or button focus
			return; // ignore spacebar entirely during the game
		  }	  
	  if (event.key === "Escape") {
		if (!gameStarted || isResuming) return;
		if (isPaused) {
		  hidePauseOverlay();
		  resumeGame();
		} else {
		  pauseGame("Paused");
		}
	  }
	});
	
	let resizeTimeout;
	
	window.addEventListener("resize", () => {
	 if (!gameStarted) {
		resizeCanvas(); // still allow resizing the canvas for layout
		return;
	  }
	pauseGame("Paused due to resize");
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(() => {
	resizeCanvas();
	draw();
	  }, 300);
	});
	
	///////////////////////////////////////////////////////////////////////////////
	
	document.getElementById("startBtn").addEventListener("click", () => {
		stopTimer();
		cancelAnimationFrame(gameInterval);
		clearInterval(rallyInterval);
		rallyInterval = null;
		clearInterval(aiThinkInterval);
		aiThinkInterval = null;
	  
		if (resumeCountdownInterval) {
		  clearInterval(resumeCountdownInterval);
		  resumeCountdownInterval = null;
		}
	  
		isPaused = false;
		isResuming = false;
		hidePauseOverlay();
	  
		if (toggleBtn) toggleBtn.disabled = false;
		const startBtn = document.getElementById("startBtn");
		if (startBtn) startBtn.disabled = false;
	  
		startGame();
		startTimer();
	  });
	  
	  stopPong = function () {
		  cancelAnimationFrame(gameInterval);
		  stopTimer();
		  clearInterval(timerInterval);
		  clearInterval(rallyInterval);
		  clearInterval(aiThinkInterval);
		  
		  gameInterval = null;
		  timerInterval = null;
		  rallyInterval = null;
		  aiThinkInterval = null;
		  gameStopped = true;
		  isPaused = false;
		  isResuming = false;
		  gameStarted = false;
		  let countdown = 3
		  
		  hidePauseOverlay?.();
		};
		
	}
}