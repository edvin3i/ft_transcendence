const ws = new WebSocket('wss://localhost/wss/');
ws.onopen = () => console.log("Connected!");
ws.onmessage = (msg) => console.log("Got:", msg.data);