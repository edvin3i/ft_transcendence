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
  
      if (data.type === "init") {
        playerId = data.playerId;
        label.innerText = playerId === 0 ? "1 (left)" : "2 (right)";
        status.innerText = "";
      }
  
      if (data.type === "waiting") {
        status.innerText = "Waiting for opponent...";
      }
  
      if (data.type === "state") {
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
  

  else {
    // -------------------------
    // LOCAL MODE - ENRICHED PONG
    // -------------------------
  
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
  }
}