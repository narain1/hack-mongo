#!/bin/bash
# Script to build the frontend for production
# Loads environment variables from root .env file

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "Building frontend..."
echo "Loading environment variables from $PROJECT_ROOT/.env"

cd "$FRONTEND_DIR"

# Export VITE_ variables from root .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "Found .env file in project root, loading VITE_ variables..."
    # Source the .env file and export only VITE_ variables
    set -a  # automatically export all variables
    source <(grep "^VITE_" "$PROJECT_ROOT/.env" || true)
    set +a  # stop automatically exporting
    echo "Loaded VITE_OPENAI_API_KEY: ${VITE_OPENAI_API_KEY:0:20}..."
    echo "Loaded VITE_GOOGLE_API_KEY: ${VITE_GOOGLE_API_KEY:0:20}..."
    [ -n "$VITE_GOOGLE_MAPS_API_KEY" ] && echo "Loaded VITE_GOOGLE_MAPS_API_KEY: ${VITE_GOOGLE_MAPS_API_KEY:0:20}..."
else
    echo "Warning: No .env file found in project root"
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build the frontend (Vite will pick up the exported VITE_ env vars)
echo "Building frontend application..."
npm run build

echo ""
echo "Frontend built successfully! Output is in frontend/dist/"
echo "You can now start the backend server and it will serve the frontend."
