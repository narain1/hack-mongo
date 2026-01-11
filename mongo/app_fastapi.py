"""
FastAPI application entry point.
"""

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from typing import Optional
from contextlib import asynccontextmanager
import os
from pathlib import Path

from database import db
from services import (
    create_user, list_users, get_user, delete_user,
    create_session, list_sessions, get_session, update_session, delete_session,
    put_message, get_messages, get_message, delete_message, clear_session_messages
)


# ============== PYDANTIC MODELS ==============

class UserCreate(BaseModel):
    username: str
    email: EmailStr


class SessionCreate(BaseModel):
    user_id: str
    title: Optional[str] = None


class SessionUpdate(BaseModel):
    title: str


class MessageCreate(BaseModel):
    role: str
    content: str


# ============== APP SETUP ==============

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    yield
    # Shutdown
    print("Shutting down...")
    db.close()


app = FastAPI(
    title="MongoDB Chat API",
    description="REST API for managing users, sessions, and chat messages",
    version="1.0.0",
    lifespan=lifespan
)


# ============== HELPER ==============

def handle_response(result: dict, success_code: int = 200, error_code: int = 400):
    """Convert service response to FastAPI response."""
    if result["success"]:
        return result
    raise HTTPException(status_code=error_code, detail=result.get("error", "Unknown error"))


# ============== STATIC FILES SETUP ==============

# Determine the path to the frontend build directory
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

# Mount static assets directory if the build exists
# Vite builds output assets to /assets/ and static files to root
if FRONTEND_DIST.exists():
    # Mount assets directory for JS/CSS bundles
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    
    # Serve other static files (favicon, etc.) from dist root
    # Note: This must be done carefully to not override API routes


# ============== ROOT & HEALTH ==============

@app.get("/health", tags=["Health"])
async def health_check():
    """Check API and database health."""
    try:
        db.client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail={
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        })


# ============== USER ENDPOINTS ==============

@app.post("/api/users", status_code=201, tags=["Users"])
async def api_create_user(user: UserCreate):
    """Create a new user."""
    result = create_user(user.username, user.email)
    return handle_response(result, success_code=201)


@app.get("/api/users", tags=["Users"])
async def api_list_users():
    """Get all users."""
    result = list_users()
    return handle_response(result, error_code=500)


@app.get("/api/users/{user_id}", tags=["Users"])
async def api_get_user(user_id: str):
    """Get a single user by ID."""
    result = get_user(user_id)
    return handle_response(result, error_code=404)


@app.delete("/api/users/{user_id}", tags=["Users"])
async def api_delete_user(user_id: str):
    """Delete a user and all related data."""
    result = delete_user(user_id)
    return handle_response(result, error_code=404)


# ============== SESSION ENDPOINTS ==============

@app.post("/api/sessions", status_code=201, tags=["Sessions"])
async def api_create_session(session: SessionCreate):
    """Create a new session for a user."""
    result = create_session(session.user_id, session.title)
    return handle_response(result, success_code=201)


@app.get("/api/sessions", tags=["Sessions"])
async def api_list_sessions(user_id: Optional[str] = Query(None, description="Filter by user ID")):
    """Get all sessions, optionally filtered by user_id."""
    result = list_sessions(user_id)
    return handle_response(result, error_code=500)


@app.get("/api/sessions/{session_id}", tags=["Sessions"])
async def api_get_session(session_id: str):
    """Get a single session by ID."""
    result = get_session(session_id)
    return handle_response(result, error_code=404)


@app.put("/api/sessions/{session_id}", tags=["Sessions"])
async def api_update_session(session_id: str, session: SessionUpdate):
    """Update a session's title."""
    result = update_session(session_id, session.title)
    return handle_response(result)


@app.delete("/api/sessions/{session_id}", tags=["Sessions"])
async def api_delete_session(session_id: str):
    """Delete a session and all its messages."""
    result = delete_session(session_id)
    return handle_response(result, error_code=404)


# ============== MESSAGE ENDPOINTS ==============

@app.post("/api/sessions/{session_id}/messages", status_code=201, tags=["Messages"])
async def api_put_message(session_id: str, message: MessageCreate):
    """Add a message to a session."""
    result = put_message(session_id, message.role, message.content)
    return handle_response(result, success_code=201)


@app.get("/api/sessions/{session_id}/messages", tags=["Messages"])
async def api_get_messages(session_id: str):
    """Get all messages in a session."""
    result = get_messages(session_id)
    return handle_response(result, error_code=404)


@app.delete("/api/sessions/{session_id}/messages", tags=["Messages"])
async def api_clear_messages(session_id: str):
    """Clear all messages in a session."""
    result = clear_session_messages(session_id)
    return handle_response(result, error_code=404)


@app.get("/api/messages/{message_id}", tags=["Messages"])
async def api_get_message(message_id: str):
    """Get a single message by ID."""
    result = get_message(message_id)
    return handle_response(result, error_code=404)


@app.delete("/api/messages/{message_id}", tags=["Messages"])
async def api_delete_message(message_id: str):
    """Delete a single message."""
    result = delete_message(message_id)
    return handle_response(result, error_code=404)


# ============== PARTICIPANTS ENDPOINT ==============

@app.get("/api/participants", tags=["Participants"])
async def api_get_participants():
    """
    Get all participants.
    Returns a list of participant names from users.
    The frontend accepts either an array directly or { participants: [...] }.
    """
    try:
        # Get all users as participants
        users_result = list_users()
        if users_result.get("success") and users_result.get("users"):
            participants = [
                user.get("username", "") 
                for user in users_result["users"] 
                if user and user.get("username")
            ]
            # Return as object with participants array (frontend handles both formats)
            return {"participants": participants}
        
        # Fallback: return empty list as object
        return {"participants": []}
    except Exception as e:
        # Return empty list on error (frontend handles this gracefully)
        return {"participants": []}


# ============== FRONTEND SERVING (SPA ROUTING) ==============
# These routes must be LAST to catch all non-API routes
# FastAPI matches more specific routes first, so /health and /api/* will be handled above

def _get_frontend_index():
    """Helper to get frontend index.html path."""
    if FRONTEND_DIST.exists():
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return index_file
    return None

@app.get("/")
async def serve_root():
    """Serve the frontend index.html at root."""
    frontend_index = _get_frontend_index()
    if frontend_index:
        return FileResponse(str(frontend_index))
    return {
        "message": "Frontend not built yet",
        "instructions": "Run 'cd frontend && npm install && npm run build' to build the frontend",
        "api_docs": "/docs",
        "api_endpoints": {
            "users": "/api/users",
            "sessions": "/api/sessions",
            "messages": "/api/sessions/{session_id}/messages",
            "health": "/health"
        }
    }

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """
    Serve the frontend application for all non-API routes (SPA routing).
    API routes (/api/*), /docs, /redoc, /openapi.json, /health are handled above.
    """
    # Skip if this looks like an API route or backend endpoint (safety check)
    if full_path.startswith("api/") or full_path in ["docs", "redoc", "openapi.json", "health"]:
        raise HTTPException(status_code=404, detail="Not found")
    
    # Check if this is a static file request (e.g., favicon.ico, vite.svg)
    if FRONTEND_DIST.exists():
        static_file = FRONTEND_DIST / full_path
        if static_file.exists() and static_file.is_file():
            # Only serve actual files, not directories
            return FileResponse(str(static_file))
    
    # Serve frontend index.html for all other routes (SPA routing)
    frontend_index = _get_frontend_index()
    if frontend_index:
        return FileResponse(str(frontend_index))
    
    raise HTTPException(status_code=404, detail="Frontend not built. Run 'cd frontend && npm install && npm run build'")


# ============== RUN ==============

if __name__ == "__main__":
    import uvicorn
    from config import API_HOST, API_PORT, DEBUG
    
    uvicorn.run(
        "app_fastapi:app",
        host=API_HOST,
        port=API_PORT,
        reload=DEBUG
    )
