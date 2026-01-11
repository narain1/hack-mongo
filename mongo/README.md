# MongoDB Chat API

A REST API for managing users, sessions, and chat messages with MongoDB Atlas. Available in both **Flask** and **FastAPI** versions.

## Project Structure

```
mongodb_api/
├── app.py                 # Flask application
├── app_fastapi.py         # FastAPI application
├── config.py              # Configuration settings
├── database.py            # MongoDB connection and collections
├── routes.py              # Flask route definitions
├── utils.py               # Helper functions
├── setup.py               # Database initialization script
├── requirements.txt       # Python dependencies
├── cred.pem              # MongoDB X.509 certificate (you provide this)
└── services/
    ├── __init__.py        # Services package
    ├── user_service.py    # User CRUD operations
    ├── session_service.py # Session CRUD operations
    └── message_service.py # Message CRUD operations
```

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure the database:**
   - Edit `config.py` and set your `DATABASE_NAME`
   - Place your `cred.pem` certificate file in the project root

3. **Initialize the database:**
   ```bash
   python setup.py
   ```

4. **Run the server:**

   **Flask:**
   ```bash
   python app.py
   ```

   **FastAPI:**
   ```bash
   python app_fastapi.py
   # or
   uvicorn app_fastapi:app --reload
   ```

## Interactive API Docs (FastAPI)

FastAPI provides automatic interactive documentation:
- **Swagger UI:** http://localhost:5000/docs
- **ReDoc:** http://localhost:5000/redoc

## API Endpoints

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create a new user |
| GET | `/api/users` | List all users |
| GET | `/api/users/<user_id>` | Get a user by ID |
| DELETE | `/api/users/<user_id>` | Delete a user |

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create a new session |
| GET | `/api/sessions` | List all sessions |
| GET | `/api/sessions?user_id=<id>` | List sessions for a user |
| GET | `/api/sessions/<session_id>` | Get a session by ID |
| PUT | `/api/sessions/<session_id>` | Update session title |
| DELETE | `/api/sessions/<session_id>` | Delete a session |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions/<session_id>/messages` | Add a message |
| GET | `/api/sessions/<session_id>/messages` | Get all messages in session |
| DELETE | `/api/sessions/<session_id>/messages` | Clear all messages |
| GET | `/api/messages/<message_id>` | Get a message by ID |
| DELETE | `/api/messages/<message_id>` | Delete a message |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check API and database status |

## Request/Response Examples

### Create User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "neha", "email": "neha@example.com"}'
```

Response:
```json
{
  "success": true,
  "user_id": "507f1f77bcf86cd799439011",
  "message": "User created successfully"
}
```

### Create Session
```bash
curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"user_id": "507f1f77bcf86cd799439011", "title": "My Chat"}'
```

### Add Message
```bash
curl -X POST http://localhost:5000/api/sessions/507f1f77bcf86cd799439012/messages \
  -H "Content-Type: application/json" \
  -d '{"role": "user", "content": "Hello, how are you?"}'
```

### Get Messages
```bash
curl http://localhost:5000/api/sessions/507f1f77bcf86cd799439012/messages
```

Response:
```json
{
  "success": true,
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "session_id": "507f1f77bcf86cd799439012",
      "role": "user",
      "content": "Hello, how are you?",
      "timestamp": "2025-01-10T12:00:00"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "session_id": "507f1f77bcf86cd799439012",
      "role": "assistant",
      "content": "I'm doing great! How can I help you?",
      "timestamp": "2025-01-10T12:00:01"
    }
  ],
  "count": 2
}
```

## Collection Schemas

### User
```json
{
  "_id": "ObjectId",
  "username": "string",
  "email": "string (unique)",
  "created_at": "datetime"
}
```

### Session
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: user)",
  "title": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### History (Messages)
```json
{
  "_id": "ObjectId",
  "session_id": "ObjectId (ref: session)",
  "role": "string (user|assistant|system)",
  "content": "string",
  "timestamp": "datetime"
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

## License

MIT
