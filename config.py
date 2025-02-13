import os
from dotenv import load_dotenv

load_dotenv()

class Config:
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

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    DATABASE_URL = os.getenv(
        "TEST_DATABASE_URL",
        f"postgresql://gatherup:gatherup@{Config.DB_HOST}:5432/gatherup_test"
    )

class ProductionConfig(Config):
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
