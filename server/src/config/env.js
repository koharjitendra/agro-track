import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required. Copy server/.env.example to server/.env');
}
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

const config = {
  PORT: Number(process.env.PORT) || 8080,
  MONGO_URL: process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agro_track',
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
};

export default config;
