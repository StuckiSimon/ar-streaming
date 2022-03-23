const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 }, () => {
  console.log("Signalling server is now listening on port 8080");
});

// Broadcast to all.
wss.broadcast = (ws, data) => {
  wss.clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

let clientId = 0;
wss.on("connection", (ws) => {
  const myId = clientId++;
  console.log(
    `Client connected ${myId}. Total connected clients: ${wss.clients.size}`
  );

  ws.onmessage = (message) => {
    console.log(`${myId}: ` + message.data + "\n");
    wss.broadcast(ws, message.data);
  };

  ws.onclose = () => {
    console.log(
      `Client disconnected ${myId}. Total connected clients: ${wss.clients.size}`
    );
  };
});
