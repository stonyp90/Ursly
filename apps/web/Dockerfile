# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy all source files
COPY apps/ ./apps/
COPY libs/ ./libs/

# Install dependencies (skip husky in Docker)
RUN npm ci --ignore-scripts

# Build the application
RUN npx nx build web --prod

# Production stage
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built application to nginx
COPY --from=builder /app/dist/apps/web /usr/share/nginx/html

# Copy nginx configuration (Docker-only, prod uses S3 + CloudFront)
COPY local-dev/docker/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

