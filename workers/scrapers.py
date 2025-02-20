"""
This module defines scrapers for gathering event data from various sources.
"""

import requests
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from models.mongo import MongoDB
import os

class BaseScraper(ABC):
    """Base class for event scrapers."""
    
    def __init__(self):
        self.db = MongoDB()
    
    def __del__(self):
        """Ensure database connection is closed."""
        if hasattr(self, 'db'):
            self.db.close()
    
    @abstractmethod
    def scrape(self):
        """Scrape events from source."""
        pass
    
    def save_events(self, events):
        """Save events to MongoDB."""
        saved_events = []
        try:
            for event in events:
                try:
                    self.db.db.events.insert_one(event)
                    saved_events.append(event)
                except Exception as e:
                    print(f"Error saving event: {str(e)}")
            return saved_events
        except Exception as e:
            print(f"Database error: {str(e)}")
            return []

class MeetupScraper(BaseScraper):
    """Scraper for Meetup events."""
    
    def __init__(self):
        super().__init__()
        self.api_key = os.getenv('MEETUP_API_KEY', 'YOUR_API_KEY')
    
    def _map_categories(self, topics):
        """Map Meetup topics to our categories."""
        category_map = {
            'technology': 'Tech',
            'python': 'Tech',
            'web': 'Tech',
            'music': 'Music',
            'food-and-drink': 'Food & Drink'
        }
        categories = set()
        for topic in topics:
            if topic['name'] in category_map:
                categories.add(category_map[topic['name']])
            elif topic['urlkey'] in category_map:
                categories.add(category_map[topic['urlkey']])
            categories.add(topic['name'])
        return list(categories)

    def scrape(self):
        """Scrape Meetup events."""
        try:
            response = requests.get(
                'https://api.meetup.com/find/upcoming_events',
                params={'key': self.api_key}
            )
            response.raise_for_status()
            data = response.json()
            
            events = []
            for event in data['events']:
                try:
                    parsed_event = {
                        'title': event['name'],
                        'description': event.get('description', ''),
                        'startDateTime': datetime.fromisoformat(event['local_date'] + 'T' + event['local_time']),
                        'endDateTime': datetime.fromisoformat(event['local_date'] + 'T' + event['local_time']) + timedelta(milliseconds=event['duration']),
                        'location': {
                            'name': event['venue']['name'],
                            'coordinates': [event['venue']['lat'], event['venue']['lon']]
                        },
                        'categories': self._map_categories(event['group_topics']),
                        'source': 'meetup',
                        'sourceUrl': event['link']
                    }
                    events.append(parsed_event)
                except KeyError as e:
                    print(f"Missing key in event data: {str(e)}")
                    continue
            
            return self.save_events(events)
        except requests.exceptions.RequestException as e:
            print(f"Meetup API error: {str(e)}")
            return []

class EventbriteScraper(BaseScraper):
    """Scraper for Eventbrite events."""
    
    def __init__(self):
        super().__init__()
        self.api_key = os.getenv('EVENTBRITE_API_KEY', 'YOUR_API_KEY')
    
    def scrape(self):
        """Scrape Eventbrite events."""
        try:
            response = requests.get(
                'https://www.eventbriteapi.com/v3/events/search/',
                headers={'Authorization': f'Bearer {self.api_key}'}
            )
            response.raise_for_status()
            data = response.json()
            
            events = []
            for event in data['events']:
                try:
                    parsed_event = {
                        'title': event['name']['text'],
                        'description': event['description']['text'],
                        'startDateTime': datetime.fromisoformat(event['start']['utc']),
                        'endDateTime': datetime.fromisoformat(event['end']['utc']),
                        'location': {
                            'name': event['venue']['name'],
                            'coordinates': [event['venue']['latitude'], event['venue']['longitude']]
                        },
                        'categories': [category['name'] for category in event['category']],
                        'source': 'eventbrite',
                        'sourceUrl': event['url']
                    }
                    events.append(parsed_event)
                except KeyError as e:
                    print(f"Missing key in event data: {str(e)}")
                    continue
            
            return self.save_events(events)
        except requests.exceptions.RequestException as e:
            print(f"Eventbrite API error: {str(e)}")
            return []

class TicketmasterScraper(BaseScraper):
    """Scraper for Ticketmaster events."""
    
    def __init__(self):
        super().__init__()
        self.api_key = os.getenv('TICKETMASTER_API_KEY', 'YOUR_API_KEY')
        self.base_url = 'https://app.ticketmaster.com/discovery/v2'
    
    def scrape(self):
        """Scrape Ticketmaster events."""
        try:
            response = requests.get(
                f'{self.base_url}/events.json',
                params={
                    'apikey': self.api_key,
                    'size': 100,  # Number of events per page
                    'sort': 'date,asc'
                }
            )
            response.raise_for_status()
            data = response.json()
            
            if '_embedded' not in data or 'events' not in data['_embedded']:
                return []
            
            events = []
            for event in data['_embedded']['events']:
                try:
                    parsed = self._parse_event(event)
                    events.append(parsed)
                except (KeyError, ValueError) as e:
                    print(f"Error parsing event: {str(e)}")
                    continue
            
            return self.save_events(events)
            
        except requests.exceptions.RequestException as e:
            print(f"Ticketmaster API error: {str(e)}")
            return []
    
    def _parse_event(self, event):
        """Parse Ticketmaster event data into our format."""
        # Get venue data
        venue = event['_embedded']['venues'][0]
        
        # Parse dates
        start_date = event['dates']['start']['dateTime']
        end_date = event['dates'].get('end', {}).get('dateTime', start_date)
        
        # Build categories from classifications
        categories = []
        for classification in event['classifications']:
            for category_type in ['segment', 'genre', 'subGenre']:
                if classification.get(category_type, {}).get('name'):
                    categories.append(classification[category_type]['name'])
        
        return {
            'title': event['name'],
            'description': event.get('description', ''),
            'startDateTime': datetime.fromisoformat(start_date.replace('Z', '+00:00')),
            'endDateTime': datetime.fromisoformat(end_date.replace('Z', '+00:00')),
            'location': {
                'name': venue['name'],
                'coordinates': [
                    float(venue['location']['longitude']),
                    float(venue['location']['latitude'])
                ],
                'address': {
                    'street': venue['address'].get('line1', ''),
                    'city': venue['address'].get('city', ''),
                    'state': venue['address'].get('state', ''),
                    'postalCode': venue['address'].get('postalCode', '')
                }
            },
            'categories': categories,
            'source': 'ticketmaster',
            'sourceUrl': event['url'],
            'priceRanges': event.get('priceRanges', [{}])[0] if event.get('priceRanges') else None
        } 