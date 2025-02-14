import pytest
from core.app import create_app
from models import Base, User, engine, SessionLocal
from sqlalchemy import create_engine
import json
from datetime import timedelta
from core.config import config

@pytest.fixture
def client():
    app = create_app('testing')
    app.config['TESTING'] = True
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=30)
    app.config['SQLALCHEMY_DATABASE_URI'] = config['testing'].DATABASE_URL
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False
    app.config['JWT_CSRF_CHECK_FORM'] = False
    with app.test_client() as client:
        yield client

@pytest.fixture(scope='function')
def session():
    # Clean up before test
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Clean up after test
        Base.metadata.drop_all(engine)

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
    print(f"\nTesting update with: {new_preferences}")
    print(f"Initial preferences: {test_user.preferences}")
    
    response = client.put(
        '/api/preferences',
        headers=auth_headers,
        json=new_preferences
    )
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.data}")
    
    assert response.status_code == 200, f"Response: {response.data}"
    data = json.loads(response.data)
    print(f"Parsed data: {data}")
    
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

def test_register_success(client, session):
    test_email = 'newuser@example.com'
    test_name = 'New User'
    
    response = client.post('/register', json={
        'email': test_email,
        'password': 'password123',
        'name': test_name
    })
    
    # Verify response
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'access_token' in data
    assert 'user' in data
    assert data['user']['email'] == test_email
    assert data['user']['name'] == test_name

    # Verify user was stored in database
    stored_user = User.get_by_email(session, test_email)
    assert stored_user is not None
    assert stored_user.email == test_email
    assert stored_user.name == test_name
    assert stored_user.verify_password('password123')
    assert stored_user.preferences == {
        'categories': [],
        'max_distance': 10.0
    }

def test_register_and_login(client, session):
    """Test full registration and login flow"""
    # Register new user
    register_response = client.post('/register', json={
        'email': 'newuser@example.com',
        'password': 'password123',
        'name': 'New User'
    })
    assert register_response.status_code == 201

    # Try logging in with the new credentials
    login_response = client.post('/login', json={
        'email': 'newuser@example.com',
        'password': 'password123'
    })
    assert login_response.status_code == 200
    assert 'access_token' in json.loads(login_response.data)

    # Verify user exists in database
    stored_user = User.get_by_email(session, 'newuser@example.com')
    assert stored_user is not None
    assert stored_user.name == 'New User'

def test_register_duplicate_email(client, test_user):
    response = client.post('/register', json={
        'email': 'test@example.com',  # Same email as test_user
        'password': 'password123',
        'name': 'Another User'
    })
    assert response.status_code == 409
    assert b'Email already registered' in response.data

def test_register_invalid_data(client):
    # Missing required fields
    response = client.post('/register', json={
        'email': 'newuser@example.com'
    })
    assert response.status_code == 400
    assert b'Email, password, and name are required' in response.data

    # Invalid email format
    response = client.post('/register', json={
        'email': 'invalid-email',
        'password': 'password123',
        'name': 'New User'
    })
    assert response.status_code == 400
    assert b'Invalid email format' in response.data

    # Short password
    response = client.post('/register', json={
        'email': 'newuser@example.com',
        'password': 'short',
        'name': 'New User'
    })
    assert response.status_code == 400
    assert b'Password must be at least 8 characters' in response.data
