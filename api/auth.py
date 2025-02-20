"""
This module handles user authentication, including registration and login.
"""

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import create_access_token
from models import SessionLocal, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    
    Validates input data, checks for existing users, and creates a new user.
    Returns a JWT access token upon successful registration.
    """
    data = request.get_json()
    current_app.logger.debug(f"Registration request received: {data}")
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Validate required fields
    required_fields = ['email', 'password', 'name']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Email, password, and name are required'}), 400

    # Validate email format (basic check)
    if '@' not in data['email']:
        return jsonify({'error': 'Invalid email format'}), 400

    # Validate password length
    if len(data['password']) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    session = SessionLocal()
    try:
        # Check if user already exists
        existing_user = User.get_by_email(session, data['email'])
        if existing_user:
            current_app.logger.warning(f"Registration failed: Email already exists: {data['email']}")
            return jsonify({'error': 'Email already registered'}), 409

        # Create new user
        user = User.create(
            session=session,
            email=data['email'],
            password=data['password'],
            name=data['name']
        )

        if not user:
            current_app.logger.error("Failed to create user in database")
            return jsonify({'error': 'Failed to create user'}), 500

        current_app.logger.info(f"User registered successfully: {user.email}")
        
        # Generate access token
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'user_id': user.id}
        )

        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        }), 201

    except Exception as e:
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500
    finally:
        session.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Log in an existing user.
    
    Validates credentials and returns a JWT access token if successful.
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    session = SessionLocal()
    try:
        user = User.get_by_email(session, email)
        if not user or not user.verify_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={'user_id': user.id}
        )
        return jsonify({'access_token': access_token})
    finally:
        session.close() 