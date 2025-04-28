'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Master from '@components/Layout/Master';
import Section from '@components/Section/Section';
import Heading from '@components/Heading/Heading';
import EventMap from '../components/EventMap';
import useMapEvents from '../hooks/useMapEvents';
import Request, { type IRequest, type IResponse } from '@utils/Request';
import ButtonLink from '@components/Button/ButtonLink';

// Define the interface for search parameters
interface SearchParams {
  name?: string;
  state?: string;
  city?: string;
  categories?: string[];
  date?: Date | null;
}

// Format date for API request
const formatDateForApi = (date: Date | null): string | undefined => {
  if (!date) return undefined;
  return date.toISOString().split('T')[0];
};

const EventMapPage = () => {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCriteria, setSearchCriteria] = useState<SearchParams>({});
  const [showFilters, setShowFilters] = useState(false);
  
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Parse search parameters when the component mounts
  useEffect(() => {
    const name = searchParams.get('name') || undefined;
    const state = searchParams.get('state') || undefined;
    const city = searchParams.get('city') || undefined;
    const categoriesParam = searchParams.get('categories');
    const categories = categoriesParam ? categoriesParam.split(',') : undefined;
    const dateParam = searchParams.get('date');
    const date = dateParam ? new Date(dateParam) : null;

    setSearchCriteria({
      name,
      state,
      city,
      categories,
      date
    });
  }, [searchParams]);

  // Fetch events based on search criteria
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        
        // Prepare search parameters for the API
        const apiParams: Record<string, any> = {};
        
        if (searchCriteria.name) apiParams.name = searchCriteria.name;
        if (searchCriteria.state && searchCriteria.state !== 'Any State') apiParams.state = searchCriteria.state;
        if (searchCriteria.city && searchCriteria.city !== 'Any City') apiParams.city = searchCriteria.city;
        if (searchCriteria.categories && searchCriteria.categories.length > 0) {
          apiParams.categories = searchCriteria.categories.join(',');
        }
        if (searchCriteria.date) {
          apiParams.date = formatDateForApi(searchCriteria.date);
        }
        
        // Use the Request utility to fetch events
        const parameters: IRequest = {
          url: 'searchEvents',
          method: 'POST',
          postData: apiParams
        };
        
        const response: IResponse = await Request.getResponse(parameters);
        
        if (response.status === 200 && response.data?.data) {
          setEvents(response.data.data);
        } else {
          console.warn('No events found or API error:', response.data?.title);
          setEvents([]);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
        setEvents([]);
        setIsLoading(false);
      }
    };
    
    // Only fetch if we have at least one search parameter
    if (Object.values(searchCriteria).some(value => 
      value !== undefined && 
      value !== null && 
      (Array.isArray(value) ? value.length > 0 : true)
    )) {
      fetchEvents();
    } else if (searchParams.toString()) {
      // If there are URL params but none are valid, show empty results
      setEvents([]);
      setIsLoading(false);
    } else {
      // If no search params, fetch some default events
      const fetchDefaultEvents = async () => {
        try {
          setIsLoading(true);
          
          const parameters: IRequest = {
            url: 'getLandingEvents',
            method: 'GET'
          };
          
          const response: IResponse = await Request.getResponse(parameters);
          
          if (response.status === 200 && response.data?.data) {
            setEvents(response.data.data);
          } else {
            console.warn('No events found or API error:', response.data?.title);
            setEvents([]);
          }
          
          setIsLoading(false);
        } catch (err) {
          console.error('Error fetching default events:', err);
          setError('Failed to load events. Please try again later.');
          setEvents([]);
          setIsLoading(false);
        }
      };
      
      fetchDefaultEvents();
    }
  }, [searchCriteria, searchParams]);

  // Get search summary text
  const getSearchSummary = () => {
    const parts = [];
    
    if (searchCriteria.name) {
      parts.push(`"${searchCriteria.name}"`);
    }
    
    if (searchCriteria.categories && searchCriteria.categories.length > 0) {
      parts.push(searchCriteria.categories.join(', '));
    }
    
    if (searchCriteria.city && searchCriteria.city !== 'Any City') {
      parts.push(searchCriteria.city);
    }
    
    if (searchCriteria.state && searchCriteria.state !== 'Any State') {
      parts.push(searchCriteria.state);
    }
    
    if (searchCriteria.date) {
      const date = new Date(searchCriteria.date);
      parts.push(date.toLocaleDateString());
    }
    
    if (parts.length === 0) {
      return 'All Events';
    }
    
    return parts.join(' • ');
  };

  return (
    <Master>
      <Section className='white-background'>
        <div className='container'>
          <div className='center'>
            <Heading type={1} color='gray' text='Events Map' />
            
            {/* Search criteria summary */}
            <div className='search-summary'>
              <span className='material-symbols-outlined' style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                search
              </span>
              <span className='gray'>{getSearchSummary()}</span>
              <ButtonLink 
                color='blue-overlay' 
                text='Modify Search' 
                leftIcon='tune'
                url='/'
              />
            </div>
          </div>
          
          <div className='map-container' style={{ marginTop: '2rem' }}>
            {/* Loading indicator */}
            {isLoading && (
              <div className="loading">
                <span className="material-symbols-outlined loading-icon">refresh</span>
                Loading events...
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="error-message">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}
            
            {/* No results message */}
            {!isLoading && !error && events.length === 0 && (
              <div className="no-results">
                <span className="material-symbols-outlined">search_off</span>
                <p>No events found matching your search criteria.</p>
                <ButtonLink 
                  color='blue-overlay' 
                  text='Reset Search' 
                  url='/'
                />
              </div>
            )}
            
            {/* Map component */}
            {!isLoading && !error && events.length > 0 && (
              <EventMap 
                events={events} 
                height="600px" 
                width="100%" 
                onMarkerClick={(event) => console.log('Event clicked:', event.name)}
              />
            )}
          </div>
          
          {/* Event count */}
          {!isLoading && !error && events.length > 0 && (
            <div className='event-count' style={{ marginTop: '1rem', textAlign: 'right' }}>
              <p className='gray'>
                <strong>{events.length}</strong> event{events.length === 1 ? '' : 's'} found
              </p>
            </div>
          )}
          
          {/* Map instructions */}
          {!isLoading && !error && events.length > 0 && (
            <div className='map-instructions' style={{ marginTop: '0.5rem', textAlign: 'center' }}>
              <p className='gray'>
                <span className='material-symbols-outlined' style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>info</span>
                Click on any marker to see event details
              </p>
            </div>
          )}
        </div>
      </Section>
      
      <style jsx>{`
        .map-container {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          min-height: 200px;
          position: relative;
        }
        
        .search-summary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin: 1rem 0;
          flex-wrap: wrap;
        }
        
        .loading, .error-message, .no-results {
          padding: 2rem;
          text-align: center;
          color: #6B7280;
          background: #F9FAFB;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }
        
        .error-message {
          color: #EF4444;
          background: #FEF2F2;
        }
        
        .no-results {
          color: #4B5563;
        }
        
        .material-symbols-outlined {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        .loading-icon {
          animation: spin 1.5s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .search-summary {
            flex-direction: column;
          }
        }
      `}</style>
    </Master>
  );
};

export default EventMapPage; 