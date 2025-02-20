# Workers Module Documentation

This documentation provides an overview of the workers module, detailing the purpose and functionality of each file and function within the `workers` folder.

## Table of Contents

- [Overview](#overview)
- [Files and Functions](#files-and-functions)
  - [__init__.py](#__init__py)
  - [scrapers.py](#scraperspy)
  - [tasks.py](#taskspy)
- [Technical Jargon](#technical-jargon)

## Overview

The `workers` folder contains modules that define background tasks and scrapers for gathering event data from various sources. These tasks are managed using Celery, a distributed task queue.

## Files and Functions

### `__init__.py`

- **Purpose**: Initializes the workers package, providing access to Celery tasks and scrapers.

### `scrapers.py`

- **Purpose**: Defines scrapers for gathering event data from various sources.
- **Classes**:
  - `BaseScraper`: Base class for event scrapers.
    - `scrape()`: Abstract method to scrape events from a source.
    - `save_events(events)`: Saves events to MongoDB.
  - `MeetupScraper`: Scraper for Meetup events.
    - `scrape()`: Scrapes Meetup events.
    - `_map_categories(topics)`: Maps Meetup topics to categories.
  - `EventbriteScraper`: Scraper for Eventbrite events.
    - `scrape()`: Scrapes Eventbrite events.
  - `TicketmasterScraper`: Scraper for Ticketmaster events.
    - `scrape()`: Scrapes Ticketmaster events.
    - `_parse_event(event)`: Parses Ticketmaster event data into a standard format.

### `tasks.py`

- **Purpose**: Defines Celery tasks for running event scrapers.
- **Functions**:
  - `scrape_events()`: Task to run all scrapers and gather event data.

## Technical Jargon

- **Celery**: An asynchronous task queue/job queue based on distributed message passing.
- **Scraper**: A program or script that extracts data from websites.
- **MongoDB**: A NoSQL database used for storing event data.
- **API Key**: A code passed in by computer programs calling an API to identify the calling program.
- **Abstract Base Class (ABC)**: A class that cannot be instantiated and is designed to be subclassed, enforcing certain methods to be implemented in derived classes.

This documentation aims to provide a clear understanding of the workers module's structure and functionality, enabling new developers to quickly get up to speed with the project. 