# ![OrgChat](frontend/icon/OrgChat_logo.png) OrgChat — The Telegram of Your Organization

**OrgChat is the Telegram of your organization** — lightweight, secure, and identity-bound to merID, enabling trusted P2P communication without personal contact exchange. Built for **media-first sharing** with chat baked in for collaboration, entirely exclusive to your organization.

> **The fastest, most secure way to share files inside your org, with chat to support it.**

**Status:** Production Ready | **Version:** 0.0.1

---

## 📋 Table of Contents

- [Positioning](#-positioning)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Application Flow](#-application-flow)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Docker Deployment](#-docker-deployment)
- [ngrok Public Access](#-ngrok-public-access-guide)
- [Mobile Support](#-mobile-support)
- [Capacity & Pitch Guide](#-capacity--live-demo-guide)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Security](#-security)
- [Database](#-database)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Positioning

### Why OrgChat?

**Media-first. Organization-exclusive. Identity-bound.**

OrgChat is purpose-built for secure file sharing within your organization — lightweight, fast, and tied to verified merID identities. No personal contact exchange. No overhead. Just effortless collaboration.

**Key Differentiation:**
- 🎯 **Media-First** — The core experience is effortless file exchange of any size, not just chat
- 🔐 **Identity-Bound to merID** — Every interaction is tied to a verified Member Entity Reference ID
- ⚡ **Zero Overhead** — No channels, no meetings, no noise — pure P2P collaboration
- 🏢 **Organization-Exclusive** — Secure, professional space where everyone's verified
- 💬 **Chat Built-In** — Supporting communication, not the primary focus

---

## ✨ Features

### 📤 Media-First File Sharing (Core)
- ✅ Secure Media Upload — Support for images, videos, documents (up to 500MB)
- ✅ Effortless Exchange — File sharing in conversations
- ✅ Media Preview — In-app media viewing without leaving the app
- ✅ File Management — Download, save, and delete capabilities
- ✅ Two distinct layouts — text bubbles vs media cards (no overlap)

### 💬 Real-time Chat
- ✅ Real-time Messaging — Instant messaging via WebSocket (STOMP/SockJS)
- ✅ Message History — Persistent conversation records
- ✅ Edit & Delete Messages — With real-time broadcast to recipient
- ✅ Unread badge counts per conversation
- ✅ Inbox with last message preview

### 🔐 Security & Identity
- ✅ Google OAuth2 SSO — Single Sign-On integration
- ✅ merID Identity Binding — Verified, unique organizational identifier
- ✅ JWT Tokens — Stateless authentication with refresh tokens
- ✅ WebSocket Security — STOMP endpoint protection
- ✅ CORS Protection — Configurable origin restrictions

### 🎨 User Experience
- ✅ Dark / Light Theme — Toggle with localStorage persistence
- ✅ Mobile Responsive — Optimized for 390×844 (Samsung S20 FE, iPhone 14)
- ✅ Slide-in sidebar — Hamburger menu on mobile
- ✅ Long press to delete conversation on mobile
- ✅ Search by merID — Start chat only on button click
- ✅ Multi-select broadcast — Send to multiple contacts at once

---

## 🛠 Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | Spring Boot 3.2.3 |
| Runtime | Java 21 |
| Database | MongoDB 7.0 |
| Real-time | WebSocket (STOMP) + SockJS |
| Auth | OAuth2 (Google) + JWT |
| Build | Maven |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | Angular 19.2 |
| Language | TypeScript 5.7 |
| Styling | CSS3 (Dark/Light Theme, Mobile Responsive) |
| WebSocket | STOMP.js + SockJS |
| HTTP | RxJS + Interceptors |

### Infrastructure
| Component | Details |
|-----------|---------|
| Container | Docker + Docker Compose |
| Web Server | Nginx (reverse proxy + static serving) |
| Public Tunnel | ngrok (for external access) |
| Frontend Port | 4200 |
| Backend Port | 8080 |
| Database Port | 27017 |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORGCHAT SYSTEM ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │    FRONTEND (SPA)    │         │   BACKEND (REST)     │      │
│  │  Angular 19.2        │◄───────►│  Spring Boot 3.2.3   │      │
│  │  - Chat Component    │  HTTP   │  - Controllers       │      │
│  │  - Auth Service      │  JWT    │  - Services          │      │
│  │  - WebSocket Service │         │  - Repositories      │      │
│  └──────────────────────┘         └──────────────────────┘      │
│         :4200                              :8080                 │
│           │                    ┌───────────┼─────────────┐      │
│           │                    │           │             │      │
│           │                 ┌──────┐  ┌────────┐  ┌──────────┐  │
│           │                 │Mongo │  │OAuth2  │  │WebSocket │  │
│           └─────────────────│ :27017  │Google  │  │STOMP     │  │
│                             └──────┘  └────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Application Flow

### Authentication Flow

```
User visits → Click "Sign in with Google"
    │
    ▼
/oauth2/authorization/google (via nginx proxy)
    │
    ▼
Google login → callback to /login/oauth2/code/google
    │
    ▼
Backend: create/update user, issue JWT
    │
    ▼
Redirect to /login?token=xxx&merID=xxx
    │
    ▼
Angular stores token → navigate to /chat
```

### Message Flow (Real-time)

```
User A types message
    │
    ▼
POST /api/messages/send → saved to MongoDB
    │
    ▼
SimpMessagingTemplate.convertAndSendToUser()
    │
    ▼
WebSocket push → /user/queue/messages
    │
    ▼
User B receives instantly — no refresh needed ✓
```

### Media Upload Flow

```
User selects file (up to 500MB)
    │
    ▼
POST /api/media/upload → stored in MongoDB GridFS
    │
    ▼
Returns media ID
    │
    ▼
POST /api/messages/send with mediaId
    │
    ▼
Recipient sees media card in real time ✓
```

---

## 📁 Project Structure

```
OrgChat/
├── backend/
│   └── src/main/java/com/orgchat/
│       ├── config/          # Security, WebSocket, CORS
│       ├── controller/      # REST endpoints
│       ├── service/         # Business logic
│       ├── repository/      # MongoDB repositories
│       ├── model/           # MongoDB documents
│       ├── dto/             # Data transfer objects
│       └── security/        # JWT, OAuth2
│
├── frontend/
│   └── src/app/
│       ├── core/            # Services, guards, interceptors
│       │   ├── auth.service.ts
│       │   ├── chat.service.ts
│       │   ├── websocket.service.ts
│       │   ├── media.service.ts
│       │   └── models.ts
│       └── pages/
│           ├── chat/        # Main chat UI (mobile responsive)
│           ├── login/       # Google SSO login
│           ├── profile/     # User profile + media
│           ├── settings/    # Account settings
│           └── media-preview/ # Full media viewer
│
├── docker-compose.yml       # All services
├── nginx.conf               # Reverse proxy config
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Java 21+
- Node.js 18+
- MongoDB 7.0+
- Docker + Docker Compose

### Local Development

```bash
# 1. Clone
git clone https://github.com/yourusername/OrgChat.git
cd OrgChat

# 2. Backend
cd backend
mvn spring-boot:run

# 3. Frontend
cd frontend
npm install
ng serve

# Open http://localhost:4200
```

---

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop
docker-compose down

# Full reset (wipes data)
docker-compose down -v
```

All three services should show **healthy**:

```
orgchat-mongodb    Up (healthy)   :27017
orgchat-backend    Up (healthy)   :8080
orgchat-frontend   Up (healthy)   :4200
```

### Known Fixes Applied

| Issue | Fix |
|-------|-----|
| MongoDB error 197 on startup | Removed `@Indexed(unique=true)` from `@Id` field in `User.java` — MongoDB 7.0 rejects `unique` on `_id` |
| nginx.conf syntax error | Removed duplicate `location` blocks that were outside the `server {}` block |
| WebSocket not delivering messages | Changed `wsUrl` from `ws://localhost:8080` to `window.location.origin/ws` — SockJS needs `http://` not `ws://` |
| Backend crash on fresh volume | Added `docker-compose down -v` to wipe bad index from MongoDB volume |

---

## 🌐 ngrok Public Access Guide

ngrok creates a public HTTPS tunnel so anyone on any device or network can access OrgChat — perfect for live demos.

### Network Flow

```
                     ┌─────────────────────────────────────────────┐
                     │           YOUR MACHINE (localhost)           │
                     │                                              │
📱 Mobile            │  ┌────────────┐                             │
Any network ─HTTPS──►│─►│   nginx    │──/──────────► Angular        │
                     │  │ :4200→:80  │                static files  │
🖥️  PC browser       │  │            │──/api/───────► Spring Boot   │
localhost:4200 ─────►│  │            │                   :8080      │
                     │  │            │──/ws/────────► WebSocket      │
                     │  │            │──/oauth2/────► OAuth2 handler │
                     │  └────────────┘                    │         │
                     │  ┌────────────┐                    │         │
                     │  │  MongoDB   │◄── Spring Boot      │         │
                     │  │   :27017   │                    │         │
                     │  └────────────┘                    │         │
                     └────────────────────────────────────│─────────┘
                                                          │
                                          ┌───────────────▼──────────┐
┌──────────────────┐                      │     Google OAuth2         │
│   ngrok cloud    │◄─────────────────────│  accounts.google.com      │
│ 7a80-xxx.ngrok   │   callback with token│  redirect + login         │
└────────┬─────────┘                      └──────────────────────────┘
         │ tunnels to localhost:4200
         ▼
    nginx :4200
```

### URL Journey (Mobile Login)

```
1. Mobile opens   https://7a80-xxx.ngrok-free.app
2. ngrok ────────► nginx :4200
3. nginx ────────► Angular login page
4. Sign in ──────► /oauth2/authorization/google (nginx proxy)
5. Spring Boot ──► redirects to accounts.google.com
6. Google login ─► callbacks to https://7a80-xxx.ngrok-free.app/login/oauth2/code/google
7. Spring Boot ──► issues JWT, redirects to ngrok/login?token=xxx
8. Angular ──────► stores token, navigates to /chat
9. WebSocket ────► connects to ngrok/ws (STOMP over SockJS)
10. Chat works ──► real-time messages ✓
```

### Setup Steps

**1. Start Docker**
```bash
docker-compose up -d
```

**2. Start ngrok**
```bash
ngrok http 4200
```

**3. Update docker-compose.yml** (3 lines — replace old URL):
```yaml
APP_CORS_ALLOWED_ORIGINS: http://localhost,http://localhost:4200,https://YOUR-URL.ngrok-free.app
APP_FRONTEND_REDIRECT_URL: https://YOUR-URL.ngrok-free.app/login
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_REDIRECT_URI: https://YOUR-URL.ngrok-free.app/login/oauth2/code/google
```

**4. Google Cloud Console**
- APIs & Services → Credentials → your OAuth Client
- Authorized JavaScript origins: `https://YOUR-URL.ngrok-free.app`
- Authorized redirect URIs: `https://YOUR-URL.ngrok-free.app/login/oauth2/code/google`
- Save and wait 2 minutes

**5. Restart backend**
```bash
docker-compose down --remove-orphans
docker-compose up -d --force-recreate
```

### ngrok Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `redirect_uri_mismatch` | Google Console not updated | Add new ngrok URL to Console |
| `502 Bad Gateway on /oauth2/` | nginx missing proxy rule | Apply nginx.conf fix |
| `ERR_EMPTY_RESPONSE` | `.env` overriding docker-compose | Update `.env` GOOGLE_REDIRECT_URI |
| URL changes on restart | Free tier generates new URL | Never restart ngrok during demo |

> **Keep ngrok running the entire session** — free tier URL changes on every restart.

---

## 📱 Mobile Support

OrgChat is fully optimized for mobile browsers (Samsung S20 FE, iPhone 14 — 390×844).

### Mobile Features
- Sidebar hidden by default — slides in from left on hamburger (≡) tap
- Dark overlay behind sidebar — tap to close
- All tap targets minimum 44–48px (Apple/Google HIG standard)
- Message bubbles max 80% width — no overflow
- Input bar anchored above keyboard — never disappears
- `100dvh` viewport — shrinks correctly when keyboard opens
- Font size 16px on input — prevents iOS Safari auto-zoom
- Momentum scrolling in message list
- Long press (600ms) on conversation to delete
- Safe area insets for notch and home bar

### Breakpoints
```css
@media (max-width: 768px)  /* tablets and phones */
@media (max-width: 380px)  /* small phones */
```

---

## 🚀 Capacity & Live Demo Guide

### Concurrent Users

| Resource | Capacity | 7 Users Need |
|----------|----------|--------------|
| WebSocket connections | ~400 | 7 |
| MongoDB connection pool | 100 | 7 |
| Nginx connections | 1024 | 7 |
| RAM usage | ~2GB | ~50MB |

Comfortable real-world limits on a single machine:
- ✅ 10–50 concurrent users — zero issues
- ⚠️ 100+ — memory pressure on WebSocket broker

### Live Pitch Demo (7 People)

**The wow moment:**
1. Open two browser windows side by side
2. Log in with two different Google accounts
3. Send messages → push instantly, zero refresh
4. Share a file → appears live on other side
5. Toggle dark/light mode
6. Show merID search → find user, start chat
7. Show `docker-compose ps` → all healthy

**Suggested flow:**
```
Login via Google SSO (10 sec) →
Two browsers side by side →
Real-time text message →
File share (image/PDF) →
merID search demo →
Dark/light toggle →
docker-compose ps (all healthy)
```

> 7 users on this stack is like a sports car doing 10 km/h. You have more than enough headroom.

---

## ⚙️ Configuration

### docker-compose.yml key variables

```yaml
# MongoDB
MONGO_USERNAME: admin
MONGO_PASSWORD: password

# JWT
APP_JWT_SECRET: your-secret-key
APP_JWT_EXPIRATION_MS: 86400000       # 24 hours
APP_JWT_REFRESH_EXPIRATION_MS: 604800000  # 7 days

# CORS — add ngrok URL when using ngrok
APP_CORS_ALLOWED_ORIGINS: http://localhost,http://localhost:4200

# OAuth2 redirect — update when using ngrok
APP_FRONTEND_REDIRECT_URL: http://localhost:4200/login
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_REDIRECT_URI: http://localhost:8080/login/oauth2/code/google
```

### Google OAuth2 Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials → Create OAuth 2.0 Client
3. Add authorized redirect URI: `http://localhost:8080/login/oauth2/code/google`
4. Copy Client ID and Secret to `docker-compose.yml`

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/oauth2/authorization/google` | Initiate Google OAuth2 |
| `POST` | `/api/auth/refresh` | Refresh JWT token |
| `POST` | `/api/auth/logout` | Logout user |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/messages/send` | Send message |
| `POST` | `/api/messages/send-multi` | Send to multiple users |
| `GET` | `/api/messages/conversation?withUser=` | Get conversation |
| `GET` | `/api/messages/inbox` | Get all conversations |
| `PUT` | `/api/messages/{id}` | Edit message |
| `DELETE` | `/api/messages/{id}` | Delete message |
| `DELETE` | `/api/messages/conversation?withUser=` | Delete conversation |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/media/upload` | Upload file (500MB max) |
| `GET` | `/api/media/download/{id}` | Download file |
| `GET` | `/api/media/info/{id}` | Get file metadata |
| `DELETE` | `/api/media/delete/{id}` | Delete file |

### Users & Mates
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/{merID}` | Get user profile |
| `GET` | `/api/mates/search?merID=` | Search user by merID |
| `POST` | `/api/mates/request` | Send mate request |
| `PUT` | `/api/mates/accept/{id}` | Accept mate request |
| `GET` | `/api/mates/list` | Get all mates |

### WebSocket (STOMP)
```
Connect:    /ws (SockJS)
Subscribe:  /user/queue/messages
Messages:   action = SEND | EDIT | DELETE
```

---

## 🔒 Security

- Google OAuth2 — no passwords stored
- JWT with configurable expiry
- Refresh tokens in HTTP-only cookies
- CORS restricted to allowed origins
- STOMP WebSocket JWT validation on every connect
- MongoDB authentication required

---

## 🗄️ Database

### Collections

**users** — merID (unique), email, displayName, avatarUrl, role, ssoProvider

**messages** — senderId, recipientId, content, mediaId, timestamp, read, isEdited

**media** — uploaderId, fileName, fileType, fileSize, storagePath (GridFS), timestamp

**mate_requests** — fromMerID, toMerID, status (PENDING/ACCEPTED/REJECTED)

**sessions** — userId, jwtToken, issuedAt, expiresAt (TTL auto-delete)

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Most common cause: bad MongoDB index from old volume
docker-compose down -v
docker-compose up -d
```

### Messages not pushing in real time
```bash
# Check WebSocket connected in browser console (F12)
# Verify wsUrl uses window.location.origin not localhost:8080
# Check nginx /ws proxy rule exists
docker exec orgchat-frontend cat /etc/nginx/nginx.conf | grep -A5 "ws"
```

### Google login fails on ngrok
```bash
# Verify backend has correct redirect URI
docker-compose exec backend env | grep REDIRECT

# Check Google Console has ngrok URL in both:
# - Authorized JavaScript origins
# - Authorized redirect URIs
```

### Port conflicts
```bash
# Check what's using port 4200 or 80
netstat -ano | findstr :4200   # Windows
lsof -i :4200                  # Mac/Linux

# Change port in docker-compose.yml
ports:
  - "4201:80"  # use different host port
```

---

## 📄 License

MIT License

---

**Built with ❤️ for secure organizational communication**

Last Updated: March 2026 | v0.0.1-SNAPSHOT
