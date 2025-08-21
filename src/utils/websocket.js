import { WebSocketServer, WebSocket } from 'ws';

// Store WebSocket connections with metadata
const wsConnections = new Map();
const connectionMetadata = new Map();

// CRITICAL FIX: Add heartbeat to detect stale connections
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 60000; // 60 seconds

export function setupWebSocket(server) {
  console.log('🔌 Setting up WebSocket server...');
  
  // Use a specific path to avoid conflict with Vite HMR WebSocket
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    // CRITICAL FIX: Limit payload size to prevent memory attacks
    maxPayload: 10 * 1024 * 1024, // 10MB max message size
    clientTracking: true,
    perMessageDeflate: false // Disable compression for better performance
  });
  
  // CRITICAL FIX: Heartbeat mechanism to clean up dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const metadata = connectionMetadata.get(ws);
      if (!metadata) {
        ws.terminate();
        return;
      }
      
      if (Date.now() - metadata.lastSeen > CONNECTION_TIMEOUT) {
        // Connection is stale, clean it up
        if (metadata.userId) {
          wsConnections.delete(metadata.userId);
        }
        connectionMetadata.delete(ws);
        ws.terminate();
        return;
      }
      
      // Send ping to check if connection is alive
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, HEARTBEAT_INTERVAL);
  
  wss.on('connection', (ws, req) => {
    console.log('📡 New WebSocket connection established');
    
    // Initialize connection metadata
    connectionMetadata.set(ws, {
      userId: null,
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      messageCount: 0
    });
    
    let userId = null;
    
    // CRITICAL FIX: Handle pong responses to keep connection alive
    ws.on('pong', () => {
      const metadata = connectionMetadata.get(ws);
      if (metadata) {
        metadata.lastSeen = Date.now();
      }
    });
    
    ws.on('message', (message) => {
      try {
        const metadata = connectionMetadata.get(ws);
        if (metadata) {
          metadata.lastSeen = Date.now();
          metadata.messageCount++;
          
          // CRITICAL FIX: Rate limiting - prevent message flooding
          if (metadata.messageCount > 100) {
            console.warn(`⚠️ User ${userId} sending too many messages, closing connection`);
            ws.close(1008, 'Rate limit exceeded');
            return;
          }
        }
        
        const data = JSON.parse(message.toString());
        
        if (data.type === 'authenticate' && data.userId) {
          userId = parseInt(data.userId);
          
          // CRITICAL FIX: Clean up old connection for same user
          const oldConnection = wsConnections.get(userId);
          if (oldConnection && oldConnection !== ws) {
            oldConnection.close(1000, 'Replaced by new connection');
          }
          
          wsConnections.set(userId, ws);
          
          if (metadata) {
            metadata.userId = userId;
          }
          
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
      connectionMetadata.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      if (userId) {
        wsConnections.delete(userId);
      }
      connectionMetadata.delete(ws);
    });
  });
  
  // CRITICAL FIX: Clean up on server shutdown
  process.on('SIGTERM', () => {
    clearInterval(heartbeatInterval);
    wss.close();
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

// Send to specific shop owner only
export async function broadcastToShop(shopId, message) {
  try {
    // Import Shop model to find shop owner
    const { Shop } = await import('../models/index.js');
    const shop = await Shop.findByPk(shopId);
    
    if (shop && shop.ownerId) {
      // Send only to shop owner, not all users
      sendToUser(shop.ownerId, message);
    }
  } catch (error) {
    console.error('Error sending to shop owner:', error);
  }
}

// Send order updates to relevant parties only
export async function broadcastOrderUpdate(order, eventType) {
  const message = {
    type: `order:${eventType}`,
    orderId: order.id,
    shopId: order.shopId,
    customerId: order.customerId,
    order: order,
    timestamp: new Date().toISOString()
  };
  
  // Send to customer only if they exist
  if (order.customerId) {
    sendToUser(order.customerId, message);
  }
  
  // Send to shop owner only
  await broadcastToShop(order.shopId, message);
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
}

export { wsConnections };