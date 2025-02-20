from flask import Flask
from flask_cors import CORS
from app.api.routes import api_bp
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    #CORS(app)
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000", "https://unimals.vercel.app"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Range", "X-Content-Range"]
        }
    })

    app.secret_key = os.getenv("DB_SECRETKEY")

    # Register blueprints
    app.register_blueprint(api_bp, url_prefix="/api")

    return app