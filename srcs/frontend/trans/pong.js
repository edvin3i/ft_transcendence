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
    // LOCAL MODE
    // -------------------------
    let paddle1Y = 100, paddle2Y = 100;
    let ballX = 250, ballY = 150;
    let ballSpeedX = 2, ballSpeedY = 2;
    let player1Speed = 0, player2Speed = 0;
    let score1 = 0, score2 = 0;

    document.addEventListener("keydown", (event) => {
      if (event.key === "w") player1Speed = -5;
      if (event.key === "s") player1Speed = 5;
      if (event.key === "ArrowUp") player2Speed = -5;
      if (event.key === "ArrowDown") player2Speed = 5;
    });

    document.addEventListener("keyup", (event) => {
      if (event.key === "w" || event.key === "s") player1Speed = 0;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") player2Speed = 0;
    });

    function resetBall() {
      ballX = canvas.width / 2;
      ballY = canvas.height / 2;
      ballSpeedX = -ballSpeedX;
    }

    function gameLoop() {
      paddle1Y += player1Speed;
      paddle2Y += player2Speed;

      paddle1Y = Math.max(0, Math.min(canvas.height - 60, paddle1Y));
      paddle2Y = Math.max(0, Math.min(canvas.height - 60, paddle2Y));

      ballX += ballSpeedX;
      ballY += ballSpeedY;

      if (ballY <= 0 || ballY + 8 >= canvas.height) ballSpeedY = -ballSpeedY;

      if (ballX <= 8 && ballY >= paddle1Y && ballY <= paddle1Y + 60) ballSpeedX = -ballSpeedX;
      if (ballX + 8 >= canvas.width - 8 && ballY >= paddle2Y && ballY <= paddle2Y + 60) ballSpeedX = -ballSpeedX;

      if (ballX <= 0) { score2++; resetBall(); }
      if (ballX + 8 >= canvas.width) { score1++; resetBall(); }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillRect(0, paddle1Y, 8, 60);
      ctx.fillRect(canvas.width - 8, paddle2Y, 8, 60);
      ctx.fillRect(ballX, ballY, 8, 8);
      ctx.font = "30px Arial";
      ctx.fillText(score1, canvas.width / 4, 30);
      ctx.fillText(score2, 3 * canvas.width / 4, 30);

      requestAnimationFrame(gameLoop);
    }

    gameLoop();
  }
}
