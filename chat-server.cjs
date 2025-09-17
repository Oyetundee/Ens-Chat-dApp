// chat-server.js
const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store connected users and messages
const connectedUsers = new Map(); // address -> { ws, ensName, lastActivity }
const messageHistory = []; // Store recent messages
const MAX_MESSAGES = 1000; // Keep last 1000 messages

console.log('🚀 ENS Chat Dapp WebSocket Server Starting...');

wss.on('connection', (ws, request) => {
  console.log('New connection established');
  let userAddress = null;
  let ensName = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'auth':
          // Authenticate user
          userAddress = message.address;
          ensName = message.ensName;
          
          // Store connection
          connectedUsers.set(userAddress, {
            ws,
            ensName,
            lastActivity: Date.now()
          });
          
          console.log(`✅ User authenticated: ${ensName} (${userAddress})`);
          
          // Send auth success
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'Authentication successful'
          }));
          
          // Send recent messages
          const recentMessages = messageHistory.slice(-50);
          recentMessages.forEach(msg => {
            ws.send(JSON.stringify({
              type: 'message',
              ...msg
            }));
          });
          
          break;

        case 'send_message':
          if (!userAddress) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not authenticated'
            }));
            return;
          }

          const newMessage = {
            id: message.id,
            from: message.from,
            to: message.to,
            content: message.content,
            timestamp: message.timestamp,
            fromName: message.fromName,
            toName: message.toName,
            serverTimestamp: Math.floor(Date.now() / 1000)
          };

          // Store message
          messageHistory.push(newMessage);
          
          // Keep only recent messages
          if (messageHistory.length > MAX_MESSAGES) {
            messageHistory.shift();
          }

          console.log(`📨 Message from ${newMessage.fromName}: ${newMessage.content}`);

          // Broadcast to all connected users
          const messageData = JSON.stringify({
            type: 'message',
            ...newMessage
          });

          connectedUsers.forEach((user, address) => {
            if (user.ws.readyState === WebSocket.OPEN) {
              user.ws.send(messageData);
            }
          });

          break;

        case 'typing':
          if (!userAddress) return;
          
          // Broadcast typing indicator to other users
          const typingData = JSON.stringify({
            type: 'typing',
            from: userAddress,
            fromName: message.fromName,
            chat: message.chat
          });

          connectedUsers.forEach((user, address) => {
            if (address !== userAddress && user.ws.readyState === WebSocket.OPEN) {
              user.ws.send(typingData);
            }
          });

          break;

        default:
          console.log('Unknown message type:', message.type);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    if (userAddress) {
      connectedUsers.delete(userAddress);
      console.log(`❌ User disconnected: ${ensName} (${userAddress})`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🎉 ENS Chat Dapp server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
});