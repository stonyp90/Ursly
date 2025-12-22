# Local Development Setup

This directory contains configuration files specifically for local development using Docker Compose.

## Contents

- **`docker/web/nginx.conf`** - Nginx configuration for serving the web frontend in Docker
- **`mongo-init/init-mongo.js`** - MongoDB initialization script for creating collections and indexes

## Usage

These files are referenced by the root `docker-compose.yml` for local development only.

For **production** and **dev** cloud deployments, we use:
- Terraform configurations in `/terraform/environments/`
- AWS S3 + CloudFront for static web hosting
- AWS DocumentDB instead of MongoDB
- AWS ECS for containerized services

## Starting Local Development

```bash
# From the project root
docker-compose up -d

# Or build and start
docker-compose up -d --build
```

## Services

| Service      | Port  | Description                     |
|--------------|-------|---------------------------------|
| web          | 4200  | React frontend (via nginx)      |
| api          | 3000  | NestJS REST API                 |
| grpc         | 50051 | gRPC service for Ollama         |
| keycloak     | 8080  | Identity provider               |
| mongodb      | 27017 | Document database               |
| ollama       | 11434 | AI model runtime                |
| mailhog      | 8025  | Email testing (SMTP on 1025)    |

## Environment Variables

Create a `.env` file in the project root:

```env
KEYCLOAK_CLIENT_SECRET=change-me
AGENT_TOKEN_SECRET=your-secret-key-change-in-production
```

## Notes

- The `nginx.conf` is only used in the Docker container. Local Vite dev server handles routing differently.
- MongoDB init script creates indexes for better query performance.
- Keycloak realm is auto-imported from `/keycloak/realms/`.
