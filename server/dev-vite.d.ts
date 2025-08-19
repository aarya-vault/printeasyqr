// Type declarations for JavaScript modules
declare module '../server/storage/storageManager.js' {
  const storageManager: {
    initialize: () => Promise<void>;
  };
  export default storageManager;
}

declare module '../src/app.js' {
  import { Express } from 'express';
  const app: Express;
  export default app;
}

declare module '../src/utils/websocket.js' {
  import { Server } from 'http';
  export function setupWebSocket(server: Server): void;
}