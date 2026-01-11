from pymongo import MongoClient
from datetime import datetime

uri = "mongodb+srv://cluster0.p0litw.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&appName=Cluster0"
client = MongoClient(uri,
                     tls=True,
                     tlsCertificateKeyFile='cred.pem',
                    # server_api=ServerApi('1')
                    )

db = client["chat_app"]

def create_collections():
    try:
        client.admin.command('ping')
        print("Connected to MongoDB successfully!")

        if "users" not in db.list_collection_names():
            db.create_collection("users")
            db.users.create_index("username", unique=True)
            db.users.create_index("email", unique=True)
            print("Users collection created with indexes")
        else:
            print("Users collection already exists")

        if "chat_history" not in db.list_collection_names():
            db.create_collection("chat_history")
            db.chat_history.create_index("room_id")
            db.chat_history.create_index("timestamp")
            print("Chat history collection created with indexes")
        else:
            print("Chat history collection already exists")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

def insert_sample_data():
    """Insert sample data for testing"""
    try:
        client.admin.command('ping')
        print("Inserting sample data...")

        # Sample users
        users_data = [
            {
                "username": "alice",
                "email": "alice@example.com",
                "password_hash": "hashed_password_1",
                "created_at": datetime.utcnow()
            },
            {
                "username": "bob",
                "email": "bob@example.com",
                "password_hash": "hashed_password_2",
                "created_at": datetime.utcnow()
            }
        ]

        # Insert users (avoid duplicates)
        for user in users_data:
            db.users.update_one(
                {"username": user["username"]},
                {"\$setOnInsert": user},
                upsert=True
            )

        chat_data = [
            {
                "room_id": "general",
                "username": "alice",
                "message": "Hello everyone!",
                "timestamp": datetime.utcnow()
            },
            {
                "room_id": "general",
                "username": "bob",
                "message": "Hi Alice!",
                "timestamp": datetime.utcnow()
            }
        ]

        result = db.chat_history.insert_many(chat_data, ordered=False)
        print(f"Inserted {len(result.inserted_ids)} sample messages")

    except Exception as e:
        print(f"Error inserting sample data: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    create_collections()
    insert_sample_data()
