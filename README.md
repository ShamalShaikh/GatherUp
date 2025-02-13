# GatherUp
GatherUp - All Events in One Place is a software product that compiles events distributed among different meetup boards and provides one click interface for attending meetings!


# GatherUp Backend Service

A Flask-based RESTful API service for user management and preferences handling with JWT authentication.

## Project Structure
```
gatherup/
├── app.py # Main application entry point
├── config.py # Configuration management
├── models/ # Database models
│ ├── init.py # Models package initialization
│ ├── base.py # SQLAlchemy base setup
│ └── user.py # User model definition
├── routes.py # API route handlers
├── tests/ # Test suite
│ ├── unit/ # Unit tests
│ ├── integration/ # Integration tests
│ ├── system/ # End-to-end tests
│ ├── conftest.py # Test configurations & fixtures
│ └── run_tests.py # Test runner
└── docker/ # Docker configuration
├── Dockerfile # Main service container
└── Dockerfile.test # Test container
```


## Components

### Core Components

1. **app.py**
   - Application entry point
   - Flask app initialization
   - JWT setup
   - Core route handlers (login, etc.)

2. **config.py**
   - Environment-based configuration management
   - Database URL configuration
   - JWT settings
   - Development/Testing/Production configs

3. **models/**
   - Database models using SQLAlchemy ORM
   - `base.py`: Database connection setup
   - `user.py`: User model with preferences management

4. **routes.py**
   - API route handlers
   - Preference management endpoints
   - Protected routes using JWT

### Testing Structure

1. **Unit Tests** (`tests/unit/`)
   - Model testing
   - Individual component testing
   - No database/external dependencies

2. **Integration Tests** (`tests/integration/`)
   - API endpoint testing
   - Database interaction testing
   - Authentication testing

3. **System Tests** (`tests/system/`)
   - End-to-end testing
   - Full application flow testing
   - External service integration testing

### Docker Setup

1. **Development Environment**
   ```yaml
   services:
     web:
       # Flask application service
     db:
       # PostgreSQL database
     test:
       # Test environment
   ```

2. **Test Environment**
   - Separate container for running tests
   - Isolated test database
   - Automated test execution

## Key Features

1. **User Management**
   - User registration
   - Authentication using JWT
   - Password hashing using pbkdf2_sha256

2. **Preference Management**
   - User preferences storage
   - Category management
   - Distance preferences

3. **Security**
   - JWT-based authentication
   - Secure password handling
   - Environment-based configuration

## Development Setup

1. **Environment Setup**
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # Unix
   venv\Scripts\activate     # Windows

   # Install dependencies
   pip install -r requirements.txt
   ```

2. **Docker Setup**
   ```bash
   # Build and start services
   docker-compose up --build -d

   # Run tests
   ./run_tests.sh
   ```

3. **Database**
   ```bash
   # Initialize database
   flask db upgrade
   ```

## Testing
```bash
# Run tests
./run_tests.sh
```
```
Run specific test types
./run_tests.sh unit
./run_tests.sh integration
./run_tests.sh system
```


## API Endpoints

1. **Authentication**
   - POST `/login`: User login
   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. **Preferences**
   - GET `/api/preferences`: Get user preferences
   - PUT `/api/preferences`: Update preferences
   ```json
   {
     "categories": ["sports", "music"],
     "max_distance": 15.0
   }
   ```

## Environment Variables
```
env
POSTGRES_USER=gatherup
POSTGRES_PASSWORD=gatherup
POSTGRES_DB=gatherup
POSTGRES_PORT=5432
FLASK_PORT=8000
JWT_SECRET_KEY=your-secret-key
FLASK_ENV=development

```


## Best Practices Implemented

1. **Code Organization**
   - Modular structure
   - Clear separation of concerns
   - Configuration management

2. **Testing**
   - Comprehensive test coverage
   - Different test types
   - Isolated test environment

3. **Security**
   - Secure password handling
   - JWT authentication
   - Environment-based secrets

4. **Database**
   - ORM usage
   - Migration support
   - Transaction management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License

[Your License Here]