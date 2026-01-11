"""
Configuration settings for the MongoDB API.
"""

# MongoDB Configuration
MONGODB_URI = "mongodb+srv://cluster0.p0litw.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&appName=Cluster0"
MONGODB_CERT_FILE = "cred.pem"
DATABASE_NAME = "chat"  # Database name

# Collection Names
USERS_COLLECTION = "user"
SESSIONS_COLLECTION = "session"
HISTORY_COLLECTION = "history"

# API Configuration
API_HOST = "0.0.0.0"
API_PORT = 5000
DEBUG = True
