import {playPong} from './pong.js'

function gamePage()
{
	return `
		<div class="text-center">
			<h2 class="text-center">Local Pong Game</h1>
			<canvas id="pongCanvas" width="600" height="400"></canvas>
			<p>Use W and S for Player 1 (left) and Arrow keys for Player 2 (right)</p>
		</div>
	`;
}

export function openGamePage()
{
	document.getElementById('app').innerHTML = gamePage();

	playPong();
}
