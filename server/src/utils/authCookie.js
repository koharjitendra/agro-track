import config from '../config/env.js';

const COOKIE_NAME = 'token';

export const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: config.COOKIE_SECURE,
  sameSite: config.COOKIE_SECURE ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, getAuthCookieOptions());
};

export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: config.COOKIE_SECURE ? 'none' : 'lax',
    path: '/',
  });
};

export const getTokenFromRequest = (req) => {
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

/**
 * Extract JWT from a Socket.IO handshake.
 * Checks: handshake.auth.token → handshake.headers.authorization → handshake.headers.cookie
 */
export const getTokenFromSocket = (socket) => {
  // 1. Explicit token in handshake auth payload
  if (socket.handshake?.auth?.token) {
    return socket.handshake.auth.token;
  }
  // 2. Authorization header
  const authHeader = socket.handshake?.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  // 3. Cookie header (parse manually)
  const cookieHeader = socket.handshake?.headers?.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
};
