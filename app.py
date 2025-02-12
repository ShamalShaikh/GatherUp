from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, create_access_token
from datetime import timedelta
from models import SessionLocal, User
from routes import api
import os

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'test-secret-key')  # Ensure it matches
print("JWT Secret Key in App:", app.config['JWT_SECRET_KEY'])  # Debugging
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['PROPAGATE_EXCEPTIONS'] = True  # This will help us see JWT errors
jwt = JWTManager(app)

app.register_blueprint(api, url_prefix='/api')

@app.route('/')
def hello_world():
    return 'Hello, World!'

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print("Invalid token error:", error)
    return jsonify({'error': 'Invalid token'}), 401


@app.route('/login', methods=['POST'])
def login():
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
            identity=user.id,
            additional_claims={'user_id': user.id}
        )
        return jsonify({'access_token': access_token})
    finally:
        session.close()

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Token is missing'}), 401

if __name__ == '__main__':
    app.run(debug=True)
