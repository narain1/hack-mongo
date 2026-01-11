#!/bin/bash
# Unified script to build frontend and restart the backend application
# This script:
# 1. Builds the frontend with latest environment variables
# 2. Stops any running backend processes
# 3. Clears caches
# 4. Restarts the backend server
# 5. Provides status information
#
# Usage:
#   ./rebuild-and-restart.sh          # Run in foreground (default)
#   ./rebuild-and-restart.sh --bg     # Run backend in background
#   ./rebuild-and-restart.sh --stop   # Only stop running processes

set -e

# Parse arguments
RUN_IN_BACKGROUND=false
STOP_ONLY=false

for arg in "$@"; do
    case $arg in
        --bg|--background)
            RUN_IN_BACKGROUND=true
            shift
            ;;
        --stop)
            STOP_ONLY=true
            shift
            ;;
        *)
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/mongo"

echo "=========================================="
echo "  Rebuild & Restart Application"
echo "=========================================="
echo ""

# ============== STEP 1: BUILD FRONTEND ==============
echo "📦 Step 1: Building frontend..."
echo "----------------------------------------"

cd "$FRONTEND_DIR"

# Export VITE_ variables from root .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "✓ Loading environment variables from $PROJECT_ROOT/.env"
    set -a  # automatically export all variables
    source <(grep "^VITE_" "$PROJECT_ROOT/.env" || true)
    set +a  # stop automatically exporting
    echo "✓ Loaded VITE_OPENAI_API_KEY: ${VITE_OPENAI_API_KEY:0:20}..."
    echo "✓ Loaded VITE_GOOGLE_API_KEY: ${VITE_GOOGLE_API_KEY:0:20}..."
    [ -n "$VITE_GOOGLE_MAPS_API_KEY" ] && echo "✓ Loaded VITE_GOOGLE_MAPS_API_KEY: ${VITE_GOOGLE_MAPS_API_KEY:0:20}..."
else
    echo "⚠ Warning: No .env file found in project root"
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build the frontend
echo "Building frontend application..."
if npm run build; then
    echo "✓ Frontend built successfully!"
    echo ""
else
    echo "✗ Frontend build failed!"
    exit 1
fi

# ============== STEP 2: STOP EXISTING BACKEND ==============
echo "🛑 Step 2: Stopping existing backend processes..."
echo "----------------------------------------"

cd "$PROJECT_ROOT"

# Find and kill any running backend processes
BACKEND_PIDS=$(ps aux | grep -E "(python.*app_fastapi|uvicorn.*app_fastapi)" | grep -v grep | awk '{print $2}' || true)

if [ -n "$BACKEND_PIDS" ]; then
    echo "Found running backend processes: $BACKEND_PIDS"
    for PID in $BACKEND_PIDS; do
        echo "  Stopping process $PID..."
        kill -TERM "$PID" 2>/dev/null || kill -9 "$PID" 2>/dev/null || true
    done
    # Wait a moment for processes to terminate
    sleep 2
    echo "✓ Backend processes stopped"
else
    echo "✓ No running backend processes found"
fi

# ============== STEP 3: CLEAR CACHES (OPTIONAL) ==============
echo ""
echo "🧹 Step 3: Clearing caches..."
echo "----------------------------------------"

# Clear Python cache
find "$BACKEND_DIR" -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
find "$BACKEND_DIR" -type f -name "*.pyc" -delete 2>/dev/null || true
echo "✓ Python cache cleared"

# Clear frontend build cache (optional - uncomment if needed)
# rm -rf "$FRONTEND_DIR/node_modules/.vite" 2>/dev/null || true
# echo "✓ Frontend Vite cache cleared"

# ============== STEP 4: START BACKEND ==============
echo ""
echo "🚀 Step 4: Starting backend server..."
echo "----------------------------------------"

cd "$BACKEND_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠ Virtual environment not found. Creating..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Verify database connection
echo "Verifying database connection..."
if python3 -c "from database import db; db.client.admin.command('ping'); print('✓ Database connection OK')" 2>/dev/null; then
    echo "✓ Database connection verified"
else
    echo "⚠ Warning: Could not verify database connection"
fi

# If --stop flag is set, exit here
if [ "$STOP_ONLY" = true ]; then
    echo ""
    echo "✓ Application stopped. Use './rebuild-and-restart.sh' to rebuild and start."
    exit 0
fi

echo ""
echo "=========================================="
echo "  Starting FastAPI Server"
echo "=========================================="
echo "📍 API URL: http://0.0.0.0:5000"
echo "📚 API Docs: http://localhost:5000/docs"
echo "🌐 Frontend: http://localhost:5000"
echo "💚 Health: http://localhost:5000/health"
echo ""

if [ "$RUN_IN_BACKGROUND" = true ]; then
    echo "🚀 Starting server in background..."
    nohup python3 app_fastapi.py > backend.log 2>&1 &
    BACKEND_PID=$!
    echo "✓ Backend started in background (PID: $BACKEND_PID)"
    echo "📝 Logs are being written to: $BACKEND_DIR/backend.log"
    echo ""
    echo "To stop the server, run: ./rebuild-and-restart.sh --stop"
    echo "Or kill the process: kill $BACKEND_PID"
    echo ""
    sleep 2
    # Check if server started successfully
    if ps -p $BACKEND_PID > /dev/null; then
        echo "✓ Server is running!"
    else
        echo "✗ Server failed to start. Check backend.log for errors."
        exit 1
    fi
else
    echo "Press Ctrl+C to stop the server"
    echo "=========================================="
    echo ""
    # Start the backend server in foreground
    python3 app_fastapi.py
fi
