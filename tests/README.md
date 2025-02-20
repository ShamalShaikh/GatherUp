# Tests Module Documentation

This documentation provides an overview of the tests module, detailing the purpose and functionality of each file and function within the `tests` folder.

## Table of Contents

- [Overview](#overview)
- [Files and Functions](#files-and-functions)
  - [__init__.py](#__init__py)
  - [conftest.py](#conftestpy)
  - [integration](#integration)
    - [test_api.py](#test_apipy)
    - [test_events_api.py](#test_events_apipy)
  - [run_tests.py](#run_testspy)
  - [system](#system)
    - [test_system.py](#test_systempy)
  - [unit](#unit)
    - [test_event_model.py](#test_event_modelpy)
    - [test_models.py](#test_modelspy)
    - [test_scrapers.py](#test_scraperspy)
    - [test_ticketmaster_scraper.py](#test_ticketmaster_scraperpy)
- [Technical Jargon](#technical-jargon)

## Overview

The `tests` folder contains various test suites for the application, including unit, integration, and system tests. These tests ensure the functionality and reliability of the application components.

## Files and Functions

### `__init__.py`

- **Purpose**: Marks the tests directory as a Python package.

### `conftest.py`

- **Purpose**: Provides fixtures for setting up the test environment, including database and client setup.
- **Fixtures**:
  - `app_with_config()`: Creates a Flask app configured for testing.
  - `client()`: Provides a test client for the Flask app.
  - `session()`: Provides a SQLAlchemy session for database operations, ensuring a clean state for each test.
  - `test_user()`: Creates a test user in the database.
  - `auth_headers()`: Provides authentication headers for a test user.
  - `mongo_db()`: Provides a MongoDB test connection.

### `integration`

#### `test_api.py`

- **Purpose**: Contains integration tests for the API, focusing on user authentication and preferences.
- **Tests**:
  - `test_login_success()`: Tests successful login with valid credentials.
  - `test_login_invalid_credentials()`: Tests login failure with invalid credentials.
  - `test_get_preferences()`: Tests retrieving user preferences.
  - `test_update_preferences()`: Tests updating user preferences.
  - `test_update_preferences_invalid_distance()`: Tests updating preferences with invalid max_distance.
  - `test_update_preferences_invalid_categories()`: Tests updating preferences with invalid categories.
  - `test_get_preferences_unauthorized()`: Tests retrieving preferences without authorization.
  - `test_update_preferences_unauthorized()`: Tests updating preferences without authorization.
  - `test_register_success()`: Tests successful user registration.
  - `test_register_and_login()`: Tests full registration and login flow.
  - `test_register_duplicate_email()`: Tests registration with a duplicate email.
  - `test_register_invalid_data()`: Tests registration with invalid data.

#### `test_events_api.py`

- **Purpose**: Contains integration tests for the events API, focusing on event retrieval and filtering.
- **Tests**:
  - `test_get_all_events()`: Tests retrieving all events with no filters.
  - `test_get_events_by_category()`: Tests filtering events by category.
  - `test_get_events_by_date_range()`: Tests filtering events by date range.
  - `test_get_events_invalid_date_format()`: Tests error handling for invalid date format.
  - `test_get_events_empty_result()`: Tests response when no events match criteria.

### `run_tests.py`

- **Purpose**: Runs the test suite, allowing for selection of test types (unit, integration, system).
- **Functions**:
  - `run_tests(test_types)`: Runs specified types of tests.

### `system`

#### `test_system.py`

- **Purpose**: Contains system tests for the application, focusing on end-to-end functionality.
- **Classes**:
  - `SystemTester`: A class to perform system tests on the application.
    - `run_all_tests()`: Runs all system tests.
    - `test_database_connection()`: Tests the database connection.
    - `test_user_registration()`: Tests user registration.
    - `test_login()`: Tests user login.
    - `test_preferences()`: Tests user preferences functionality.

### `unit`

#### `test_event_model.py`

- **Purpose**: Contains unit tests for the Event model in MongoDB.
- **Tests**:
  - `test_create_event()`: Tests creating a new event.
  - `test_create_event_with_extra_fields()`: Tests creating event with additional fields.
  - `test_find_events()`: Tests finding events by query.
  - `test_invalid_event_data()`: Tests validation of event data.

#### `test_models.py`

- **Purpose**: Contains unit tests for the User model in SQLAlchemy.
- **Tests**:
  - `test_user_create()`: Tests creating a new user.
  - `test_user_create_duplicate_email()`: Tests creating a user with a duplicate email.
  - `test_user_get_by_email()`: Tests retrieving a user by email.
  - `test_user_get_by_id()`: Tests retrieving a user by ID.
  - `test_user_verify_password()`: Tests verifying a user's password.
  - `test_user_update_preferences()`: Tests updating a user's preferences.

#### `test_scrapers.py`

- **Purpose**: Contains unit tests for the scrapers used to gather event data.
- **Tests**:
  - `test_meetup_scraper()`: Tests that the Meetup scraper can parse and store events.
  - `test_eventbrite_scraper()`: Tests that the Eventbrite scraper can parse and store events.
  - `test_scrape_events_task()`: Tests the Celery task that runs all scrapers.
  - `test_database_error_handling()`: Tests handling of database errors.

#### `test_ticketmaster_scraper.py`

- **Purpose**: Contains unit tests for the Ticketmaster scraper.
- **Tests**:
  - `test_ticketmaster_scraper()`: Tests that the Ticketmaster scraper can parse and store events.
  - `test_ticketmaster_error_handling()`: Tests that the Ticketmaster scraper handles API errors gracefully.

## Technical Jargon

- **Fixture**: A function used in testing to set up a specific environment or state.
- **Integration Test**: A test that verifies the interaction between different components of a system.
- **Unit Test**: A test that verifies the functionality of a specific section of code, usually a function or method.
- **System Test**: A test that verifies the complete and integrated software product.
- **Mock**: A simulated object that mimics the behavior of real objects in controlled ways.
- **Celery**: An asynchronous task queue/job queue based on distributed message passing.

This documentation aims to provide a clear understanding of the tests module's structure and functionality, enabling new developers to quickly get up to speed with the project. 