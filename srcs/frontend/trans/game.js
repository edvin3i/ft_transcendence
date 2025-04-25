import {playPong} from './pong.js'

function gamePage()
{
	return `
		<div class="text-center">
			<h2>Pong Game</h2>
			<div class="d-grid gap-2 col-6 mx-auto">
				<button id="localButton" class="btn btn-primary">Local 🎮</button>
				<button id="remoteButton" class="btn btn-primary">Remote 🌐</button>
				<button id="tournamentButton" class="btn btn-primary">Tournament 🏆</button>
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
			<h2>Tournament</h2>
			<p>Work in progress...</p>
		</div>
	`;
}

function openTournamentPage()
{
	document.getElementById('app').innerHTML = tournamentPage();
}

