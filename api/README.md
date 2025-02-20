# API Module Documentation

This documentation provides an overview of the API module, detailing the purpose and functionality of each file and function within the `api` folder.

## Table of Contents

- [Overview](#overview)
- [Files and Functions](#files-and-functions)
  - [__init__.py](#__init__py)
  - [auth.py](#authpy)
  - [events.py](#eventspy)
  - [preferences.py](#preferencespy)
- [Technical Jargon](#technical-jargon)

## Overview

The `api` folder contains modules that define the API endpoints for user authentication, event management, and user preferences. These modules are built using Flask and integrate with a database for data persistence.

## Files and Functions

### `__init__.py`

- **Purpose**: Initializes the API package by importing and exposing the blueprints for authentication, preferences, and events.

### `auth.py`

- **Purpose**: Manages user authentication, including registration and login.
- **Functions**:
  - `register()`: Registers a new user, validates input data, checks for existing users, and creates a new user. Returns a JWT access token upon successful registration.
  - `login()`: Logs in an existing user, validates credentials, and returns a JWT access token if successful.

### `events.py`

- **Purpose**: Provides endpoints for managing and retrieving events.
- **Functions**:
  - `get_events()`: Retrieves events with optional filtering by category and date range. Returns events sorted by start date.

### `preferences.py`

- **Purpose**: Manages user preferences, allowing retrieval and updates.
- **Functions**:
  - `validate_preferences(data)`: Validates the structure and content of preference data, ensuring categories are a list and max_distance is a positive number.
  - `get_preferences()`: Retrieves the current user's preferences, requiring JWT authentication.
  - `update_preferences()`: Updates the current user's preferences, validating and updating preferences, requiring JWT authentication.

## Technical Jargon

- **Blueprint**: A Flask concept used to organize routes and handlers in a modular way.
- **JWT (JSON Web Token)**: A compact, URL-safe means of representing claims to be transferred between two parties. Used for authentication.
- **SessionLocal**: A SQLAlchemy session factory used to interact with the database.
- **MongoDB**: A NoSQL database used for storing event data.
- **ISO Format**: A standard format for representing date and time, e.g., `YYYY-MM-DDTHH:MM:SS`.

This documentation aims to provide a clear understanding of the API module's structure and functionality, enabling new developers to quickly get up to speed with the project. 