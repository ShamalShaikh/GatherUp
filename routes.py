from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import SessionLocal, User
from contextlib import contextmanager

api = Blueprint('api', __name__)

@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@api.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    current_user_id = get_jwt_identity()
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

@api.route('/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    current_user_id = get_jwt_identity()
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
            updated_preferences = validate_and_update_preferences(user, data)
            db.commit()
            return jsonify(updated_preferences)
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
