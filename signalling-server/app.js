const WebSocket = require("ws");

const port = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port }, () => {
  console.log(`Signalling server is now listening on port ${port}`);
});

const broadcast = (self, data) => {
  wss.clients.forEach((client) => {
    if (client !== self && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

let clientId = 0;
wss.on("connection", (ws) => {
  const myId = clientId++;
  console.log(
    `Client #${myId} connected. Total connected clients: ${wss.clients.size}`
  );

  ws.onmessage = (message) => {
    console.log(`#${myId}: ` + message.data + "\n");
    broadcast(ws, message.data);
  };

  ws.onclose = () => {
    console.log(
      `Client #${myId} disconnected. Total connected clients: ${wss.clients.size}`
    );
  };
});
