import {playPong} from './pong.js'

function gamePage() {
	return `
	  <div class="text-center">
		<h2>Pong Game</h2>
		<canvas id="pongCanvas" width="600" height="400"></canvas>
		<p>
		  <button onclick="window.playPong({ remote: false })">🎮 Local</button>
		  <button onclick="window.playPong({ remote: true })">🌐 Remote</button>
		</p>
	  </div>
	`;
}
  

export function openGamePage()
{
	document.getElementById('app').innerHTML = gamePage();
	
}

