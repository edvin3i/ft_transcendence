import { playPong } from './pong.js';
import { playPong3D } from './pong3d.js';
// import { playMoshpit } from './moshpitRemote.js';
import { playTournament, openTournamentPage } from './tournament.js';
import { openOnlineTournamentPage } from './tournamentOnline.js';
import { openMoshpitPage } from './moshpitRemote.js';

function gamePage()
{
	return `
		<div class="text-center">
			<h2>Pong Game</h2>
			<div class="d-grid gap-2 col-6 mx-auto">
				<button id="localButton" class="btn btn-primary">Local 🎮</button>
				<button id="remoteButton" class="btn btn-primary">Remote 🌐</button>
				<button id="tournamentButton" class="btn btn-primary">Tournament 🏆</button>
				<button id="tournamentOnlineButton" class="btn btn-primary">Online Tournament 🏆</button>
				<button id="moshpitButton" class="btn btn-primary">Moshpit 👾</button>
				<button id="threeDButton" class="btn btn-primary">3D Mode 🧠</button>
			</div>
		</div>
	`;
}


// 🚀 Entry point to render the main game selection screen
export function openGamePage() {
	document.getElementById('app').innerHTML = gamePage();
  
	// Bind each button to its respective page
	document.getElementById('localButton')?.addEventListener('click', openLocalGamePage);
	document.getElementById('remoteButton')?.addEventListener('click', openRemoteGamePage);
	document.getElementById('tournamentButton')?.addEventListener('click', openTournamentPage);
	document.getElementById('tournamentOnlineButton')?.addEventListener('click', openOnlineTournamentPage);
	document.getElementById('moshpitButton')?.addEventListener('click', openMoshpitPage);
	document.getElementById('threeDButton')?.addEventListener('click', open3DPage);
  }
  

function localGamePage()
{
	return `
		<div id="frameContainer">
			<div id="uiLayer">
				<div id="controls">
					<button id="startBtn">Start / Restart</button>
					<span id="timer">00:00</span>
					<button id="toggleAI">Toggle AI</button>
				</div>
				<img id="fullFrameOverlay" src="assets/frame.png" alt="Frame Overlay" />
				<canvas id="pongCanvas"></canvas>
				<div style="position: absolute; top: 10px; left: 10px;">
					<button onclick="history.back()">← Back to main menu</button>
				</div>
			</div>
		</div>
	`;
}

function openLocalGamePage()
{
	document.getElementById('app').innerHTML = localGamePage();

	playPong({remote: false});
}

function enterRoomPage()
{
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

function openRemoteGamePage()
{
	document.getElementById('app').innerHTML = enterRoomPage();

	const enterRoomButton = document.getElementById('remoteButton');
	enterRoomButton.addEventListener('click', startRemoteGame);
}

function remoteGamePage()
{
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


function startRemoteGame()
{
	const room = document.getElementById('roomInput').value;

	document.getElementById('app').innerHTML = remoteGamePage();

	playPong({remote: true, room: room});
}



function open3DPage() {
	document.getElementById('app').innerHTML = ''; // clear current view
	playPong3D();
}