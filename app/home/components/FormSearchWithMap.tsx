'use client';

import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import FormSearch from './FormSearch';
import EventMap from '../../map/components/EventMap';
import styles from './FormSearchWithMap.module.css';
import { initializeGeocoding, geocodeVenues } from '../../map/utils/geocoder';

// Extend the FormSearch component with our additional props
type FormSearchWithMapProps = {
  onSearchComplete?: (results: EventData[]) => void;
  onLoadingChange?: (isLoading: boolean) => void;
};

// Define the event data interface
interface EventData {
  _id: string;
  name: string;
  date_time: string;
  image_url: string;
  descriptions?: string;
  venue: {
    name: string;
    city: string;
    state: string;
    country: string;
  };
  classifications: {
    segment: string;
    genre: string;
    subGenre?: string;
  };
  price_range?: {
    min: number | null;
    max: number | null;
    currency: string | null;
  };
  sources?: {
    ticketmaster?: {
      ticket_availability: string;
      url: string;
    };
    eventbrite?: { 
      url: string;
    };
  };
  dto_date_time?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const FormSearchWithMap = () => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchResults, setSearchResults] = useState<EventData[]>([]);
  const [displayResults, setDisplayResults] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(false);
  const [geocodingComplete, setGeocodingComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize component and geocoding service
  useEffect(() => {
    setIsMounted(true);
    
    // Initialize Mapbox geocoding with token from env
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (mapboxToken) {
      initializeGeocoding(mapboxToken);
    }
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Process geocoding when results change
  useEffect(() => {
    let isCancelled = false;
    
    const processGeocoding = async () => {
      if (searchResults.length === 0) {
        setGeocodingComplete(true);
        return;
      }
      
      try {
        // Extract unique venues to geocode
        const uniqueVenues = searchResults.map(event => event.venue)
          .filter((venue, index, self) => 
            index === self.findIndex(v => 
              v.name === venue.name && 
              v.city === venue.city && 
              v.state === venue.state
            )
          );
        
        // Geocode venues
        const venueCoordinates = await geocodeVenues(uniqueVenues);
        
        if (isCancelled) return;
        
        // Update events with coordinates
        const updatedResults = searchResults.map(event => {
          // Create a key for this venue
          const cacheKey = [
            event.venue.name, 
            event.venue.city, 
            event.venue.state, 
            event.venue.country
          ].filter(Boolean).join('|').toLowerCase();
          
          // Get coordinates from cache
          const coordinates = venueCoordinates.get(cacheKey);
          
          return {
            ...event,
            coordinates: coordinates || undefined
          };
        });
        
        setDisplayResults(updatedResults);
      } catch (error) {
        console.error('Error geocoding venues:', error);
      } finally {
        if (!isCancelled) {
          setGeocodingComplete(true);
        }
      }
    };
    
    setGeocodingComplete(false);
    processGeocoding();
    
    return () => {
      isCancelled = true;
    };
  }, [searchResults]);

  // Handle receiving search results from FormSearch
  const handleSearchResults = (results: any[]) => {
    // Transform results to match EventData if needed
    const formattedResults: EventData[] = results.map(result => ({
      _id: result._id,
      name: result.name,
      date_time: result.date_time,
      image_url: result.image_url,
      descriptions: result.descriptions,
      venue: result.venue,
      classifications: result.classifications,
      price_range: result.price_range,
      sources: result.sources,
      coordinates: undefined // Will be added through geocoding
    }));
    
    setSearchResults(formattedResults);
  };

  // Handle selecting an event on the map
  const handleMarkerClick = (event: EventData) => {
    setSelectedEvent(event);
    // Scroll the selected event into view if we have a list visible
    if (viewMode === 'list' && isMounted) {
      const eventElement = document.getElementById(`event-${event._id}`);
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Handle loading state changes
  const handleLoadingChange = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  if (!isMounted) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      {/* View mode toggle */}
      <div className={styles.viewToggle}>
        <button
          type="button"
          className={`${styles.toggleButton} ${viewMode === 'list' ? styles.active : ''}`}
          onClick={() => setViewMode('list')}
          aria-pressed={viewMode === 'list'}
          aria-label="Switch to list view"
        >
          <span className="material-symbols-outlined">view_list</span>
          List View
        </button>
        <button
          type="button"
          className={`${styles.toggleButton} ${viewMode === 'map' ? styles.active : ''}`}
          onClick={() => setViewMode('map')}
          aria-pressed={viewMode === 'map'}
          aria-label="Switch to map view"
        >
          <span className="material-symbols-outlined">map</span>
          Map View
        </button>
      </div>

      {/* Search form */}
      <FormSearch 
        onSearchComplete={handleSearchResults}
        onLoadingChange={handleLoadingChange}
      />

      {/* Results display */}
      <div className={styles.resultsWrapper}>
        {/* Map view */}
        {viewMode === 'map' && (
          <div className={styles.mapContainer}>
            <EventMap
              events={displayResults}
              height="600px"
              width="100%"
              onMarkerClick={handleMarkerClick}
            />
            
            {/* Show loading spinner when searching */}
            {(loading || !geocodingComplete) && (
              <div className={styles.loadingOverlay}>
                <div className={styles.spinner}>
                  <span className="material-symbols-outlined">refresh</span>
                  <span>{loading ? 'Searching...' : 'Processing locations...'}</span>
                </div>
              </div>
            )}
            
            {/* Show no results message */}
            {!loading && geocodingComplete && displayResults.length === 0 && (
              <div className={styles.noResults}>
                <span className="material-symbols-outlined">search_off</span>
                <p>No events found matching your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormSearchWithMap; 