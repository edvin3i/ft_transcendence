const canvas = document.getElementById("mushpitCanvas");
const contexte = canvas.getContext("2d");

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = canvas.width / 2 - 10;

document.addEventListener("keydown", movePaddles)

function movePaddles(event)
{
	switch(event.key)
	{
		case "w":
			paddles[0].direction = -1; // Player 1 va vers le haut
			break;
		case "s":
			paddles[0].direction = 1;  // Player 1 va vers le bas
			break;
		case "ArrowUp":
			paddles[1].direction = -1; // Player 2 va vers le haut
			break;
		case "ArrowDown":
			paddles[1].direction = 1;  // Player 2 va vers le bas
			break;
		case "ArrowLeft":
			paddles[2].direction = -1; // Player 3 va vers la gauche
			break;
		case "ArrowRight":
			paddles[2].direction = 1;  // Player 3 va vers la droite
			break;
		case "a":
			paddles[3].direction = -1; // Player 4 va vers la gauche
			break;
		case "d":
			paddles[3].direction = 1;  // Player 4 va vers la droite
			break;
	}
}

document.addEventListener("keyup", (event) => {
	switch(event.key) {
		case "w":
		case "s":
			paddles[0].direction = 0;
			break;
		case "ArrowUp":
		case "ArrowDown":
			paddles[1].direction = 0;
			break;
		case "ArrowLeft":
		case "ArrowRight":
			paddles[2].direction = 0;
			break;
		case "a":
		case "d":
			paddles[3].direction = 0;
			break;
	}
});

function drawCurvedPaddle(startAngle, endAngle, color) {
	contexte.beginPath();
	contexte.arc(centerX, centerY, radius, startAngle, endAngle);
	contexte.lineWidth = 10; // épaisseur de la palette
	contexte.strokeStyle = color;
	contexte.stroke();
	contexte.closePath();
}

function drawPaddles() {
	const angleSize = Math.PI / 12; // palette de 15°
	const offsets = [
		Math.PI * 0,       // Joueur 1 : droite
		Math.PI * 0.5,     // Joueur 2 : bas
		Math.PI * 1,       // Joueur 3 : gauche
		Math.PI * 1.5      // Joueur 4 : haut
	];
	const colors = ["#ff4d4d", "#4da6ff", "#4dff4d", "#ffff4d"];

	for (let i = 0; i < 4; i++) {
		const angle = offsets[i];
		drawCurvedPaddle(angle - angleSize/2, angle + angleSize/2, colors[i]);
	}
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
	const colors = ["#ff4d4d", "#4da6ff", "#4dff4d", "#ffff4d"];
	const angleStep = Math.PI / 2;

	for(let i=0; i < 4; i ++)
	{
		const startAngle = angleStep * i;
		const endAngle = startAngle + angleStep;
		drawPlayerSector(startAngle, endAngle, colors[i]);
	}
}

function drawGameCircle()
{
	contexte.clearRect(0, 0, canvas.width, canvas.height);
	drawAllPlayerSector();
	drawPaddles();
	updatePaddles();
	contexte.beginPath();
	contexte.arc(centerX, centerY, radius, 0, Math.PI * 2);
	contexte.strokeStyle = "#fff";
	contexte.lineWidth = 4;
	contexte.stroke();
}

drawGameCircle();
