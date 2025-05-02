/*  tournamentOnlineFixed.js  */
/*───────────────────────────────────────────────────────────*/
/*  AUTH – do NOT touch these two functions  */
function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

function getCurrentUserId() {
  const id = localStorage.getItem('userId');
  return id ? parseInt(id, 10) : null;
}

/*───────────────────────────────────────────────────────────*/
import { playPong } from './pong.js';

/* GLOBAL STATE */
let tourId  = null;      // current tournament ID
let matches = [];        // bracket state from server

/*================ PUBLIC ENTRY ================*/
export function openOnlineTournamentPage() {
  document.getElementById('app').innerHTML = markup();
  init();
}

/*================ MARKUP ================*/
function markup() {
  return `
<div class="text-center">
  <h2>Online Tournament 🏆</h2>

  <div id="tournamentsSection">
    <!-- create tournament form -->
    <h3>Create Tournament</h3>
    <input id="tName" class="form-control mb-2" placeholder="Name">
    <input id="tMax"  class="form-control mb-2" type="number"
           placeholder="Max players (power of 2)" min="2">
    <input id="tDesc" class="form-control mb-2" placeholder="Description">
    <button id="createTournamentBtn" class="btn btn-success mb-4">
      Create
    </button>

    <!-- list of tournaments -->
    <h3>Available Tournaments</h3>
    <ul id="tournamentList" class="list-group"></ul>
  </div>

  <div id="tournamentDetails" class="mt-4" style="display:none;">
    <button id="backBtn" class="btn btn-link mb-3">← back</button>
    <h3 id="currentTournamentName"></h3>
    <p id="participantCount" data-max="0"></p>
    <ul id="participantList" class="list-group mb-3"></ul>
    <button id="joinBtn"  class="btn btn-primary me-2">Join</button>
    <button id="startBtn" class="btn btn-warning">Start Tournament</button>

    <!-- game canvas -->
    <div id="matchArea" class="mt-4" style="display:none;">
      <h4 id="matchPlayers"></h4>
      <div id="matchStatus" class="small text-muted mb-1"></div>
      <canvas id="pongCanvas" width="500" height="300" class="border"></canvas>
    </div>

    <!-- bracket view -->
    <div id="bracketView" class="d-flex flex-wrap gap-3 mt-4"></div>
  </div>
</div>`;
}

/*================ INIT & LIST ================*/
function init() {
  document.getElementById('createTournamentBtn')
          .addEventListener('click', createTournament);
  loadTournaments();
}

function loadTournaments() {
  fetch('/api/tournaments/all', { headers: getAuthHeaders() })
    .then(r => r.json())
    .then(data => {
      const list = Array.isArray(data) ? data : (data.results || []);
      renderList(list);
    })
    .catch(e => alert('Load error: ' + e));
}

function renderList(tours) {
  const ul = document.getElementById('tournamentList');
  ul.innerHTML = '';
  tours.filter(t => !t.is_finished).forEach(t => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <span><b>${t.name}</b> 
            (${t.current_players_count}/${t.max_players})
      </span>
      <button class="btn btn-sm btn-primary">Details</button>
    `;
    li.querySelector('button').onclick = () => showDetails(t.id);
    ul.appendChild(li);
  });
}

/*================ DETAILS ================*/
function showDetails(id) {
  fetch(`/api/tournaments/details/${id}/`, { headers: getAuthHeaders() })
    .then(r => r.json())
    .then(t => {
      // set state and store creator for later checks
      tourId = t.id;
      localStorage.setItem('creatorUserId', t.creator.id);

      // always connect WS for live updates (reconnect if needed)
      closeTourWs();
      openTourWs(tourId);

      // hide list, show details
      document.getElementById('tournamentsSection').style.display = 'none';
      const det = document.getElementById('tournamentDetails');
      det.style.display = 'block';

      // title and participant count
      document.getElementById('currentTournamentName').textContent = t.name;
      const pCount = document.getElementById('participantCount');
      pCount.textContent = `Players: ${t.current_players_count}/${t.max_players}`;
      pCount.dataset.max = t.max_players;

      // render existing participants
      const ulP = document.getElementById('participantList');
      ulP.innerHTML = '';
      (t.participants || []).forEach(p => {
        ulP.insertAdjacentHTML('beforeend',
          `<li class="list-group-item" data-pid="${p.id}">${p.username}</li>`
        );
      });

      // back button
      document.getElementById('backBtn').onclick = () => {
        det.style.display = 'none';
        document.getElementById('tournamentsSection').style.display = 'block';
        closeTourWs();
        loadTournaments();
      };

      // join button visibility & handler
      const meId   = getCurrentUserId();
      const joined = (t.participants||[]).some(p => p.id === meId);
      const joinBtn = document.getElementById('joinBtn');
      joinBtn.style.display =
      (!joined && t.current_players_count < t.max_players && !t.is_started)
      ? '' : 'none';
      joinBtn.onclick = () => joinTournament(id, joinBtn);


      // start button visibility & handler
      const creatorId = t.creator.id;
      const startBtn  = document.getElementById('startBtn');
      const canStart  =
      t.current_players_count === t.max_players &&
      !t.is_started &&
      creatorId === meId;
      startBtn.style.display = canStart ? '' : 'none';
      startBtn.onclick = () => startTournament(id);
    })
    .catch(e => alert('Details error: ' + e));
}

/*================ MUTATIONS ================*/
function createTournament() {
  const body = {
    name        : document.getElementById('tName').value.trim(),
    max_players : Number(document.getElementById('tMax').value),
    description : document.getElementById('tDesc').value.trim(),
  };
  fetch('/api/tournaments/create', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(loadTournaments)
  .catch(e => alert('Create failed: ' + e));
}

function joinTournament(id, btn) {
  btn.disabled = true;
  fetch(`/api/tournaments/join/${id}/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(() => showDetails(id))
  .catch(e => { alert('Join failed: ' + e); btn.disabled = false; });
}

function startTournament(id) {
  fetch(`/api/tournaments/start/${id}/`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .catch(e => alert('Start failed: ' + e));
}

/*================ WEBSOCKET ================*/
let tourWs = null;

function openTourWs(id = tourId) {
  if (tourWs) return;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const token = localStorage.getItem('accessToken');
  tourWs = new WebSocket(`${proto}://${location.host}/ws/tournament/${id}/?token=${token}`);
  tourWs.onmessage = e => handleTournamentMsg(JSON.parse(e.data));
  tourWs.onclose   = () => { tourWs = null; console.warn('Tournament WS closed'); };
}

function closeTourWs() {
  if (!tourWs) return;
  tourWs.close();
  tourWs = null;
}

function handleTournamentMsg(msg) {
  switch (msg.type) {
    case 'participant_update':
      addParticipant(msg.player);
      break;

    case 'init':
      matches = msg.payload.matches || [];
      renderBracket();
      break;

    case 'match_update':
      updateMatch(msg.payload);
      break;

    case 'round_finished':
      alert(`Round ${msg.round} finished!`);
      break;

    case 'match_ready':
      playMatch(msg.room, msg.match_id);
      break;

    case 'tournament_finished':
      alert(`🏆 Winner: ${msg.winner}`);
      break;
  }
}

/*================ BRACKET UI ================*/
function renderBracket() {
  const rounds = groupByRound(matches);
  const root = document.getElementById('bracketView');
  root.innerHTML = '';
  rounds.forEach((round, idx) => {
    const col = document.createElement('div');
    col.innerHTML = `<h5>Round ${idx + 1}</h5>`;
    round.forEach(m => {
      col.insertAdjacentHTML('beforeend', `
        <div class="border rounded p-2 mb-2">
          ${(m.player1.username)} <b>${m.score_p1 ?? ''}</b> vs 
          ${(m.player2.username)} <b>${m.score_p2 ?? ''}</b>
        </div>
      `);
    });
    root.appendChild(col);
  });
}

function groupByRound(arr) {
  const map = new Map();
  arr.forEach(m => {
    const r = m.round_number || 1;
    (map.get(r) || map.set(r, []).get(r)).push(m);
  });
  return Array.from(map.values());
}

function updateMatch(m) {
  const i = matches.findIndex(x => x.id === m.id || x.match_id === m.match_id);
  if (i >= 0) matches[i] = m;
  else matches.push(m);
  renderBracket();
}

/*================ GAME FLOW ================*/
let activeGameWs = null;   // GameConsumer socket (per‑match scope)
let awaitingStart = false; // first player waits until opponent joins

function playMatch(room, matchId) {
  if (activeGameWs) { activeGameWs.close(); }

  const match = matches.find(mm => mm.id === matchId || mm.match_id === matchId);
  const p1 = match.player1.username;
  const p2 = match.player2.username;

  // show canvas
  document.getElementById('matchArea').style.display = 'block';
  document.getElementById('matchPlayers').textContent = `${p1} vs ${p2}`;
  document.getElementById('matchStatus').textContent   = 'Waiting for opponent…';

  awaitingStart = false;
  pongStarted  = false;

  /* ──── connect to GameConsumer ──── */
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  // activeGameWs = new WebSocket(`${proto}://${location.host}/ws/game/${room}/`);

  const token = localStorage.getItem('accessToken');
  activeGameWs = new WebSocket(`${proto}://${location.host}/ws/game/${room}/?token=${token}`);

  activeGameWs.onopen  = () => console.log("✅ Game WS open");
  activeGameWs.onclose = e  => console.warn("❌ Game WS closed:", e);

  activeGameWs.onmessage = e => {
    console.log("📩 Game WS message:", e.data);
    handleGameMsg(JSON.parse(e.data), matchId);
  };


  activeGameWs.onopen    = () => { /* no-op */ };
  activeGameWs.onmessage = e => handleGameMsg(JSON.parse(e.data), matchId);
  activeGameWs.onclose   = () => {
    activeGameWs = null;
    document.getElementById('matchArea').style.display = 'none';
  };
}

function handleGameMsg(msg, matchId) {
  switch (msg.type) {
    case 'init':
      /* we are connected but game may still wait 2nd player */
      awaitingStart = true;
      break;

    case 'waiting':
      awaitingStart = true;
      break;

    case 'state':
      if (awaitingStart) {
        awaitingStart = false;
        document.getElementById('matchStatus').textContent = '';
        startLocalPong(matchId);
      }
      /* let playPong receive the full state through its own WS */
      break;

    case 'end':
      // the back‑end closed the game (time or score) – hide canvas handled in onclose
      break;
  }
}

/* helper to launch local pong renderer exactly once */
let pongStarted = false;
function startLocalPong(matchId) {
  if (pongStarted) return;
  pongStarted = true;
  playPong({
    remote: true,
    canvas: document.getElementById('pongCanvas'),
    socket: activeGameWs,
    onGameEnd: winnerSide => {
      const body = {
        score_p1: winnerSide === 'left'  ? 1 : 0,
        score_p2: winnerSide === 'right' ? 1 : 0,
      };
      fetch(`/api/matches/report/${matchId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      }).catch(() => {});
    }
  });
}

/*================ PARTICIPANT UPDATE ================*/
function addParticipant(p) {
  const ul = document.getElementById('participantList');

  /* check if this player is already in the list */
  if (!ul.querySelector(`[data-pid="${p.id}"]`)) {
    ul.insertAdjacentHTML(
      'beforeend',
      `<li class="list-group-item" data-pid="${p.id}">${p.username}</li>`
    );
  }

  /* recalc unique count */
  const uniqueCnt = ul.querySelectorAll('li').length;
  const pCount    = document.getElementById('participantCount');
  const max       = Number(pCount.dataset.max);
  pCount.textContent = `Players: ${uniqueCnt}/${max}`;

  /* show Start if I'm creator and roster is full */
  const meId      = getCurrentUserId();
  const creatorId = Number(localStorage.getItem('creatorUserId'));
  if (uniqueCnt === max && meId === creatorId) {
    document.getElementById('startBtn').style.display = '';
  }
}
