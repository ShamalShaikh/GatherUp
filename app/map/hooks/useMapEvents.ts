import { useState, useEffect, useMemo } from 'react';
import { initializeGeocoding, geocodeVenues, getStateCentroid } from '../utils/geocoder';

// Event data structure matching your existing interfaces
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

interface FilterOptions {
  state?: string;
  city?: string;
  categories?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

interface UseMapEventsResult {
  events: EventData[];
  filteredEvents: EventData[];
  eventsWithCoordinates: EventData[];
  loading: boolean;
  error: string | null;
  filterEvents: (options: FilterOptions) => void;
  resetFilters: () => void;
}

/**
 * Custom hook for managing events on a map
 * 
 * @param initialEvents - Initial array of events to display on the map
 * @param mapboxToken - Mapbox API token
 * @returns Object containing the events, filtered events, loading state, error state, and filter functions
 */
const useMapEvents = (
  initialEvents: EventData[],
  mapboxToken?: string
): UseMapEventsResult => {
  const [events, setEvents] = useState<EventData[]>(initialEvents);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>(initialEvents);
  const [eventsWithCoordinates, setEventsWithCoordinates] = useState<EventData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});

  // Process events to add coordinates using the geocoding utility
  useEffect(() => {
    const geocodeEventVenues = async () => {
      try {
        // Initialize geocoding service with the token
        initializeGeocoding(mapboxToken);
        
        // Extract unique venues to geocode to minimize API calls
        const uniqueVenues = events.map(event => event.venue)
          .filter((venue, index, self) => 
            index === self.findIndex(v => 
              v.name === venue.name && 
              v.city === venue.city && 
              v.state === venue.state
            )
          );
        
        // Geocode all venues in batch
        setLoading(true);
        const venueCoordinates = await geocodeVenues(uniqueVenues);
        
        // Update events with coordinates
        const updatedEvents = events.map(event => {
          const cacheKey = [
            event.venue.name, 
            event.venue.city, 
            event.venue.state, 
            event.venue.country
          ].filter(Boolean).join('|').toLowerCase();
          
          let coordinates = venueCoordinates.get(cacheKey);
          
          // If venue geocoding failed, try to use state centroid
          if (!coordinates && event.venue.state) {
            coordinates = getStateCentroid(event.venue.state);
          }
          
          return {
            ...event,
            coordinates: coordinates || undefined
          };
        });
        
        // Update state with events that have coordinates
        const eventsWithValidCoordinates = updatedEvents.filter(event => event.coordinates !== undefined);
        setEventsWithCoordinates(eventsWithValidCoordinates);
        setLoading(false);
      } catch (err) {
        console.error('Error geocoding venues:', err);
        setError('Failed to load map data. Please try again later.');
        setLoading(false);
      }
    };
    
    if (events.length > 0) {
      geocodeEventVenues();
    } else {
      setLoading(false);
    }
  }, [events, mapboxToken]);

  // Apply filters to events
  useEffect(() => {
    let filtered = [...events];
    
    // Filter by state
    if (filters.state && filters.state !== 'Any State') {
      filtered = filtered.filter(event => 
        event.venue.state === filters.state
      );
    }
    
    // Filter by city
    if (filters.city && filters.city !== 'Any City') {
      filtered = filtered.filter(event => 
        event.venue.city === filters.city
      );
    }
    
    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(event => 
        filters.categories!.includes(event.classifications.genre) ||
        filters.categories!.includes(event.classifications.segment)
      );
    }
    
    // Filter by date range
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date_time);
          return eventDate >= filters.dateRange!.start!;
        });
      }
      
      if (filters.dateRange.end) {
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date_time);
          return eventDate <= filters.dateRange!.end!;
        });
      }
    }
    
    setFilteredEvents(filtered);
  }, [events, filters]);

  // Filter events based on provided options
  const filterEvents = (options: FilterOptions) => {
    setFilters(options);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({});
  };

  // Return only events that have coordinates for mapping
  const eventsForMap = useMemo(() => {
    // Filter the filtered events to only include those with coordinates
    return filteredEvents.filter(event => 
      eventsWithCoordinates.some(e => e._id === event._id)
    ).map(event => {
      // Get coordinates from the eventsWithCoordinates array
      const eventWithCoords = eventsWithCoordinates.find(e => e._id === event._id);
      return {
        ...event,
        coordinates: eventWithCoords?.coordinates
      };
    });
  }, [filteredEvents, eventsWithCoordinates]);

  return {
    events,
    filteredEvents: eventsForMap,
    eventsWithCoordinates,
    loading,
    error,
    filterEvents,
    resetFilters
  };
};

export default useMapEvents; 