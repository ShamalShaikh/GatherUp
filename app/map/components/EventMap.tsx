'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Map, Marker, NavigationControl, FullscreenControl, MapRef } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { initializeGeocoding, geocodeVenues, getStateCentroid } from '../utils/geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import { format } from 'date-fns';
import EventPopup from './EventPopup';
import EventMarker from './EventMarker';

// Get the Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Types for map props
interface EventMapProps {
  events: EventData[];
  height?: string | number;
  width?: string | number;
  onMarkerClick?: (event: EventData) => void;
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
}

// Event data structure that matches your existing interfaces
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

// Marker styling based on event classifications
const getMarkerColor = (genre: string): string => {
  const genreColors: { [key: string]: string } = {
    'Concert': '#3B82F6', // blue
    'Theatre': '#EF4444', // red
    'Festival': '#F59E0B', // amber
    'Sports': '#10B981', // green
    'Comedy': '#8B5CF6', // purple
    'Family': '#EC4899', // pink
    'Arts': '#6366F1', // indigo
  };
  
  return genreColors[genre] || '#6B7280'; // gray default
};

// Format price display
const formatPrice = (min: number | null, max: number | null, currency: string | null): string => {
  if (min === null && max === null) return 'Price TBD';
  if (min === null) return `Up to ${currency || '$'}${max}`;
  if (max === null) return `From ${currency || '$'}${min}`;
  return `${currency || '$'}${min} - ${currency || '$'}${max}`;
};

// Format date for display
const formatEventDate = (dateTimeStr: string): string => {
  try {
    const date = new Date(dateTimeStr);
    return format(date, 'MMM dd, yyyy • h:mm a');
  } catch (e) {
    return 'Date TBD';
  }
};

// View type for map controls
interface ViewStateChangeEvent {
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
}

const EventMap: React.FC<EventMapProps> = ({ 
  events, 
  height = '500px', 
  width = '100%', 
  onMarkerClick,
  initialViewState
}) => {
  // Set up state
  const [viewState, setViewState] = useState(initialViewState || {
    longitude: -98.5795, // Center of US
    latitude: 39.8283,
    zoom: 3
  });
  
  const [popupInfo, setPopupInfo] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [eventsWithCoordinates, setEventsWithCoordinates] = useState<EventData[]>([]);
  const mapRef = useRef<MapRef | null>(null);
  
  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Verify Mapbox token
  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token is missing. Please check your .env.local file.');
      setError('Map configuration error: API token missing');
      setLoading(false);
    } else {
      console.log('Mapbox token is available:', MAPBOX_TOKEN.substring(0, 10) + '...');
    }
  }, []);
  
  // Fit map to markers helper function
  const fitMapToMarkers = useCallback((eventsToFit: EventData[]) => {
    if (!mapRef.current || eventsToFit.length === 0) return;
    
    const bounds = new mapboxgl.LngLatBounds();
    
    eventsToFit.forEach(event => {
      if (event.coordinates) {
        bounds.extend([event.coordinates.lng, event.coordinates.lat]);
      }
    });
    
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12
      });
    }
  }, []);
  
  // Process events to add coordinates
  useEffect(() => {
    console.log('Processing events:', events.length);
    
    // Check if events already have coordinates
    const preGeocoded = events.filter(event => 
      event.coordinates && 
      event.coordinates.lat !== undefined && 
      event.coordinates.lng !== undefined
    );
    
    if (preGeocoded.length > 0) {
      console.log('Events already have coordinates:', preGeocoded.length);
      setEventsWithCoordinates(preGeocoded);
      
      // Auto-fit map to the pre-geocoded events
      if (mapRef.current && preGeocoded.length > 0) {
        setTimeout(() => {
          fitMapToMarkers(preGeocoded);
        }, 100);
      }
      
      setLoading(false);
      return;
    }
    
    const geocodeEventVenues = async () => {
      try {
        // Initialize geocoding service
        if (!MAPBOX_TOKEN) {
          throw new Error('Mapbox token is missing');
        }
        
        console.log('Initializing geocoding service with token');
        initializeGeocoding(MAPBOX_TOKEN);
        
        // Filter out events with incomplete venue data
        const eventsWithVenues = events.filter(event => 
          event.venue && 
          event.venue.city && 
          event.venue.state
        );
        
        console.log('Events with valid venues:', eventsWithVenues.length);
        
        if (eventsWithVenues.length === 0) {
          console.warn('No events have valid location data (city and state)');
          // Log the problematic events
          events.forEach((event, index) => {
            if (!event.venue || !event.venue.city || !event.venue.state) {
              console.warn(`Event ${index} (${event.name}) has incomplete venue data:`, 
                event.venue);
            }
          });
          
          setError('No events with valid location data');
          setLoading(false);
          return;
        }
        
        // Extract unique venues to geocode
        const uniqueVenues = eventsWithVenues.map(event => event.venue)
          .filter((venue, index, self) => 
            index === self.findIndex(v => 
              v.name === venue.name && 
              v.city === venue.city && 
              v.state === venue.state
            )
          );
        
        console.log('Unique venues to geocode:', uniqueVenues.length);
        
        // Geocode all venues in batch
        setLoading(true);
        const venueCoordinates = await geocodeVenues(uniqueVenues);
        
        console.log('Geocoded venues:', venueCoordinates.size);
        
        // Update events with coordinates
        const geocodedEvents = eventsWithVenues.map(event => {
          // Create cache key for venue lookup
          const cacheKey = [
            event.venue.name, 
            event.venue.city, 
            event.venue.state, 
            event.venue.country
          ].filter(Boolean).join('|').toLowerCase();
          
          let coordinates = venueCoordinates.get(cacheKey);
          
          // If venue geocoding failed, try to use state centroid
          if (!coordinates && event.venue.state) {
            const stateCoordinates = getStateCentroid(event.venue.state);
            if (stateCoordinates) {
              console.log(`Using state centroid for ${event.venue.city}, ${event.venue.state}`);
              coordinates = stateCoordinates;
            } else {
              console.warn(`No coordinates found for ${event.venue.city}, ${event.venue.state}`);
            }
          }
          
          return {
            ...event,
            coordinates: coordinates || undefined
          };
        }).filter(event => event.coordinates);
        
        console.log('Events with coordinates after geocoding:', geocodedEvents.length);
        
        if (geocodedEvents.length === 0) {
          setError('Could not locate any events on the map. Please try adjusting your search criteria.');
        } else {
          setEventsWithCoordinates(geocodedEvents);
          
          // Auto-fit map bounds if we have events with coordinates
          setTimeout(() => {
            if (mapRef.current) {
              fitMapToMarkers(geocodedEvents);
            }
          }, 100);
        }
      } catch (err) {
        console.error('Error geocoding venues:', err);
        setError('Failed to load event locations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (events.length > 0) {
      geocodeEventVenues();
    } else {
      setLoading(false);
      setError('No events found matching your criteria. Try adjusting your filters.');
    }
  }, [events, fitMapToMarkers]);
  
  // Handle marker click
  const handleMarkerClick = useCallback((event: EventData) => {
    setPopupInfo(event);
    if (onMarkerClick) {
      onMarkerClick(event);
    }
    
    // Center map on clicked marker with animation
    if (mapRef.current && event.coordinates) {
      mapRef.current.flyTo({
        center: [event.coordinates.lng, event.coordinates.lat],
        zoom: Math.max(viewState.zoom, 12),
        duration: 1000
      });
    }
  }, [onMarkerClick, viewState.zoom]);
  
  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setPopupInfo(null);
  }, []);
  
  // Get event venue URL for tickets
  const getEventUrl = (event: EventData): string => {
    if (event.sources?.ticketmaster?.url) {
      return event.sources.ticketmaster.url;
    }
    if (event.sources?.eventbrite?.url) {
      return event.sources.eventbrite.url;
    }
    return `/events/${event._id}`;
  };
  
  // Get ticket availability status
  const getTicketStatus = (event: EventData): { status: string; color: string } => {
    if (!event.sources?.ticketmaster?.ticket_availability) {
      return { status: 'Check Availability', color: '#6B7280' };
    }
    
    const status = event.sources.ticketmaster.ticket_availability.toLowerCase();
    
    if (status.includes('available')) {
      return { status: 'Tickets Available', color: '#10B981' };
    } else if (status.includes('limited')) {
      return { status: 'Limited Availability', color: '#F59E0B' };
    } else if (status.includes('sold_out')) {
      return { status: 'Sold Out', color: '#EF4444' };
    }
    
    return { status: 'Check Availability', color: '#6B7280' };
  };

  return (
    <div className="mapContainer" style={{ width, height }}>
      {MAPBOX_TOKEN && !error && eventsWithCoordinates.length > 0 && (
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          {...viewState}
          onMove={(e: ViewStateChangeEvent) => setViewState(e.viewState)}
          style={{ width: '100%', height: '100%' }}
          reuseMaps
        >
          {/* Only render markers for events with coordinates */}
          {eventsWithCoordinates.map((event) => (
            event.coordinates && (
              <Marker
                key={event._id}
                longitude={event.coordinates.lng}
                latitude={event.coordinates.lat}
                anchor="bottom"
                style={{ zIndex: popupInfo === event ? 3 : 1 }}
              >
                <EventMarker
                  genre={event.classifications?.genre || 'Other'}
                  onClick={() => {
                    setPopupInfo(event);
                    if (onMarkerClick) {
                      onMarkerClick(event);
                    }
                  }}
                  isSelected={popupInfo?._id === event._id}
                />
              </Marker>
            )
          ))}
          
          {/* Use the EventPopup component */}
          {popupInfo && popupInfo.coordinates && (
            <EventPopup 
              event={popupInfo} 
              onClose={() => setPopupInfo(null)} 
            />
          )}
          
          <NavigationControl position="top-right" />
          <FullscreenControl position="top-right" />
        </Map>
      )}
      
      {!MAPBOX_TOKEN && (
        <div className="error-message">
          <span className="material-symbols-outlined error-icon">settings</span>
          <h3>Map configuration error</h3>
          <p>Mapbox API token is missing. Please check your environment configuration.</p>
        </div>
      )}
      
      {loading && (
        <div className="loading-overlay">
          <div className="spinner">
            <span className="material-symbols-outlined">refresh</span>
            <span>Loading map...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <span className="material-symbols-outlined error-icon">error</span>
          <h3>Error loading map</h3>
          <p>{error}</p>
          <button 
            className="retryButton" 
            onClick={() => window.location.reload()}
          >
            <span className="material-symbols-outlined">refresh</span>
            Retry
          </button>
        </div>
      )}
      
      {!loading && !error && eventsWithCoordinates.length === 0 && events.length > 0 && (
        <div className="error-message">
          <span className="material-symbols-outlined">search_off</span>
          <h3>No mappable events found</h3>
          <p>Could not find any events with valid location data that match your filters.</p>
        </div>
      )}
    </div>
  );
};

export default EventMap; 