#!/bin/bash
# Ursly.io EC2 Deployment Script
# Deploys to app.ursly.io on EC2 instance
#
# Prerequisites:
#   - SSH key configured for the EC2 instance
#   - EC2_HOST environment variable set (or edit below)
#
# Usage:
#   EC2_HOST=your-ec2-ip ./scripts/deploy-ec2.sh

set -e

# Configuration - Override via environment variables
EC2_HOST="${EC2_HOST:?EC2_HOST environment variable is required}"
EC2_USER="${EC2_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
DEPLOY_DIR="${DEPLOY_DIR:-/home/ubuntu/ursly}"

echo "================================================"
echo "  Ursly.io EC2 Deployment"
echo "  Target: app.ursly.io"
echo "  Host: $EC2_HOST"
echo "================================================"

# Validate SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key not found at $SSH_KEY"
    echo "Set SSH_KEY environment variable to your key path"
    exit 1
fi

echo ""
echo "[1/4] Testing SSH connection..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$EC2_USER@$EC2_HOST" "echo 'SSH connection successful'"

echo ""
echo "[2/4] Creating deployment directory structure..."
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" "mkdir -p $DEPLOY_DIR/{nginx,keycloak/realms,keycloak/themes,local-dev/mongo-init,apps/{api,grpc,web},libs}"

echo ""
echo "[3/4] Syncing project files to EC2..."
# Create a temporary directory with only needed files
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy essential files to temp directory
cp docker-compose.prod.yml "$TEMP_DIR/docker-compose.yml"
cp -r nginx "$TEMP_DIR/"
mkdir -p "$TEMP_DIR/keycloak/realms" "$TEMP_DIR/keycloak/themes"
cp keycloak/realms/agent-orchestrator-realm.json "$TEMP_DIR/keycloak/realms/"
cp -r keycloak/themes/ursly "$TEMP_DIR/keycloak/themes/"
mkdir -p "$TEMP_DIR/local-dev/mongo-init"
cp local-dev/mongo-init/init-mongo.js "$TEMP_DIR/local-dev/mongo-init/"
cp package.json package-lock.json nx.json tsconfig.base.json "$TEMP_DIR/"
cp -r apps "$TEMP_DIR/"
cp -r libs "$TEMP_DIR/"

# Remove node_modules and build artifacts
find "$TEMP_DIR" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find "$TEMP_DIR" -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find "$TEMP_DIR" -name "target" -type d -exec rm -rf {} + 2>/dev/null || true
find "$TEMP_DIR" -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true

# Sync to EC2
rsync -avz --progress -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$TEMP_DIR/" "$EC2_USER@$EC2_HOST:$DEPLOY_DIR/"

echo ""
echo "[4/4] Setting up environment and starting services..."
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << 'REMOTE_SCRIPT'
cd /home/ubuntu/ursly

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Ursly.io Production Environment
# IMPORTANT: Update all placeholder values before running!
NODE_ENV=production

# Keycloak Configuration
KEYCLOAK_ADMIN_PASSWORD=CHANGE_ME_SECURE_PASSWORD
KEYCLOAK_DB_PASSWORD=CHANGE_ME_SECURE_PASSWORD
KEYCLOAK_CLIENT_SECRET=CHANGE_ME_SECURE_SECRET

# MongoDB Configuration
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=CHANGE_ME_SECURE_PASSWORD

# Agent Token (minimum 32 characters)
AGENT_TOKEN_SECRET=CHANGE_ME_MINIMUM_32_CHARACTERS_LONG

# SMTP Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_FROM=noreply@ursly.io
SMTP_USER=
SMTP_PASSWORD=
SMTP_SSL=false
SMTP_STARTTLS=true

# Novu Notifications (optional)
NOVU_API_KEY=
VITE_NOVU_APPLICATION_IDENTIFIER=
EOF
    echo "Created default .env file - PLEASE UPDATE WITH SECURE PASSWORDS!"
    echo "Run: nano /home/ubuntu/ursly/.env"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker ubuntu
    echo "Docker installed successfully!"
fi

# Check if SSL certificates exist
if [ ! -d /etc/letsencrypt/live/app.ursly.io ]; then
    echo "SSL certificates not found. Setting up Let's Encrypt..."
    sudo apt-get update
    sudo apt-get install -y certbot
    # Stop any running services that might be using port 80
    docker compose down 2>/dev/null || true
    sudo certbot certonly --standalone \
        -d app.ursly.io \
        -d api.ursly.io \
        -d auth.ursly.io \
        -d grpc.ursly.io \
        --non-interactive --agree-tos --email admin@ursly.io \
        || echo "Certbot failed - check DNS and try again"
fi

# Start or restart services
echo "Starting Docker services..."
docker compose down || true
docker compose build --no-cache
docker compose up -d

echo "Waiting for services to start..."
sleep 30

echo "Checking service status..."
docker compose ps

echo ""
echo "================================================"
echo "  Deployment Complete!"
echo "  Access: https://app.ursly.io"
echo "================================================"
REMOTE_SCRIPT

echo ""
echo "Deployment finished!"
echo "Check logs with: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'cd $DEPLOY_DIR && docker compose logs -f'"
