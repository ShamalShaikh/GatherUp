from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import DATABASE_URL

# Print for debugging
print(f"Using DATABASE_URL: {DATABASE_URL}")

Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine) 