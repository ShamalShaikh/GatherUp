from sqlalchemy import Column, Integer, String, Float, JSON
from sqlalchemy.exc import IntegrityError
from passlib.hash import pbkdf2_sha256
from .base import Base

class User(Base):
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
        super().__init__(**kwargs)
        if self.preferences is None:
            self.preferences = {
                'categories': [],
                'max_distance': 10.0
            }

    @classmethod
    def create(cls, session, email, password, name):
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
        return session.query(cls).filter(cls.id == user_id).first()

    @classmethod
    def get_by_email(cls, session, email):
        return session.query(cls).filter(cls.email == email).first()

    def verify_password(self, password):
        return pbkdf2_sha256.verify(password, self.password_hash)

    def update_preferences(self, session, categories=None, max_distance=None):
        # Ensure preferences dict exists
        if self.preferences is None:
            self.preferences = {
                'categories': [],
                'max_distance': 10.0
            }

        # Create a new dict to avoid reference issues
        new_preferences = dict(self.preferences)

        if categories is not None:
            new_preferences['categories'] = list(categories)  # Create a new list
        if max_distance is not None:
            new_preferences['max_distance'] = float(max_distance)

        # Update the preferences with the new dict
        self.preferences = new_preferences
        
        session.add(self)
        session.commit()
        session.refresh(self)  # Refresh from database
        
        return self.preferences 