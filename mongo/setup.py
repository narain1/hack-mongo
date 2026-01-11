"""
Setup script to initialize database indexes.
Run this once before starting the application.
"""

from database import db


def setup():
    """Initialize the database with required indexes."""
    print("Setting up database indexes...")
    db.setup_indexes()
    print("Setup complete!")
    
    # Test connection
    print("\nTesting connection...")
    try:
        db.client.admin.command('ping')
        print("✓ Successfully connected to MongoDB!")
    except Exception as e:
        print(f"✗ Connection failed: {e}")


if __name__ == '__main__':
    setup()
