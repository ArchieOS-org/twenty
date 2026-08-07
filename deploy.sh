#!/bin/bash
# Deploy Twenty CRM on M1 Studio with minimal resources
# Run from: /Users/noahdeskin/twenty-crm on M1 Studio

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Docker needs full path on macOS
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

echo "=== Twenty CRM Deploy ==="
echo ""

# Check Docker
if ! docker ps &>/dev/null; then
    echo "❌ Docker not running. Start Docker Desktop first."
    exit 1
fi

# Stop any existing instances
echo "→ Stopping existing containers..."
docker compose -f packages/twenty-docker/docker-compose.yml \
               -f packages/twenty-docker/docker-compose.lowres.yml \
               down 2>/dev/null || true

# Create .env if missing
if [ ! -f packages/twenty-docker/.env ]; then
    echo "→ Creating .env from template..."
    cp packages/twenty-docker/.env.example packages/twenty-docker/.env
    
    # Generate random secrets
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    APP_SECRET=$(openssl rand -base64 32)
    sed -i '' "s/CHANGE_ME_ENCRYPTION_KEY/$ENCRYPTION_KEY/" packages/twenty-docker/.env
    sed -i '' "s/CHANGE_ME_APP_SECRET/$APP_SECRET/" packages/twenty-docker/.env
fi

# Start with resource limits
echo "→ Starting containers (low-res mode)..."
docker compose -f packages/twenty-docker/docker-compose.yml \
               -f packages/twenty-docker/docker-compose.lowres.yml \
               up -d

echo ""
echo "→ Waiting for health checks..."
sleep 5

# Check health
echo "→ Container status:"
docker compose -f packages/twenty-docker/docker-compose.yml ps

echo ""
echo "→ Waiting for server to be ready (may take 60-90s)..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:3000/healthz > /dev/null 2>&1; then
        echo "✅ Twenty CRM is up at http://localhost:3000"
        exit 0
    fi
    sleep 3
done

echo "⚠️  Server not ready after 90s. Check logs:"
docker compose -f packages/twenty-docker/docker-compose.yml logs --tail=30 server
