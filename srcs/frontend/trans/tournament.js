// tournament.js — version avec Next Match manuel, Restart, victoire finale propre et sans Round fantôme

let players = [];
let currentMatchIndex = 0;
let currentRoundIndex = 0;
let bracketStructure = [];

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

	document.getElementById("registration").style.display = "none";
	document.getElementById("gameArea").style.display = "block";
	document.getElementById("historyList").innerHTML = "";
	document.getElementById("nextMatchBtn").style.display = "none";
	document.getElementById("restartBtn").style.display = "none";

	const numPlayers = players.length;
	const totalRounds = Math.ceil(Math.log2(numPlayers));
	const filledPlayers = [...players];
	while (filledPlayers.length < 2 ** totalRounds) {
		filledPlayers.push(null);
	}

	bracketStructure = [];

	for (let r = 0; r < totalRounds; r++) {
		const numMatches = Math.ceil(filledPlayers.length / (2 ** (r + 1)));
		bracketStructure.push(new Array(numMatches).fill(null));
	}

	for (let i = 0; i < filledPlayers.length; i += 2) {
		bracketStructure[0][i / 2] = [filledPlayers[i], filledPlayers[i + 1]];
	}

	currentRoundIndex = 0;
	currentMatchIndex = 0;
	renderBracket();
	document.getElementById("nextMatchBtn").style.display = "inline-block";
}

export function startMatch() {
	const round = bracketStructure[currentRoundIndex];
	if (!round || currentMatchIndex >= round.length) {
		currentRoundIndex++;
		currentMatchIndex = 0;
		startMatch();
		return;
	}

	const match = round[currentMatchIndex];
	if (!match || match.includes(null)) {
		const winner = match.find(p => p !== null);
		const loser = match.find(p => p === null);
		placeWinner(winner, winner, loser);
		currentMatchIndex++;
		renderBracket();
		showNextOrRestartButton();
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
					placeWinner(winner, player1, player2);
					currentMatchIndex++;
					renderBracket();
					showNextOrRestartButton();
				}
			});
		});
	}, 2000);
}

function placeWinner(winner, player1, player2) {
	logMatch(player1, player2, winner);

	const nextIndex = Math.floor(currentMatchIndex / 2);
	const targetRoundIndex = currentRoundIndex + 1;

	// 🛑 Stop if tournament is over
    if (targetRoundIndex >= bracketStructure.length) {
        document.getElementById("playerNames").textContent = `🏆 Winner: ${winner}`;
        document.getElementById("restartBtn").style.display = "inline-block";
        document.getElementById("nextMatchBtn").style.display = "none"; // 👈 ajoute ça
        return;
    }    

	if (!bracketStructure[targetRoundIndex][nextIndex]) {
		bracketStructure[targetRoundIndex][nextIndex] = [null, null];
	}

	const slot = currentMatchIndex % 2 === 0 ? 0 : 1;
	bracketStructure[targetRoundIndex][nextIndex][slot] = winner;
}

function showNextOrRestartButton() {
	const isFinalRound = currentRoundIndex >= bracketStructure.length;
	if (!isFinalRound) {
		document.getElementById("nextMatchBtn").style.display = "inline-block";
	}
}

function logMatch(player1, player2, winner) {
	const p1 = player1 || 'bye';
	const p2 = player2 || 'bye';
	const li = document.createElement("li");
	li.innerHTML = `🏁 ${p1} vs ${p2} → 🏆 ${winner}`;
	document.getElementById("historyList").appendChild(li);
}

function renderBracket() {
	const bracketContainer = document.getElementById("bracketContainer");
	bracketContainer.innerHTML = "";

	bracketStructure.forEach((round, roundIndex) => {
		const column = document.createElement("div");
		column.style.background = "#222";
		column.style.padding = "10px";
		column.style.borderRadius = "10px";
		column.style.minWidth = "120px";
		column.innerHTML = `<h4 style=\"color: white;\">Round ${roundIndex + 1}</h4>`;

		round.forEach((match, matchIndex) => {
			const matchBox = document.createElement("div");
			matchBox.style.border = "1px solid #999";
			matchBox.style.padding = "10px";
			matchBox.style.marginBottom = "10px";
			matchBox.style.background = "#111";
			matchBox.style.borderRadius = "5px";
			matchBox.style.color = "#eee";

			if (Array.isArray(match)) {
				const [p1, p2] = match;
				matchBox.innerHTML = `${p1 || 'bye'} vs ${p2 || 'bye'}`;
			} else {
				matchBox.textContent = "Waiting...";
			}

			column.appendChild(matchBox);
		});

		bracketContainer.appendChild(column);
	});
}

// Activation des boutons dynamiques
document.addEventListener('DOMContentLoaded', () => {
	const nextBtn = document.getElementById('nextMatchBtn');
	if (nextBtn) {
		nextBtn.addEventListener('click', () => {
			nextBtn.style.display = "none";
			startMatch();
		});
	}

	const restartBtn = document.getElementById('restartBtn');
	if (restartBtn) {
		restartBtn.addEventListener('click', () => {
			location.reload();
		});
	}
});

//test3