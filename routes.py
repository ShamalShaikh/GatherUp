from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import SessionLocal, User
from contextlib import contextmanager

# This is a blueprint for the API routes
api = Blueprint('api', __name__)

# This decorator creates a context manager that allows you to use the with statement. It:
# 1. Creates a new database session
# 2. Yields the session to the caller
# 3. Closes the session after the with block is finished
@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# This route gets the user's preferences
@api.route('/preferences', methods=['GET'])
@jwt_required() # This decorator ensures that the user is authenticated before accessing the route
def get_preferences():
    current_user_id = get_jwt_identity() # This gets the user's ID from the JWT token
    current_app.logger.debug(f"JWT Identity: {current_user_id}")
    
    with get_db() as db:
        # Convert string ID back to integer
        user = User.get_by_id(db, int(current_user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Initialize preferences if they don't exist
        if not hasattr(user, 'preferences') or user.preferences is None:
            user.preferences = {
                'categories': [],
                'max_distance': 10.0
            }
            db.commit()
            
        return jsonify(user.preferences)

# This route updates the user's preferences
@api.route('/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    current_user_id = get_jwt_identity() # This gets the user's ID from the JWT token
    current_app.logger.debug(f"JWT Identity: {current_user_id}")
    
    with get_db() as db:
        # Convert string ID back to integer
        user = User.get_by_id(db, int(current_user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        if data is None:
            return jsonify({'error': 'Invalid JSON'}), 400

        try:
            updated_preferences = validate_and_update_preferences(user, data) # This validates and updates the user's preferences
            db.commit() # This commits the changes to the database
            return jsonify(updated_preferences) # This returns the updated preferences to the client
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            current_app.logger.error(f"Error in update_preferences: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

def validate_and_update_preferences(user, data):
    categories = data.get('categories')
    max_distance = data.get('max_distance')

    if categories is not None and not isinstance(categories, list):
        raise ValueError('Categories must be a list')

    if max_distance is not None:
        try:
            max_distance = float(max_distance)
            if max_distance <= 0:
                raise ValueError('Max distance must be positive')
        except (ValueError, TypeError):
            raise ValueError('Invalid max distance value')

    # Initialize preferences if they don't exist
    if not hasattr(user, 'preferences') or user.preferences is None:
        user.preferences = {
            'categories': [],
            'max_distance': 10.0
        }

    # Update only the provided fields
    if categories is not None:
        user.preferences['categories'] = categories
    if max_distance is not None:
        user.preferences['max_distance'] = max_distance

    return user.preferences
