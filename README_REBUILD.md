# Rebuild and Restart Script

## Overview

The `rebuild-and-restart.sh` script is a unified solution that:
1. **Builds the frontend** with the latest environment variables from root `.env`
2. **Stops any running backend processes**
3. **Clears caches** (Python __pycache__)
4. **Restarts the backend server** with the newly built frontend

## Usage

### Basic Usage (Foreground)
```bash
./rebuild-and-restart.sh
```
This will build the frontend and start the backend server in the foreground. Press `Ctrl+C` to stop.

### Background Mode
```bash
./rebuild-and-restart.sh --bg
```
or
```bash
./rebuild-and-restart.sh --background
```
This will build the frontend and start the backend server in the background. Logs are written to `mongo/backend.log`.

### Stop Only
```bash
./rebuild-and-restart.sh --stop
```
This will only stop any running backend processes without rebuilding or restarting.

## What the Script Does

### Step 1: Build Frontend
- Loads `VITE_*` environment variables from root `.env` file
- Installs Node.js if not present
- Installs npm dependencies if needed
- Builds the frontend production bundle to `frontend/dist/`

### Step 2: Stop Existing Backend
- Finds all running backend processes (Python/uvicorn)
- Gracefully stops them (SIGTERM, then SIGKILL if needed)
- Waits for processes to terminate

### Step 3: Clear Caches
- Removes Python `__pycache__` directories
- Removes `.pyc` files
- (Optional) Can clear Vite cache if needed

### Step 4: Start Backend
- Activates Python virtual environment
- Verifies database connection
- Starts FastAPI server
- Serves both API endpoints and frontend static files

## Output Locations

- **Frontend Build**: `frontend/dist/`
- **Backend Logs** (background mode): `mongo/backend.log`
- **API**: http://localhost:5000
- **API Docs**: http://localhost:5000/docs
- **Frontend**: http://localhost:5000

## Environment Variables

The script automatically loads `VITE_*` prefixed variables from the root `.env` file:
- `VITE_OPENAI_API_KEY`
- `VITE_GOOGLE_API_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`

## Troubleshooting

### Server won't start
- Check `mongo/backend.log` for errors (if running in background)
- Verify database connection: `cd mongo && source venv/bin/activate && python3 -c "from database import db; db.client.admin.command('ping')"`
- Check if port 5000 is already in use: `lsof -i :5000`

### Frontend build fails
- Ensure Node.js is installed: `node --version`
- Check npm dependencies: `cd frontend && npm install`
- Verify `.env` file exists in project root with `VITE_*` variables

### Process already running
- Use `./rebuild-and-restart.sh --stop` to stop existing processes
- Or manually: `pkill -f "app_fastapi.py"`

## Examples

```bash
# Full rebuild and restart (foreground)
./rebuild-and-restart.sh

# Full rebuild and restart (background)
./rebuild-and-restart.sh --bg

# Stop only
./rebuild-and-restart.sh --stop

# View background logs
tail -f mongo/backend.log
```
