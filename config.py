import os
from dotenv import load_dotenv

load_dotenv()

# Get the database host from environment or use localhost as default
DB_HOST = os.getenv("DB_HOST", "localhost")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "test-secret-key") 
# Default database URL for main application
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://gatherup:gatherup@{DB_HOST}:5432/gatherup"
)

# Test database URL
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    f"postgresql://gatherup:gatherup@{DB_HOST}:5432/gatherup_test"
)
