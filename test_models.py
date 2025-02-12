import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User
from config import TEST_DATABASE_URL

@pytest.fixture(scope="function")
def session():
    # Create test database engine
    engine = create_engine(TEST_DATABASE_URL)
    
    # Create all tables
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    
    # Create session
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        # Base.metadata.drop_all(engine)

def test_create_user(session):
    # Test creating a new user
    user = User.create(
        session=session,
        email="test@example.com",
        password="password123",
        name="Test User"
    )
    
    assert user is not None
    assert user.email == "test@example.com"
    assert user.name == "Test User"
    assert user.id is not None
    assert user.verify_password("password123")

def test_duplicate_email(session):
    # Create first user
    user1 = User.create(
        session=session,
        email="test@example.com",
        password="password123",
        name="Test User 1"
    )
    
    # Try to create second user with same email
    user2 = User.create(
        session=session,
        email="test@example.com",
        password="password2",
        name="Test User 2"
    )
    
    assert user1 is not None
    assert user2 is None

def test_get_user_by_id(session):
    # Create a user
    user = User.create(
        session=session,
        email="test@example.com",
        password="test_password",
        name="Test User"
    )
    
    # Fetch user by ID
    fetched_user = User.get_by_id(session, user.id)
    
    assert fetched_user is not None
    assert fetched_user.id == user.id
    assert fetched_user.email == user.email
    assert fetched_user.name == user.name
