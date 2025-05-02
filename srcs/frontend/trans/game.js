import {playPong} from './pong.js'
import {playTournament} from './tournament.js'
import {playMoshpit} from './moshpitRemote.js'
import {openOnlineTournamentPage} from './tournamentOnline.js'

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
			</div>
		</div>
	`;
}

export function openGamePage()
{
	document.getElementById('app').innerHTML = gamePage();
	
	const localButton = document.getElementById('localButton');
	localButton.addEventListener('click', openLocalGamePage);
		
	const remoteButton = document.getElementById('remoteButton');
	remoteButton.addEventListener('click', openRemoteGamePage);
	
	const tournamentButton = document.getElementById('tournamentButton');
	tournamentButton.addEventListener('click', openTournamentPage);

	const onlineTournamentButton = document.getElementById('tournamentOnlineButton');
	onlineTournamentButton.addEventListener('click', openOnlineTournamentPage);

	const moshpitButton = document.getElementById('moshpitButton');
	moshpitButton.addEventListener('click', openMoshpitPage);
}

function localGamePage()
{
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
				<button id="remoteButton"">Enter room</button>
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

function tournamentPage()
{
	return `
		<div class="text-center">
			<h2>Tournament Mode 🏆</h2>
			<div id="registration">
				<input type="text" id="playerAlias" placeholder="Enter alias">
				<button id="addPlayerBtn">Add</button>
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

function openTournamentPage()
{
	document.getElementById('app').innerHTML = tournamentPage();

	playTournament();
}

function moshpitPage()
{
	return `
		<div class="container">
			<h2 class="text-center">Moshpit</h2>
			<canvas id="moshpitRemoteCanvas" width="600" height="600"></canvas>
		</div>
	`;
}

function openMoshpitPage()
{
	document.getElementById('app').innerHTML = moshpitPage();

	playMoshpit();
}
