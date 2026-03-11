# 🤖 Poke Web Interface

A modern web interface for communicating with **Poke** (MCP system) via a browser.

![Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20React%20%7C%20PostgreSQL%20%7C%20Redis-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📐 Architecture

```
poke-web-interface/
├── backend/                    # Node.js / Express API
│   ├── server.js               # Entry point
│   └── src/
│       ├── app.js              # Express application
│       ├── config/             # Database, Redis, JWT config
│       ├── controllers/        # Route controllers
│       ├── middleware/         # Auth, validation, error handling
│       ├── routes/             # API routes
│       ├── services/           # Poke MCP service
│       └── websocket/          # Socket.io handler
├── frontend/                   # React / Vite / TypeScript
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── hooks/              # Custom React hooks
│       ├── pages/              # Page components
│       ├── services/           # API & Socket.io clients
│       ├── stores/             # Zustand state management
│       └── types/              # TypeScript types
├── database/
│   └── init.sql                # PostgreSQL schema
├── docker-compose.yml          # Production Docker stack
└── docker-compose.dev.yml      # Development override
```

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docker.com) & Docker Compose v2
- Node.js 20+ (for local development)
- A running **Poke MCP** instance

### 1. Clone & configure

```bash
git clone https://github.com/theorbot42/poke-web-interface.git
cd poke-web-interface
cp .env.example .env
# Edit .env with your values
```

### 2. Start with Docker (recommended)

```bash
docker compose up -d
```

The app will be available at:
- 🌐 **Frontend**: http://localhost
- 🔌 **Backend API**: http://localhost:3000
- 📊 **Health check**: http://localhost:3000/health

### 3. Local development

**Start infrastructure:**
```bash
docker compose up postgres redis -d
```

**Backend:**
```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev
```

**Frontend (new terminal):**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend dev server: http://localhost:5173

---

## 🔧 Configuration

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|--------|
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_NAME` | Database name | `poke_db` |
| `DB_USER` | DB username | `postgres` |
| `DB_PASSWORD` | DB password | — |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | — |
| `JWT_REFRESH_SECRET` | Refresh token secret | — |
| `POKE_BASE_URL` | Poke MCP service URL | `http://localhost:8080` |
| `POKE_API_KEY` | Poke API key | — |
| `WEBHOOK_SECRET` | Webhook HMAC signing secret | — |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|--------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` |
| `VITE_WS_URL` | WebSocket server URL | `http://localhost:3000` |

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/refresh` | Refresh token |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/me` | Get current user |
| `PUT` | `/api/auth/me` | Update profile |
| `PUT` | `/api/auth/change-password` | Change password |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chat/sessions` | List sessions |
| `POST` | `/api/chat/sessions` | Create session |
| `GET` | `/api/chat/sessions/:id` | Get session |
| `DELETE` | `/api/chat/sessions/:id` | Delete session |
| `PUT` | `/api/chat/sessions/:id/title` | Rename session |
| `GET` | `/api/chat/sessions/:id/messages` | Get messages |
| `POST` | `/api/chat/sessions/:id/messages` | Send message |

### WebSocket Events

**Client → Server:**
- `join:session` — Join a chat session room
- `leave:session` — Leave a session room
- `chat:message` — Send `{ sessionId, content }`

**Server → Client:**
- `connected` — Connection confirmed
- `message:saved` — User message persisted
- `poke:typing` — Poke is generating a response
- `poke:typing:stop` — Typing stopped
- `poke:response` — Poke's response message
- `error` — Error event

### Webhook

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhook/poke` | Receive Poke events |

Webhook requests must include `X-Webhook-Signature: sha256=<hmac>` when `WEBHOOK_SECRET` is set.

---

## 🗄️ Database Schema

```sql
users        — id, username, email, password_hash, role, is_active, ...
chat_sessions — id, user_id, title, created_at, updated_at
messages     — id, session_id, role, content, metadata (JSONB), created_at
```

Schema auto-applied via `database/init.sql` on first Docker run.

---

## 🏗️ Tech Stack

### Backend
- **Node.js 20** + **Express 4** — HTTP server
- **Socket.io 4** — Real-time WebSocket communication
- **PostgreSQL 16** — Primary data store
- **Redis 7** — Caching & token blacklist
- **JWT** — Authentication (access + refresh tokens)
- **bcryptjs** — Password hashing
- **express-validator** — Input validation
- **Helmet / CORS / rate-limit** — Security middleware

### Frontend
- **React 18** + **TypeScript** — UI framework
- **Vite 5** — Build tool
- **Tailwind CSS 3** — Utility-first styling
- **Zustand** — State management
- **TanStack Query** — Server state & caching
- **Socket.io-client** — Real-time connection
- **React Router 6** — Client-side routing
- **Lucide React** — Icons
- **date-fns** — Date formatting
- **react-hot-toast** — Notifications

### Infrastructure
- **Docker** + **Docker Compose** — Containerization
- **Nginx** — Static file serving + reverse proxy

---

## 🧪 Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## 🔒 Security Notes

- **Change all secrets** in `.env` before production deployment
- JWT tokens are blacklisted in Redis on logout
- Rate limiting: 100 requests / 15 min per IP on `/api/`
- CSP, HSTS, and other security headers via Helmet
- SQL injection protection via parameterized queries
- Webhook signature verification via HMAC-SHA256

---

## 📄 License

MIT © 2026 [theorbot42](https://github.com/theorbot42)
