"""
This module contains integration tests for the events API, focusing on event retrieval and filtering.
"""

import pytest
from datetime import datetime, timedelta
from models.mongo import MongoDB, Event

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

# Fixture to create sample events for testing
@pytest.fixture
def sample_events(mongo_db):
    """
    Create sample events for testing.
    """
    now = datetime.utcnow()
    events = [
        {
            'title': 'Python Meetup',
            'description': 'Monthly Python meetup',
            'startDateTime': now + timedelta(days=1),
            'endDateTime': now + timedelta(days=1, hours=2),
            'location': {'name': 'Tech Hub', 'coordinates': [40.7128, -74.0060]},
            'categories': ['Tech', 'Python']
        },
        {
            'title': 'Art Exhibition',
            'description': 'Local artists showcase',
            'startDateTime': now + timedelta(days=2),
            'endDateTime': now + timedelta(days=2, hours=4),
            'location': {'name': 'Gallery', 'coordinates': [40.7128, -74.0060]},
            'categories': ['Art', 'Culture']
        },
        {
            'title': 'Web Dev Workshop',
            'description': 'Learn web development',
            'startDateTime': now + timedelta(days=5),
            'endDateTime': now + timedelta(days=5, hours=3),
            'location': {'name': 'Code School', 'coordinates': [40.7128, -74.0060]},
            'categories': ['Tech', 'Web']
        }
    ]
    
    # Insert events and store their IDs
    created_events = [Event.create(mongo_db, event) for event in events]
    return created_events

# Test retrieving all events with no filters
def test_get_all_events(client, sample_events):
    """
    Test retrieving all events with no filters.
    """
    response = client.get('/api/events')
    assert response.status_code == 200
    
    data = response.get_json()
    assert 'events' in data
    assert len(data['events']) == len(sample_events)
    
    # Verify event fields
    event = data['events'][0]
    assert 'title' in event
    assert 'description' in event
    assert 'startDateTime' in event
    assert 'endDateTime' in event
    assert 'location' in event
    assert 'categories' in event

# Test filtering events by category
def test_get_events_by_category(client, sample_events):
    """
    Test filtering events by category.
    """
    response = client.get('/api/events?category=Tech')
    assert response.status_code == 200
    
    data = response.get_json()
    assert len(data['events']) == 2  # Should find 2 Tech events
    
    # Verify all returned events have Tech category
    for event in data['events']:
        assert 'Tech' in event['categories']

# Test filtering events by date range
def test_get_events_by_date_range(client, sample_events):
    """
    Test filtering events by date range.
    """
    # Get reference time from first event and normalize to second precision
    first_event_time = sample_events[0]['startDateTime'].replace(microsecond=0)
    
    # Set date range to include first two events
    start_date = first_event_time.isoformat()
    end_date = (first_event_time + timedelta(days=2)).replace(microsecond=0).isoformat()
    
    response = client.get(f'/api/events?startDate={start_date}&endDate={end_date}')
    assert response.status_code == 200
    
    data = response.get_json()
    events = data['events']
    assert len(events) == 2  # Should find 2 events in range
    
    # Verify dates are within range
    for event in events:
        # Normalize datetime to second precision for comparison
        event_date = datetime.fromisoformat(event['startDateTime']).replace(microsecond=0)
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
        assert start_dt <= event_date <= end_dt, f"Event date {event_date} not in range {start_dt} to {end_dt}"
        
    # Verify we got the right events
    titles = {event['title'] for event in events}
    assert 'Python Meetup' in titles
    assert 'Art Exhibition' in titles

# Test error handling for invalid date format
def test_get_events_invalid_date_format(client):
    """
    Test error handling for invalid date format.
    """
    response = client.get('/api/events?startDate=invalid-date')
    assert response.status_code == 400
    assert 'error' in response.get_json()

# Test response when no events match criteria
def test_get_events_empty_result(client, mongo_db):
    """
    Test response when no events match criteria.
    """
    response = client.get('/api/events?category=NonExistent')
    assert response.status_code == 200
    assert len(response.get_json()['events']) == 0 