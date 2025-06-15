const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const players = new Map();

wss.on('connection', function connection(ws) {
  const id = Date.now() + Math.random().toString(36).substring(2);
  players.set(ws, { id, x: 400, y: 300 });

  ws.send(JSON.stringify({ type: 'init', id, players: Array.from(players.values()) }));

  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      if (data.type === 'move') {
        const player = players.get(ws);
        if (!player) return;
        player.x = data.x;
        player.y = data.y;
        broadcast({ type: 'update', id: player.id, x: player.x, y: player.y });
      }
    } catch (e) {
      console.error('Failed to parse message', e);
    }
  });

  ws.on('close', function() {
    const player = players.get(ws);
    players.delete(ws);
    if (player) broadcast({ type: 'remove', id: player.id });
  });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

console.log('WebSocket server running on port 8080');
