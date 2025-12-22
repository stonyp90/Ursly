# Build stage - Build gRPC service without NX
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy source files needed for build
COPY apps/grpc ./apps/grpc
COPY libs/ ./libs/

# Install dependencies (skip husky in Docker)
RUN npm ci --ignore-scripts

# Build using esbuild directly (bypass NX project graph)
RUN npx esbuild apps/grpc/src/main.ts \
    --bundle \
    --platform=node \
    --target=node24 \
    --outfile=dist/apps/grpc/main.js \
    --external:@nestjs/microservices \
    --external:@nestjs/websockets \
    --external:cache-manager \
    --external:class-transformer \
    --external:class-validator \
    --external:@grpc/grpc-js \
    --external:@grpc/proto-loader \
    --external:mongoose \
    --external:rxjs \
    --external:@nestjs/core \
    --external:@nestjs/common \
    --external:@nestjs/platform-express \
    --external:reflect-metadata

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install production dependencies only (skip husky)
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copy built application and proto files
COPY --from=builder /app/dist/apps/grpc ./dist
COPY apps/grpc/src/proto ./proto

# Expose gRPC port
EXPOSE 50051

# Start the application
CMD ["node", "dist/main.js"]
