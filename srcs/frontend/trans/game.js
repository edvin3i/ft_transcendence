import { playPong } from "./pong.js";

function gamePage() {
  return `
    <div class="text-center">
      <h2>Pong Game</h2>

      <p id="playerLabel" style="font-weight:bold; margin-bottom:10px;"></p>
      <canvas id="pongCanvas" width="500" height="300"></canvas>

      <p style="margin-top:10px;">
        <input id="roomInput" placeholder="Enter room name" value="myroom" />
      </p>

      <p>
        <button onclick="window.playPong({ remote: false })">🎮 Local</button>
        <button onclick="
          const room = document.getElementById('roomInput').value;
          window.playPong({ remote: true, room: room });
        ">🌐 Remote</button>
        <button id="endGameButton" style="display:none;">❌ End Game</button>
      </p>

      <p id="pongStatus" style="margin-top:10px; color: #fff;"></p>
    </div>
  `;
}

export function openGamePage() {
  document.getElementById("app").innerHTML = gamePage();
}



