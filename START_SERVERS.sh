#!/bin/bash

set -e

echo "🚀 SUQAFURAN - Fast Server Startup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kill any existing processes
echo "${YELLOW}Cleaning up old processes...${NC}"
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "python main.py" 2>/dev/null || true
sleep 2

# Start Backend
echo ""
echo "${BLUE}1️⃣  Starting FastAPI Backend (Port 8000)...${NC}"
cd /Users/mac/suqafuran/backend
python main.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"

# Wait for backend
echo "   Waiting for health check..."
for i in {1..30}; do
  if curl -s http://localhost:8000/openapi.json > /dev/null 2>&1; then
    echo "${GREEN}   ✅ Backend ready!${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "${YELLOW}   ⚠️  Backend may still be starting (timeout)${NC}"
  fi
  sleep 1
done

# Start Frontend
echo ""
echo "${BLUE}2️⃣  Starting Next.js Frontend (Port 3000)...${NC}"
cd /Users/mac/suqafuran/new-frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"

# Wait for frontend
echo "   Waiting for dev server to start..."
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "${GREEN}   ✅ Frontend ready!${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "${YELLOW}   ⚠️  Frontend may still be loading${NC}"
  fi
  sleep 1
done

echo ""
echo "${GREEN}=================================="
echo "✅ SERVERS RUNNING SUCCESSFULLY"
echo "==================================${NC}"
echo ""
echo "${BLUE}URLs:${NC}"
echo "  🌐 Frontend: ${GREEN}http://localhost:3000${NC}"
echo "  📡 Backend:  ${GREEN}http://localhost:8000${NC}"
echo "  📚 API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo "${BLUE}Logs:${NC}"
echo "  Backend:  tail -f /tmp/backend.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo "${YELLOW}Press Ctrl+C to stop servers${NC}"
echo ""

# Keep script running
wait
