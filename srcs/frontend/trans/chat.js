let socket = null;

function openChat() {
	const protocol = window.location.protocol === "https:" ? "wss" : "ws";
	const wsUrl = `${protocol}://${window.location.host}/ws/chat/general/`;

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

	document.getElementById("send").addEventListener("click", () => {
		const input = document.getElementById("chat-message-input");
		if (input.value.trim() !== "") {
			socket.send(JSON.stringify({ message: input.value }));
			input.value = "";
		}
	});

	document.getElementById("chat-message-input").addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			document.getElementById("send").click();
		}
	});
}

document.addEventListener("DOMContentLoaded", openChat);

