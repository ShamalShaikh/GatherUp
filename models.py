from sqlalchemy import Column, Integer, String, Float, JSON, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import IntegrityError
from config import DATABASE_URL
from passlib.hash import pbkdf2_sha256

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    preferences = Column(JSON, default={
        'categories': [],
        'max_distance': 10.0  # Default max distance in kilometers
    })

    @classmethod
    def create(cls, session, email, password, name):
        password_hash = pbkdf2_sha256.hash(password)
        user = cls(email=email, password_hash=password_hash, name=name)
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
        if categories is not None:
            self.preferences['categories'] = categories
        if max_distance is not None:
            self.preferences['max_distance'] = float(max_distance)
        session.commit()
        return self.preferences

# Create engine and session factory
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Create all tables
if __name__ == '__main__':
    Base.metadata.create_all(engine)
