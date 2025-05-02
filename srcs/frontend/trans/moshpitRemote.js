// moshpitRemote.js

// --- VARIABLES GLOBALES ---
let canvas;
let context;
let centerX;
let centerY;

const radius = 290; // à adapter selon ton besoin
const paddleSize = Math.PI / 6; // exemple : 15° d'arc

// --- CLASSE PRINCIPALE ---
class MoshpitRemote {
	constructor(matchId, playerId) {
		this.matchId = matchId;
		this.playerId = playerId;
		this.socket = null;
		this.gameState = null;
	}

	connect() {
		const token = localStorage.getItem("accessToken");
		const protocol = window.location.protocol === "https:" ? "wss" : "ws";

		this.socket = new WebSocket(`${protocol}://${window.location.host}/ws/moshpit/${this.matchId}/?token=${token}`);

		this.socket.onopen = () => {
			console.log("✅ Connexion WebSocket établie pour le match", this.matchId);
			this.sendGameStateRequest();
		};

		this.socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			// console.log("📨 Message reçu : ", data);
			if (data.type === 'game_update')
				this.updateGameState(data.game_state);
			else if (data.type === 'waiting') {
				console.log("⏳ En attente d'autres joueurs...", data.players);
				// Optionnel : afficher une animation ou un message sur l’écran
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
		if (this.gameState.finished) {
			victoryScreen(this.gameState.winner);
			return ;
		}
		drawGameCircle(this.gameState);
		// this.updateDisplay();
	}

	// updateDisplay() {
	// 	if (this.gameState) {
	// 		drawGameCircle(this.gameState);
	// 	}
	// }

	movePlayer(direction) {
		this.sendAction('move', { direction });
	}

	endGame() {
		this.sendAction('end_game');
	}
}

// --- FONCTION D’ENTRÉE PRINCIPALE ---
export function playMoshpit() {
	canvas = document.getElementById('moshpitRemoteCanvas');
	context = canvas.getContext('2d');
	centerX = canvas.width / 2;
	centerY = canvas.height / 2;

	const matchId = 1;
	const playerId = 123;

	const moshpitRemote = new MoshpitRemote(matchId, playerId);
	moshpitRemote.connect();

	window.addEventListener("keydown", (e) => {
		if (e.key === "ArrowLeft") {
			moshpitRemote.movePlayer("left");
		} else if (e.key === "ArrowRight") {
			moshpitRemote.movePlayer("right");
		}
	});

	window.addEventListener("keyup", (e) => {
		if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
			moshpitRemote.movePlayer("stop");
		}
	}
	);
}

// --- DESSIN ---
function drawBall(ball) {
	context.beginPath();
	context.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
	context.fillStyle = "#ffffff";
	context.fill();
	context.closePath();
}

function victoryScreen(winnerId) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏆 Partie terminée", canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`Vainqueur : ${winnerId}`, canvas.width / 2, canvas.height / 2 + 30);
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
