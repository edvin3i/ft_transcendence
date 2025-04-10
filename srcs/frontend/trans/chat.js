let socket = null;

function openChat(room = "general") {
	const protocol = window.location.protocol === "https:" ? "wss" : "ws";
	const token = localStorage.getItem("access_token");
	const wsUrl = `${protocol}://${window.location.host}/ws/chat/${room}/?token=${token}`;

	// 👇 Fermer proprement l'ancien socket
	if (socket) {
		socket.onopen = null;
		socket.onmessage = null;
		socket.onclose = null;
		socket.close();
	}

	document.getElementById("current-room-name").textContent = room;
	console.log("💬 Connecting to:", wsUrl);

	const chatLog = document.getElementById("chat-log");
	chatLog.innerHTML = ""; // 🔄 Clear log

	socket = new WebSocket(wsUrl);

	let hasDisplayedConnectionNotice = false;

	socket.onopen = () => {
		console.log("✅ WebSocket connecté :", wsUrl);
	};

	socket.onmessage = function (e) {
		const data = JSON.parse(e.data);
		const chatLog = document.getElementById("chat-log");
	
		// ⬇️ Affiche le message utilisateur
		const p = document.createElement("p");
		p.innerHTML = `<strong>${data.username || "Anonymous"}</strong> : ${data.message}`;
		chatLog.appendChild(p);
	
		// ✅ Message spécial à la fin de l'historique
		if (data.history_end) {
			const notice = document.createElement("p");
			notice.style.fontStyle = "italic";
			notice.classList.add("text-muted");
			notice.textContent = "✅ You are connected to the chat.";
			chatLog.appendChild(notice);
		}
	};
	

	socket.onclose = function (event) {
		console.warn("❌ WebSocket fermé :", event);

		if (!event.wasClean && event.code === 1006) {
			console.warn("🛑 Connexion refusée (probablement token expiré)");
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
			document.getElementById("chat-log").innerHTML = "";
			openChat(room);
		}
	});
});
