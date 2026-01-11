"""
Utility functions for the MongoDB API.
"""

from bson import ObjectId
from datetime import datetime


def serialize_doc(doc: dict) -> dict:
    """
    Convert MongoDB document to JSON-serializable format.
    Converts ObjectId and datetime fields to strings.
    
    Args:
        doc: MongoDB document
        
    Returns:
        dict: Serialized document
    """
    if doc is None:
        return None
    
    serialized = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value
    
    return serialized


def serialize_docs(docs: list) -> list:
    """
    Serialize a list of MongoDB documents.
    
    Args:
        docs: List of MongoDB documents
        
    Returns:
        list: List of serialized documents
    """
    return [serialize_doc(doc) for doc in docs]


def is_valid_object_id(id_string: str) -> bool:
    """
    Check if a string is a valid MongoDB ObjectId.
    
    Args:
        id_string: String to validate
        
    Returns:
        bool: True if valid ObjectId, False otherwise
    """
    try:
        ObjectId(id_string)
        return True
    except Exception:
        return False


def create_response(success: bool, data: dict = None, error: str = None) -> dict:
    """
    Create a standardized API response.
    
    Args:
        success: Whether the operation was successful
        data: Data to include in response
        error: Error message if unsuccessful
        
    Returns:
        dict: Standardized response
    """
    response = {"success": success}
    
    if success and data:
        response.update(data)
    elif not success and error:
        response["error"] = error
    
    return response
