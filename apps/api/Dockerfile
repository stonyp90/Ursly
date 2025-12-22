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
RUN npx nx build api --prod

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install production dependencies only (skip husky)
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist/apps/api ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main.js"]

