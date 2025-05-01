// Import the core game modes
import { playPong } from './pong.js';
import { playMoshpit } from './moshpitRemote.js';

// 🎮 Main game menu with buttons for each mode
function gamePage() {
	return `
		<div class="text-center">
			<h2>Pong Game</h2>
			<div class="d-grid gap-2 col-6 mx-auto">
				<button id="localButton" class="btn btn-primary">Local 🎮</button>
				<button id="remoteButton" class="btn btn-primary">Remote 🌐</button>
				<button id="tournamentButton" class="btn btn-primary">Tournament 🏆</button>
				<button id="moshpitButton" class="btn btn-primary">Moshpit 👾</button>
			</div>
		</div>
	`;
}

// 🚀 Entry point to render the main game selection screen
export function openGamePage() {
	document.getElementById('app').innerHTML = gamePage();

	// Bind each button to its respective page
	document.getElementById('localButton').addEventListener('click', openLocalGamePage);
	document.getElementById('remoteButton').addEventListener('click', openRemoteGamePage);
	document.getElementById('tournamentButton').addEventListener('click', openTournamentPage);
	document.getElementById('moshpitButton').addEventListener('click', openMoshpitPage);
}

// 🎮 Local 2-player Pong screen
function localGamePage() {
	return `
		<div class="text-center">
			<h2>Local Pong Game</h2>
			<p id="playerNames" style="font-weight:bold;"></p>
			<p id="playerLabel" style="font-weight:bold; margin-bottom:10px;"></p>
			<canvas id="pongCanvas" width="500" height="300"></canvas>
			<p>Use W and S for Player 1 (left) and Arrow keys for Player 2 (right)</p>
		</div>
	`;
}

// 🧠 Launch local Pong game mode
function openLocalGamePage() {
	document.getElementById('app').innerHTML = localGamePage();
	playPong({ remote: false });
}

// 🌐 Remote Pong room entry screen
function enterRoomPage() {
	return `
		<div class="text-center">
			<h2>Remote Pong Game</h2>
			<p style="margin-top:10px;">
				<input id="roomInput" placeholder="Enter room name" value="myroom">
			</p>
			<p>
				<button id="remoteButton">Enter room</button>
			</p>
		</div>
	`;
}

// 🚪 Load remote room input and bind Enter Room button
function openRemoteGamePage() {
	document.getElementById('app').innerHTML = enterRoomPage();
	document.getElementById('remoteButton').addEventListener('click', startRemoteGame);
}

// 🕹️ Remote Pong game canvas and controls
function remoteGamePage() {
	return `
		<div class="text-center">
			<h2>Remote Pong Game</h2>
			<p style="font-weight:bold; margin-bottom:10px;">You are Player <span id="playerLabel"></span>, use Arrow keys</p>
			<canvas id="pongCanvas" width="500" height="300"></canvas>
			<p id="playerNames" style="font-weight:bold;"></p>
			<p id="gameTimer" style="font-size: 18px;"></p>
			<p id="pongStatus" style="margin-top:10px; color: #fff;"></p>
			<p>
				<button id="endGameButton" style="display:none;">❌ End Game</button>
				<button id="resetGameButton" style="display:none;">🔄 Reset Game</button>
			</p>
		</div>
	`;
}

// 🚀 Connect to remote Pong room and launch game
function startRemoteGame() {
	const room = document.getElementById('roomInput').value;
	document.getElementById('app').innerHTML = remoteGamePage();
	playPong({ remote: true, room: room });
}

// 🏆 Tournament setup screen
function tournamentPage() {
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

			<div id="tournamentHistory" class="text-left" style="margin-top: 30px;">
				<h3 style="color: #fff;">📜 Tournament History</h3>
				<ul id="historyList" style="list-style: none; padding-left: 0; color: #ccc;"></ul>
			</div>

			<div id="bracketView" style="margin-top: 50px;">
				<h3 style="color: #fff;">🏆 Bracket</h3>
				<div id="bracketContainer" style="display: flex; flex-wrap: wrap; gap: 40px; color: #fff;"></div>
			</div>
		</div>
	`;
}

// 🧩 Launch tournament screen and wire event listeners dynamically
function openTournamentPage() {
	document.getElementById('app').innerHTML = tournamentPage();
	import('./tournament.js').then(mod => {
		mod.resetTournament(); // 🧼 clean any previous state

		const addBtn = document.getElementById('addPlayerBtn');
		const input = document.getElementById('playerAlias');
		const startBtn = document.getElementById('startTournamentBtn');
		const nextBtn = document.getElementById('nextMatchBtn');
		const restartBtn = document.getElementById('restartBtn');

		addBtn.addEventListener('click', mod.addPlayer);
		startBtn.addEventListener('click', mod.startTournament);

		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') addBtn.click();
		});

		nextBtn.addEventListener('click', () => {
			nextBtn.style.display = 'none';
			mod.startMatch();
		});

		restartBtn.addEventListener('click', () => {
			mod.resetTournament();
		});
	});
}


// 👾 Display Moshpit canvas 
function moshpitPage() {
	return `
		<div class="container">
			<h2 class="text-center">Moshpit</h2>
			<canvas id="moshpitRemoteCanvas" width="600" height="600"></canvas>
		</div>
	`;
}

// 🚀 Launch Moshpit game mode
function openMoshpitPage() {
	document.getElementById('app').innerHTML = moshpitPage();
	playMoshpit();
}
