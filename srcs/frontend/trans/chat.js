let socket = null;

function openChat(room = "general") {
	const protocol = window.location.protocol === "https:" ? "wss" : "ws";
	const token = localStorage.getItem("access_token"); // récupère le JWT
	const wsUrl = `${protocol}://${window.location.host}/ws/chat/${room}/?token=${token}`;

	// 👇 Fermer l'ancien socket proprement si besoin
	if (socket) {
		socket.onopen = null;
		socket.onmessage = null;
		socket.onclose = null;
		socket.close();
	}

	// ✅ Mise à jour du nom de room affiché
	document.getElementById("current-room-name").textContent = room;

	console.log("💬 Connecting to:", wsUrl);
	socket = new WebSocket(wsUrl);

	socket.onopen = () => {
		console.log("✅ WebSocket connecté :", wsUrl);
	};

	socket.onmessage = function (e) {
		const data = JSON.parse(e.data);
		const chatLog = document.getElementById("chat-log");
		const p = document.createElement("p");
		p.innerHTML = `<strong>${data.username || "Anonymous"}</strong> : ${data.message}`;
		chatLog.appendChild(p);
	};

	socket.onclose = function (event) {
		console.warn("❌ WebSocket fermé :", event);
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
	openChat(); // default
	
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
