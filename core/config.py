"""
This module defines configuration settings for different environments.
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """
    Base configuration class with default settings.
    """
    DB_HOST = os.getenv("DB_HOST", "localhost")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "test-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_TOKEN_LOCATION = ['headers']
    PROPAGATE_EXCEPTIONS = True
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_CSRF_CHECK_FORM = False
    
    # Base database URL configuration
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        f"postgresql://gatherup:gatherup@{DB_HOST}:5432/gatherup"
    )

    # MongoDB configuration
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/gatherup')
    MONGO_TEST_URI = os.getenv('MONGO_TEST_URI', 'mongodb://localhost:27017/gatherup_test')

class DevelopmentConfig(Config):
    """
    Development-specific configuration.
    """
    DEBUG = True

class TestingConfig(Config):
    """
    Testing-specific configuration.
    """
    TESTING = True
    DATABASE_URL = os.getenv(
        "TEST_DATABASE_URL",
        f"postgresql://gatherup:gatherup@{Config.DB_HOST}:5432/gatherup_test"
    )
    MONGO_URI = Config.MONGO_TEST_URI

class ProductionConfig(Config):
    """
    Production-specific configuration.
    """
    DEBUG = False
    JWT_COOKIE_SECURE = True

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# Export the URLs for direct import
current_config = config[os.getenv('FLASK_ENV', 'development')]
DATABASE_URL = current_config.DATABASE_URL
TEST_DATABASE_URL = config['testing'].DATABASE_URL
