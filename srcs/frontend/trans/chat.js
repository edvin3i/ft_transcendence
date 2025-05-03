import { openUserProfilePage } from './userProfile.js';

let socket = null;
let chatWs = null;
let openRooms = new Set();
let currentRoom = "general"; // par défaut

function chatPage()
{
	return `
		<div class="d-flex justify-content-between align-items-center px-4" style="min-height: 100px;">
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
	openRooms.clear(); // ✅ état vierge à chaque appel
	document.getElementById('chat').innerHTML = chatPage();
	addChatEventListeners();
}

export function closeChat()
{
	if (chatWs)
		chatWs.close();
}

function getPrivateRoomName(userA, userB) {
	const sorted = [userA, userB].sort();
	return `dm__${sorted[0]}__${sorted[1]}`;
}

function startDirectMessage(targetUsername) {
	const myUsername = localStorage.getItem("username");
	if (!myUsername) return alert("Username not found in localStorage");
	const room = getPrivateRoomName(myUsername, targetUsername);
	switchRoom(room);
}

function addChatEventListeners()
{
	document.getElementById("join-room").addEventListener("click", () => {
		const roomInput = document.getElementById("room-name");
		const room = roomInput.value.trim();
	
		if (!room) return;
	
		if (room.startsWith("dm__")) {
			alert("❌ You cannot join a private DM room manually.");
			roomInput.value = "";
			return;
		}
	
		switchRoom(room);
		roomInput.value = "";
	});	

	document.getElementById("room-name").addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			document.getElementById("join-room").click();
		}
	});

	openChat(); // 👈 Lancement ici, une fois que tout est prêt
}

function openChat(room = "general") {
	let receivedHistory = false;
	const protocol = window.location.protocol === "https:" ? "wss" : "ws";
	const token = localStorage.getItem("accessToken");
	const wsUrl = `${protocol}://${window.location.host}/ws/chat/${room}/?token=${token}`;

	if (!openRooms.has(room)) {
		createChatTab(room);
	}	
	document.querySelectorAll("#chat-tabs button").forEach((btn) => {
		btn.classList.remove("active");
		if (btn.dataset.room === room) {
			btn.classList.add("active");
		}
	});
	currentRoom = room;

	if (chatWs) {
		chatWs.onopen = null;
		chatWs.onmessage = null;
		chatWs.onclose = null;
		chatWs.close();
	}

	document.getElementById("current-room-name").textContent = room;
	document.getElementById("chat-log").innerHTML = "";

	console.log("💬 Connecting to:", wsUrl);
	chatWs = new WebSocket(wsUrl);
	let pinginterval;
	chatWs.onopen = () => {
		console.log("✅ WebSocket connected:", wsUrl);
		pinginterval = setInterval(() => 
		{
    if (socket && socket.readyState === WebSocket.OPEN)
    			{
        			socket.send(JSON.stringify(
        				{
        					type: "ping" 
        				}
        				));
    			}
		}, 3000);
	};

	chatWs.onmessage = function (e) {
		const data = JSON.parse(e.data);

		console.log("📥 Message reçu du WebSocket:", data);
		
		if (data.type === "open_dm") {
			const room = data.room;
			if (!openRooms.has(room)) {
				switchRoom(room);
			}
			return;
		}

		const chatLog = document.getElementById("chat-log");

		if (!receivedHistory) {
			receivedHistory = true;
			const connectedP = document.createElement("p");
			connectedP.classList.add("fw-bold", "text-success", "mt-2");
			connectedP.style.fontStyle = "italic";
			connectedP.textContent = "✅ You are connected to the chat.";
			chatLog.appendChild(connectedP);
		}

		const timestamp = data.timestamp ? `[${data.timestamp}]` : "";
		const sender = data.username || "Anonymous";
		const senderId = data.user_id;
		const message = data.message;

		const p = document.createElement("p");

		const tsSpan = document.createElement("span");
		tsSpan.classList.add("text-info");
		tsSpan.textContent = timestamp + " ";
		p.appendChild(tsSpan);

		const senderSpan = document.createElement("strong");
		senderSpan.textContent = sender;
		senderSpan.style.cursor = "pointer";

		if (
			sender !== "SYSTEM" &&
			sender !== localStorage.getItem("username") &&
			senderId
		) {
			senderSpan.title = "Click to view profile";
			senderSpan.addEventListener("click", () => {
				openUserProfilePage(senderId-1); // 👈 utilise l’ID ici
			});
		}

		p.appendChild(senderSpan);
		const textNode = document.createTextNode(` : ${message}`);
		p.appendChild(textNode);

		chatLog.appendChild(p);
		chatLog.scrollTop = chatLog.scrollHeight;
	
	};

	chatWs.onclose = function (event) {
		console.warn("❌ WebSocket closed:", event);
		clearInterval(pinginterval);
		if (!event.wasClean && event.code === 1006) {
			console.warn("🛑 Likely invalid/expired token");
		}
	};
	window.addEventListener("beforeunload", () =>
	{
  		if (socket) socket.close();
	}
	);
	document.getElementById("send").onclick = () => {
		const input = document.getElementById("chat-message-input");
		if (input.value.trim() !== "") {
			chatWs.send(JSON.stringify({ message: input.value }));
			input.value = "";
		}
	};

	document.getElementById("chat-message-input").addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			document.getElementById("send").click();
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
	let label = `#${room}`;  // valeur par défaut

	if (room.startsWith("dm__")) {
		const [_, userA, userB] = room.split("__");
		const currentUser = localStorage.getItem("username");
		const otherUser = (userA === currentUser) ? userB : userA;
		label = `@${otherUser}`;
	}

	roomBtn.textContent = label;

	roomBtn.className = "flex-grow-1";
	roomBtn.style.cursor = "pointer";
	roomBtn.onclick = () => switchRoom(room);

	tab.appendChild(roomBtn);

	if (room !== "general") {
		const closeBtn = document.createElement("button");
		closeBtn.innerHTML = "&times;";
		closeBtn.className = "btn btn-sm btn-light ms-2";
		closeBtn.style.padding = "0 6px";
		closeBtn.onclick = (e) => {
			e.stopPropagation();
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
	const tab = document.querySelector(`#chat-tabs [data-room="${room}"]`);
	if (tab) tab.remove();
	openRooms.delete(room);
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