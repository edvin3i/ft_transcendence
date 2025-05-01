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

  } else {
    // -------------------------
    // LOCAL MODE - ENRICHED PONG
    // -------------------------
  
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
          if (typeof onGameEnd === "function") onGameEnd("right");
          return;
        }
        resetBall();
      }
  
      if (ballX + ballSize >= canvas.width) {
        player1Score++;
        if (player1Score === 2) {
          gameEnded = true;
          if (typeof onGameEnd === "function") onGameEnd("left");
          return;
        }
        resetBall();
      }
    }
  
    function gameLoop() {
      if (gameEnded) return;
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
      player1Score = 0;
      player2Score = 0;
      gameEnded = false;
      paddleHeight = canvas.height * paddleHeightRatio;
  
      player1Y = canvas.height / 2 - paddleHeight / 2;
      player2Y = canvas.height / 2 - paddleHeight / 2;
  
      paddle1.height = paddleHeight;
      paddle2.height = paddleHeight;
  
      resetBall();
  
      if (aiThinkInterval) clearInterval(aiThinkInterval);
      aiThinkInterval = setInterval(() => {
        if (!useAI || gameEnded) return;
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
  }
}