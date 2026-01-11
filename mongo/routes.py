"""
Flask API routes for MongoDB operations.
"""

from flask import Blueprint, request, jsonify
from services import (
    create_user, list_users, get_user, delete_user,
    create_session, list_sessions, get_session, update_session, delete_session,
    put_message, get_messages, get_message, delete_message, clear_session_messages
)

api = Blueprint('api', __name__)


# ============== USER ROUTES ==============

@api.route('/users', methods=['POST'])
def api_create_user():
    """Create a new user."""
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "error": "Request body is required"}), 400
    
    username = data.get('username')
    email = data.get('email')
    
    if not username:
        return jsonify({"success": False, "error": "Username is required"}), 400
    if not email:
        return jsonify({"success": False, "error": "Email is required"}), 400
    
    result = create_user(username, email)
    status_code = 201 if result['success'] else 400
    return jsonify(result), status_code


@api.route('/users', methods=['GET'])
def api_list_users():
    """Get all users."""
    result = list_users()
    status_code = 200 if result['success'] else 500
    return jsonify(result), status_code


@api.route('/users/<user_id>', methods=['GET'])
def api_get_user(user_id):
    """Get a single user by ID."""
    result = get_user(user_id)
    status_code = 200 if result['success'] else 404
    return jsonify(result), status_code


@api.route('/users/<user_id>', methods=['DELETE'])
def api_delete_user(user_id):
    """Delete a user and all related data."""
    result = delete_user(user_id)
    status_code = 200 if result['success'] else 404
    return jsonify(result), status_code


# ============== SESSION ROUTES ==============

@api.route('/sessions', methods=['POST'])
def api_create_session():
    """Create a new session."""
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "error": "Request body is required"}), 400
    
    user_id = data.get('user_id')
    title = data.get('title')
    
    if not user_id:
        return jsonify({"success": False, "error": "user_id is required"}), 400
    
    result = create_session(user_id, title)
    status_code = 201 if result['success'] else 400
    return jsonify(result), status_code


@api.route('/sessions', methods=['GET'])
def api_list_sessions():
    """Get all sessions, optionally filtered by user_id."""
    user_id = request.args.get('user_id')
    result = list_sessions(user_id)
    status_code = 200 if result['success'] else 500
    return jsonify(result), status_code


@api.route('/sessions/<session_id>', methods=['GET'])
def api_get_session(session_id):
    """Get a single session by ID."""
    result = get_session(session_id)
    status_code = 200 if result['success'] else 404
    return jsonify(result), status_code


@api.route('/sessions/<session_id>', methods=['PUT'])
def api_update_session(session_id):
    """Update a session's title."""
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "error": "Request body is required"}), 400
    
    title = data.get('title')
    
    result = update_session(session_id, title)
    status_code = 200 if result['success'] else 400
    return jsonify(result), status_code


@api.route('/sessions/<session_id>', methods=['DELETE'])
def api_delete_session(session_id):
    """Delete a session and all its messages."""
    result = delete_session(session_id)
    status_code = 200 if result['success'] else 404
    return jsonify(result), status_code


# ============== MESSAGE ROUTES ==============

@api.route('/sessions/<session_id>/messages', methods=['POST'])
def api_put_message(session_id):
    """Add a message to a session."""
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "error": "Request body is required"}), 400
    
    role = data.get('role')
    content = data.get('content')
    
    if not role:
        return jsonify({"success": False, "error": "role is required"}), 400
    if not content:
        return jsonify({"success": False, "error": "content is required"}), 400
    
    result = put_message(session_id, role, content)
    status_code = 201 if result['success'] else 400
    return jsonify(result), status_code


@api.route('/sessions/<session_id>/messages', methods=['GET'])
def api_get_messages(session_id):
    """Get all messages in a session."""
    result = get_messages(session_id)
    status_code = 200 if result['success'] else 404
    return jsonify(result), status_code


@api.route('/sessions/<session_id>/messages', methods=['DELETE'])
def api_clear_messages(session_id):
    """Clear all messages in a session."""
    result = clear_session_messages(session_id)
    status_code = 200 if result['success'] else 404
    return jsonify(result), status_code


@api.route('/messages/<message_id>', methods=['GET'])
def api_get_message(message_id):
    """Get a single message by ID."""
    result = get_message(message_id)
    status_code = 200 if result['success'] else 404
    return jsonify(result), status_code


@api.route('/messages/<message_id>', methods=['DELETE'])
def api_delete_message(message_id):
    """Delete a single message."""
    result = delete_message(message_id)
    status_code = 200 if result['success'] else 404
    return jsonify(result), status_code
