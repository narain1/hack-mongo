#!/bin/bash
# Start script for the MongoDB Chat API backend

cd "$(dirname "$0")"
source venv/bin/activate

echo "Starting FastAPI backend server..."
echo "API will be available at: http://0.0.0.0:5000"
echo "Interactive docs at: http://localhost:5000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 app_fastapi.py
