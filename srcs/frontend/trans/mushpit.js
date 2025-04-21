const canvas = document.getElementById("mushpitCanvas");
const contexte = canvas.getContext("2d");

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = canvas.width / 2 - 10;

const paddleSize = Math.PI / 12;

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
	// angle: Math.PI / 4, //for + position
	angle: 0, //for x position
	color: "#ff4d4d",      // Droite/red
	keyLeft: "ArrowLeft",
	keyRight: "ArrowRight",
	direction: 0,
	minAngle: -Math.PI / 4,
	maxAngle: Math.PI / 4,
	id: "red"
},
{
	// angle: 3 * Math.PI / 4, //for + position
	angle: Math.PI / 2, //for x position
	color: "#4da6ff",      // Bas/blue
	keyLeft: "ArrowDown",
	keyRight: "ArrowUp",
	direction: 0,
	minAngle: Math.PI / 4,
	maxAngle: 3 * Math.PI / 4,
	id: "blue"
},
{
	// angle: -3 * Math.PI / 4,//for + position
	angle: Math.PI,// for x position
	color: "#4dff4d",      // Gauche.green
	keyLeft: "a",
	keyRight: "e",
	direction: 0,
	minAngle: 3 * Math.PI / 4,
	maxAngle: 5 * Math.PI / 4,
	id: "green"
},
{
	// angle: -Math.PI / 4,// for + position
	angle: 3 * Math.PI / 2,// for x position
	color: "#ffff4d",      // Haut/yellow
	keyLeft: "q",
	keyRight: "d",
	direction: 0,
	minAngle: 5 * Math.PI / 4,
	maxAngle: 7 * Math.PI / 4,
	id: "yellow"
},
];

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

// function getExpectedPlayer(angle)
// {
// 	angle = normalizeAngle(angle);

// 	for (const player of players)
// 	{
// 		const min = normalizeAngle(player.minAngle/* - angle*/);
// 		const max = normalizeAngle(player.maxAngle/* - angle*/);

// 		// angle = 0;
// 		console.log(`Testing angle=${(angle * 180 / Math.PI).toFixed(1)}°`);
// 		console.log(`Checking player ${player.id} -> shifted min=${(min * 180 / Math.PI).toFixed(1)}°, max=${(max * 180 / Math.PI).toFixed(1)}°`);

// 		if (min < max)
// 			if (angle >= min && angle <= max) return player;
// 		else
// 			if (angle >= min || angle <= max) return player;
// 	}
// 	// return null; //souldn't go here
// }

function getExpectedPlayer(angle)
{
	angle = normalizeAngle(angle);
	// console.log(`Balle à l'angle: ${(angle * 180 / Math.PI).toFixed(1)}°`);

	for (const player of players)
	{
		const min = normalizeAngle(player.minAngle);
		const max = normalizeAngle(player.maxAngle);

		// console.log(`Joueur ${player.id} : min=${(min * 180 / Math.PI).toFixed(1)}°, max=${(max * 180 / Math.PI).toFixed(1)}°`);

		// let inside = false;
		
		// if (min <= max)
		// 	inZone = angle >= min && angle <= max
		const inside =
			min < max
					? angle >= min && angle <= max
					: angle >= min || angle <= max;

		if (inside) {
			// console.log(`→ Balle dans la zone du joueur ${player.id}`);
			return player;
		}
	}

	console.log("→ Aucun joueur trouvé !");
	return null;
}


function resetGame()
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
			players.splice(index, 1); // retire le joueur
			if (players.length === 1)
				return winScreen();
			setTimeout(resetGame, 3000);
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
		handleMiss(normalizeAngle(Math.atan2(ball.y - centerY, ball.x - centerX)));//angle polaire
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
	contexte.lineWidth = 10; // épaisseur de la palette
	contexte.strokeStyle = player.color;//"#000000";//black
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
	// const colors = ["#4da6ff", "#4dff4d", "#ffff4d", "#ff4d4d"];
	const playerCount = players.length;
	const angleStep = Math.PI * 2 / playerCount;
	const offset = angleStep / 2;//uncoment for x position

	for (let i = 0; i < playerCount; i++)
	{
		// const startAngle = angleStep * i;//for + position
		// const startAngle = offset + angleStep * i;//this one is for x position
		// const endAngle = startAngle + angleStep;
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
	drawBall();
	drawAllPaddles();
	checkBallCollision();

	contexte.beginPath();
	contexte.arc(centerX, centerY, radius, 0, Math.PI * 2);
	contexte.strokeStyle = "#fff";
	contexte.lineWidth = 4;
	contexte.stroke();

	requestAnimationFrame(drawGameCircle);
}

drawGameCircle();
