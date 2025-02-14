from flask import Flask, jsonify
from core.extensions import jwt
from api import auth_bp, preferences_bp, events_bp
from core.config import config
import os

def create_app(config_name=None):
    app = Flask(__name__)

    # Load configuration
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])

    # Initialize extensions
    jwt.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(preferences_bp, url_prefix='/api')
    app.register_blueprint(events_bp, url_prefix='/api')

    # Root route
    @app.route('/')
    def hello_world():
        return 'Hello, World!'

    return app 