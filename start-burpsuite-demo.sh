#!/bin/bash

# Start Burp Suite Demo Environment
# This script runs both the frontend and API server

echo "🔒 Starting Burp Suite Demo Environment..."
echo ""
echo "This will start:"
echo "  - Frontend on http://localhost:5173"
echo "  - API Server on http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Trap Ctrl+C to kill both processes
trap 'kill $(jobs -p) 2>/dev/null; echo ""; echo "✅ Servers stopped"; exit 0' INT

# Start API server in background
echo "Starting API server..."
node api-server.js &
API_PID=$!

# Wait a moment for API server to start
sleep 1

# Start Vite dev server
echo "Starting frontend..."
npm run dev

# This line won't be reached unless vite exits
kill $API_PID 2>/dev/null
