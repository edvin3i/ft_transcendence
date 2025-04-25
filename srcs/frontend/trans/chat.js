let socket = null;
let openRooms = new Set();
let currentRoom = "general"; // par défaut

function chatPage()
{
	return `
		<div class="d-flex justify-content-between align-items-center px-4" style="min-height: 100px;">
			<!-- Chat Button à gauche -->
			<button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#chatBox" aria-expanded="false" aria-controls="chatBox">Chat 💬</button>
		</div>
		<div class="collapse" id="chatBox">
			<div class="card bg-dark text-light shadow" id="chat-section" style="display: block;">
				<section id="chat">
					<h2>Live Chat</h2>
					<div class="mb-2">
						<input id="room-name" type="text" placeholder="Enter room name" class="form-control d-inline w-auto" />
						<button id="join-room" class="btn btn-primary btn-sm">Join Room</button>
					</div>
					<p id="current-room" class="fw-bold text-info">
						🟢 Room: <span id="current-room-name">general</span>
					</p>
					<div id="chat-tabs" class="nav nav-tabs mb-3">
						<!-- Onglets ajoutés dynamiquement ici -->
					</div>			  
					<div id="chat-log" style="height: 200px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px;">
					</div>
					<input id="chat-message-input" type="text" placeholder="Type a message...">
					<button id="send">Send</button>
				</section>
			</div>
		</div>
	`;
}

export function showChat()
{
	document.getElementById('chat').innerHTML = chatPage();

	addChatEventListeners();

	openChat();
}

export function closeChat()
{
	if (socket)
		socket.close();
}

function openChat(room = "general") {

//	console.log(openRooms);
// different on first and second log in, may be the reason of the bug, also check global variables
	let receivedHistory = false;

	const protocol = window.location.protocol === "https:" ? "wss" : "ws";
	const token = localStorage.getItem("accessToken");

	const wsUrl = `${protocol}://${window.location.host}/ws/chat/${room}/?token=${token}`;

	createChatTab(room);
	document.querySelectorAll("#chat-tabs button").forEach((btn) => {
		btn.classList.remove("active");
		if (btn.dataset.room === room) {
			btn.classList.add("active");
		}
	});
	currentRoom = room;
	
	if (socket) {
		socket.onopen = null;
		socket.onmessage = null;
		socket.onclose = null;
		socket.close();
	}

	document.getElementById("current-room-name").textContent = room;
	document.getElementById("chat-log").innerHTML = ""; // reset

	console.log("💬 Connecting to:", wsUrl);
	socket = new WebSocket(wsUrl);
	receivedHistory = false;

	socket.onopen = () => {
		console.log("✅ WebSocket connected:", wsUrl);
	};

	socket.onmessage = function (e) {
		const data = JSON.parse(e.data);
		const chatLog = document.getElementById("chat-log");
	
		// Detect first normal message (non-historique)
		if (!receivedHistory) {
			receivedHistory = true;
	
			// ✅ Affiche "connected" après les messages historiques
			const connectedP = document.createElement("p");
			connectedP.classList.add("fw-bold", "text-success", "mt-2");
			connectedP.style.fontStyle = "italic";
			connectedP.textContent = "✅ You are connected to the chat.";
			chatLog.appendChild(connectedP);
		}
	
		const timestamp = data.timestamp ? `<span class="text-info">[${data.timestamp}]</span>` : "";
		const sender = data.username || "Anonymous";
		const message = data.message;
	
		const p = document.createElement("p");
		p.innerHTML = `${timestamp} <strong>${sender}</strong> : ${message}`;
		chatLog.appendChild(p);
		chatLog.scrollTop = chatLog.scrollHeight;
	};
	

	socket.onclose = function (event) {
		console.warn("❌ WebSocket closed:", event);

		if (!event.wasClean && event.code === 1006) {
			console.warn("🛑 Likely invalid/expired token");
		//	handleLogout(); // was it a function from profile.js?
		}
	};

	document.getElementById("send").onclick = () => {
		const input = document.getElementById("chat-message-input");
		if (input.value.trim() !== "") {
			socket.send(JSON.stringify({ message: input.value }));
			input.value = "";
		}
	};

	document.getElementById("chat-message-input").addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			document.getElementById("send").click();
		}
	});
}

//document.addEventListener("DOMContentLoaded", addChatEventListeners);
		
function addChatEventListeners()
{
//	updateUIWithUser();

	document.getElementById("join-room").addEventListener("click", () => {
		const roomInput = document.getElementById("room-name");
		const room = roomInput.value.trim();
		console.log("🔁 Room switch requested to:", room);

		if (room) {
			switchRoom(room);
			document.getElementById("room-name").value = "";
		}
	});
	document.getElementById("room-name").addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			document.getElementById("join-room").click(); // 👈 Simule le clic
		}
	});
}

function createChatTab(room) {
	if (openRooms.has(room)) return;

	const tab = document.createElement("button");
	tab.className = "nav-link d-flex align-items-center";
	tab.dataset.room = room;
	tab.setAttribute("type", "button");

	const roomBtn = document.createElement("span");
	roomBtn.textContent = `#${room}`;
	roomBtn.className = "flex-grow-1";
	roomBtn.style.cursor = "pointer";
	roomBtn.onclick = () => switchRoom(room);

	tab.appendChild(roomBtn);

	// ❌ Ajouter le bouton "fermer" (sauf pour general)
	if (room !== "general") {
		const closeBtn = document.createElement("button");
		closeBtn.innerHTML = "&times;";
		closeBtn.className = "btn btn-sm btn-light ms-2";
		closeBtn.style.padding = "0 6px";
		closeBtn.onclick = (e) => {
			e.stopPropagation(); // évite de switcher de room en même temps
			closeChatTab(room);
		};
		tab.appendChild(closeBtn);
	}

	document.getElementById("chat-tabs").appendChild(tab);
	openRooms.add(room);
	if (room === currentRoom) {
		tab.classList.add("active", "bg-primary", "text-white");
	}	
}

function closeChatTab(room) {
	// Supprimer visuellement l'onglet
	const tab = document.querySelector(`#chat-tabs [data-room="${room}"]`);
	if (tab) tab.remove();

	openRooms.delete(room);

	// Si on ferme la room active, switcher vers "general"
	if (currentRoom === room) {
		switchRoom("general");
	}
}


function switchRoom(room) {
	if (room === currentRoom) return;

	document.querySelectorAll("#chat-tabs .nav-link").forEach((tab) => {
		tab.classList.remove("active", "bg-primary", "text-white");
		if (tab.dataset.room === room) {
			tab.classList.add("active", "bg-primary", "text-white");
		}
	});
	
	currentRoom = room;
	openChat(room);
}
