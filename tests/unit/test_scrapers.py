"""
This module contains unit tests for the scrapers used to gather event data.
"""

import pytest
import responses
import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from workers.scrapers import MeetupScraper, EventbriteScraper
from workers.tasks import scrape_events
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

@pytest.fixture
def mock_meetup_response():
    """
    Provide a sample Meetup API response.
    """
    return {
        "events": [
            {
                "title": "Python Meetup",
                "description": "Monthly Python meetup",
                "group": {"name": "Python Developers"},
                "venue": {
                    "name": "Tech Hub",
                    "lat": 40.7128,
                    "lon": -74.0060
                },
                "local_date": "2024-02-20",
                "local_time": "18:00",
                "duration": 7200000,  # 2 hours in milliseconds
                "link": "https://meetup.com/events/123",
                "group_topics": [
                    {"urlkey": "python", "name": "Python"},
                    {"urlkey": "technology", "name": "Technology"}
                ]
            }
        ]
    }

@pytest.fixture
def mock_eventbrite_response():
    """
    Provide a sample Eventbrite API response.
    """
    return {
        "events": [
            {
                "name": {"text": "Web Development Workshop"},
                "description": {"text": "Learn web development"},
                "start": {
                    "timezone": "America/New_York",
                    "utc": "2024-02-21T15:00:00Z"
                },
                "end": {
                    "timezone": "America/New_York",
                    "utc": "2024-02-21T18:00:00Z"
                },
                "venue": {
                    "name": "Code School",
                    "latitude": "40.7128",
                    "longitude": "-74.0060"
                },
                "url": "https://eventbrite.com/e/123",
                "category_id": "102",
                "subcategory_id": "102003"
            }
        ]
    }

@responses.activate
def test_meetup_scraper(mongo_db, mock_meetup_response):
    """
    Test that the Meetup scraper can parse and store events.
    """
    # Mock the Meetup API response
    responses.add(
        responses.GET,
        'https://api.meetup.com/find/upcoming_events',
        json=mock_meetup_response,
        status=200
    )
    
    # Run scraper
    scraper = MeetupScraper()
    events = scraper.scrape()
    
    # Verify parsed data
    assert len(events) == 1
    event = events[0]
    assert event['title'] == "Python Meetup"
    assert event['description'] == "Monthly Python meetup"
    assert 'Tech' in event['categories']
    assert 'Python' in event['categories']
    
    # Verify MongoDB storage
    stored_events = list(mongo_db.db.events.find({'source': 'meetup'}))
    assert len(stored_events) == 1
    stored = stored_events[0]
    assert stored['title'] == event['title']
    assert stored['location']['coordinates'] == [-74.0060, 40.7128]

@responses.activate
def test_eventbrite_scraper(mongo_db, mock_eventbrite_response):
    """
    Test that the Eventbrite scraper can parse and store events.
    """
    # Mock the Eventbrite API response
    responses.add(
        responses.GET,
        'https://www.eventbriteapi.com/v3/events/search/',
        json=mock_eventbrite_response,
        status=200
    )
    
    # Run scraper
    scraper = EventbriteScraper()
    events = scraper.scrape()
    
    # Verify parsed data
    assert len(events) == 1
    event = events[0]
    assert event['title'] == "Web Development Workshop"
    assert event['description'] == "Learn web development"
    assert 'Tech' in event['categories']
    
    # Verify MongoDB storage
    stored_events = list(mongo_db.db.events.find({'source': 'eventbrite'}))
    assert len(stored_events) == 1
    stored = stored_events[0]
    assert stored['title'] == event['title']
    assert stored['location']['coordinates'] == [-74.0060, 40.7128]

@patch('workers.tasks.TicketmasterScraper')
@patch('workers.tasks.EventbriteScraper')
@patch('workers.tasks.MeetupScraper')
def test_scrape_events_task(mock_meetup, mock_eventbrite, mock_ticketmaster, mongo_db):
    """
    Test the Celery task that runs all scrapers.
    """
    # Create test events
    meetup_event = {
        'title': 'Python Meetup',
        'source': 'meetup',
        'description': 'Test meetup',
        'startDateTime': datetime.utcnow(),
        'endDateTime': datetime.utcnow() + timedelta(hours=2),
        'location': {
            'name': 'Test Venue',
            'coordinates': [0, 0]
        },
        'categories': ['Tech']
    }
    
    eventbrite_event = {
        'title': 'Web Workshop',
        'source': 'eventbrite',
        'description': 'Test workshop',
        'startDateTime': datetime.utcnow(),
        'endDateTime': datetime.utcnow() + timedelta(hours=2),
        'location': {
            'name': 'Test Venue',
            'coordinates': [0, 0]
        },
        'categories': ['Tech']
    }

    # Create mock instances
    meetup_instance = MagicMock()
    eventbrite_instance = MagicMock()
    ticketmaster_instance = MagicMock()

    # Setup scrape behavior to simulate the full scrape + save flow
    def mock_meetup_scrape():
        mongo_db.db.events.insert_one(meetup_event)
        return [meetup_event]

    def mock_eventbrite_scrape():
        mongo_db.db.events.insert_one(eventbrite_event)
        return [eventbrite_event]

    # Configure mock instances
    meetup_instance.scrape.side_effect = mock_meetup_scrape
    eventbrite_instance.scrape.side_effect = mock_eventbrite_scrape
    ticketmaster_instance.scrape.return_value = []

    # Set up mock constructors to return our instances
    mock_meetup.return_value = meetup_instance
    mock_eventbrite.return_value = eventbrite_instance
    mock_ticketmaster.return_value = ticketmaster_instance
    
    # Run task synchronously
    result = scrape_events()
    assert result == 2  # Two events total
    
    # Verify all scrapers were called
    meetup_instance.scrape.assert_called_once()
    eventbrite_instance.scrape.assert_called_once()
    ticketmaster_instance.scrape.assert_called_once()
    
    # Verify events were stored
    events = list(mongo_db.db.events.find())
    assert len(events) == 2
    
    # Verify event sources
    sources = {e['source'] for e in events}
    assert sources == {'meetup', 'eventbrite'}
    
    # Verify event data
    stored_meetup = mongo_db.db.events.find_one({'source': 'meetup'})
    assert stored_meetup['title'] == 'Python Meetup'
    
    stored_eventbrite = mongo_db.db.events.find_one({'source': 'eventbrite'})
    assert stored_eventbrite['title'] == 'Web Workshop'

def test_database_error_handling(mongo_db):
    """
    Test handling of database errors.
    """
    # Create a mock collection with an error
    mock_collection = MagicMock()
    mock_collection.insert_one.side_effect = Exception("Database error")
    
    # Create a test scraper with mocked db
    scraper = MeetupScraper()
    
    # Replace the events collection with our mock
    original_collection = scraper.db.db.events
    scraper.db.db.events = mock_collection
    
    try:
        events = scraper.save_events([{'title': 'Test Event'}])
        assert events == []  # Should return empty list on error
        mock_collection.insert_one.assert_called_once()
    finally:
        # Restore the original collection
        scraper.db.db.events = original_collection 