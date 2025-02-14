from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import SessionLocal, User

preferences_bp = Blueprint('preferences', __name__)

def validate_preferences(data):
    """Validate preference data"""
    current_app.logger.debug(f"Validating preferences data: {data}")
    if 'categories' in data:
        if not isinstance(data['categories'], list):
            raise ValueError('Categories must be a list')
        
    if 'max_distance' in data:
        try:
            max_distance = float(data['max_distance'])
            if max_distance <= 0:
                raise ValueError('Max distance must be positive')
        except (ValueError, TypeError):
            raise ValueError('Invalid max distance value')
    current_app.logger.debug("Validation successful")

@preferences_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    current_user_id = get_jwt_identity()
    
    with SessionLocal() as session:
        user = User.get_by_id(session, int(current_user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify(user.preferences)

@preferences_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    current_user_id = get_jwt_identity()
    current_app.logger.debug(f"Updating preferences for user {current_user_id}")
    
    with SessionLocal() as session:
        user = User.get_by_id(session, int(current_user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        current_app.logger.debug(f"Received data: {data}")
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        try:
            validate_preferences(data)
            
            current_app.logger.debug(f"Before update: {user.preferences}")
            updated_prefs = user.update_preferences(
                session,
                categories=data.get('categories'),
                max_distance=data.get('max_distance')
            )
            current_app.logger.debug(f"After update: {updated_prefs}")
            
            return jsonify(updated_prefs)
            
        except ValueError as e:
            current_app.logger.error(f"Validation error: {str(e)}")
            return jsonify({'error': str(e)}), 400 