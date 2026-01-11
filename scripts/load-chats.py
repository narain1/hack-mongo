"""
Load chats from MongoDB using session IDs.
"""

import sys
import os
from bson import ObjectId
from datetime import datetime

# Add parent directory to path to import mongo modules
mongo_dir = os.path.join(os.path.dirname(__file__), '..', 'mongo')
sys.path.insert(0, mongo_dir)

# Change to mongo directory to find cred.pem
os.chdir(mongo_dir)

from database import db
from utils import serialize_doc


def load_session_chats(session_id: str = None):
    """
    Load chats from MongoDB for a specific session or all sessions.
    
    Args:
        session_id: Optional session ID to filter. If None, loads all sessions.
    """
    try:
        if session_id:
            # Load specific session
            if not ObjectId.is_valid(session_id):
                print(f"❌ Invalid session ID format: {session_id}")
                return
            
            session_obj_id = ObjectId(session_id)
            
            # Get session info
            session = db.sessions.find_one({"_id": session_obj_id})
            if not session:
                print(f"❌ Session not found: {session_id}")
                return
            
            print(f"\n📋 Session: {session.get('title', 'Untitled')}")
            print(f"   ID: {session_id}")
            print(f"   User ID: {session.get('user_id')}")
            print(f"   Created: {session.get('created_at')}")
            print(f"   Updated: {session.get('updated_at')}")
            
            # Get messages for this session
            messages = list(db.history.find({"session_id": session_obj_id}).sort("timestamp", 1))
            
            if messages:
                print(f"\n💬 Messages ({len(messages)}):")
                print("-" * 80)
                for msg in messages:
                    role = msg.get('role', 'unknown')
                    content = msg.get('content', '')
                    timestamp = msg.get('timestamp', '')
                    msg_id = msg.get('_id')
                    
                    # Format role with emoji
                    role_emoji = {
                        'user': '👤',
                        'assistant': '🤖',
                        'system': '⚙️'
                    }.get(role, '❓')
                    
                    print(f"\n{role_emoji} [{role.upper()}] (ID: {msg_id})")
                    print(f"   Time: {timestamp}")
                    print(f"   Content: {content[:200]}{'...' if len(content) > 200 else ''}")
            else:
                print("\n📭 No messages found for this session.")
        
        else:
            # Load all sessions
            print("\n🔍 Loading all sessions from MongoDB...\n")
            
            sessions = list(db.sessions.find().sort("created_at", -1))
            
            if not sessions:
                print("❌ No sessions found in database.")
                return
            
            print(f"📊 Found {len(sessions)} session(s)\n")
            print("=" * 80)
            
            for session in sessions:
                session_id = str(session.get('_id'))
                title = session.get('title', 'Untitled')
                user_id = session.get('user_id')
                created_at = session.get('created_at')
                updated_at = session.get('updated_at')
                
                print(f"\n📋 Session: {title}")
                print(f"   ID: {session_id}")
                print(f"   User ID: {user_id}")
                print(f"   Created: {created_at}")
                print(f"   Updated: {updated_at}")
                
                # Get message count
                session_obj_id = ObjectId(session_id)
                message_count = db.history.count_documents({"session_id": session_obj_id})
                
                print(f"   Messages: {message_count}")
                
                # Get first few messages as preview
                if message_count > 0:
                    messages = list(db.history.find({"session_id": session_obj_id})
                                  .sort("timestamp", 1).limit(3))
                    print(f"\n   Preview:")
                    for msg in messages:
                        role = msg.get('role', 'unknown')
                        content = msg.get('content', '')
                        preview = content[:60] + '...' if len(content) > 60 else content
                        role_emoji = {'user': '👤', 'assistant': '🤖', 'system': '⚙️'}.get(role, '❓')
                        print(f"      {role_emoji} [{role}]: {preview}")
                
                print("-" * 80)
    
    except Exception as e:
        print(f"❌ Error loading chats: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Main function to load chats."""
    if len(sys.argv) > 1:
        # Load specific session
        session_id = sys.argv[1]
        print(f"🔍 Loading chat for session: {session_id}")
        load_session_chats(session_id)
    else:
        # Load all sessions
        print("🔍 Loading all chats from MongoDB...")
        load_session_chats()


if __name__ == "__main__":
    main()
