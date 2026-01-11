"""
User service - handles all user-related operations.
"""

from datetime import datetime
from bson import ObjectId
from database import db
from utils import serialize_doc, serialize_docs, is_valid_object_id, create_response


def create_user(username: str, email: str) -> dict:
    """
    Create a new user.
    
    Args:
        username: User's username
        email: User's email address
        
    Returns:
        dict: Response with user_id or error
    """
    try:
        # Validate inputs
        if not username or not username.strip():
            return create_response(False, error="Username is required")
        
        if not email or not email.strip():
            return create_response(False, error="Email is required")
        
        # Check if email already exists
        if db.users.find_one({"email": email}):
            return create_response(False, error="Email already exists")
        
        # Check if username already exists
        if db.users.find_one({"username": username}):
            return create_response(False, error="Username already exists")
        
        user = {
            "username": username.strip(),
            "email": email.strip().lower(),
            "created_at": datetime.utcnow()
        }
        
        result = db.users.insert_one(user)
        
        return create_response(True, {
            "user_id": str(result.inserted_id),
            "message": "User created successfully"
        })
        
    except Exception as e:
        return create_response(False, error=str(e))


def list_users() -> dict:
    """
    Get all users.
    
    Returns:
        dict: Response with list of users
    """
    try:
        users = list(db.users.find().sort("created_at", -1))
        
        return create_response(True, {
            "users": serialize_docs(users),
            "count": len(users)
        })
        
    except Exception as e:
        return create_response(False, error=str(e))


def get_user(user_id: str) -> dict:
    """
    Get a single user by ID.
    
    Args:
        user_id: User's ObjectId as string
        
    Returns:
        dict: Response with user data or error
    """
    try:
        if not is_valid_object_id(user_id):
            return create_response(False, error="Invalid user ID format")
        
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return create_response(False, error="User not found")
        
        return create_response(True, {
            "user": serialize_doc(user)
        })
        
    except Exception as e:
        return create_response(False, error=str(e))


def delete_user(user_id: str) -> dict:
    """
    Delete a user and all their sessions and messages.
    
    Args:
        user_id: User's ObjectId as string
        
    Returns:
        dict: Response with deletion status
    """
    try:
        if not is_valid_object_id(user_id):
            return create_response(False, error="Invalid user ID format")
        
        # Check if user exists
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return create_response(False, error="User not found")
        
        # Get all session IDs for this user
        sessions = db.sessions.find({"user_id": ObjectId(user_id)})
        session_ids = [s["_id"] for s in sessions]
        
        # Delete all messages in user's sessions
        if session_ids:
            db.history.delete_many({"session_id": {"$in": session_ids}})
        
        # Delete all user's sessions
        db.sessions.delete_many({"user_id": ObjectId(user_id)})
        
        # Delete the user
        db.users.delete_one({"_id": ObjectId(user_id)})
        
        return create_response(True, {
            "message": "User and all related data deleted successfully"
        })
        
    except Exception as e:
        return create_response(False, error=str(e))
