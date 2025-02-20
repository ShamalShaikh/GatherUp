"""
This module defines the User model and its operations for SQLAlchemy.
"""

from sqlalchemy import Column, Integer, String, Float, JSON
from sqlalchemy.exc import IntegrityError
from passlib.hash import pbkdf2_sha256
from .base import Base

class User(Base):
    """
    User model for SQLAlchemy with methods for user management.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    preferences = Column(JSON, nullable=False, default={
        'categories': [],
        'max_distance': 10.0
    })

    def __init__(self, **kwargs):
        """
        Initialize a User instance with default preferences if not provided.
        """
        super().__init__(**kwargs)
        if self.preferences is None:
            self.preferences = {
                'categories': [],
                'max_distance': 10.0
            }

    @classmethod
    def create(cls, session, email, password, name):
        """
        Create a new user and add to the session.
        
        Hashes the password and handles integrity errors.
        """
        password_hash = pbkdf2_sha256.hash(password)
        user = cls(
            email=email,
            password_hash=password_hash,
            name=name,
            preferences={
                'categories': [],
                'max_distance': 10.0
            }
        )
        session.add(user)
        try:
            session.commit()
            return user
        except IntegrityError:
            session.rollback()
            return None

    @classmethod
    def get_by_id(cls, session, user_id):
        """
        Retrieve a user by their ID.
        """
        return session.query(cls).filter(cls.id == user_id).first()

    @classmethod
    def get_by_email(cls, session, email):
        """
        Retrieve a user by their email.
        """
        return session.query(cls).filter(cls.email == email).first()

    def verify_password(self, password):
        """
        Verify a user's password against the stored hash.
        """
        return pbkdf2_sha256.verify(password, self.password_hash)

    def update_preferences(self, session, categories=None, max_distance=None):
        """
        Update the user's preferences.
        
        Commits changes to the session and refreshes the user instance.
        """
        current_preferences = self.preferences or {
            'categories': [],
            'max_distance': 10.0
        }
        
        # Create new dict to avoid reference issues
        new_preferences = dict(current_preferences)

        if categories is not None:
            new_preferences['categories'] = list(categories)  # Create new list copy
        if max_distance is not None:
            new_preferences['max_distance'] = float(max_distance)

        # Update preferences
        self.preferences = new_preferences
        session.add(self)
        session.commit()
        session.refresh(self)  # Ensure we have latest data
        
        return self.preferences 