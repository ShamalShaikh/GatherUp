"""
This module initializes and configures Flask extensions.
"""

from flask_jwt_extended import JWTManager

jwt = JWTManager()

# JWT error handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    """
    Handle invalid JWT token errors.
    """
    return {'error': 'Invalid token'}, 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    """
    Handle expired JWT token errors.
    """
    return {'error': 'Token has expired'}, 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    """
    Handle missing JWT token errors.
    """
    return {'error': 'Token is missing'}, 401 