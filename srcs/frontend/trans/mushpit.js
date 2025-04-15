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
	//-Math.PI / 4,
	maxAngle: Math.PI / 4
	// minAngle: 0, + position
	// maxAngle: Math.PI / 2,
},
{
	// angle: 3 * Math.PI / 4, //for + position
	angle: Math.PI / 2, //for x position
	color: "#4da6ff",      // Bas/blue
	keyLeft: "ArrowDown",
	keyRight: "ArrowUp",
	direction: 0,
	minAngle: Math.PI / 4,
	maxAngle: 3 * Math.PI / 4
	// minAngle: Math.PI / 2,for + position
	// maxAngle: Math.PI,
},
{
	// angle: -3 * Math.PI / 4,//for + position
	angle: Math.PI,// for x position
	color: "#4dff4d",      // Gauche.green
	keyLeft: "a",
	keyRight: "d",
	direction: 0,
	minAngle: 3 * Math.PI / 4,
	maxAngle: 5 * Math.PI / 4
	// minAngle: Math.PI,for + position
	// maxAngle: -Math.PI / 2,
},
{
	// angle: -Math.PI / 4,// for + position
	angle: 3 * Math.PI / 2,// for x position
	color: "#ffff4d",      // Haut/yellow
	keyLeft: "q",
	keyRight: "e",
	direction: 0,
	minAngle: 5 * Math.PI / 4,
	maxAngle: 7 * Math.PI / 4
	// minAngle: -Math.PI / 2,for + position
	// maxAngle: 0,
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

function normalizeAngle(angle) {
	angle = angle % (Math.PI * 2);
	return angle < 0 ? angle + Math.PI * 2 : angle;
}

function updatePlayers()
{
	const speed = 0.05;
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
	const colors = ["#4da6ff", "#4dff4d", "#ffff4d", "#ff4d4d"];
	const angleStep = Math.PI / 2;
	const offset = Math.PI / 4;//uncoment for x position

	for (let i = 0; i < 4; i++)
	{
		// const startAngle = angleStep * i;//for + position
		const startAngle = offset + angleStep * i;//this one is for x position
		const endAngle = startAngle + angleStep;
		drawPlayerSector(startAngle, endAngle, colors[i]);
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

	contexte.beginPath();
	contexte.arc(centerX, centerY, radius, 0, Math.PI * 2);
	contexte.strokeStyle = "#fff";
	contexte.lineWidth = 4;
	contexte.stroke();

	requestAnimationFrame(drawGameCircle);
}

drawGameCircle();
