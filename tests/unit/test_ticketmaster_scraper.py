"""
This module contains unit tests for the Ticketmaster scraper.
"""

import pytest
import responses
from datetime import datetime
from workers.scrapers import TicketmasterScraper
from models.mongo import MongoDB

@pytest.fixture
def mock_ticketmaster_response():
    """
    Provide a sample Ticketmaster API response.
    """
    return {
        "_embedded": {
            "events": [
                {
                    "name": "Taylor Swift | The Eras Tour",
                    "description": "Taylor Swift performs her greatest hits",
                    "dates": {
                        "start": {
                            "dateTime": "2024-08-15T19:30:00Z",
                            "localDate": "2024-08-15",
                            "localTime": "19:30:00"
                        },
                        "end": {
                            "dateTime": "2024-08-15T23:00:00Z",
                        },
                        "timezone": "America/New_York"
                    },
                    "_embedded": {
                        "venues": [{
                            "name": "MetLife Stadium",
                            "location": {
                                "longitude": "-74.074",
                                "latitude": "40.814"
                            },
                            "address": {
                                "line1": "1 MetLife Stadium Dr",
                                "city": "East Rutherford",
                                "state": "NJ",
                                "postalCode": "07073"
                            }
                        }]
                    },
                    "classifications": [
                        {
                            "segment": {"name": "Music"},
                            "genre": {"name": "Pop"},
                            "subGenre": {"name": "Pop Rock"}
                        }
                    ],
                    "url": "https://www.ticketmaster.com/event/123",
                    "id": "123abc",
                    "priceRanges": [
                        {
                            "min": 49.50,
                            "max": 499.00,
                            "currency": "USD"
                        }
                    ]
                }
            ]
        },
        "page": {
            "size": 20,
            "totalElements": 1,
            "totalPages": 1,
            "number": 0
        }
    }

@responses.activate
def test_ticketmaster_scraper(mongo_db, mock_ticketmaster_response):
    """
    Test that the Ticketmaster scraper can parse and store events.
    """
    # Mock the Ticketmaster API response
    responses.add(
        responses.GET,
        'https://app.ticketmaster.com/discovery/v2/events.json',
        json=mock_ticketmaster_response,
        status=200
    )
    
    # Run scraper
    scraper = TicketmasterScraper()
    events = scraper.scrape()
    
    # Verify parsed data
    assert len(events) == 1
    event = events[0]
    assert event['title'] == "Taylor Swift | The Eras Tour"
    assert "Taylor Swift performs" in event['description']
    assert event['source'] == 'ticketmaster'
    assert event['sourceUrl'] == "https://www.ticketmaster.com/event/123"
    
    # Verify date parsing
    start_time = event['startDateTime']
    assert isinstance(start_time, datetime)
    assert start_time.isoformat() == "2024-08-15T19:30:00+00:00"
    
    # Verify location parsing
    location = event['location']
    assert location['name'] == "MetLife Stadium"
    assert location['coordinates'] == [-74.074, 40.814]
    assert location['address'] == {
        'street': '1 MetLife Stadium Dr',
        'city': 'East Rutherford',
        'state': 'NJ',
        'postalCode': '07073'
    }
    
    # Verify categories
    assert 'Music' in event['categories']
    assert 'Pop' in event['categories']
    
    # Verify price ranges
    assert event['priceRanges'] == {
        'min': 49.50,
        'max': 499.00,
        'currency': 'USD'
    }
    
    # Verify MongoDB storage
    stored_events = list(mongo_db.db.events.find({'source': 'ticketmaster'}))
    assert len(stored_events) == 1
    stored = stored_events[0]
    assert stored['title'] == event['title']
    assert stored['location']['coordinates'] == [-74.074, 40.814]

@responses.activate
def test_ticketmaster_error_handling(mongo_db):
    """
    Test that the Ticketmaster scraper handles API errors gracefully.
    """
    # Mock API error response
    responses.add(
        responses.GET,
        'https://app.ticketmaster.com/discovery/v2/events.json',
        json={'errors': ['Invalid authentication credentials']},
        status=401
    )
    
    scraper = TicketmasterScraper()
    events = scraper.scrape()
    
    # Should return empty list on error
    assert events == []
    
    # No events should be stored
    stored_events = list(mongo_db.db.events.find({'source': 'ticketmaster'}))
    assert len(stored_events) == 0 