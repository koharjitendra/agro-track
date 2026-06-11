import { createServer } from 'http';
import app from './app.js';
import env from './config/env.js';
import connectDB from './config/db.js';
import { initSocket } from './utils/socket.js';
import { ensureDeliveryConfig } from './utils/checkout.js';

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Ensure default delivery config is seeded
    await ensureDeliveryConfig();

    // Create HTTP server wrapping the Express app
    const httpServer = createServer(app);

    // Attach Socket.IO to the HTTP server
    initSocket(httpServer);

    // Start listening
    httpServer.listen(env.PORT, () => {
      console.log(`[SERVER] Running on port ${env.PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
      console.log(`[SERVER] Socket.IO enabled`);
    });
  } catch (error) {
    console.error('[SERVER] Failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
