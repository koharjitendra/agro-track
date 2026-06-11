import { Server } from 'socket.io';
import { verifyToken } from './jwt.js';
import { getTokenFromSocket } from './authCookie.js';
import config from '../config/env.js';

let io = null;

/**
 * Initialize Socket.IO on the HTTP server.
 * Must be called once in server.js before listening.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGINS,
      credentials: true,
    },
  });

  // JWT authentication middleware for every socket connection
  io.use((socket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = verifyToken(token);
      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Each user joins a room named by their userId
    const roomId = socket.user.id.toString();
    socket.join(roomId);

    socket.on('disconnect', () => {
      socket.leave(roomId);
    });
  });

  console.log('[SOCKET] Socket.IO initialized');
  return io;
};

/**
 * Get the initialized Socket.IO instance.
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized. Call initSocket() first.');
  }
  return io;
};

/**
 * Emit an event to a specific user's room.
 * @param {string} userId
 * @param {string} event
 * @param {object} payload
 */
export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(userId.toString()).emit(event, {
    event,
    ...payload,
    timestamp: new Date().toISOString(),
  });
};
