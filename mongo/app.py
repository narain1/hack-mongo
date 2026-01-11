"""
Main Flask application entry point.
"""

from flask import Flask, jsonify
from routes import api
from database import db
from config import API_HOST, API_PORT, DEBUG


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Register blueprints
    app.register_blueprint(api, url_prefix='/api')
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        try:
            # Ping the database
            db.client.admin.command('ping')
            return jsonify({
                "status": "healthy",
                "database": "connected"
            }), 200
        except Exception as e:
            return jsonify({
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }), 503
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            "message": "MongoDB Chat API",
            "version": "1.0.0",
            "endpoints": {
                "users": "/api/users",
                "sessions": "/api/sessions",
                "messages": "/api/sessions/<session_id>/messages",
                "health": "/health"
            }
        }), 200
    
    return app


if __name__ == '__main__':
    app = create_app()
    
    # Optionally setup indexes on first run
    # db.setup_indexes()
    
    print(f"Starting server on http://{API_HOST}:{API_PORT}")
    app.run(host=API_HOST, port=API_PORT, debug=DEBUG)
