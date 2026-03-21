# Stage 1: Builder - Node.js development environment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install dependencies (npm ci for reproducible builds)
RUN npm ci --prefer-offline --no-audit --no-fund

# Copy entire source code
COPY . .

# Build Angular 19 app with production optimizations
RUN npm run build -- --configuration production

# Stage 2: Runtime - Nginx
FROM nginx:1.27-alpine

WORKDIR /var/www

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create nginx cache and log directories
RUN mkdir -p /var/cache/nginx /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/www

# Copy built Angular app from builder
COPY --from=builder --chown=nginx:nginx /app/dist/orgchat-frontend/browser /var/www/html

# Add curl for health checks
RUN apk add --no-cache curl tini

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -fsSL http://localhost/ > /dev/null || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
