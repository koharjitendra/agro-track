# 🌾 Agro Track — Farmer Ledger & Marketplace

A comprehensive, full-stack MERN application for farmers and buyers. Agro Track manages crop cycles, expenses, stock inventories, and peer-to-peer sales. It features an immutable shared ledger with a mutual approval workflow and an AI-driven Agronomy Decision Center.

---

## 🔗 Live Deployments

* **Deployed Frontend (Vercel)**: [https://agro-track-eight.vercel.app](https://agro-track-eight.vercel.app)
* **Deployed Backend (Render)**: [https://agro-track-tsxq.onrender.com](https://agro-track-tsxq.onrender.com)
* **API Health Status**: [https://agro-track-tsxq.onrender.com/health](https://agro-track-tsxq.onrender.com/health)

---

## 🚀 Key Features

* **Mutual Ledger & Shared Transactions**: Complete buyer-farmer invoice approval workflow. Transactions remain `PENDING` until mutually approved (`FINAL`), creating an immutable audit trail with full revision history.
* **Farmer & Buyer Dashboards**: Visual analytics showing expense breakdowns, sales trends, net profits, and outstanding due amounts.
* **Marketplace & Orders**: Farmers list products with custom quantities and prices. Buyers can browse, preview checkouts, order, and track delivery with a secure 6-digit verification code.
* **Inventory Management**: Track stock for seeds, fertilizers, pesticides, and equipment. Alerts farmers with automated low-stock warnings.
* **Agronomy Decision Center**: Advisory tools containing crop price trends, local weather recommendations, automated yield predictions, an AI agronomy chatbot, and plant disease detection.
* **Real-time Notifications**: Real-time push alerts powered by WebSockets (`socket.io`) for order status changes and transaction updates.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React (v18), Vite, Zustand (State Management), React Router Dom (v6), Recharts |
| **Backend** | Node.js, Express, Mongoose (MongoDB ORM), Socket.io, Zod (Validation), Helmet, Cookie-Parser |
| **Database** | MongoDB Atlas (Cloud Cluster) |
| **Security** | JWT (stored in `httpOnly` secure cookies), password hashing with `bcryptjs`, and IP rate-limiting |

---

## 📂 Project Structure

```text
agro_track2/
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── api/            # Axios API config
│   │   ├── features/       # Modular features (Farmer, Buyer, Marketplace, etc.)
│   │   ├── store/          # Zustand global states & WebSockets
│   │   └── App.jsx         # App router and layout entrypoint
│   └── package.json
│
├── server/                 # Express Backend
│   ├── src/
│   │   ├── config/         # Database and Env configs
│   │   ├── middlewares/    # Auth, validation, and error middlewares
│   │   ├── modules/        # Modular backend domains (auth, transactions, agronomy, etc.)
│   │   └── server.js       # App setup and WebSocket server starter
│   └── package.json
│
└── package.json            # Workspace controls for combined deployment
```

---

## 🛰️ Detailed API Reference

All requests to `/api/*` endpoints (except Auth registration/login and Health check) require a valid authentication session, established via an `httpOnly` JWT session cookie.

### 1. Authentication & Users
| Method | Endpoint | Auth Required | Role | Description |
|:---|:---|:---:|:---:|:---|
| **POST** | `/api/auth/register` | No | Any | Register user; sets session cookie |
| **POST** | `/api/auth/login` | No | Any | Log in user; sets session cookie |
| **POST** | `/api/auth/logout` | No | Any | Clears session cookie |
| **GET** | `/api/auth/me` | Yes | Any | Retrieve authenticated profile |
| **GET** | `/api/users` | Yes | Any | Search counter-parties (e.g. `?role=BUYER`) |

### 2. Ledger & Transaction Approvals
| Method | Endpoint | Auth Required | Role | Description |
|:---|:---|:---:|:---:|:---|
| **GET** | `/api/transactions` | Yes | Any | Get list of mutual transactions (paginated) |
| **POST** | `/api/transactions` | Yes | Any | Create a new shared transaction |
| **GET** | `/api/transactions/:id` | Yes | Any | View a single transaction details |
| **PUT** | `/api/transactions/:id` | Yes | Any | Edit a transaction (triggers revision history) |
| **DELETE** | `/api/transactions/:id` | Yes | Any | Cancel/delete a pending transaction |
| **GET** | `/api/transactions/:id/revisions` | Yes | Any | View history log of changes for a transaction |
| **GET** | `/api/approvals` | Yes | Any | View pending transaction queue |
| **POST** | `/api/approvals/:id/approve` | Yes | Any | Approve transaction (moves state to `FINAL`) |
| **POST** | `/api/approvals/:id/reject` | Yes | Any | Reject transaction |

### 3. Crop Cycles, Expenses & Activities
| Method | Endpoint | Auth Required | Role | Description |
|:---|:---|:---:|:---:|:---|
| **GET** | `/api/crop-cycles` | Yes | FARMER | List all crop cycles |
| **POST** | `/api/crop-cycles` | Yes | FARMER | Create a new crop cycle |
| **PUT** | `/api/crop-cycles/:id` | Yes | FARMER | Update cycle details |
| **DELETE** | `/api/crop-cycles/:id` | Yes | FARMER | Remove a crop cycle |
| **GET** | `/api/expenses` | Yes | FARMER | Get expense breakdown |
| **POST** | `/api/expenses` | Yes | FARMER | Log new crop expense |
| **GET** | `/api/crop-cycles/:cropCycleId/activities` | Yes | FARMER | List activities (irrigation, fertilizer) |
| **POST** | `/api/crop-cycles/:cropCycleId/activities` | Yes | FARMER | Log new activity |

### 4. Marketplace & Orders
| Method | Endpoint | Auth Required | Role | Description |
|:---|:---|:---:|:---:|:---|
| **GET** | `/api/listings` | Yes | Any | View active product listings |
| **POST** | `/api/listings` | Yes | FARMER | Create new marketplace product |
| **PUT** | `/api/listings/:id` | Yes | FARMER | Update product listing details |
| **POST** | `/api/listings/:id/publish` | Yes | FARMER | Make listing visible to buyers |
| **POST** | `/api/listings/:id/unpublish` | Yes | FARMER | Hide listing from marketplace |
| **DELETE** | `/api/listings/:id` | Yes | FARMER | Delete listing |
| **GET** | `/api/orders` | Yes | Any | Retrieve orders list (filtered by role) |
| **POST** | `/api/orders` | Yes | BUYER | Place an order for a listing |
| **GET** | `/api/orders/checkout-preview` | Yes | BUYER | Preview shipping/fees preview |
| **POST** | `/api/orders/:id/cancel` | Yes | BUYER | Cancel order (Pending orders only) |
| **GET** | `/api/orders/:id/delivery-code` | Yes | BUYER | Fetch 6-digit delivery verification code |
| **POST** | `/api/orders/:id/accept` | Yes | FARMER | Accept buyer's order |
| **POST** | `/api/orders/:id/reject` | Yes | FARMER | Reject order and specify reason |
| **POST** | `/api/orders/:id/out-for-delivery` | Yes | FARMER | Flag order status to dispatch |
| **POST** | `/api/orders/:id/verify-delivery` | Yes | FARMER | input buyer's code to complete order |

### 5. Agronomy Decision Center
| Method | Endpoint | Auth Required | Role | Description |
|:---|:---|:---:|:---:|:---|
| **GET** | `/api/agronomy/weather` | Yes | Any | Fetch current local weather data |
| **GET** | `/api/agronomy/weather-recommendations` | Yes | Any | Get AI advice matching local weather conditions |
| **GET** | `/api/agronomy/market-prices` | Yes | Any | Fetch current market intelligence rates |
| **GET** | `/api/agronomy/insights` | Yes | Any | Retrieve crop planning insights |
| **GET** | `/api/agronomy/crop-cycles/:cropCycleId/predict-yield` | Yes | FARMER | Predict harvest yield from cycle metrics |
| **POST** | `/api/agronomy/ai/chat` | Yes | Any | Conversation route with the AI Agronomy assistant |
| **POST** | `/api/agronomy/ai/disease-detect` | Yes | Any | Scan image data to diagnose crop diseases |

---

## ⚙️ Development & Local Installation

### Prerequisites
* **Node.js** v18+
* **MongoDB** (Local instance or remote cluster URL)

### 1. Clone & Install Dependencies
Run the workspace installer from the root directory:
```bash
npm run install:all
```
This automatically sets up all dependencies inside both `/client` and `/server` packages.

### 2. Configure Environment Variables
Create a `.env` file inside the `server/` directory:
```env
PORT=8080
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/agro_track
JWT_SECRET=your_32_character_super_secret_jwt_passphrase
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173
COOKIE_SECURE=false
```

Create a `.env` file inside the `client/` directory:
```env
VITE_API_URL=/api
```

### 3. Run Locally
To run both backend and frontend concurrently in development mode:
```bash
# In one terminal:
npm run dev:server

# In another terminal:
npm run dev:client
```
* Backend starts at `http://localhost:8080`
* Frontend dev server starts at `http://localhost:5173` (proxied to server)

---

## 📦 Production Deployment (Render Monolith)

The application is optimized to compile the frontend assets directly and serve them from the Express server.

### Render Web Service Configurations
1. **Root Directory**: `agro_track2`
2. **Build Command**: `npm run build`
3. **Start Command**: `npm run start`
4. **Environment Variables**:
   * `NODE_ENV=production`
   * `PORT=10000`
   * `MONGO_URL` = *Your MongoDB Atlas connection URI*
   * `JWT_SECRET` = *Secure 32+ character key*
   * `JWT_EXPIRES_IN=7d`
   * `COOKIE_SECURE=true`
   * `CORS_ORIGINS=https://agro-track-tsxq.onrender.com` (Your Render deployment URL)

Under this structure, Express serves your backend API and delivers the static React single-page app via the `client/dist` directory. We set `COOKIE_SECURE=true` and proxy websocket transport endpoints dynamically.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
