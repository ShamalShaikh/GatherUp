"""
This module initializes the workers package, providing access to Celery tasks and scrapers.
"""

from .tasks import celery, scrape_events
from .scrapers import MeetupScraper, EventbriteScraper, TicketmasterScraper

__all__ = [
    'celery', 
    'scrape_events',
    'MeetupScraper',
    'EventbriteScraper',
    'TicketmasterScraper'
] 