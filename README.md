# Ursly.io Agent Orchestrator

[![Website](https://img.shields.io/badge/Website-ursly.io-blue?logo=google-chrome&logoColor=white)](https://ursly.io)
[![App](https://img.shields.io/badge/App-app.ursly.io-purple?logo=react&logoColor=white)](https://app.ursly.io)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289da?logo=discord&logoColor=white)](https://discord.gg/cree8)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-green?logo=node.js)](https://nodejs.org/)

Ursly.io is an open-source platform for building and deploying **AI-powered agents** with automatic context management, clean architecture, and enterprise-grade security.

**Website:** [ursly.io](https://ursly.io) | **Live App:** [app.ursly.io](https://app.ursly.io) | **Auth:** [auth.ursly.io](https://auth.ursly.io)

---

## Features

### Agent Management

- Create & configure AI agents with tailored system prompts
- Interactive chat interface with real-time token tracking
- Lifecycle control (start, stop, pause)
- Context window monitoring with automatic rotation
- Model parameter tuning (temperature, top-p, max tokens)

### Model Management

- Ollama integration with direct model pulling
- Multi-model support: LLaMA 3.x, Mistral, CodeLlama, Phi3, Gemma, Qwen
- Model details: size, family, quantization, context window

### Task Execution

- AI task queue with configurable agents
- Real-time progress via WebSocket streaming
- Complete execution history with error tracking

### Access Control

- Granular permission management
- Role-based access with customizable groups
- Multi-organization support

### Enterprise Authentication

- Keycloak OIDC single sign-on
- Session management with refresh tokens
- Multi-organization contexts

---

## Repository Structure

| Folder                       | Description                                       |
| ---------------------------- | ------------------------------------------------- |
| `apps/api`                   | NestJS REST API with clean architecture           |
| `apps/web`                   | React frontend with MUI components                |
| `apps/grpc`                  | gRPC service for Ollama integration               |
| `apps/desktop`               | Tauri desktop app with GPU monitoring             |
| `libs/agent-core`            | Core agent runtime with context window management |
| `libs/audit-logger`          | Type-safe audit logging                           |
| `libs/shared/types`          | Shared TypeScript types and Zod schemas           |
| `libs/shared/access-control` | Permission and entitlement management             |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v24+
- [Docker](https://www.docker.com/) & Docker Compose
- npm (included with Node.js)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/stonyp90/ursly.git
cd ursly

# Copy environment configuration
cp env.example .env
# Edit .env with your configuration

# Install dependencies
npm install

# Start infrastructure services
docker-compose up -d

# Start development servers
npm run dev
```

### Development Commands

```bash
# Start API only
npm run start:api

# Start Web UI only
npm run start:web

# Start all services in dev mode
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Build all packages
npm run build
```

### Service Ports

| Service  | Port  | Description                          |
| -------- | ----- | ------------------------------------ |
| Web UI   | 4200  | React frontend                       |
| API      | 3000  | REST API with OpenAPI docs at `/api` |
| gRPC     | 50051 | Ollama gRPC service                  |
| Keycloak | 8080  | Identity provider                    |
| MongoDB  | 27017 | Database                             |
| Ollama   | 11434 | LLM inference                        |

---

## Architecture

```
+-------------------------------------------------------------------------+
|                    Web UI (React + MUI + Tailwind)                       |
|              Desktop App (Tauri + Rust GPU Monitoring)                   |
+-------------------------------------------------------------------------+
|                           API Gateway                                    |
|                  (NestJS + WebSocket + OpenAPI)                          |
+----------------+----------------+-----------------------------------------+
| Agent Service  |  Audit Service |     Entitlements Service              |
| (Context Mgmt) | (MongoDB Log)  |   (RBAC + Permissions)                |
+----------------+----------------+-----------------------------------------+
|                         gRPC Service                                     |
|                       (Ollama Bridge)                                    |
+-------------------------------------------------------------------------+
|                        Ollama (LLM Engine)                               |
|         llama3.x | mistral | codellama | phi3 | gemma | qwen            |
+----------------+--------------------------------------------+------------+
|    Keycloak    |                  MongoDB                   |
|   (Identity)   |                (Data Store)                |
+----------------+--------------------------------------------+
```

---

## Libraries

### Agent Core

Context window management with automatic rotation:

```typescript
import { ContextWindowManager } from '@ursly/agent-core';

const manager = new ContextWindowManager();

manager.createWindow('agent-123', {
  maxTokens: 8192,
  thresholdPercent: 80,
  modelName: 'llama3',
});

manager.addMessage('agent-123', {
  role: 'user',
  content: 'What is the capital of France?',
});

if (manager.shouldRotate('agent-123')) {
  await manager.rotateWindow('agent-123');
}
```

---

## Deployment

### Production Deployment (EC2)

```bash
# Set required environment variables
export EC2_HOST=your-ec2-ip

# Run deployment
./scripts/deploy-ec2.sh
```

### Static Website Deployment (S3)

```bash
# Requires AWS CLI configured
./scripts/deploy-website.sh
```

---

## Tech Stack

| Category     | Technologies                                             |
| ------------ | -------------------------------------------------------- |
| **Backend**  | NestJS, TypeScript, Zod, MongoDB, gRPC, WebSocket        |
| **Frontend** | React, MUI, React Router, Tailwind CSS                   |
| **Desktop**  | Tauri, Rust, Native GPU APIs                             |
| **Auth**     | Keycloak, OIDC, JWT, Passport                            |
| **AI/ML**    | Ollama, LLaMA 3.x, Mistral, CodeLlama, Phi3, Gemma, Qwen |
| **DevOps**   | Docker, Nx, Vite, Terraform, ESLint, Husky               |

---

## Contributing

We welcome contributions from the community!

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes with tests
4. Run `npm test` and `npm run lint`
5. Submit a pull request

### Code Standards

- All new code requires unit tests
- Follow existing code style (enforced by ESLint + Prettier)
- Update documentation for new features

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <b>Build the future of AI agents with Ursly.io</b>
</p>
