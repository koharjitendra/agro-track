# Agro Track API

Base URL (development): `http://localhost:8080`  
Frontend proxy: `http://localhost:5173/api` → server

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register; sets httpOnly `token` cookie |
| POST | `/api/auth/login` | No | Login; sets httpOnly `token` cookie |
| POST | `/api/auth/logout` | No | Clears auth cookie |
| GET | `/api/auth/me` | Yes | Current user profile |

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server and DB status |

## Protected modules

All routes below require a valid session (cookie or `Authorization: Bearer`).

- `/api/users` — profile, counterparty search (`?role=FARMER|BUYER`)
- `/api/crop-cycles` — farmer only
- `/api/expenses` — farmer only
- `/api/transactions` — list (paginated), CRUD, approve/reject/revise, `GET /:id/revisions`
- `/api/approvals` — pending queue, decision history
- `/api/analytics` — role-specific charts

Responses use `{ success, message, data }`.
