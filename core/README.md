# Core Module Documentation

This documentation provides an overview of the core module, detailing the purpose and functionality of each file and function within the `core` folder.

## Table of Contents

- [Overview](#overview)
- [Files and Functions](#files-and-functions)
  - [__init__.py](#__init__py)
  - [app.py](#apppy)
  - [config.py](#configpy)
  - [extensions.py](#extensionspy)
- [Technical Jargon](#technical-jargon)

## Overview

The `core` folder contains essential components for setting up and configuring the Flask application, including application creation, configuration management, and extension initialization.

## Files and Functions

### `__init__.py`

- **Purpose**: Marks the directory as a Python package.

### `app.py`

- **Purpose**: Sets up the Flask application, including configuration, extensions, and blueprints.
- **Functions**:
  - `create_app(config_name=None)`: Creates and configures the Flask application, loading configuration, initializing extensions, and registering blueprints.

### `config.py`

- **Purpose**: Defines configuration settings for different environments.
- **Classes**:
  - `Config`: Base configuration class with default settings.
  - `DevelopmentConfig`: Development-specific configuration.
  - `TestingConfig`: Testing-specific configuration.
  - `ProductionConfig`: Production-specific configuration.

### `extensions.py`

- **Purpose**: Initializes and configures Flask extensions.
- **Functions**:
  - `invalid_token_callback(error)`: Handles invalid JWT token errors.
  - `expired_token_callback(jwt_header, jwt_payload)`: Handles expired JWT token errors.
  - `missing_token_callback(error)`: Handles missing JWT token errors.

## Technical Jargon

- **Blueprint**: A Flask concept used to organize routes and handlers in a modular way.
- **JWT (JSON Web Token)**: A compact, URL-safe means of representing claims to be transferred between two parties. Used for authentication.
- **dotenv**: A module that loads environment variables from a `.env` file.
- **CSRF (Cross-Site Request Forgery)**: A type of attack that tricks the victim into submitting a malicious request.

This documentation aims to provide a clear understanding of the core module's structure and functionality, enabling new developers to quickly get up to speed with the project. 