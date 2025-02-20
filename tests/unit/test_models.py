"""
This module contains unit tests for the User model in SQLAlchemy.
"""

import pytest
from models import User
from sqlalchemy.exc import IntegrityError

def test_user_create(session):
    """
    Test creating a new user.
    """
    user = User.create(
        session=session,
        email="test@example.com",
        password="password123",
        name="Test User"
    )
    assert user is not None
    assert user.email == "test@example.com"
    assert user.name == "Test User"
    assert user.verify_password("password123")

def test_user_create_duplicate_email(session):
    """
    Test creating a user with a duplicate email.
    """
    # Create first user
    user1 = User.create(
        session=session,
        email="test@example.com",
        password="password123",
        name="Test User 1"
    )
    assert user1 is not None

    # Try to create second user with same email
    user2 = User.create(
        session=session,
        email="test@example.com",
        password="password456",
        name="Test User 2"
    )
    assert user2 is None

def test_user_get_by_email(session):
    """
    Test retrieving a user by email.
    """
    # Create user
    user = User.create(
        session=session,
        email="test@example.com",
        password="password123",
        name="Test User"
    )
    
    # Get user by email
    found_user = User.get_by_email(session, "test@example.com")
    assert found_user is not None
    assert found_user.id == user.id
    assert found_user.email == user.email

def test_user_get_by_id(session):
    """
    Test retrieving a user by ID.
    """
    # Create user
    user = User.create(
        session=session,
        email="test@example.com",
        password="password123",
        name="Test User"
    )
    
    # Get user by id
    found_user = User.get_by_id(session, user.id)
    assert found_user is not None
    assert found_user.id == user.id
    assert found_user.email == user.email

def test_user_verify_password(session):
    """
    Test verifying a user's password.
    """
    user = User.create(
        session=session,
        email="test@example.com",
        password="password123",
        name="Test User"
    )
    
    assert user.verify_password("password123")
    assert not user.verify_password("wrongpassword")

def test_user_update_preferences(session):
    """
    Test updating a user's preferences.
    """
    user = User.create(
        session=session,
        email="test@example.com",
        password="password123",
        name="Test User"
    )
    
    # Verify initial preferences
    assert user.preferences == {
        'categories': [],
        'max_distance': 10.0
    }

    # Test updating categories only
    prefs = user.update_preferences(session, categories=["sports", "music"])
    assert prefs["categories"] == ["sports", "music"]
    assert prefs["max_distance"] == 10.0  # Should remain unchanged

    # Test updating max_distance only
    prefs = user.update_preferences(session, max_distance=20.0)
    assert prefs["categories"] == ["sports", "music"]  # Should remain unchanged
    assert prefs["max_distance"] == 20.0

    # Test updating both
    prefs = user.update_preferences(
        session,
        categories=["food", "movies"],
        max_distance=15.0
    )
    assert prefs["categories"] == ["food", "movies"]
    assert prefs["max_distance"] == 15.0

    # Verify changes persist after session refresh
    session.refresh(user)
    assert user.preferences["categories"] == ["food", "movies"]
    assert user.preferences["max_distance"] == 15.0 