export let stopPong = () => {};
export function playPong({ remote = false, room = "myroom", onGameEnd = null, ai = false } = {}) {

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
    // const socket = new WebSocket(`wss://${window.location.host}/ws/game/${room}/`);
    const token = localStorage.getItem("accessToken");
    const socket = new WebSocket(`wss://${window.location.host}/ws/game/${room}/?token=${token}`);
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
        //if (label) label.innerText = `You are Player ${playerId + 1}`;
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

	function handleRemoteKeyDown(e) {
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
	  }
	  
	  function handleRemoteKeyUp(e) {
		if (
		  (playerId === 0 && (e.key === "w" || e.key === "s")) ||
		  (playerId === 1 && (e.key === "ArrowUp" || e.key === "ArrowDown"))
		) {
		  if (keyState !== 0) {
			keyState = 0;
			sendDirection(0);
		  }
		}
	  }
	  
	  document.addEventListener("keydown", handleRemoteKeyDown);
	  document.addEventListener("keyup", handleRemoteKeyUp);
	  

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
    // if (endBtn) {
    //   endBtn.style.display = "inline-block";
    //   endBtn.onclick = () => {
    //     socket.send(JSON.stringify({ type: "end" }));
    //     if (status) status.innerText = "Game ended.";
    //   };
    // }

    // // Reset Game button
    // if (resetBtn) {
    //   resetBtn.style.display = "inline-block";
    //   resetBtn.onclick = () => {
    //     socket.send(JSON.stringify({ type: "reset" }));
    //     if (status) status.innerText = "Game restarted.";
    //   };
    // }

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

	stopPong = function () {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }

  document.removeEventListener("keydown", handleRemoteKeyDown);
  document.removeEventListener("keyup", handleRemoteKeyUp);

  if (status) status.innerText = "Game disconnected.";
};


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
	if (!gameStarted || isResuming) return; // Prevent overlapping resumes
	isResuming = true;
  
	let countdown = 3;
	showPauseOverlay(`Resuming in ${countdown}...`);
  
	const countdownInterval = setInterval(() => {
	  countdown--;
	  if (countdown > 0) {
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

document.getElementById("pauseText").textContent = message;

// Only show resume button if not in countdown
if (isResuming) {
	resumeBtn.style.display = "none";
} else {
	resumeBtn.style.display = "block";
  }
  
  pauseOverlay.style.display = "block";
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
  if (!remote) {
	resizeCanvas(); // RESIZE WHEN LOADING THE .JS FILE SO IT'S ALWAYS FITTING WINDOW'S SIZE BEFORE GAME START.
  }
  stopPong = function () {
	cancelAnimationFrame(gameInterval);
	clearInterval(timerInterval);
	clearInterval(rallyInterval);
	clearInterval(aiThinkInterval);
  
	gameInterval = null;
	timerInterval = null;
	rallyInterval = null;
	aiThinkInterval = null;
  
	isPaused = false;
	isResuming = false;
	gameStarted = false;
  
	hidePauseOverlay?.();
  };

}
}