"""
This module contains unit tests for the Event model in MongoDB.
"""

import pytest
from datetime import datetime, timedelta
from models.mongo import MongoDB, Event
from bson import ObjectId

@pytest.fixture
def mongo_db():
    """
    Provide a MongoDB test connection.
    """
    db = MongoDB()
    # Clear events collection before each test
    db.db.events.delete_many({})
    yield db
    db.db.events.delete_many({})
    db.close()

def test_create_event(mongo_db):
    """
    Test creating a new event.
    """
    event_data = {
        'title': 'Test Event',
        'description': 'Test Description',
        'startDateTime': datetime.utcnow(),
        'endDateTime': datetime.utcnow() + timedelta(hours=2),
        'location': {
            'name': 'Test Location',
            'coordinates': [40.7128, -74.0060]  # NYC coordinates
        },
        'categories': ['test', 'tech']
    }
    
    # Create event
    created_event = Event.create(mongo_db, event_data)
    assert created_event['_id'] is not None
    
    # Verify it was stored
    stored_event = Event.get_by_id(mongo_db, created_event['_id'])
    assert stored_event is not None
    assert stored_event['title'] == event_data['title']
    assert stored_event['description'] == event_data['description']
    assert 'created_at' in stored_event
    assert 'updated_at' in stored_event

def test_create_event_with_extra_fields(mongo_db):
    """
    Test creating event with additional fields.
    """
    event_data = {
        'title': 'Test Event',
        'description': 'Test Description',
        'startDateTime': datetime.utcnow(),
        'endDateTime': datetime.utcnow() + timedelta(hours=2),
        'location': {
            'name': 'Test Location',
            'coordinates': [40.7128, -74.0060]
        },
        'categories': ['test'],
        'speakerName': 'John Doe',  # Extra field
        'maxAttendees': 100  # Extra field
    }
    
    created_event = Event.create(mongo_db, event_data)
    assert created_event['speakerName'] == 'John Doe'
    assert created_event['maxAttendees'] == 100

def test_find_events(mongo_db):
    """
    Test finding events by query.
    """
    # Create test events
    event1 = Event.create(mongo_db, {
        'title': 'Tech Talk',
        'description': 'About Python',
        'startDateTime': datetime.utcnow(),
        'endDateTime': datetime.utcnow() + timedelta(hours=1),
        'location': {'coordinates': [0, 0]},
        'categories': ['tech', 'python']
    })
    
    event2 = Event.create(mongo_db, {
        'title': 'Art Show',
        'description': 'Local artists',
        'startDateTime': datetime.utcnow(),
        'endDateTime': datetime.utcnow() + timedelta(hours=3),
        'location': {'coordinates': [0, 0]},
        'categories': ['art']
    })
    
    # Find by category
    tech_events = Event.find(mongo_db, {'categories': 'tech'})
    assert len(tech_events) == 1
    assert tech_events[0]['title'] == 'Tech Talk'
    
    # Find by partial title match
    talk_events = Event.find(mongo_db, {'title': {'$regex': 'Talk'}})
    assert len(talk_events) == 1
    assert talk_events[0]['_id'] == event1['_id']

def test_invalid_event_data(mongo_db):
    """
    Test validation of event data.
    """
    # Missing required field
    with pytest.raises(ValueError, match="Missing required field"):
        Event.create(mongo_db, {
            'title': 'Test Event'  # Missing other required fields
        })
    
    # Invalid location format
    with pytest.raises(ValueError, match="Location must include coordinates"):
        Event.create(mongo_db, {
            'title': 'Test Event',
            'description': 'Test',
            'startDateTime': datetime.utcnow(),
            'endDateTime': datetime.utcnow(),
            'location': {'name': 'Test'},  # Missing coordinates
            'categories': []
        })
    
    # Invalid categories format
    with pytest.raises(ValueError, match="Categories must be a list"):
        Event.create(mongo_db, {
            'title': 'Test Event',
            'description': 'Test',
            'startDateTime': datetime.utcnow(),
            'endDateTime': datetime.utcnow(),
            'location': {'coordinates': [0, 0]},
            'categories': 'not a list'  # Should be a list
        }) 