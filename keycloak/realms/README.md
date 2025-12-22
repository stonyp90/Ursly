# Keycloak Realm Configuration

This directory contains the Keycloak realm configuration that will be automatically imported when the Keycloak container starts.

## Realm: agent-orchestrator

### Clients

1. **agent-web** (Public Client)
   - Frontend React application
   - Uses PKCE for security
   - Allowed redirect URIs: `http://localhost:4200/*`

2. **agent-api** (Confidential Client)
   - Backend NestJS API
   - Client secret: `change-me-in-production`
   - Service account enabled for machine-to-machine communication

### Roles

- **agent-admin**: Full administrative access
- **agent-user**: Standard user access
- **agent-viewer**: Read-only access

### Default Users

1. **admin**
   - Email: admin@agent-orchestrator.local
   - Password: admin123
   - Role: agent-admin

2. **user**
   - Email: user@agent-orchestrator.local
   - Password: user123
   - Role: agent-user

**Note**: Change these passwords in production!

## Token Configuration

- Access Token Lifespan: 300 seconds (5 minutes)
- SSO Session Idle: 1800 seconds (30 minutes)
- SSO Session Max: 36000 seconds (10 hours)

## Security Features

- Brute force protection enabled
- Email verification required
- Password reset allowed
- HTTPS required for external connections

