let players = [];
let currentMatchIndex = 0;
let currentRound = [];
let nextRound = [];

function renderPlayerList() {
	const list = document.getElementById("playerList");
	list.innerHTML = "";
	players.forEach(p => {
		const li = document.createElement("li");
		li.textContent = p;
		list.appendChild(li);
	});
}

export function addPlayer() {
	const input = document.getElementById("playerAlias");
	const name = input.value.trim();
	if (name && !players.includes(name)) {
		players.push(name);
		renderPlayerList();
		input.value = "";
	}
}

export function startTournament() {
	if (players.length < 2) {
		alert("Please enter at least 2 players.");
		return;
	}
	if (players.length % 2 !== 0) {
		alert("Number of players must be even for this simple bracket system.");
		return;
	}

	document.getElementById("registration").style.display = "none";
	document.getElementById("gameArea").style.display = "block";

	currentRound = [];
	for (let i = 0; i < players.length; i += 2) {
		const p1 = players[i];
		const p2 = players[i + 1];
		if (p1 && p2) currentRound.push([p1, p2]);
	}
	nextRound = [];
	currentMatchIndex = 0;

	startMatch();
}

function startMatch() {
	// Si le tournoi est terminé
	if (currentRound.length === 0 && nextRound.length === 1) {
		const winner = nextRound[0];
		document.getElementById("playerNames").textContent = `🏆 Winner: ${winner}`;
		renderBracket();
		return;
	}

	// Si la ronde est terminée, on génère la suivante
	if (currentMatchIndex >= currentRound.length) {
		const tempWinners = [...nextRound];
		currentRound = [];
		nextRound = [];

		for (let i = 0; i < tempWinners.length; i += 2) {
			const p1 = tempWinners[i];
			const p2 = tempWinners[i + 1];

			if (!p2) {
				// Bye automatique : pas d'adversaire
				logMatch(p1, "(bye)", p1);
				nextRound.push(p1);
				continue;
			}

			currentRound.push([p1, p2]);
		}

		currentMatchIndex = 0;
		renderBracket(); // met à jour la vue avant de recommencer
		startMatch();
		return;
	}

	// Lancement du match actuel
	const match = currentRound[currentMatchIndex];

	if (!Array.isArray(match) || match.length !== 2) {
		console.error("Invalid match format:", match);
		currentMatchIndex++;
		startMatch();
		return;
	}

	const [player1, player2] = match;

	document.getElementById("playerNames").textContent = `Next match: ${player1} vs ${player2}`;

	setTimeout(() => {
		document.getElementById("playerNames").textContent = `${player1} vs ${player2}`;

		import('./pong.js').then(({ playPong }) => {
			playPong({
				remote: false,
				onGameEnd: (winnerSide) => {
					const winner = winnerSide === "left" ? player1 : player2;
					logMatch(player1, player2, winner);
					nextRound.push(winner);
					currentMatchIndex++;
					renderBracket();
					setTimeout(startMatch, 1000); // pause avant le prochain
				}
			});
		});
	}, 2000);
}

function logMatch(player1, player2, winner) {
	const li = document.createElement("li");
	li.textContent = `🏁 ${player1} vs ${player2} → 🏆 ${winner}`;
	document.getElementById("historyList").appendChild(li);
}

function renderBracket() {
	const bracketContainer = document.getElementById("bracketContainer");
	bracketContainer.innerHTML = "";

	[currentRound, nextRound].forEach((round, roundIndex) => {
		if (round.length === 0) return;
		const column = document.createElement("div");
		column.style.background = "#222";
		column.style.padding = "10px";
		column.style.borderRadius = "10px";
		column.innerHTML = `<h4 style="color: white;">Round ${roundIndex + 1}</h4>`;
		round.forEach(match => {
			const matchBox = document.createElement("div");
			matchBox.style.border = "1px solid #999";
			matchBox.style.padding = "10px";
			matchBox.style.marginBottom = "10px";
			matchBox.style.background = "#111";
			matchBox.style.borderRadius = "5px";
			matchBox.textContent = Array.isArray(match)
				? `${match[0]} vs ${match[1]}`
				: `${match}`;
			column.appendChild(matchBox);
		});
		bracketContainer.appendChild(column);
	});
}
