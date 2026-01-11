# Serving Frontend from Backend

The FastAPI backend is now configured to serve the frontend React application.

## Configuration

The backend (`mongo/app_fastapi.py`) has been updated to:
- Serve static assets from `frontend/dist/assets/` 
- Serve the frontend `index.html` for all non-API routes (SPA routing)
- Handle API routes at `/api/*` as before
- Serve static files (favicon, etc.) from the dist directory

## Setup Instructions

### 1. Build the Frontend

First, install Node.js if not already installed, then build the frontend:

```bash
# Option 1: Use the build script
./build-frontend.sh

# Option 2: Manual build
cd frontend
npm install
npm run build
```

This creates a `frontend/dist/` directory with the production build.

### 2. Start the Backend

The backend will automatically serve the frontend once it's built:

```bash
cd mongo
source venv/bin/activate
python3 app_fastapi.py
```

Or use the start script:
```bash
cd mongo
./start.sh
```

### 3. Access the Application

- **Frontend**: http://localhost:5000
- **API Docs**: http://localhost:5000/docs
- **Health Check**: http://localhost:5000/health
- **API Endpoints**: http://localhost:5000/api/*

## How It Works

1. **API Routes** (`/api/*`, `/docs`, `/health`, etc.) are handled by FastAPI endpoints
2. **Static Assets** (`/assets/*`) are served from `frontend/dist/assets/`
3. **All Other Routes** serve the frontend `index.html` for client-side routing (React Router)

## Routes Priority

FastAPI matches routes in order of specificity:
1. Specific routes (`/health`, `/api/users`, etc.) - matched first
2. Static file mounts (`/assets/*`) - matched second
3. Catch-all route (`/{full_path:path}`) - matched last, serves SPA

## Notes

- The frontend uses `/api` as the base URL (configured in `frontend/src/services/api/client.ts`)
- All API calls from the frontend will automatically go to the same domain
- No CORS issues since frontend and backend are served from the same origin
- The frontend build must exist at `frontend/dist/` for serving to work
