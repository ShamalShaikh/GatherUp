"""
This module defines Celery tasks for running event scrapers.
"""

from celery import Celery
from .scrapers import MeetupScraper, EventbriteScraper, TicketmasterScraper
import os

# Initialize Celery
celery = Celery('tasks', broker='redis://redis:6379/0')

# Configure Celery for testing
if os.getenv('FLASK_ENV') == 'testing':
    celery.conf.update(
        task_always_eager=True,  # Tasks run synchronously in tests
        task_eager_propagates=True,  # Exceptions are propagated
        broker_url='memory://',
        result_backend='memory://',  # Use memory backend for tests
        accept_content=['json'],
        task_serializer='json',
        result_serializer='json',
        beat_schedule={
            'scrape-events': {
                'task': 'workers.tasks.scrape_events',
                'schedule': 3 * 60 * 60
            }
        }
    )
else:
    # Production schedule
    celery.conf.beat_schedule = {
        'scrape-events': {
            'task': 'workers.tasks.scrape_events',
            'schedule': 3 * 60 * 60  # 3 hours
        }
    }

@celery.task
def scrape_events():
    """Task to run all scrapers."""
    scrapers = [MeetupScraper(), EventbriteScraper(), TicketmasterScraper()]
    all_events = []
    
    for scraper in scrapers:
        try:
            events = scraper.scrape()
            if events:  # Only extend if we got events
                all_events.extend(events)
        except Exception as e:
            print(f"Error in {scraper.__class__.__name__}: {str(e)}")
    
    return len(all_events) 