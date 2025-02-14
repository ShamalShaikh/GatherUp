import pytest
from models import Base, User, engine, SessionLocal
from datetime import timedelta
from core.config import config
from core.app import create_app

@pytest.fixture(scope='session')
def app_with_config():
    app = create_app('testing')
    return app

@pytest.fixture
def client(app_with_config):
    with app_with_config.test_client() as client:
        yield client

@pytest.fixture(scope='function')
def session():
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
    response = client.post('/login', json={
        'email': "test@example.com",
        'password': "password123"
    })
    assert response.status_code == 200, f"Login failed: {response.data}"
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def app():
    app = create_app('testing')
    return app 