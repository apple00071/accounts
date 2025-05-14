const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

let wss;

const initWebSocket = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    // Extract token from query string
    const url = new URL(req.url, 'ws://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.businessId = decoded.businessId;

      // Send initial connection success message
      ws.send(JSON.stringify({ type: 'connection', status: 'success' }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  });
};

const handleWebSocketMessage = (ws, data) => {
  // Handle different message types here
  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
    // Add more message type handlers as needed
  }
};

const broadcastToBusinesses = (businessIds, data) => {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      businessIds.includes(client.businessId)
    ) {
      client.send(JSON.stringify(data));
    }
  });
};

module.exports = {
  initWebSocket,
  broadcastToBusinesses
}; 