let socket = null;
let receivedHistory = false;
let openRooms = new Set();
let currentRoom = "general"; // par défaut

function openChat(room = "general") {
	const protocol = window.location.protocol === "https:" ? "wss" : "ws";
	const token = localStorage.getItem("access_token");
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
			handleLogout();
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

document.addEventListener("DOMContentLoaded", () => {
	updateUIWithUser();

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
});

function createChatTab(room) {
	if (openRooms.has(room)) return;

	const tab = document.createElement("div");
	tab.className = "nav-link d-flex align-items-center";
	tab.dataset.room = room;

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
