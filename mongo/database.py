"""
Database connection and collection management.
"""

from pymongo import MongoClient, ASCENDING
from config import (
    MONGODB_URI,
    MONGODB_CERT_FILE,
    DATABASE_NAME,
    USERS_COLLECTION,
    SESSIONS_COLLECTION,
    HISTORY_COLLECTION
)


class Database:
    """Singleton database connection class."""
    
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._connect()
        return cls._instance
    
    def _connect(self):
        """Establish connection to MongoDB."""
        self._client = MongoClient(
            MONGODB_URI,
            tls=True,
            tlsCertificateKeyFile=MONGODB_CERT_FILE
        )
        self._db = self._client[DATABASE_NAME]
    
    @property
    def client(self):
        return self._client
    
    @property
    def db(self):
        return self._db
    
    @property
    def users(self):
        return self._db[USERS_COLLECTION]
    
    @property
    def sessions(self):
        return self._db[SESSIONS_COLLECTION]
    
    @property
    def history(self):
        return self._db[HISTORY_COLLECTION]
    
    def setup_indexes(self):
        """Create indexes for better query performance."""
        # User indexes
        self.users.create_index([("email", ASCENDING)], unique=True)
        self.users.create_index([("username", ASCENDING)])
        
        # Session indexes
        self.sessions.create_index([("user_id", ASCENDING)])
        self.sessions.create_index([("created_at", ASCENDING)])
        
        # History indexes
        self.history.create_index([("session_id", ASCENDING)])
        self.history.create_index([("session_id", ASCENDING), ("timestamp", ASCENDING)])
        
        print("Indexes created successfully!")
    
    def close(self):
        """Close the database connection."""
        if self._client:
            self._client.close()


# Global database instance
db = Database()
