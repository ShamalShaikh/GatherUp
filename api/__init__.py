"""
This module initializes the API package by importing and exposing the blueprints
for authentication, preferences, and events.
"""

from .auth import auth_bp
from .preferences import preferences_bp
from .events import events_bp

__all__ = ['auth_bp', 'preferences_bp', 'events_bp'] 