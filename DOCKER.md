# OrgChat Docker Setup Guide

## Overview

OrgChat is containerized with Docker for easy deployment across different environments. This guide covers development, staging, and production deployments.

## Quick Start (Development)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### 1. Clone and Setup

```bash
cd OrgChat
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` and update the following:

```bash
# MongoDB defaults are fine for development
MONGO_USERNAME=admin
MONGO_PASSWORD=password

# Update with your Google OAuth credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 3. Start Services

```bash
# Start all services (frontend, backend, MongoDB)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Access Points:**
- Frontend: http://localhost
- Backend API: http://localhost:8080
- MongoDB Admin UI: http://localhost:8081 (optional, add `--profile debug`)

## Service Details

### Frontend Service
- **Port:** 80
- **Technology:** Angular + Nginx
- **Build Time:** ~2-3 minutes
- **Features:**
  - Automatic API proxy to backend
  - WebSocket proxy for real-time messaging
  - Client-side routing support
  - Gzip compression
  - Cache control

### Backend Service
- **Port:** 8080
- **Technology:** Spring Boot 3.2.3 + Java 21
- **Build Time:** ~3-5 minutes
- **Features:**
  - Multi-stage Docker build (optimized image)
  - Health checks enabled
  - Automatic database connection
  - OAuth2 integration

### MongoDB Service
- **Port:** 27017
- **Database:** `orgchat`
- **Admin User:** `admin` / `password` (default)
- **Volumes:** 
  - `mongodb_data` - persistent db data
  - `mongodb_config` - persistent config

### Mongo Express (Optional)
- **Port:** 8081 (only starts with `--profile debug`)
- **Features:**
  - Web-based MongoDB admin UI
  - Query builder
  - Data exploration

## Docker Compose Commands

### View Service Status
```bash
docker-compose ps
```

### View Real-time Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuild Images
```bash
# Rebuild all
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache backend
```

### Shell Into Container
```bash
# Backend
docker exec -it orgchat-backend /bin/sh

# Frontend
docker exec -it orgchat-frontend /bin/sh

# MongoDB
docker exec -it orgchat-mongodb mongosh
```

### View Container Logs
```bash
# With timestamps
docker-compose logs --timestamps backend
```

## Production Deployment

### Prerequisites
- Secure MongoDB instance (Atlas, RDS, etc.)
- SSL/TLS certificates
- Production Google OAuth credentials
- Reverse proxy (Nginx, HAProxy, etc.)

### Production Setup

1. **Create production environment file:**
```bash
cp .env.prod.example .env.prod
```

2. **Update with production values:**
```bash
# .env.prod
MONGO_USERNAME=secure_username
MONGO_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
PRODUCTION_DOMAIN=orgchat.yourdomain.com
GOOGLE_CLIENT_ID=production-client-id
GOOGLE_CLIENT_SECRET=production-client-secret
```

3. **Deploy with production compose file:**
```bash
# Using external MongoDB (recommended)
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Or with embedded MongoDB
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

4. **Configure Reverse Proxy (Nginx example):**
```nginx
upstream orgchat_backend {
    server backend:8080;
}

upstream orgchat_frontend {
    server frontend:80;
}

server {
    listen 443 ssl http2;
    server_name orgchat.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/orgchat.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/orgchat.yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://orgchat_frontend;
        proxy_set_header Host $host;
    }

    # API
    location /api/ {
        proxy_pass http://orgchat_backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://orgchat_backend/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name orgchat.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Database Management

### Backup MongoDB Data
```bash
# Backup
docker exec orgchat-mongodb mongodump --authenticationDatabase admin > backup.archive

# Restore
docker exec -i orgchat-mongodb mongorestore --authenticationDatabase admin < backup.archive
```

### Access MongoDB Shell
```bash
docker exec -it orgchat-mongodb mongosh -u admin -p password

# Inside mongo shell:
use orgchat
db.users.find()
```

### Database Indexes
MongoDB automatically creates indexes as defined in the application. To verify:

```bash
docker exec -it orgchat-mongodb mongosh -u admin -p password
use orgchat
db.users.getIndexes()
db.messages.getIndexes()
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Verify Docker daemon
docker ps

# Check disk space
docker system df

# Clean up unused resources
docker system prune -a
```

### MongoDB Connection Error

```bash
# Verify MongoDB is running
docker-compose ps mongodb

# Check logs
docker-compose logs mongodb

# Verify credentials
docker exec orgchat-mongodb mongosh -u admin -p password --authenticationDatabase admin

# Reset MongoDB
docker-compose down -v  # ⚠️ Deletes data!
docker-compose up -d
```

### Backend Can't Connect to MongoDB

```bash
# Check backend logs
docker-compose logs backend

# Verify connection string
docker exec orgchat-backend env | grep MONGODB

# Test MongoDB connectivity
docker exec orgchat-backend curl -f mongodb:27017 || echo "Connection failed"
```

### Frontend Can't Connect to Backend

```bash
# Check frontend logs
docker-compose logs frontend

# Verify Nginx config
docker exec orgchat-frontend nginx -t

# Test backend connectivity
docker exec orgchat-frontend curl http://backend:8080/api/health
```

### Port Already in Use

```bash
# Find process using port
# On Windows:
netstat -ano | findstr :8080

# On macOS/Linux:
lsof -i :8080

# Change ports in docker-compose.yml
# ports:
#   - "8081:8080"  # Map to different host port
```

## Performance Optimization

### Multi-Stage Builds
Both Dockerfiles use multi-stage builds to minimize image size:
- Backend: ~500MB (reduced from ~900MB)
- Frontend: ~200MB (reduced from ~1.2GB)

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Caching

```bash
# Build with cache
docker-compose build

# Build without cache (fresh)
docker-compose build --no-cache

# Prune unused images
docker image prune -a
```

## Security Best Practices

### 1. Secrets Management
```bash
# Don't commit .env files
echo ".env" >> .gitignore
echo ".env.prod" >> .gitignore

# Use Docker secrets for production
# See: https://docs.docker.com/engine/swarm/secrets/
```

### 2. Image Scanning
```bash
# Scan for vulnerabilities (requires Docker Scout)
docker scout cves orgchat-backend
docker scout cves orgchat-frontend
```

### 3. Network Isolation
```yaml
# Already configured in docker-compose.yml
networks:
  orgchat-network:
    driver: bridge
```

### 4. Health Checks
All services have health checks configured. Monitor with:

```bash
docker-compose ps
docker inspect orgchat-backend --format='{{.State.Health}}'
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: docker-compose build --no-cache
      
      - name: Run tests
        run: docker-compose run --rm backend mvn test
      
      - name: Push to Registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag orgchat-backend:latest myregistry/orgchat-backend:latest
          docker push myregistry/orgchat-backend:latest
```

## Monitoring & Logging

### Docker Stats
```bash
# Real-time resource usage
docker stats

# Specific container
docker stats orgchat-backend
```

### Log Rotation
Already configured in `docker-compose.prod.yml`:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Spring Boot Docker Guide](https://spring.io/guides/topical/spring-boot-docker)
- [Angular Docker Guide](https://angular.io/guide/docker)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)

---

**Last Updated:** March 21, 2026
