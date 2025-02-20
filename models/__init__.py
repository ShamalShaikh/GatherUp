"""
This module initializes the models package and provides access to the database engine and session.
"""

from .base import Base, engine, SessionLocal
from .user import User

__all__ = ['Base', 'SessionLocal', 'engine', 'User']

# Create all tables if running this file directly
if __name__ == '__main__':
    Base.metadata.create_all(engine)
