from flask import Flask
from flask_cors import CORS
from app.api.routes import api_bp
import os
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.secret_key = os.getenv("DB_SECRETKEY")

    # Register blueprints
    app.register_blueprint(api_bp, url_prefix="/api")

    return app