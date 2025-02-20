# Models Module Documentation

This documentation provides an overview of the models module, detailing the purpose and functionality of each file and function within the `models` folder.

## Table of Contents

- [Overview](#overview)
- [Files and Functions](#files-and-functions)
  - [__init__.py](#__init__py)
  - [base.py](#basepy)
  - [mongo.py](#mongopy)
  - [user.py](#userpy)
- [Technical Jargon](#technical-jargon)

## Overview

The `models` folder contains modules that define the database models and operations for both SQLAlchemy and MongoDB. These models are used for managing users and events within the application.

## Files and Functions

### `__init__.py`

- **Purpose**: Initializes the models package and provides access to the database engine and session.

### `base.py`

- **Purpose**: Sets up the SQLAlchemy base, engine, and session for database interactions.

### `mongo.py`

- **Purpose**: Provides MongoDB client setup and operations for event management.
- **Classes**:
  - `MongoDB`: MongoDB client wrapper for database operations.
  - `Event`: Event model for MongoDB operations.
    - `create(db, event_data)`: Creates a new event in the database, validating required fields and inserting the event document.
    - `get_by_id(db, event_id)`: Retrieves an event by its ID, converting string ID to ObjectId if necessary.
    - `find(db, query=None)`: Finds events matching a query and returns a list of events.

### `user.py`

- **Purpose**: Defines the User model and its operations for SQLAlchemy.
- **Classes**:
  - `User`: User model for SQLAlchemy with methods for user management.
    - `create(session, email, password, name)`: Creates a new user, hashes the password, and handles integrity errors.
    - `get_by_id(session, user_id)`: Retrieves a user by their ID.
    - `get_by_email(session, email)`: Retrieves a user by their email.
    - `verify_password(password)`: Verifies a user's password against the stored hash.
    - `update_preferences(session, categories=None, max_distance=None)`: Updates the user's preferences, commits changes to the session, and refreshes the user instance.

## Technical Jargon

- **SQLAlchemy**: A Python SQL toolkit and Object-Relational Mapping (ORM) library.
- **MongoDB**: A NoSQL database used for storing event data.
- **ObjectId**: A BSON type used as a primary key in MongoDB.
- **pbkdf2_sha256**: A password hashing algorithm used for securely storing passwords.
- **IntegrityError**: An exception raised by SQLAlchemy when a database integrity constraint is violated.

This documentation aims to provide a clear understanding of the models module's structure and functionality, enabling new developers to quickly get up to speed with the project. 