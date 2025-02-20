"""
This module provides fixtures for setting up the test environment, including database and client setup.
"""

import pytest
from models import Base, User, engine, SessionLocal
from datetime import timedelta
from core.config import config
from core.app import create_app
from models.mongo import MongoDB

@pytest.fixture(scope='session')
def app_with_config():
    """
    Create a Flask app configured for testing.
    """
    app = create_app('testing')
    return app

@pytest.fixture
def client(app_with_config):
    """
    Provide a test client for the Flask app.
    """
    with app_with_config.test_client() as client:
        yield client

@pytest.fixture(scope='function')
def session():
    """
    Provide a SQLAlchemy session for database operations, ensuring a clean state for each test.
    """
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(engine)

@pytest.fixture
def test_user(session):
    """
    Create a test user in the database.
    """
    user = User.create(
        session=session,
        email="test@example.com",
        password="password123",
        name="Test User"
    )
    # Ensure preferences are properly initialized
    user.preferences = {
        'categories': [],
        'max_distance': 10.0
    }
    session.commit()
    return user

@pytest.fixture
def auth_headers(client, test_user):
    """
    Provide authentication headers for a test user.
    """
    response = client.post('/login', json={
        'email': "test@example.com",
        'password': "password123"
    })
    assert response.status_code == 200, f"Login failed: {response.data}"
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def app():
    """
    Create a Flask app for testing.
    """
    app = create_app('testing')
    return app

@pytest.fixture
def mongo_db():
    """
    Provide a MongoDB test connection.
    """
    db = MongoDB()
    # Clear events collection before each test
    db.db.events.delete_many({})
    yield db
    db.db.events.delete_many({})
    db.close() 