import { WebSocketServer, WebSocket } from 'ws';

// Store WebSocket connections
const wsConnections = new Map();

export function setupWebSocket(server) {
  console.log('🔌 Setting up WebSocket server...');
  
  // Use a specific path to avoid conflict with Vite HMR WebSocket
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('📡 New WebSocket connection established');
    
    let userId = null;
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'authenticate' && data.userId) {
          userId = parseInt(data.userId);
          wsConnections.set(userId, ws);
          console.log(`👤 User ${userId} authenticated via WebSocket`);
          
          ws.send(JSON.stringify({
            type: 'authenticated',
            message: 'WebSocket connection authenticated'
          }));
        }
      } catch (error) {
        console.error('❌ WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        wsConnections.delete(userId);
        console.log(`👋 User ${userId} WebSocket disconnected`);
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      if (userId) {
        wsConnections.delete(userId);
      }
    });
  });
  
  console.log('✅ WebSocket server setup completed');
}

// Send message to specific user
export function sendToUser(userId, message) {
  const ws = wsConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

// Broadcast to all connected users
export function broadcast(message) {
  wsConnections.forEach((ws, userId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Broadcast to specific shop's connected users
export function broadcastToShop(shopId, message) {
  // This will need shop-user mapping from database
  // For now, broadcast to all users and let client filter
  broadcast({ ...message, targetShopId: shopId });
}

// Broadcast order updates to relevant parties
export function broadcastOrderUpdate(order, eventType) {
  const message = {
    type: `order:${eventType}`,
    orderId: order.id,
    shopId: order.shopId,
    customerId: order.customerId,
    order: order,
    timestamp: new Date().toISOString()
  };
  
  // Send to customer
  sendToUser(order.customerId, message);
  
  // Send to shop owner (would need shop owner ID lookup)
  broadcastToShop(order.shopId, message);
  
  console.log(`📢 Broadcasted order:${eventType} for order ${order.id}`);
}

// Broadcast message updates
export function broadcastMessageUpdate(message, eventType) {
  const wsMessage = {
    type: `message:${eventType}`,
    messageId: message.id,
    orderId: message.orderId,
    senderId: message.senderId,
    recipientId: message.recipientId,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  // Send to both sender and recipient
  sendToUser(message.senderId, wsMessage);
  if (message.recipientId) {
    sendToUser(message.recipientId, wsMessage);
  }
  
  console.log(`📢 Broadcasted message:${eventType} for message ${message.id}`);
}

export { wsConnections };