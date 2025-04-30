export function playPong({ remote = false, room = "myroom" } = {}) {
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
  
	canvas.width = 500;
	canvas.height = 300;
	const ctx = canvas.getContext("2d");
  
	if (remote) {
	  const socket = new WebSocket(`wss://${window.location.host}/ws/game/${room}/`);
	  let playerId = null;
	  let paddle1Y = 0, paddle2Y = 0;
	  let ballX = 0, ballY = 0;
	  let score1 = 0, score2 = 0;
	  let keyState = 0;
  
	  // On successful connection, send player name
	  const username = localStorage.getItem("username") || "Anonymous";
	  socket.onopen = () => {
		socket.send(JSON.stringify({ type: "set_name", name: username }));
	  };
  
	  socket.onmessage = (event) => {
		const data = JSON.parse(event.data);
  
		if (data.type === "init") {
		  playerId = data.playerId;
		  if (label && playerId === 0) label.innerText = `${playerId + 1} (left)`;
		  if (label && playerId === 1) label.innerText = `${playerId + 1} (right)`;
		  if (status) status.innerText = "";
		}
  
		if (data.type === "waiting") {
		  if (status) status.innerText = "Waiting for opponent...";
		}
  
		if (data.type === "state") {
		  paddle1Y = data.paddle1_y;
		  paddle2Y = data.paddle2_y;
		  ballX = data.ball.x;
		  ballY = data.ball.y;
		  score1 = data.score[0];
		  score2 = data.score[1];
		}
  
		if (data.type === "end") {
		  if (status) status.innerText = "Game ended.";
		  socket.close();
		}
  
		if (data.type === "timer") {
		  if (timerDisplay) timerDisplay.innerText = `⏱️ Time left: ${data.value}s`;
		}
  
		if (data.type === "names") {
		  if (nameLabel) nameLabel.innerText = `🟦 ${data.names[0]} vs 🟥 ${data.names[1]}`;
		}
	  };
  
	  const sendDirection = (direction) => {
		if (playerId !== null) {
		  socket.send(JSON.stringify({ type: "move", direction, player: playerId }));
		}
	  };
  
	  document.addEventListener("keydown", (e) => {
		if (playerId === null) return;
  
		if (playerId === 0 && (e.key === "w" || e.key === "s")) {
		  const dir = e.key === "w" ? -1 : 1;
		  if (keyState !== dir) {
			keyState = dir;
			sendDirection(dir);
		  }
		}
  
		if (playerId === 1 && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
		  const dir = e.key === "ArrowUp" ? -1 : 1;
		  if (keyState !== dir) {
			keyState = dir;
			sendDirection(dir);
		  }
		}
	  });
  
	  document.addEventListener("keyup", (e) => {
		if (
		  (playerId === 0 && (e.key === "w" || e.key === "s")) ||
		  (playerId === 1 && (e.key === "ArrowUp" || e.key === "ArrowDown"))
		) {
		  if (keyState !== 0) {
			keyState = 0;
			sendDirection(0);
		  }
		}
	  });
  
	  // End Game button
	  if (endBtn) {
		endBtn.style.display = "inline-block";
		endBtn.onclick = () => {
		  socket.send(JSON.stringify({ type: "end" }));
		  if (status) status.innerText = "Game ended.";
		};
	  }
  
	  // Reset Game button
	  if (resetBtn) {
		resetBtn.style.display = "inline-block";
		resetBtn.onclick = () => {
		  socket.send(JSON.stringify({ type: "reset" }));
		  if (status) status.innerText = "Game restarted.";
		};
	  }
  
	  function drawRemote() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillRect(0, paddle1Y, 8, 60);
		ctx.fillRect(canvas.width - 8, paddle2Y, 8, 60);
		ctx.fillRect(ballX, ballY, 8, 8);
		ctx.font = "30px Arial";
		ctx.fillText(score1, canvas.width / 4, 30);
		ctx.fillText(score2, 3 * canvas.width / 4, 30);
		requestAnimationFrame(drawRemote);
	  }
  
	  drawRemote();
  
	} else {
	  // ----------------------------------------------------------------------------------------------------
	  // LOCAL MODE
	  // -----------------------------------------------------------------------------------------------------
	  
	  // --- Game State & Timers ---

	  let gameInterval = null;
	  let timerInterval = null;
	  let secondsElapsed = 0;
	  let rallyTime = 0;
	  let rallyInterval = null;
	  let gameStarted = false;

	  let pauseOverlay = null;
	  let isPaused = false;
	  let pauseTimestamp = null;
	  let timerStartTimestamp = null;
	  let resumeBtn = null;
	  let isResuming = false;
	  let isResizing = false;

	  // --- Dimensions & Speeds --- 

	  const paddleHeightRatio = 0.25; // 25% of canvas height
	  const maxBounceAngle = Math.PI / 3; // 60°
	  let paddleWidth = 120;
	  let paddleHeight = 10;
	  let ballSize = 60;
	  let ballSpeedX, ballSpeedY;
	  let defaultBallSpeed = 4;
	  const speedIncrement = 0.3;

	  // --- Positions & Scores ---

	  let player1Y, player2Y, ballX, ballY;
	  let player1Speed = 0, player2Speed = 0;
	  let player1Score = 0, player2Score = 0;

	    // --- Assets ---
	  const paddle1Img = new Image();
	  paddle1Img.src = './assets/paddle1.png';
	  const paddle2Img = new Image();
	  paddle2Img.src = './assets/paddle2.png';
	  const ballImg = new Image();
	  ballImg.src = './assets/ball.png';

	  // --- AI Flags ---

	  let useAI = true; // Press "A" to toggle
	  const aiMaxSpeed = 4; // How fast the AI paddle can move
	  const aiReactionDelay = 13; // in frames
	  let aiDelayCounter = 0;
	  let aiTargetY = null;
	  let aiThinkInterval = null;
  
	    // --- Helpers ---
	  function formatTime(s) {
	    const m = String(Math.floor(s/60)).padStart(2,'0');
	    const sec = String(s%60).padStart(2,'0');
	    return `${m}:${sec}`;
	  }
	  function startTimer(reset = true) {
	    if (reset) {
	      secondsElapsed = 0;
	      timerStartTimestamp = Date.now();
	    } else {
	      const pauseDur = Date.now() - pauseTimestamp;
	      timerStartTimestamp += pauseDur;
	    }
	    document.getElementById("timer").textContent = formatTime(secondsElapsed);
	    clearInterval(timerInterval);
	    timerInterval = setInterval(() => {
	      secondsElapsed = Math.floor((Date.now() - timerStartTimestamp)/1000);
	      document.getElementById("timer").textContent = formatTime(secondsElapsed);
	    }, 200);
	  }
	  function startRallyTimer() {
	    rallyTime = 0;
	    clearInterval(rallyInterval);
	    rallyInterval = setInterval(() => {
	      rallyTime++;
	      ballSpeedX += Math.sign(ballSpeedX)*speedIncrement;
	      ballSpeedY += Math.sign(ballSpeedY)*speedIncrement;
	    }, 1000);
	  }
	  function stopTimer() { clearInterval(timerInterval); }

	  function resizeCanvas() {
	    canvas.width  = window.innerWidth  * 0.85;
	    canvas.height = window.innerHeight * 0.85;
	    paddleHeight  = canvas.height * paddleHeightRatio;
	  }

	  // --- Pause / Resume overlay ---
  	function showPauseOverlay(msg) {
  	  if (!pauseOverlay) {
  	    pauseOverlay = document.createElement("div");
  	    Object.assign(pauseOverlay.style, {
  	      position: "absolute", top: "50%", left: "50%",
  	      transform: "translate(-50%, -50%)",
  	      backgroundColor: "rgba(0,0,0,0.7)", color: "#fff",
  	      padding: "30px 50px", borderRadius: "12px",
  	      fontSize: "32px", fontWeight: "bold", textAlign: "center",
  	      zIndex: "10"
  	    });
  	    const text = document.createElement("div"); text.id = "pauseText";
  	    const btn  = document.createElement("button");
  	    btn.textContent = "Resume";
  	    Object.assign(btn.style, { marginTop:"20px", padding:"10px 20px", fontSize:"20px"});
  	    btn.onclick = () => { if (!isResuming) hidePauseOverlay(); resumeGame(); };
  	    pauseOverlay.append(text, btn);
  	    document.body.appendChild(pauseOverlay);
  	  }
  	  document.getElementById("pauseText").innerText = msg;
  	  pauseOverlay.style.display = "block";
  	}
  	function hidePauseOverlay() {
  	  if (pauseOverlay) pauseOverlay.style.display = "none";
  	}
  	function pauseGame(reason = "") {
  	  if (!gameStarted || isPaused || isResuming) return;
  	  cancelAnimationFrame(gameInterval);
  	  stopTimer();
  	  clearInterval(rallyInterval);
  	  pauseTimestamp = Date.now();
  	  isPaused = true;
  	  showPauseOverlay(reason || "Paused");
  	}
  	function resumeGame() {
  	  if (!gameStarted || isResuming) return;
  	  isResuming = true;
  	  let count = 3;
  	  showPauseOverlay(`Resuming in ${count}...`);
  	  const iv = setInterval(() => {
  	    count--;
  	    if (count > 0) {
  	      showPauseOverlay(`Resuming in ${count}...`);
  	    } else {
  	      clearInterval(iv);
  	      hidePauseOverlay();
  	      isPaused = false;
  	      isResuming = false;
  	      startTimer(false);
  	      startRallyTimer();
  	      gameLoop();
  	    }
  	  }, 1000);
  	}

  	// --- Ball reset with random angle ---
  	function resetBallSpeed() {
  	  clearInterval(rallyInterval);
  	  let ang;
  	  do {
  	    ang = Math.random() * 2 * Math.PI;
  	  } while (Math.abs(Math.cos(ang)) < 0.25 || Math.abs(Math.sin(ang)) < 0.15);
  	  ballSpeedX = defaultBallSpeed * Math.cos(ang);
  	  ballSpeedY = defaultBallSpeed * Math.sin(ang);
  	  startRallyTimer();
  	}
  	function resetBall() {
  	  resetBallSpeed();
  	  ballX = canvas.width/2  - ballSize/2;
  	  ballY = canvas.height/2 - ballSize/2;
  	}

  	// --- Movement & AI ---
  	function movePaddles() {
  	  player1Y += player1Speed;
  	  player1Y = Math.max(0, Math.min(canvas.height-paddleHeight, player1Y));

  	  // AI or manual for player 2
  	  if (useAI) {
  	    aiDelayCounter++;
  	    if (aiDelayCounter >= aiReactionDelay) {
  	      aiDelayCounter = 0;
  	      const delta = (ballY + ballSize/2) - (player2Y + paddleHeight/2);
  	      player2Speed = Math.sign(delta)*Math.min(aiMaxSpeed, Math.abs(delta)/4);
  	    }
  	  }
  	  player2Y += player2Speed;
  	  player2Y = Math.max(0, Math.min(canvas.height-paddleHeight, player2Y));

  	  paddle1.y = player1Y;
  	  paddle2.y = player2Y;
  	}

  	// --- Rendering ---
  	function draw() {
  	  ctx.clearRect(0,0,canvas.width,canvas.height);
  	  paddle2.x = canvas.width - paddleWidth;

  	  ctx.drawImage(paddle1Img, paddle1.x, paddle1.y, paddle1.width, paddle1.height);
  	  ctx.drawImage(paddle2Img, paddle2.x, paddle2.y, paddle2.width, paddle2.height);
  	  ctx.drawImage(ballImg,    ballX,       ballY,       ballSize,    ballSize);

  	  ctx.font = "30px Arial";
  	  ctx.fillText(player1Score, canvas.width/4,     30);
  	  ctx.fillText(player2Score, (3*canvas.width)/4, 30);
  	}

  	// --- Ball Physics ---
  	function moveBall() {
  	  ballX += ballSpeedX;
  	  ballY += ballSpeedY;
  	  if (ballY <= 0 || ballY + ballSize >= canvas.height) {
  	    ballSpeedY = -ballSpeedY;
  	  }
  	  // Paddle 1 bounce
  	  if (ballX <= paddle1.x + paddleWidth &&
  	      ballY + ballSize >= paddle1.y &&
  	      ballY <= paddle1.y + paddleHeight) {

  	    const rel = ((ballY + ballSize/2) - (paddle1.y + paddleHeight/2)) / (paddleHeight/2);
  	    const angle = rel * maxBounceAngle;
  	    const speed = Math.hypot(ballSpeedX, ballSpeedY);
  	    ballSpeedX = speed * Math.cos(angle);
  	    ballSpeedY = speed * Math.sin(angle);
  	  }
  	  // Paddle 2 bounce
  	  if (ballX + ballSize >= paddle2.x &&
  	      ballY + ballSize >= paddle2.y &&
  	      ballY <= paddle2.y + paddleHeight) {

  	    const rel = ((ballY + ballSize/2) - (paddle2.y + paddleHeight/2)) / (paddleHeight/2);
  	    const angle = rel * maxBounceAngle;
  	    const speed = Math.hypot(ballSpeedX, ballSpeedY);
  	    ballSpeedX = -speed * Math.cos(angle);
  	    ballSpeedY = speed * Math.sin(angle);
  	  }
  	  // Score
  	  if (ballX <= 0) { player2Score++; resetBall(); }
  	  if (ballX + ballSize >= canvas.width) { player1Score++; resetBall(); }
  	}

  	function gameLoop() {
  	  if (isPaused) return;
  	  movePaddles();
  	  moveBall();
  	  draw();
  	  gameInterval = requestAnimationFrame(gameLoop);
  	}

  	// --- Game Start / Reset ---
  	function startGame() {
  	  resizeCanvas();
  	  paddle1.y = player1Y = (canvas.height - paddleHeight)/2;
  	  paddle2.y = player2Y = (canvas.height - paddleHeight)/2;
  	  ballX = (canvas.width - ballSize)/2;
  	  ballY = (canvas.height - ballSize)/2;
  	  player1Speed = player2Speed = 0;
  	  player1Score = player2Score = 0;
  	  gameStarted = true;
  	  resetBall();
  	  startRallyTimer();
  	  gameLoop();
  	}

  	// --- Input & UI Hooks ---
  	document.addEventListener("keydown", e => {
  	  if (e.key === "a") {
  	    useAI = !useAI;
  	    pauseGame(`AI is now ${useAI?"enabled":"disabled"}`);
  	    return;
  	  }
  	  if (e.key === "w")      player1Speed = -5;
  	  if (e.key === "s")      player1Speed =  5;
  	  if (!useAI && e.key==="ArrowUp")    player2Speed = -5;
  	  if (!useAI && e.key==="ArrowDown")  player2Speed =  5;
  	  if (e.key === "Escape") {
  	    isPaused ? resumeGame() : pauseGame("Paused");
  	  }
  	});

  	document.addEventListener("keyup", e => {
  	  if (e.key==="w"||e.key==="s") player1Speed=0;
  	  if (!useAI && (e.key==="ArrowUp"||e.key==="ArrowDown")) player2Speed=0;
  	});

  	window.addEventListener("resize", () => {
  	  if (!gameStarted) return resizeCanvas();
  	  pauseGame("Paused due to resize");
  	  clearTimeout(resizeTimeout);
  	  var resizeTimeout = setTimeout(() => {
  	    resizeCanvas();
  	    draw();
  	  }, 300);
  	});

  	document.getElementById("startBtn").onclick = () => {
  	  stopTimer();
  	  cancelAnimationFrame(gameInterval);
  	  startGame();
  	  startTimer();
  	};

  	document.getElementById("backToNavBtn").onclick = () => {
  	  // your nav logic here
  	};
}	