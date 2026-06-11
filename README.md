# 🌾 Agro Track — Farmer Ledger

A full-stack MERN application for farmers and buyers to track crop cycles, expenses, sales, and shared transactions with a mutual approval workflow.

## Features

- **Farmer Dashboard**: Track crop cycles, expenses, sales, and profit
- **Buyer Dashboard**: Track purchases, due amounts, payment history
- **Shared Transactions**: Buyer-farmer approval workflow (PENDING → FINAL)
- **Revision History**: Immutable audit trail for all transaction changes
- **Analytics**: Charts for expense breakdown, sales trends, profit summaries
- **Responsive**: Works on all devices — mobile, tablet, desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (httpOnly cookie) + bcrypt |
| Charts | Recharts |
| State | Zustand |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017 (or update `MONGO_URL` in `server/.env`)

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Environment
```bash
cd server
cp .env.example .env
# Edit .env: JWT_SECRET must be at least 32 characters
```

```bash
cd client
cp .env.example .env
```

### 3. Backend
```bash
cd server
npm run dev
```
Server: **http://localhost:8080** · Health: **http://localhost:8080/health**

### 4. Frontend
```bash
cd client
npm run dev
```
Client: **http://localhost:5173** (API proxied to `/api`)

### Optional seed data
```bash
cd server
npm run seed
```

## API

See [docs/api.md](docs/api.md).

## Security notes

- Never commit `server/.env` or real credentials in `.env.example`
- Use a strong `JWT_SECRET` (32+ characters) in production
- Set `COOKIE_SECURE=true` when serving over HTTPS

## License
MIT
