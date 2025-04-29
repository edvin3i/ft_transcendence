// moshpitRemote.js

class MoshpitRemote {
	constructor(matchId, playerId) {
		this.matchId = matchId;
		this.playerId = playerId;
		this.socket = null;
		this.gameState = null;
	}
  
	connect() {
		const token = localStorage.getItem("access");
		const socket = new WebSocket(`ws://${window.location.host}/ws/moshpit/?token=${token}`);

		// const token = localStorage.getItem('accessToken');
		// this.socket = new WebSocket(`ws://${window.location.host}/ws/match/${this.matchId}/?token=${token}`);
		
		// this.socket = new WebSocket(`ws://${window.location.host}/ws/match/${this.matchId}/`);
  
		this.socket.onopen = () => {
			console.log("✅ Connexion WebSocket établie pour le match", this.matchId);
			this.sendGameStateRequest();
		};
  
		this.socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			console.log("📨 Message reçu : ", data);
			if (data.type === 'game_update') {
				this.updateGameState(data.game_state);
			}
		};
  
		this.socket.onclose = (event) => {
			console.log("⚠️ Connexion WebSocket fermée.", event);
		};
  
		this.socket.onerror = (error) => {
			console.error("❌ Erreur WebSocket : ", error);
		};
	}
  
	sendAction(action, params = {}) {
		const message = {
			action: action,
			player_id: this.playerId,
			...params,
		};
		this.socket.send(JSON.stringify(message));
	}
  
	sendGameStateRequest() {
		this.sendAction('request_game_state');
	}
  
	updateGameState(state) {
		this.gameState = state;
		this.updateDisplay();
	}
  
	updateDisplay() {
		if (this.gameState) {
			drawGameCircle(this.gameState);
		}
	}
  
	movePlayer(direction) {
		this.sendAction('move', { direction });
	}
  
	endGame() {
		this.sendAction('end_game');
	}
}

// --- DESSIN ---

const canvas = document.getElementById('moshpitRemoteCanvas');
const context = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 200; // à adapter selon ton besoin
const paddleSize = Math.PI / 6; // exemple : 30° d'arc

function drawBall(ball) {
	context.beginPath();
	context.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
	context.fillStyle = "#ffffff";
	context.fill();
	context.closePath();
}

function drawCurvedPaddle(player) {
	const startAngle = player.angle - paddleSize / 2;
	const endAngle = player.angle + paddleSize / 2;

	context.beginPath();
	context.arc(centerX, centerY, radius, startAngle, endAngle);
	context.lineWidth = 10;
	context.strokeStyle = player.color;
	context.stroke();
	context.closePath();
}

function drawAllPaddles(players) {
	players.forEach(player => drawCurvedPaddle(player));
}

function drawPlayerSector(startAngle, endAngle, color) {
	context.beginPath();
	context.moveTo(centerX, centerY);
	context.arc(centerX, centerY, radius, startAngle, endAngle);
	context.closePath();
	context.fillStyle = color;
	context.fill();
}

function drawAllPlayerSectors(players) {
	players.forEach(player => {
		drawPlayerSector(player.min_angle, player.max_angle, player.color);
	});
}

function drawGameCircle(gameState) {
	context.clearRect(0, 0, canvas.width, canvas.height);

	drawAllPlayerSectors(gameState.players);
	drawBall(gameState.ball);
	drawAllPaddles(gameState.players);

	context.beginPath();
	context.arc(centerX, centerY, radius, 0, Math.PI * 2);
	context.strokeStyle = "#fff";
	context.lineWidth = 4;
	context.stroke();
}

// --- Exemple d'utilisation ---

const matchId = 1;
const playerId = 123;

const moshpitRemote = new MoshpitRemote(matchId, playerId);
moshpitRemote.connect();

// document.getElementById("endGameButton").addEventListener("click", () => {
// 	moshpitRemote.endGame();
// });

// document.addEventListener("keydown", event =>
// {
// 	if (event.key === "ArrowRight")
// 		moshpitRemote.movePlayer('right');
// 	if (event.key === "ArrowLeft")
// 		moshpitRemote.movePlayer('left');
// })

window.addEventListener("keydown", (e) => {
	if (e.key === "ArrowLeft") {
		sendAction("move", { direction: "left" });
	} else if (e.key === "ArrowRight") {
		sendAction("move", { direction: "right" });
	}
});


/*const canvas = document.getElementById("moshpitRemoteCanvas");
const contexte = canvas.getContext("2d");

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = canvas.width / 2 - 10;

const paddleSize = Math.PI / 12;

let isGameOver = false;

const ball =
{
	y: centerY,
	x: centerX,
	angle: Math.random() * 2 * Math.PI,
	speed: 2.5,
	radius: 8,
}

const players = [
{
	angle: 0,
	color: "#ff4d4d",
	keyLeft: "ArrowLeft",
	keyRight: "ArrowRight",
	direction: 0,
	minAngle: -Math.PI / 4,
	maxAngle: Math.PI / 4,
	id: "red"
},
{
	angle: Math.PI / 2,
	color: "#4da6ff",
	keyLeft: "ArrowDown",
	keyRight: "ArrowUp",
	direction: 0,
	minAngle: Math.PI / 4,
	maxAngle: 3 * Math.PI / 4,
	id: "blue"
},
{
	angle: Math.PI,
	color: "#4dff4d",
	keyLeft: "a",
	keyRight: "e",
	direction: 0,
	minAngle: 3 * Math.PI / 4,
	maxAngle: 5 * Math.PI / 4,
	id: "green"
},
{
	angle: 3 * Math.PI / 2,
	color: "#ffff4d",
	keyLeft: "q",
	keyRight: "d",
	direction: 0,
	minAngle: 5 * Math.PI / 4,
	maxAngle: 7 * Math.PI / 4,
	id: "yellow"
},
];

const eliminatedPlayers = [];//for a proper reset ?


//////////////////////////////remote-bloc////////////////////////////
// WebSocket connection function

let socket;

async function connectToWebSocket() {
	const token = localStorage.getItem('accessToken'); // Get JWT from local storage
	if (!token) {
	  console.log("No JWT token found");
	  return;
	}
  
	// Create WebSocket connection with the token in the query string
	socket = new WebSocket(`ws://localhost:8000/game?token=${token}`);
  
	socket.onopen = () => {
		players.forEach(player => {
		  socket.send(JSON.stringify({ type: 'playerInfo', player }));
		});
	  };

	socket.onmessage = (event) => {
		const data = JSON.parse(event.data);
    	if (data.type === 'gameState')
    		updateGameState(data);
	}

	socket.onerror = (error) => {
	  console.error('WebSocket Error:', error);
	};
  
	socket.onclose = () => {
	  console.log('WebSocket connection closed');
	};
}

function sendPlayerInfo(socket) {
	players.forEach(player => {
	  socket.send(JSON.stringify({
		type: 'playerInfo',
		player: {
		  id: player.id,
		  angle: player.angle,
		  direction: player.direction
		}
	  }));
	});
  }

  function updateGameState(data) {
	// Mettez à jour la position des paddles et de la balle avec les données reçues
	data.players.forEach((playerData, index) => {
	  const player = players[index];
	  player.angle = playerData.angle;
	  player.direction = playerData.direction;
	});
  
	// Mettez à jour la balle
	ball.x = data.ball.x;
	ball.y = data.ball.y;
	ball.angle = data.ball.angle;
	ball.speed = data.ball.speed;
  
	// Redessine le canvas avec les nouvelles positions
	drawGameCircle();
  }
  

/////////////////////////////the rest//////////////////////////////////
document.addEventListener("keydown", event =>
{
	players.forEach(player => 
	{
		if (event.key === player.keyLeft)
			player.direction = -1;
		else if (event.key === player.keyRight)
			player.direction = 1;
	})
})

document.addEventListener("keyup", event =>
{
	players.forEach(player => 
	{
		if (event.key === player.keyLeft || event.key === player.keyRight)
			player.direction = 0;
	})
})

function winScreen(winner)
{
	// Stop le jeu, masque le canvas ou autre
	isGameOver = true;
	contexte.clearRect(0, 0, canvas.width, canvas.height);
	contexte.fillStyle = "white";
	contexte.font = "40px Arial";
	contexte.textAlign = "center";
	contexte.fillText(`🏆 Joueur ${winner.id} gagne !`, canvas.width / 2, canvas.height / 2);
}

function isBallTouchingWall()
{
	const dx = ball.x - centerX;
	const dy = ball.y - centerY;
	const distance = Math.sqrt(dx * dx + dy * dy);
	return distance >= radius - ball.radius;
}

function isPaddleAt(angle)
{
	angle = normalizeAngle(angle);

	for (const player of players)
	{
		const start = normalizeAngle(player.angle - paddleSize / 2);
		const end = normalizeAngle(player.angle + paddleSize / 2);
		

		if (start < end)
		{
			if (angle >= start && angle <= end)
				return player;
		}
		else
		{
			if (angle >= start || angle <= end)
				return player;
		}
	}
	return null;
}

function getExpectedPlayer(angle)
{
	angle = normalizeAngle(angle);

	for (const player of players)
	{
		const min = normalizeAngle(player.minAngle);
		const max = normalizeAngle(player.maxAngle);
		let inside = false;

		if (min < max)
			inside = angle >= min && angle <= max;
		else
			inside = angle >= min || angle <= max;

		if (inside)
			return player;
	}

	console.log("→ Aucun joueur trouvé !");
	return null;
}

function continueGame()
{
	const playerCount = players.length;
	const angleStep = (2 * Math.PI) / playerCount;
	const offset = Math.PI / 2;

	for (let i = 0; i < playerCount; i++)
	{
		const angle = normalizeAngle(offset + i * angleStep);
		const player = players[i];
		player.angle = angle;
		player.minAngle = normalizeAngle(angle - angleStep / 2);
		player.maxAngle = normalizeAngle(angle + angleStep / 2);
	}
	ball.x = centerX;
	ball.y = centerY;
	ball.speed = 2.5
	ball.angle = Math.random() * 2 * Math.PI;
}

function handleMiss(angle)
{
	const missedPlayer = getExpectedPlayer(angle);
	console.log(missedPlayer);
	if (missedPlayer)
	{
		const index = players.indexOf(missedPlayer);
		if (index !== -1) 
		{
			eliminatedPlayers.push(missedPlayer);//for proper reset
			players.splice(index, 1); // retire le joueur
			if (players.length === 1)
				return winScreen(players[0]);
			setTimeout(continueGame, 3000);
		}
	}
}

function checkBallCollision()
{
	if (!isBallTouchingWall()) return;

	const dx = ball.x - centerX;
	const dy = ball.y - centerY;
	const angle = normalizeAngle(Math.atan2(dy, dx));

	const impactAngle = normalizeAngle(Math.atan2(dy, dx));
	const player = isPaddleAt(impactAngle);

	if (player)
	{
		const paddleCenter = normalizeAngle(player.angle);
		let offset = impactAngle - paddleCenter;

		if (offset > Math.PI) offset -= 2 * Math.PI;
		if (offset < -Math.PI) offset += 2 * Math.PI;

		const bounceStrength = 4;
		ball.angle = normalizeAngle(Math.PI + ball.angle + offset * bounceStrength);
		ball.speed += 0.3//acceleration
	}
	else
		handleMiss(normalizeAngle(Math.atan2(ball.y - centerY, ball.x - centerX)));
}

function updateBall()
{
	ball.x += Math.cos(ball.angle) * ball.speed;
	ball.y += Math.sin(ball.angle) * ball.speed;
}

function drawBall()
{
	contexte.beginPath();
	contexte.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
	contexte.fillStyle = "#ffffff";
	contexte.fill();
	contexte.closePath();
}

function drawCurvedPaddle(player)
{
	const startAngle = player.angle - paddleSize / 2;
	const endAngle = player.angle + paddleSize / 2;

	contexte.beginPath();
	contexte.arc(centerX, centerY, radius, startAngle, endAngle);
	contexte.lineWidth = 10;// épaisseur de la palette
	contexte.strokeStyle = player.color;
	contexte.stroke();
	contexte.closePath();
}

function drawAllPaddles()
{
	players.forEach(player => drawCurvedPaddle(player));
}

function angularDistance(a, b)
{
	const diff = Math.abs(a - b) % (Math.PI * 2);
	return Math.min(diff, Math.PI * 2 - diff);
}

function normalizeAngle(angle)
{
	angle = angle % (Math.PI * 2);
	return angle < 0 ? angle + Math.PI * 2 : angle;
}

function updatePlayers()
{
	const speed = 0.03;//player movement speed
	players.forEach(player =>
	{
		player.angle += player.direction * speed;
		player.angle = normalizeAngle(player.angle);

		const min = normalizeAngle(player.minAngle + paddleSize / 2);
		const max = normalizeAngle(player.maxAngle - paddleSize / 2);

		if (min > max)
		{
			const inZone = (player.angle >= min || player.angle <= max);
			if (!inZone) {
				const distToMin = angularDistance(player.angle, min);
				const distToMax = angularDistance(player.angle, max);
				player.angle = (distToMin < distToMax) ? min : max;
			}
		}
		else
		{
			if (player.angle < min) player.angle = min;
			if (player.angle > max) player.angle = max;
		}
	});
}

function drawPlayerSector(startAngle, endAngle, colors)
{
	contexte.beginPath();
	contexte.moveTo(centerX, centerY);
	contexte.arc(centerX, centerY, radius, startAngle, endAngle);
	contexte.closePath();
	contexte.fillStyle = colors;
	contexte.fill();
}

function drawAllPlayerSector()
{
	const playerCount = players.length;
	const angleStep = Math.PI * 2 / playerCount;
	const offset = angleStep / 2;

	for (let i = 0; i < playerCount; i++)
	{

		const startAngle = normalizeAngle(players[i].minAngle);
		const endAngle = normalizeAngle(players[i].maxAngle);
		drawPlayerSector(startAngle, endAngle, players[i].color);
	}
}

function drawGameCircle()
{
	contexte.clearRect(0, 0, canvas.width, canvas.height);
	drawAllPlayerSector();
	updatePlayers();
	updateBall();

	if (socket && socket.readyState === WebSocket.OPEN)
		sendPlayerInfo(socket);
	
	drawBall();
	drawAllPaddles();
	checkBallCollision();

	contexte.beginPath();
	contexte.arc(centerX, centerY, radius, 0, Math.PI * 2);
	contexte.strokeStyle = "#fff";
	contexte.lineWidth = 4;
	contexte.stroke();

	if (isGameOver === false)
		requestAnimationFrame(drawGameCircle);
}

window.onload = () => {
	connectToWebSocket();
	drawGameCircle();
  };*/
