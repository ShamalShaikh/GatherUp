import pytest
from app import app
from models import Base, User, engine, SessionLocal
from sqlalchemy import create_engine
import json
from datetime import timedelta
from config import config

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=30)
    app.config['SQLALCHEMY_DATABASE_URI'] = config['testing'].DATABASE_URL
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False
    app.config['JWT_CSRF_CHECK_FORM'] = False
    with app.test_client() as client:
        yield client

@pytest.fixture
def session():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Base.metadata.drop_all(engine)

@pytest.fixture
def test_user(session):
    user = User.create(
        session=session,
        email="test@example.com",
        password="password123",
        name="Test User"
    )
    # Initialize default preferences
    user.preferences = {
        'categories': [],
        'max_distance': 10.0
    }
    session.commit()
    return user

@pytest.fixture
def auth_headers(client, test_user):
    # Get a fresh token for each test
    response = client.post('/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200, 'Login failed'
    token = json.loads(response.data)['access_token']
    print(f"Generated Token: {token}")  # Debugging
    print("Using token in request:", f'Bearer {token}')  # Debugging
    return {'Authorization': f'Bearer {token}'}

def test_login_success(client, test_user):
    response = client.post('/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    assert 'access_token' in json.loads(response.data)

def test_login_invalid_credentials(client, test_user):
    response = client.post('/login', json={
        'email': 'test@example.com',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401

def test_get_preferences(client, test_user, auth_headers, session):
    # Initialize preferences
    test_user.preferences = {
        'categories': ['sports', 'music'],
        'max_distance': 15.0
    }
    session.commit()

    response = client.get('/api/preferences', headers=auth_headers)
    assert response.status_code == 200, f"Response: {response.data}"
    data = json.loads(response.data)
    assert 'categories' in data
    assert 'max_distance' in data
    assert isinstance(data['categories'], list)
    assert isinstance(data['max_distance'], (int, float))

def test_update_preferences(client, test_user, auth_headers):
    new_preferences = {
        'categories': ['sports', 'music'],
        'max_distance': 20.5
    }
    response = client.put(
        '/api/preferences',
        headers=auth_headers,
        json=new_preferences
    )
    assert response.status_code == 200, f"Response: {response.data}"
    data = json.loads(response.data)
    assert data['categories'] == new_preferences['categories']
    assert data['max_distance'] == new_preferences['max_distance']

def test_update_preferences_invalid_distance(client, test_user, auth_headers):
    response = client.put(
        '/api/preferences',
        headers=auth_headers,
        json={'max_distance': -5}
    )
    assert response.status_code == 400, f"Response: {response.data}"

def test_update_preferences_invalid_categories(client, test_user, auth_headers):
    response = client.put(
        '/api/preferences',
        headers=auth_headers,
        json={'categories': 'not-a-list'}
    )
    assert response.status_code == 400, f"Response: {response.data}"

def test_get_preferences_unauthorized(client):
    response = client.get('/api/preferences')
    assert response.status_code == 401

def test_update_preferences_unauthorized(client):
    response = client.put('/api/preferences', json={
        'categories': ['sports'],
        'max_distance': 15
    })
    assert response.status_code == 401
