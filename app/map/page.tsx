'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import EventMap from './components/EventMap';
import MapFilter from './components/MapFilter';
import Spinner from '../../components/Spinner/Spinner';
import Link from 'next/link';
import styles from './styles/MapPage.module.css';
import { buildUrl } from '@utils/Request';

// Define the interface to match the expected structure in EventMap
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

// Filter form properties interface
interface IFilterFormProps {
  keyword: string;
  state: string;
  city: string;
  date: Date | null;
  categories: string[];
}

export default function MapPage() {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Add state for initial filters
  const [initialFilters, setInitialFilters] = useState<IFilterFormProps | undefined>(undefined);

  // Mock data to use if API fails
  const mockEvents: EventData[] = [
    {
      _id: '1',
      name: 'Taylor Swift Concert',
      date_time: '2023-12-25T19:00:00Z',
      image_url: 'https://picsum.photos/400/300',
      venue: {
        name: 'MSG',
        city: 'New York',
        state: 'NY',
        country: 'USA'
      },
      classifications: {
        segment: 'Music',
        genre: 'Concert',
      },
      coordinates: {
        lat: 40.7505,
        lng: -73.9934
      }
    },
    {
      _id: '2',
      name: 'Basketball Game',
      date_time: '2023-12-20T20:00:00Z',
      image_url: 'https://picsum.photos/400/300',
      venue: {
        name: 'Staples Center',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA'
      },
      classifications: {
        segment: 'Sports',
        genre: 'Sports',
      },
      coordinates: {
        lat: 34.0430,
        lng: -118.2673
      }
    },
    {
      _id: '3',
      name: 'Broadway Show',
      date_time: '2023-12-22T19:30:00Z',
      image_url: 'https://picsum.photos/400/300',
      venue: {
        name: 'Broadway Theatre',
        city: 'New York',
        state: 'NY',
        country: 'USA'
      },
      classifications: {
        segment: 'Arts',
        genre: 'Theatre',
      },
      coordinates: {
        lat: 40.7630,
        lng: -73.9837
      }
    }
  ];

  // Helper function to use mock data with a specific message
  const showFallbackData = (message: string) => {
    console.warn(message);
    // Optional: Show an alert or message to the user
    setEvents(mockEvents);
    setFilteredEvents(mockEvents);
  }

  // Function to apply filters to the events
  const filterEvents = (filters: IFilterFormProps) => {
    setLoading(true);
    
    // Format date to YYYY-MM-DD for the API
    const formattedDate = filters.date 
      ? new Date(filters.date).toISOString().split('T')[0]
      : '';
      
    // Create the request body for the search API
    const searchParams = {
      name: filters.keyword || '',
      state: filters.state !== 'Any State' ? filters.state : '',
      city: filters.city !== 'Any City' ? filters.city : '',
      date: formattedDate,
      categories: filters.categories
    };
    
    // Call the searchEvents API
    // fetch(`${buildUrl()}/searchEvents`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(searchParams)
    // })
    //   .then(response => {
    //     if (!response.ok) {
    //       throw new Error(`API error: ${response.status}`);
    //     }
    //     return response.json();
    //   })
    //   .then(data => {
    //     if (data.data && Array.isArray(data.data)) {
    //       // Transform API response to match the expected EventData structure
    //       const transformedEvents = data.data.map((event: any) => ({
    //         _id: event._id || event.id || '',
    //         name: event.name || event.title || '',
    //         date_time: event.date_time || event.startDate || '',
    //         image_url: event.image_url || event.image || '',
    //         descriptions: event.description || event.descriptions || '',
    //         venue: {
    //           name: event.venue?.name || (event.location?.venue || ''),
    //           city: event.venue?.city || (event.location?.city || ''),
    //           state: event.venue?.state || (event.location?.state || ''),
    //           country: event.venue?.country || (event.location?.country || '')
    //         },
    //         classifications: {
    //           segment: event.classifications?.segment || 'Other',
    //           genre: event.classifications?.genre || event.genres?.[0] || 'Other'
    //         },
    //         coordinates: (event.coordinates || (event.latitude && event.longitude)) 
    //           ? {
    //               lat: event.coordinates?.lat || event.latitude,
    //               lng: event.coordinates?.lng || event.longitude
    //             } 
    //           : undefined,
    //         price_range: event.price_range || (event.price 
    //           ? {
    //               min: event.price,
    //               max: event.price,
    //               currency: 'USD'
    //             } 
    //           : undefined)
    //       }));
          
          // setFilteredEvents(transformedEvents);
          
          // Update URL with search parameters without causing navigation
      //     const params = new URLSearchParams();
      //     if (filters.keyword) params.set('keyword', filters.keyword);
      //     if (filters.state !== 'Any State') params.set('state', filters.state);
      //     if (filters.city !== 'Any City') params.set('city', filters.city);
      //     if (filters.date) params.set('date', formattedDate);
      //     if (filters.categories.length > 0) params.set('categories', filters.categories.join(','));
          
      //     // Use history.replaceState to update URL without triggering a page reload or re-render
      //     const newUrl = `${window.location.pathname}?${params.toString()}`;
      //     window.history.replaceState({ path: newUrl }, '', newUrl);
      //   } else {
      //     console.warn('API returned unsuccessful status or unexpected format:', data);
      //     showFallbackData('No events match your search criteria. Showing all events instead.');
      //     setFilteredEvents(events); // Fall back to showing all events
      //   }
      // })
      // .catch(error => {
      //   console.error('Error filtering events:', error);
      //   showFallbackData('Error filtering events. Showing all events instead.');
      //   setFilteredEvents(events); // Fall back to showing all events
      // })
      // .finally(() => {
      //   setLoading(false);
      // });
  };

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      try {
        // Fetch initial events from /getLandingEvents endpoint
        const response = await fetch(`${buildUrl()}/getLandingEvents`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // body: JSON.stringify({
          //   // name: '',
          //   // state: '',
          //   // city: '',
          //   // date: '',
          //   // categories: []
          // })
        });
        
        if (!response.ok) {
          console.error(`API error: ${response.status} - ${response.statusText}`);
          throw new Error(`API response error: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('API response:', data);
        
        if (data.data && Array.isArray(data.data)) {
          // Transform API response to match the expected EventData structure
          const transformedEvents = data.data.map((event: any) => ({
            _id: event._id || event.id || '',
            name: event.name || event.title || '',
            date_time: event.date_time || event.startDate || '',
            image_url: event.image_url || event.image || '',
            descriptions: event.description || event.descriptions || '',
            venue: {
              name: event.venue?.name || (event.location?.venue || ''),
              city: event.venue?.city || (event.location?.city || ''),
              state: event.venue?.state || (event.location?.state || ''),
              country: event.venue?.country || (event.location?.country || '')
            },
            classifications: {
              segment: event.classifications?.segment || 'Other',
              genre: event.classifications?.genre || event.genres?.[0] || 'Other'
            },
            coordinates: (event.coordinates || (event.latitude && event.longitude)) 
              ? {
                  lat: event.coordinates?.lat || event.latitude,
                  lng: event.coordinates?.lng || event.longitude
                } 
              : undefined,
            price_range: event.price_range || (event.price 
              ? {
                  min: event.price,
                  max: event.price,
                  currency: 'USD'
                } 
              : undefined)
          }));
          
          setEvents(transformedEvents);
          setFilteredEvents(transformedEvents);
        } else {
          console.warn('API returned unsuccessful status or unexpected format:', data);
          showFallbackData('API returned data in unexpected format. Using sample data instead.');
        }
      } catch (apiError: unknown) {
        const errorMessage = apiError instanceof Error 
          ? apiError.message 
          : 'Unknown error occurred';
        console.error('API error details:', apiError);
        showFallbackData(`Unable to fetch events data: ${errorMessage}. Using sample data instead.`);
      } finally {
        setLoading(false);
      }
    }

    // Process URL parameters and set initial filters
    const processUrlSearchParams = () => {
      // Get search parameters from URL
      const keyword = searchParams.get('keyword');
      const categories = searchParams.get('categories');
      const state = searchParams.get('state');
      const city = searchParams.get('city');
      const date = searchParams.get('date');
      
      // If any search parameters exist, create initial filters
      if (keyword || categories || state || city || date) {
        const filters: IFilterFormProps = {
          keyword: keyword || '',
          state: state || 'Any State',
          city: city || 'Any City',
          date: date ? new Date(date) : null,
          categories: categories ? categories.split(',') : []
        };
        
        setInitialFilters(filters);
        // Apply initial filters
        filterEvents(filters);
      } else {
        // No filters, fetch all events
        fetchEvents();
      }
    };

    processUrlSearchParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2 className={styles.errorTitle}>Error</h2>
        <p className={styles.errorMessage}>{error}</p>
        <Link href="/" className={styles.returnButton}>
          Return to Home
        </Link>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <h2 className={styles.errorTitle}>No Events Found</h2>
        <p className={styles.errorMessage}>Try adjusting your search criteria</p>
        <Link href="/" className={styles.returnButton}>
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <main className={styles.mapPage}>
      <div className={styles.mapHeader}>
        <h1>Discover Events Near You</h1>
        <p>Find concerts, sports, and more on our interactive map</p>
      </div>
      
      <div className={styles.mapFilter}>
        <MapFilter 
          onFilterChange={filterEvents} 
          onLoadingChange={setLoading} 
          initialFilters={initialFilters} 
        />
      </div>
      
      <div className={styles.resultsInfo}>
        {filteredEvents.length === events.length ? (
          <p>Showing all {events.length} events</p>
        ) : (
          <p>Showing {filteredEvents.length} of {events.length} events</p>
        )}
      </div>
      
      <div className={styles.mapContainer}>
        {loading ? (
          <div className={styles.mapOverlay}>
            <Spinner size="md" />
          </div>
        ) : null}
        <EventMap 
          events={filteredEvents} 
          height="70vh" 
        />
      </div>
      
      {/* Map-specific styling */}
      <style jsx global>{`
        .mapboxgl-map {
          font-family: inherit;
        }
        
        .mapboxgl-ctrl-attrib-inner {
          font-size: 0.75rem;
        }
        
        .mapboxgl-ctrl-group {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* Other styles are now handled by the CSS module */
        .custom-marker {
          cursor: pointer;
        }
      `}</style>
    </main>
  );
} 