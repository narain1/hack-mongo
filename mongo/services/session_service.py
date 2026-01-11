"""
Session service - handles all session-related operations.
"""

from datetime import datetime
from bson import ObjectId
from database import db
from utils import serialize_doc, serialize_docs, is_valid_object_id, create_response


def create_session(user_id: str, title: str = None) -> dict:
    """
    Create a new session for a user.
    
    Args:
        user_id: User's ObjectId as string
        title: Optional session title
        
    Returns:
        dict: Response with session_id or error
    """
    try:
        if not is_valid_object_id(user_id):
            return create_response(False, error="Invalid user ID format")
        
        # Verify user exists
        if not db.users.find_one({"_id": ObjectId(user_id)}):
            return create_response(False, error="User not found")
        
        session = {
            "user_id": ObjectId(user_id),
            "title": title.strip() if title else "New Session",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = db.sessions.insert_one(session)
        
        return create_response(True, {
            "session_id": str(result.inserted_id),
            "message": "Session created successfully"
        })
        
    except Exception as e:
        return create_response(False, error=str(e))


def list_sessions(user_id: str = None) -> dict:
    """
    Get all sessions, optionally filtered by user_id.
    
    Args:
        user_id: Optional user ID to filter sessions
        
    Returns:
        dict: Response with list of sessions
    """
    try:
        query = {}
        
        if user_id:
            if not is_valid_object_id(user_id):
                return create_response(False, error="Invalid user ID format")
            query["user_id"] = ObjectId(user_id)
        
        sessions = list(db.sessions.find(query).sort("updated_at", -1))
        
        return create_response(True, {
            "sessions": serialize_docs(sessions),
            "count": len(sessions)
        })
        
    except Exception as e:
        return create_response(False, error=str(e))


def get_session(session_id: str) -> dict:
    """
    Get a single session by ID.
    
    Args:
        session_id: Session's ObjectId as string
        
    Returns:
        dict: Response with session data or error
    """
    try:
        if not is_valid_object_id(session_id):
            return create_response(False, error="Invalid session ID format")
        
        session = db.sessions.find_one({"_id": ObjectId(session_id)})
        
        if not session:
            return create_response(False, error="Session not found")
        
        return create_response(True, {
            "session": serialize_doc(session)
        })
        
    except Exception as e:
        return create_response(False, error=str(e))


def update_session(session_id: str, title: str) -> dict:
    """
    Update a session's title.
    
    Args:
        session_id: Session's ObjectId as string
        title: New session title
        
    Returns:
        dict: Response with update status
    """
    try:
        if not is_valid_object_id(session_id):
            return create_response(False, error="Invalid session ID format")
        
        if not title or not title.strip():
            return create_response(False, error="Title is required")
        
        result = db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "title": title.strip(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return create_response(False, error="Session not found")
        
        return create_response(True, {
            "message": "Session updated successfully"
        })
        
    except Exception as e:
        return create_response(False, error=str(e))


def delete_session(session_id: str) -> dict:
    """
    Delete a session and all its messages.
    
    Args:
        session_id: Session's ObjectId as string
        
    Returns:
        dict: Response with deletion status
    """
    try:
        if not is_valid_object_id(session_id):
            return create_response(False, error="Invalid session ID format")
        
        # Check if session exists
        session = db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            return create_response(False, error="Session not found")
        
        # Delete all messages in this session
        db.history.delete_many({"session_id": ObjectId(session_id)})
        
        # Delete the session
        db.sessions.delete_one({"_id": ObjectId(session_id)})
        
        return create_response(True, {
            "message": "Session and all messages deleted successfully"
        })
        
    except Exception as e:
        return create_response(False, error=str(e))
