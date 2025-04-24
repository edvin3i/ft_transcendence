import { playPong } from "./pong.js";

function gamePage() {
  return `
    <div class="text-center">
      <h2>Pong Game</h2>

      <p id="playerLabel" style="font-weight:bold; margin-bottom:10px;"></p>
      <canvas id="pongCanvas" width="500" height="300"></canvas>
      <p id="playerNames" style="font-weight:bold;"></p>
      <p id="gameTimer" style="font-size: 18px;"></p>

      <p style="margin-top:10px;">
        <input id="roomInput" placeholder="Enter room name" value="myroom" />
      </p>

      <p>
        <button id="localButton">🎮 Local</button>
        <button id="remoteButton">🌐 Remote</button>
        <button id="endGameButton" style="display:none;">❌ End Game</button>
        <button id="resetGameButton" style="display:none;">🔄 Reset Game</button>
      </p>

      <p id="pongStatus" style="margin-top:10px; color: #fff;"></p>
    </div>
  `;
}

export function openGamePage() {
  document.getElementById("app").innerHTML = gamePage();

  // local game
  const localButton = document.getElementById("localButton");
  localButton.addEventListener("click", () =>
    playPong({ remote: false })
  );

  // remote
  const remoteButton = document.getElementById("remoteButton");
  remoteButton.addEventListener("click", () => {
    const room = document.getElementById("roomInput").value;
    playPong({ remote: true, room });
  });
}
