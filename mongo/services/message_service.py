"""
Message service - handles all message/history-related operations.
"""

from datetime import datetime
from bson import ObjectId
from database import db
from utils import serialize_doc, serialize_docs, is_valid_object_id, create_response


VALID_ROLES = ["user", "assistant", "system"]


def put_message(session_id: str, role: str, content: str) -> dict:
    """
    Add a message to a session's history.
    
    Args:
        session_id: Session's ObjectId as string
        role: Message role ("user", "assistant", or "system")
        content: Message content
        
    Returns:
        dict: Response with message_id or error
    """
    try:
        if not is_valid_object_id(session_id):
            return create_response(False, error="Invalid session ID format")
        
        # Verify session exists
        if not db.sessions.find_one({"_id": ObjectId(session_id)}):
            return create_response(False, error="Session not found")
        
        # Validate role
        if role not in VALID_ROLES:
            return create_response(False, error=f"Role must be one of: {', '.join(VALID_ROLES)}")
        
        # Validate content
        if not content or not content.strip():
            return create_response(False, error="Content is required")
        
        message = {
            "session_id": ObjectId(session_id),
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow()
        }
        
        result = db.history.insert_one(message)
        
        # Update session's updated_at timestamp
        db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        
        return create_response(True, {
            "message_id": str(result.inserted_id),
            "message": "Message added successfully"
        })
        
    except Exception as e:
        return create_response(False, error=str(e))


def get_messages(session_id: str) -> dict:
    """
    Get all messages in a session, ordered by timestamp.
    
    Args:
        session_id: Session's ObjectId as string
        
    Returns:
        dict: Response with list of messages
    """
    try:
        if not is_valid_object_id(session_id):
            return create_response(False, error="Invalid session ID format")
        
        # Verify session exists
        if not db.sessions.find_one({"_id": ObjectId(session_id)}):
            return create_response(False, error="Session not found")
        
        messages = list(db.history.find(
            {"session_id": ObjectId(session_id)}
        ).sort("timestamp", 1))
        
        return create_response(True, {
            "messages": serialize_docs(messages),
            "count": len(messages)
        })
        
    except Exception as e:
        return create_response(False, error=str(e))


def get_message(message_id: str) -> dict:
    """
    Get a single message by ID.
    
    Args:
        message_id: Message's ObjectId as string
        
    Returns:
        dict: Response with message data or error
    """
    try:
        if not is_valid_object_id(message_id):
            return create_response(False, error="Invalid message ID format")
        
        message = db.history.find_one({"_id": ObjectId(message_id)})
        
        if not message:
            return create_response(False, error="Message not found")
        
        return create_response(True, {
            "message": serialize_doc(message)
        })
        
    except Exception as e:
        return create_response(False, error=str(e))


def delete_message(message_id: str) -> dict:
    """
    Delete a single message.
    
    Args:
        message_id: Message's ObjectId as string
        
    Returns:
        dict: Response with deletion status
    """
    try:
        if not is_valid_object_id(message_id):
            return create_response(False, error="Invalid message ID format")
        
        result = db.history.delete_one({"_id": ObjectId(message_id)})
        
        if result.deleted_count == 0:
            return create_response(False, error="Message not found")
        
        return create_response(True, {
            "message": "Message deleted successfully"
        })
        
    except Exception as e:
        return create_response(False, error=str(e))


def clear_session_messages(session_id: str) -> dict:
    """
    Delete all messages in a session.
    
    Args:
        session_id: Session's ObjectId as string
        
    Returns:
        dict: Response with deletion status
    """
    try:
        if not is_valid_object_id(session_id):
            return create_response(False, error="Invalid session ID format")
        
        # Verify session exists
        if not db.sessions.find_one({"_id": ObjectId(session_id)}):
            return create_response(False, error="Session not found")
        
        result = db.history.delete_many({"session_id": ObjectId(session_id)})
        
        return create_response(True, {
            "message": f"Deleted {result.deleted_count} messages",
            "deleted_count": result.deleted_count
        })
        
    except Exception as e:
        return create_response(False, error=str(e))
