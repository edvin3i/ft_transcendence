function tournamentPage()
{
	return `
		<div class="text-center">
			<h2>Tournament Mode 🏆</h2>
			<div id="registration">
				<input type="text" id="playerAlias" placeholder="Enter alias">
				<button id="addPlayerBtn">Add</button>
				<p id="playerCount" style="margin: 0; color: white;">0 / 8 players maximum</p>
				<ul id="playerList" style="list-style: none; padding: 0;"></ul>
				<button id="startTournamentBtn">Start Tournament</button>
			</div>

			<div id="gameArea" style="display:none;">
				<h3 id="playerNames">Match</h3>
				<canvas id="pongCanvas" width="500" height="300"></canvas>
			</div>
			
			<p><button id="nextMatchBtn" style="display: none;">▶️ Next Match</button></p>
			
			<p><button id="restartBtn" style="display: none;">✨ New Tournament</button></p>

			<!-- START: Hidden results section -->
			<div id="tournamentResults" style="display: none;">
				<div id="tournamentHistory" class="text-left" style="margin-top: 30px;">
					<h3 style="color: #fff;">📜 Tournament History</h3>
					<ul id="historyList" style="list-style: none; padding-left: 0; color: #ccc;"></ul>
				</div>

				<div id="bracketView" style="margin-top: 50px;">
					<h3 style="color: #fff;">🏆 Bracket</h3>
					<div id="bracketContainer" style="display: flex; flex-wrap: wrap; gap: 40px; color: #fff;"></div>
				</div>
			</div>
			<!-- END: Hidden results section -->
		</div>
	`;
}

export function openTournamentPage()
{
	document.getElementById('app').innerHTML = tournamentPage();

	playTournament();
}

// tournament.js — version with manual Next Match, full reset, clean bracket and winner display

// Global state variables
let players = [];                  // List of players
let currentMatchIndex = 0;         // Current match index within the round
let currentRoundIndex = 0;         // Current round index
let bracketStructure = [];         // 2D array representing rounds and matches

function playTournament() {
		resetTournament();

		const addBtn = document.getElementById('addPlayerBtn');
		const input = document.getElementById('playerAlias');
		const startBtn = document.getElementById('startTournamentBtn');
		const nextBtn = document.getElementById('nextMatchBtn');
		const restartBtn = document.getElementById('restartBtn');

		addBtn.addEventListener('click', addPlayer);
		startBtn.addEventListener('click', startTournament);

		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') addBtn.click(); // Enable Enter to add player
		});

		nextBtn.addEventListener('click', () => {
			nextBtn.style.display = 'none';
			startMatch(); // Launch next match manually
		});

		restartBtn.addEventListener('click', () => {
			resetTournament(); // Restart with cleared state
		});
}

// Render the list of player names to the DOM
function renderPlayerList() {
	const list = document.getElementById("playerList");
	const counter = document.getElementById("playerCount");
	list.innerHTML = "";
	players.forEach(p => {
		const li = document.createElement("li");
		li.textContent = p;
		list.appendChild(li);
	});

	if (counter) {
		counter.textContent = `${players.length} / 8 players maximum`;
	}
}

// Add a player name from input field and update the display
export function addPlayer() {
	const input = document.getElementById("playerAlias");
	const name = input.value.trim();

	if (!name) return;

	if (players.includes(name)) {
		alert("This player is already in the tournament.");
		return;
	}

	if (players.length >= 8) {
		alert("Maximum of 8 players reached.");
		return;
	}

	players.push(name);
	renderPlayerList();
	input.value = "";
}

// Initialize a new tournament and generate the bracket
export function startTournament() {
	if (players.length < 2) {
		alert("Please enter at least 2 players.");
		return;
	}

	// Clear old canvas state if present
	const canvas = document.getElementById("pongCanvas");
	if (canvas) {
		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
	document.getElementById("playerNames").textContent = "";

	// Reset interface and display bracket
	document.getElementById("registration").style.display = "none";
	document.getElementById("gameArea").style.display = "block";
	document.getElementById("historyList").innerHTML = "";
	document.getElementById("nextMatchBtn").style.display = "none";
	document.getElementById("restartBtn").style.display = "none";

	// Generate the full bracket including empty slots for byes
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

	// Fill the first round with actual pairings
	for (let i = 0; i < filledPlayers.length; i += 2) {
		bracketStructure[0][i / 2] = [filledPlayers[i], filledPlayers[i + 1]];
	}

	currentRoundIndex = 0;
	currentMatchIndex = 0;
	renderBracket();
	document.getElementById("tournamentResults").style.display = "block";
	document.getElementById("nextMatchBtn").style.display = "inline-block";
}

// Start a single match or skip to next round if needed
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

	// Show players before launching pong game
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

// Place winner in next round's correct slot
function placeWinner(winner, player1, player2) {
	logMatch(player1, player2, winner);

	const nextIndex = Math.floor(currentMatchIndex / 2);
	const targetRoundIndex = currentRoundIndex + 1;

	// End of tournament: declare winner
	if (targetRoundIndex >= bracketStructure.length) {
		document.getElementById("playerNames").textContent = `🏆 Winner: ${winner}`;
		document.getElementById("restartBtn").style.display = "inline-block";
		document.getElementById("nextMatchBtn").style.display = "none";
		return;
	}

	// Fill in the match pairing in the next round
	if (!bracketStructure[targetRoundIndex][nextIndex]) {
		bracketStructure[targetRoundIndex][nextIndex] = [null, null];
	}

	const slot = currentMatchIndex % 2 === 0 ? 0 : 1;
	bracketStructure[targetRoundIndex][nextIndex][slot] = winner;
}

// Decide if next match or restart button should be shown
function showNextOrRestartButton() {
	const isFinalRound = (
		currentRoundIndex >= bracketStructure.length ||
		(currentRoundIndex === bracketStructure.length - 1 &&
		currentMatchIndex >= bracketStructure[bracketStructure.length - 1].length)
	);
	if (!isFinalRound) {
		document.getElementById("nextMatchBtn").style.display = "inline-block";
	}
}

// Append match result to tournament history
function logMatch(player1, player2, winner) {
	const p1 = player1 || 'bye';
	const p2 = player2 || 'bye';
	const li = document.createElement("li");
	li.innerHTML = `🏁 ${p1} vs ${p2} → 🏆 ${winner}`;
	document.getElementById("historyList").appendChild(li);
}

// Draw bracket in columns (1 per round)
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

		round.forEach((match) => {
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

// Hook up buttons on first load
/*
document.addEventListener('DOMContentLoaded', () => {
*/
function addTournamentEventListeners() {
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
			players = [];
			currentRoundIndex = 0;
			currentMatchIndex = 0;
			bracketStructure = [];

			document.getElementById("app").innerHTML = "";
			/*
			import('./navigation.js').then(mod => {
				mod.openTournamentPage();
			});
			*/
			openTournamentPage();
		});
	}
}
/*
});
*/

// External reset that clears the UI and memory
export function resetTournament() {
	players = [];
	currentMatchIndex = 0;
	currentRoundIndex = 0;
	bracketStructure = [];

	const list = document.getElementById("playerList");
	if (list) list.innerHTML = "";

	const input = document.getElementById("playerAlias");
	if (input) input.value = "";

	document.getElementById("historyList").innerHTML = "";
	document.getElementById("bracketContainer").innerHTML = "";
	document.getElementById("playerNames").textContent = "";
	document.getElementById("gameArea").style.display = "none";
	document.getElementById("registration").style.display = "block";
	document.getElementById("nextMatchBtn").style.display = "none";
	document.getElementById("restartBtn").style.display = "none";
	document.getElementById("tournamentResults").style.display = "none";
}
