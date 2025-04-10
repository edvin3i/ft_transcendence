let socket = null;
let receivedHistory = false;


function openChat(room = "general") {
	const protocol = window.location.protocol === "https:" ? "wss" : "ws";
	const token = localStorage.getItem("access_token");
	const wsUrl = `${protocol}://${window.location.host}/ws/chat/${room}/?token=${token}`;

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
			document.getElementById("chat-log").innerHTML = "";
			openChat(room);
		}
	});
});
