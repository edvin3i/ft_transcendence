const roomName = "general";  // Tu peux changer dynamiquement si besoin
const socket = new WebSocket("ws://localhost:8001/ws/chat/general/");


socket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    const chatLog = document.getElementById("chat-log");
    const p = document.createElement("p");
    p.innerHTML = `<strong>${data.username}</strong> : ${data.message}`;
    chatLog.appendChild(p);
};

socket.onopen = function () {
    console.log("WebSocket connecté");
};

socket.onclose = function (event) {
    console.warn("WebSocket fermé :", event);
    if (event.code === 1006) {
        console.warn("⚠️ Peut-être un problème d'authentification ?");
    }
};


document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("chat-message-input");
    const sendButton = document.getElementById("send");

    sendButton.addEventListener("click", () => {
        if (input.value.trim() !== "") {
            socket.send(JSON.stringify({ message: input.value }));
            input.value = "";
        }
    });

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendButton.click();
        }
    });
});
