from .base import Base, engine, SessionLocal
from .user import User

__all__ = ['Base', 'SessionLocal', 'engine', 'User']

# Create all tables if running this file directly
if __name__ == '__main__':
    Base.metadata.create_all(engine)
