export function playPong({ remote = false } = {}) {
    const canvas = document.getElementById("pongCanvas");
    if (!canvas) {
      console.error("❌ Canvas introuvable !");
      return;
    }
  
    canvas.width = 500;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
  
    if (remote) {
      // --- Remote (Server-side Pong) ---
      const socket = new WebSocket(`wss://${window.location.host}/ws/game/myroom/`);
  
      let playerId;
      let paddle1Y = 0, paddle2Y = 0;
      let ballX = 0, ballY = 0;
      let score1 = 0, score2 = 0;
  
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "init") {
          playerId = data.playerId;
        } else if (data.type === "state") {
          paddle1Y = data.paddle1_y;
          paddle2Y = data.paddle2_y;
          ballX = data.ball.x;
          ballY = data.ball.y;
          score1 = data.score[0];
          score2 = data.score[1];
        }
      };
  
      document.addEventListener("keydown", (e) => {
        if (e.key === "w" || e.key === "ArrowUp")
          socket.send(JSON.stringify({ type: "move", direction: -1 }));
        if (e.key === "s" || e.key === "ArrowDown")
          socket.send(JSON.stringify({ type: "move", direction: 1 }));
      });
  
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
      // --- Local Pong (offline) ---
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
  
        // Boundaries
        paddle1Y = Math.max(0, Math.min(canvas.height - 60, paddle1Y));
        paddle2Y = Math.max(0, Math.min(canvas.height - 60, paddle2Y));
  
        ballX += ballSpeedX;
        ballY += ballSpeedY;
  
        // Bounce
        if (ballY <= 0 || ballY + 8 >= canvas.height) ballSpeedY = -ballSpeedY;
  
        // Left paddle
        if (ballX <= 8 && ballY >= paddle1Y && ballY <= paddle1Y + 60) {
          ballSpeedX = -ballSpeedX;
        }
  
        // Right paddle
        if (ballX + 8 >= canvas.width - 8 && ballY >= paddle2Y && ballY <= paddle2Y + 60) {
          ballSpeedX = -ballSpeedX;
        }
  
        // Score
        if (ballX <= 0) {
          score2++; resetBall();
        }
        if (ballX + 8 >= canvas.width) {
          score1++; resetBall();
        }
  
        // Draw
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
  