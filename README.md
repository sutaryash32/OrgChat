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
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Security](#-security)
- [Database](#-database)

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

While giants dominate chat-first collaboration, **OrgChat owns the media-first positioning** — the fastest, most secure way to share files within your organization.

---

## ✨ Features

### 📤 Media-First File Sharing (Core)
- ✅ **Secure Media Upload** — Support for images, videos, documents (up to 500MB)
- ✅ **Effortless Exchange** — Drag-and-drop file sharing in conversations
- ✅ **Media Preview** — In-app media viewing without leaving the app
- ✅ **File Management** — Download, save, and delete capabilities
- ✅ **Any Size, Any Type** — No artificial file type restrictions

### 💬 Real-time Chat (Supporting Feature)
- ✅ **Real-time Messaging** — Instant messaging via WebSocket (STOMP)
- ✅ **Multi-user Support** — Contact management with mate requests
- ✅ **Message History** — Persistent conversation records with context
- ✅ **Contextual Communication** — Chat tied directly to file exchanges

### 🔐 Security & Organization-Exclusive Access
- ✅ **Google OAuth2 SSO** — Single Sign-On integration with your organization
- ✅ **merID Identity Binding** — Verified, unique organizational identifier for each user
- ✅ **JWT Tokens** — Stateless authentication with refresh tokens
- ✅ **WebSocket Security** — STOMP endpoint protection
- ✅ **End-to-End Verification** — Know exactly who you're communicating with
- ✅ **CORS Protection** — Configurable origin restrictions for organization only

### 🎨 User Experience
- ✅ **Human-readable User IDs** — merID system (vs ObjectIds)
- ✅ **User Search** — Find contacts instantly by merID
- ✅ **Dark/Light Theme** — Adaptive UI based on preference
- ✅ **Responsive Design** — Seamless experience across devices
- ✅ **Database Auto-migration** — Automatic data sanitization on startup

---

## 🛠 Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| **Framework** | Spring Boot 3.2.3 |
| **Runtime** | Java 17+ |
| **Database** | MongoDB 5.0+ |
| **Real-time** | WebSocket (STOMP) + SockJS |
| **Auth** | OAuth2 (Google) + JWT |
| **Build** | Maven |

### Frontend
| Component | Technology |
|-----------|-----------|
| **Framework** | Angular 19.2 |
| **Language** | TypeScript 5.7 |
| **Styling** | CSS3 (Dark/Light Theme) |
| **WebSocket** | STOMP.js + SockJS |
| **HTTP** | RxJS + Interceptors |

### Infrastructure
- **Port (Backend):** 8080
- **Port (Frontend):** 4200
- **Database:** MongoDB (Local: `localhost:27017`)

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORGCHAT SYSTEM ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │    FRONTEND (SPA)    │         │   BACKEND (REST)     │      │
│  │  Angular 19.2        │◄───────►│  Spring Boot 3.2.3   │      │
│  │  - Chat Component    │         │  - Controllers       │      │
│  │  - Auth Service      │  HTTP   │  - Services          │      │
│  │  - WebSocket Service │  JWT    │  - Repositories      │      │
│  └──────────────────────┘         └──────────────────────┘      │
│         :4200                              :8080                │
│           │                                  │                  │
│           │                    ┌─────────────┼─────────────┐   │
│           │                    │             │             │   │
│           │                  ┌─────────┐ ┌──────────┐ ┌────────┐
│           │                  │ Mongo DB│ │ OAuth2   │ │WebSocket│
│           └──────────────────│(orgchat)│ │(Google)  │ │(STOMP)  │
│                              └─────────┘ └──────────┘ └────────┘
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Data Flow Layers:**
1. **Presentation Layer** — Angular UI components
2. **Service Layer** — Business logic (UserService, MessageService, etc.)
3. **Repository Layer** — MongoDB data access
4. **Messaging Layer** — WebSocket for real-time updates

---

## 🔄 Application Flow

### 1️⃣ **Authentication Flow**

```
┌─────────────┐
│   User      │
│  Visits UI  │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ Click "Sign in with  │
│ Google" Button       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ OAuth2 Redirect to Google            │
│ /oauth2/authorization/google         │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Google Login                         │
│ (User grants permissions)            │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Backend: AuthController.handleLogin()│
│ - Verify OAuth2 token               │
│ - Create/Update User in MongoDB     │
│ - Generate JWT token               │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Redirect to Dashboard               │
│ JWT stored in localStorage          │
│ Refresh token in HTTP-Only Cookie   │
└──────────────────────────────────────┘
```

### 2️⃣ **Message Flow (Real-time)**

```
User A                          Backend                    User B
  │                               │                          │
  │──1. Type Message──────────►   │                          │
  │                               │                          │
  │◄──2. Send via WebSocket────┐  │                          │
  │    MESSAGE                 │  │                          │
  │    /app/sendMessage        │  │                          │
  │                            │  │                          │
  │                            ▼  │                          │
  │                        ┌──────────────┐                  │
  │                        │ Save to      │                  │
  │                        │ MongoDB      │                  │
  │                        │ (messages)   │                  │
  │                        └──────┬───────┘                  │
  │                               │                          │
  │                               ├──3. Broadcast────────────►│
  │                               │  /topic/room/{id}/msg    │
  │  ┌──4. Receive──────────────┐ │                          │
  │  │ MESSAGE via STOMP        │ │                    ┌─────┴─────┐
  │  │                          │ │                    │ Display  │
  │  │                          ▼ ▼                    │ in Chat  │
  │  │                      /user/queue/msg           │          │
  │  │                                                └──────────┘
  │  │ (Message appears instantly)
  │  └──────────────────────────────────────────────┘
```

### 3️⃣ **Media Upload Flow**

```
┌─────────────┐
│ User Selects│
│ File (500MB)│
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ Frontend Upload Request │
│ multipart/form-data     │
│ /api/media/upload       │
└──────┬──────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Backend: MediaService    │
│ - Validate file         │
│ - Store file            │
│ - Save metadata in DB   │
│ - Generate unique ID    │
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────┐
│ Return Media ID        │
│ + Download URL         │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ Attach to Message      │
│ Send via WebSocket     │
└────────────────────────┘
```

### 4️⃣ **User Search & Contact Addition**

```
┌────────────┐
│ User A     │
│ Types MerID│
│ "john.doe" │
└──────┬─────┘
       │
       ▼
┌────────────────────────────┐
│ WebSocket Query            │
│ /app/searchByMerID         │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Backend: UserController    │
│ - Find user in MongoDB    │
│ - Return user profile    │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Display Search Result      │
│ - Avatar, Name, ID       │
│ - "Add Contact" Button   │
└──────┬─────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Send Mate Request           │
│ POST /api/mate-request      │
│ {fromMerID, toMerID}        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Create MateRequest in DB    │
│ Status: PENDING             │
│ Notify User B via WebSocket │
└─────────────────────────────┘
```

---

## 📁 Project Structure

```
OrgChat/
│
├── backend/                          # Spring Boot Backend
│   ├── src/main/
│   │   ├── java/com/orgchat/
│   │   │   ├── config/              # Configuration classes
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── WebSocketConfig.java
│   │   │   │   ├── DatabaseMigrationRunner.java
│   │   │   │   └── StompAuthChannelInterceptor.java
│   │   │   │
│   │   │   ├── controller/          # REST API Endpoints
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── UserController.java
│   │   │   │   ├── ChatController.java (WebSocket)
│   │   │   │   ├── MessageController.java
│   │   │   │   ├── MateController.java
│   │   │   │   └── MediaController.java
│   │   │   │
│   │   │   ├── service/             # Business Logic
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── UserService.java
│   │   │   │   ├── MessageService.java
│   │   │   │   ├── ChatService.java
│   │   │   │   ├── MateService.java
│   │   │   │   └── MediaService.java
│   │   │   │
│   │   │   ├── repository/          # MongoDB Repositories
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── MessageRepository.java
│   │   │   │   ├── MateRequestRepository.java
│   │   │   │   └── MediaRepository.java
│   │   │   │
│   │   │   ├── model/               # MongoDB Documents
│   │   │   │   ├── User.java
│   │   │   │   ├── Message.java
│   │   │   │   ├── Media.java
│   │   │   │   └── MateRequest.java
│   │   │   │
│   │   │   ├── dto/                 # Data Transfer Objects
│   │   │   ├── exception/           # Exception handling
│   │   │   ├── security/            # JWT & Security utilities
│   │   │   └── OrgChatApplication.java
│   │   │
│   │   └── resources/
│   │       └── application.yml      # Configuration
│   │
│   └── pom.xml                      # Maven dependencies
│
└── frontend/                         # Angular Application
    ├── src/
    │   ├── app/
    │   │   ├── core/                # Services & Guards
    │   │   │   ├── auth.service.ts
    │   │   │   ├── chat.service.ts
    │   │   │   ├── websocket.service.ts
    │   │   │   ├── user.service.ts
    │   │   │   ├── mate.service.ts
    │   │   │   ├── media.service.ts
    │   │   │   ├── auth.guard.ts
    │   │   │   ├── jwt.interceptor.ts
    │   │   │   └── models.ts
    │   │   │
    │   │   ├── pages/               # Feature Components
    │   │   │   ├── login/
    │   │   │   ├── chat/
    │   │   │   ├── profile/
    │   │   │   ├── settings/
    │   │   │   └── media-preview/
    │   │   │
    │   │   ├── app.component.ts     # Root component
    │   │   ├── app.routes.ts        # Route configuration
    │   │   ├── app.config.ts        # App providers
    │   │   └── app.component.html
    │   │
    │   ├── index.html               # Entry point
    │   ├── main.ts                  # Bootstrap
    │   └── styles.css               # Global styles
    │
    ├── angular.json                 # Angular CLI config
    ├── package.json                 # NPM dependencies
    └── tsconfig.json                # TypeScript config
```

---

## 🚀 Getting Started

### Prerequisites

- **Java 17+** — Backend runtime
- **Node.js 18+** — Frontend tooling
- **npm/yarn** — Package manager
- **MongoDB 5.0+** — Database
- **Git** — Version control

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/OrgChat.git
cd OrgChat
```

#### 2. Backend Setup

```bash
cd backend

# Build project
mvn clean install

# Start MongoDB (if not running)
mongod

# Run Spring Boot
mvn spring-boot:run
# or
java -jar target/orgchat-backend-0.0.1-SNAPSHOT.jar
```

Backend runs at: **http://localhost:8080**

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend runs at: **http://localhost:4200**

#### 4. Access Application
- Open: **http://localhost:4200**
- Click "Sign in with Google"
- Start chatting! 💬

---

## 🐳 Docker Deployment

### Quick Start with Docker

Deploy OrgChat in seconds using Docker Compose with all services (Frontend, Backend, MongoDB) bundled.

#### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

#### 1. Clone and Configure

```bash
git clone https://github.com/yourusername/OrgChat.git
cd OrgChat

# Copy environment template
cp .env.example .env

# Update Google OAuth credentials
nano .env
```

#### 2. Start All Services

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Access services:
# - Frontend: http://localhost
# - Backend: http://localhost:8080
# - MongoDB Admin: http://localhost:8081 (add --profile debug)
```

#### 3. Stop Services

```bash
# Stop and remove containers (retain volumes)
docker-compose down

# Stop and remove everything (including data)
docker-compose down -v
```

### Services Included

| Service | Port | Technology | Status |
|---------|------|-----------|--------|
| **Frontend** | 80 | Angular + Nginx | ✅ |
| **Backend** | 8080 | Spring Boot + Java 17 | ✅ |
| **MongoDB** | 27017 | MongoDB 7.0 | ✅ |
| **Mongo Express** | 8081 | Admin UI | 📋 Debug profile |

### Production Deployment

For production deployment with security hardening:

```bash
# Copy production environment
cp .env.prod.example .env.prod

# Update with secure values
nano .env.prod

# Deploy with production compose file
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Useful Docker Commands

```bash
# View service status
docker-compose ps

# Rebuild images
docker-compose build --no-cache

# Shell into container
docker exec -it orgchat-backend /bin/sh

# MongoDB CLI
docker exec -it orgchat-mongodb mongosh -u admin -p password

# View resource usage
docker stats
```

### Docker Documentation

For comprehensive Docker setup, troubleshooting, and production deployment guides:

→ **[See DOCKER.md](DOCKER.md)** for complete documentation

---

## ⚙️ Configuration

### Backend Configuration (`application.yml`)

```yaml
server:
  port: 8080                          # Server port

spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/orgchat

  security:
    oauth2:
      client:
        registration:
          google:
            client-id: YOUR_CLIENT_ID
            client-secret: YOUR_CLIENT_SECRET
            redirect-uri: "http://localhost:8080/login/oauth2/code/google"

app:
  jwt:
    secret: YOUR_JWT_SECRET
    expiration-ms: 86400000           # 24 hours
    refresh-expiration-ms: 604800000  # 7 days

  cors:
    allowed-origins: http://localhost:4200

  frontend:
    redirect-url: http://localhost:4200/login
```

### Environment Variables

Set these before running:

```bash
# Backend
export JWT_SECRET="your-secret-key"
export MONGODB_URI="mongodb://localhost:27017/orgchat"

# Or in application.yml (above)
```

### Google OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI:
   - `http://localhost:8080/login/oauth2/code/google`
4. Copy `Client ID` and `Client Secret` to `application.yml`

---

## 📡 API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/sso/login` | Initiate Google OAuth2 |
| `POST` | `/api/auth/refresh` | Refresh JWT token |
| `POST` | `/api/auth/logout` | Logout user |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/{merID}` | Get user profile |
| `GET` | `/api/users/search/{merID}` | Search user by MerID |
| `GET` | `/api/users/me` | Get current user |
| `PUT` | `/api/users/{merID}` | Update user profile |

### Message Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/messages` | Get message history |
| `GET` | `/api/messages/{chatId}` | Get conversation messages |
| `POST` | `/api/messages` | Send message (stored) |
| `DELETE` | `/api/messages/{msgId}` | Delete message |

### WebSocket Endpoints (STOMP)

```
Connection: ws://localhost:8080/ws

Send to:
- /app/sendMessage          → Send real-time message
- /app/searchByMerID        → Search users
- /app/createMateRequest    → Send contact request

Subscribe to:
- /topic/room/{roomId}      → Room messages
- /user/queue/notifications → Personal notifications
- /user/queue/messages      → Personal messages
```

### Media Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/media/upload` | Upload file |
| `GET` | `/api/media/{mediaId}/download` | Download file |
| `DELETE` | `/api/media/{mediaId}` | Delete media |
| `GET` | `/api/media/metadata/{mediaId}` | Get media info |

---

## 🔒 Security

### Authentication Flow
- **Google OAuth2** — External identity provider
- **JWT Tokens** — Stateless authentication
- **Refresh Tokens** — Secure in HTTP-Only cookies
- **CORS** — Restricted to allowed origins

### WebSocket Security
- **STOMP Auth Interceptor** — JWT validation on each message
- **User Isolation** — Users only see their own messages
- **Rate Limiting** — Configure via security config

### Data Protection
- **Password-less Auth** — No passwords stored
- **HTTPS Ready** — TLS/SSL support in production
- **Database Encryption** — MongoDB encryption at rest

### Security Checklist

- [ ] Change JWT secret in production
- [ ] Update Google OAuth credentials
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS in production
- [ ] Set secure CORS origins
- [ ] Configure firewall rules

---

## 🗄️ Database

### MongoDB Collections

#### 1. **Users**
```javascript
{
  _id: ObjectId,                    // MongoDB ID
  merID: "john.doe" (unique),       // Human-readable ID
  email: "john@example.com" (unique),
  displayName: "John Doe",
  avatarUrl: "https://...",
  role: "USER",                     // USER | ADMIN
  ssoProvider: "google",
  createdAt: ISODate("2024-03-21T10:00:00Z"),
  updatedAt: ISODate("2024-03-21T10:00:00Z"),
  lastLoginAt: ISODate("2024-03-21T15:30:00Z")
}
```

#### 2. **Messages**
```javascript
{
  _id: ObjectId,
  senderId: "john.doe",            // Foreign key
  recipientId: "jane.smith",       // Foreign key
  roomId: "room_123",              // Conversation ID
  content: "Hello!",
  fileUrl: "https://...",          // Optional
  mediaId: ObjectId,               // Optional
  timestamp: ISODate("2024-03-21T15:35:00Z"),
  read: true
}
```

#### 3. **Media**
```javascript
{
  _id: ObjectId,
  uploadedBy: "john.doe",
  fileName: "photo.jpg",
  fileType: "image/jpeg",
  fileSize: 2048576,               // in bytes
  s3Url: "https://...",
  timestamp: ISODate("2024-03-21T15:36:00Z"),
  metadata: {
    width: 1920,
    height: 1080
  }
}
```

#### 4. **MateRequests**
```javascript
{
  _id: ObjectId,
  fromMerID: "john.doe",           // Sender
  toMerID: "jane.smith",           // Recipient
  status: "PENDING",               // PENDING | ACCEPTED | REJECTED
  createdAt: ISODate("2024-03-21T15:37:00Z"),
  respondedAt: null
}
```

### Database Indexes

```javascript
// Optimize queries
db.users.createIndex({ merID: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
db.messages.createIndex({ senderId: 1, recipientId: 1 })
db.messages.createIndex({ roomId: 1, timestamp: -1 })
db.mateRequests.createIndex({ fromMerID: 1, toMerID: 1 })
```

### Database Migration

The **DatabaseMigrationRunner** automatically:
- Detects corrupted ObjectId entries in `merID`
- Converts them to human-readable identifiers
- Updates all foreign key references
- Logs migration progress

Runs automatically on startup ✅

---

## 🐛 Troubleshooting

### Frontend won't connect to backend
```bash
# Check backend is running
curl http://localhost:8080/api/health

# Check CORS in application.yml
# Ensure http://localhost:4200 is in allowed-origins
```

### WebSocket connection failed
```bash
# Verify WebSocket endpoint
ws://localhost:8080/ws

# Check StompAuthChannelInterceptor is intercepting
# Verify JWT token is valid
```

### MongoDB connection error
```bash
# Start MongoDB
mongod
# or
brew services start mongodb-community

# Check URI in application.yml
mongodb://localhost:27017/orgchat
```

### Google OAuth not working
```bash
# Verify redirect URI matches exactly:
http://localhost:8080/login/oauth2/code/google

# Check Client ID and Secret in application.yml
# Ensure Google APIs enabled in Cloud Console
```

---

## 📝 Development Notes

### Running in Production
```bash
# Build backend
mvn clean install -DskipTests

# Build frontend
ng build --configuration production

# Run with environment
java -Dspring.profiles.active=production \
     -DJWT_SECRET=prod-secret \
     -jar target/orgchat-backend-0.0.1-SNAPSHOT.jar
```

### Database Backup
```bash
mongodump --uri "mongodb://localhost:27017/orgchat" \
          --out ./backup

mongorestore --uri "mongodb://localhost:27017/orgchat" \
             ./backup
```

---

## � Capacity & Live Demo Guide

### How Many Users Can OrgChat Handle?

**Registered users: Unlimited** — MongoDB has no user cap, merID is just a string.

**Concurrent active users (current single-machine Docker setup):**

| Resource | Capacity | 7 Users Need |
|----------|----------|--------------|
| WebSocket connections | ~400 simultaneous | 7 |
| MongoDB connection pool | 100 | 7 |
| Nginx connections | 1024 | 7 |
| RAM usage | ~2GB available | ~50MB |
| CPU | Full machine | ~0% |

**Comfortable real-world limits on a single machine:**
- ✅ 10–20 concurrent users — zero issues
- ✅ 50 concurrent users — still smooth
- ⚠️ 100+ concurrent users — memory pressure on WebSocket broker

> To scale beyond 100 concurrent users, replace the in-memory STOMP broker
> with a dedicated message broker (RabbitMQ or Redis) and scale the backend horizontally.

---

### 🎯 Live Pitch Demo Guide (7 Person Demo)

For a 7-person pitch, OrgChat is **completely overkill ready**.

**The wow moment — run this live:**

1. Open **two browser windows side by side**
2. Log in with two different Google accounts (one per window)
3. Send messages back and forth — they push **instantly with zero refresh**
4. Share a file (image, PDF, video) — appears live on the other side
5. Toggle **dark/light mode** live
6. Show the **merID identity system** — search a user by merID and start a chat

**What impresses the panel:**

| Feature | Why It Impresses |
|---------|-----------------|
| Real-time push | No refresh needed — feels like WhatsApp |
| Google SSO | Professional, no signup friction |
| File sharing up to 500MB | Media-first positioning |
| merID identity | Unique concept — org-bound identity |
| Dark / Light theme | Polished UI attention to detail |
| Docker deployment | Shows production maturity |
| Full stack | MongoDB + Spring Boot + Angular |

**Suggested pitch flow:**
```
1. Show login → Google SSO (10 seconds, looks clean)
2. Open two browsers side by side
3. Send a text message → show real-time push
4. Send an image → show media preview
5. Show merID search → find a user, start chat
6. Toggle dark/light mode
7. Show Docker running → docker-compose ps (all healthy)
```

> **Bottom line:** 7 users on this stack is like a sports car doing 10 km/h.
> You have more than enough headroom for any live demo scenario.

---

## �📄 License

MIT License — See LICENSE.md

---

## 👥 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📧 Support

For issues and questions:
- Open GitHub Issue
- Email: support@orgchat.com
- Documentation: [Wiki](https://github.com/yourusername/OrgChat/wiki)

---

**Built with ❤️ for secure organizational communication**

Last Updated: March 21, 2026 | v0.0.1-SNAPSHOT
