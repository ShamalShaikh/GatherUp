'use client';

// components
import Master from '@components/Layout/Master';
import Section from '@components/Section/Section';
import Heading from '@components/Heading/Heading';
import EventCard from '@components/Card/EventCard';
import CardGroup from '@components/Card/CardGroup';

import FormSearch from './home/components/FormSearch';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

// Import the Request utility
import Request, { type IRequest, type IResponse, buildUrl } from '@utils/Request';

// Define the event interface to match your API response structure
interface Event {
  _id: string;
  name: string;
  date_time: string;
  image_url: string;
  venue: {
    name: string;
    city: string;
    state: string;
    country: string;
  };
  price_range?: {
    min?: number | null;
    max?: number | null;
    currency?: string | null;
  };
  // Add sources for ticket links
  sources?: {
    ticketmaster?: {
      url: string;
      ticket_availability?: string;
    };
    eventbrite?: {
      url: string;
    };
  };
  // Add dto_date_time for formatted date
  dto_date_time?: string;
}

const Page: React.FC = () => {
  const [latestEvents, setLatestEvents] = useState<Event[]>([]);
  const [moreEvents, setMoreEvents] = useState<Event[]>([]);
  const [editorsChoice, setEditorsChoice] = useState<Event[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [isAuthChecked, setIsAuthChecked] = useState<boolean>(false);

  // Check user authentication status and fetch events after the check
  useEffect(() => {
    // Step 1: Check if user is logged in
    const checkAuthStatus = () => {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            setIsLoggedIn(user.isLoggedIn || false);
            setUsername(user.username || '');
          } catch {
            setIsLoggedIn(false);
          }
        }
        // Mark authentication check as complete
        setIsAuthChecked(true);
      }
    };

    checkAuthStatus();
  }, []);

  // Only fetch events after authentication status is determined
  useEffect(() => {
    // Skip if we haven't checked auth status yet
    if (!isAuthChecked) return;

    const fetchEvents = async () => {
      try {
        // Define parameters for the appropriate API endpoint
        let parameters: IRequest;

        // Determine which API to call based on login status
        if (isLoggedIn) {
          // For logged-in users, use POST to getRecommendation with username
          parameters = {
            url: 'getRecommendation',
            method: 'POST',
            postData: {
              username,
            },
          };
        } else {
          // For guests, use GET to getLandingEvents
          parameters = {
            url: 'getLandingEvents',
            method: 'GET',
          };
        }

        // Only log in development environment
        if (process.env.NODE_ENV === 'development') {
          try {
            // eslint-disable-next-line no-console
            console.log(
              `Fetching ${parameters.method} from: ${buildUrl()}/${
                parameters.url
              } - User logged in: ${isLoggedIn}${isLoggedIn ? `, username: ${username}` : ''}`,
            );
          } catch {
            // Silently fail if logging fails
          }
        }

        const response: IResponse = await Request.getResponse(parameters);

        // Process the response
        if (response.status === 200) {
          // Process data if it exists
          if (response.data && response.data.data) {
            processEventsData(response.data.data);
          } else {
            // Fall back to mock data if no events found
            showMockData();
          }
        } else {
          // Fall back to mock data on error
          showMockData();
        }
      } catch {
        // Fall back to mock data on error
        showMockData();
      }
    };

    // Helper function to process events data
    const processEventsData = (data: Event[]) => {
      // Process events to add formatted dates
      const events: Event[] = data.map((event: Event) => {
        // Format the date_time to a more readable format
        if (event.date_time) {
          try {
            const eventDate = new Date(event.date_time);
            if (!isNaN(eventDate.getTime())) {
              event.dto_date_time = format(eventDate, 'MMM dd, yyyy - h:mm a');
            } else {
              event.dto_date_time = 'Date TBD';
            }
          } catch {
            event.dto_date_time = 'Date TBD';
          }
        } else {
          event.dto_date_time = 'Date TBD';
        }
        return event;
      });

      // Split events into different categories
      setLatestEvents(events.slice(0, 6));
      setMoreEvents(events.slice(6, 12));
      setEditorsChoice(events.slice(12, 18));
    };

    // Helper function to use mock data when API fails
    const showMockData = () => {
      // Create some mock event data for development purposes
      const mockEvents: Event[] = Array(24)
        .fill(null)
        .map((_, index) => ({
          _id: `mock-${index}`,
          name: `Mock Event ${index + 1}`,
          date_time: new Date(Date.now() + 86400000 * (index % 30)).toISOString(),
          dto_date_time: format(
            new Date(Date.now() + 86400000 * (index % 30)),
            'MMM dd, yyyy - h:mm a'
          ),
          image_url: `https://picsum.photos/400/225?random=${index}`,
          venue: {
            name: `Venue ${(index % 5) + 1}`,
            city: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Seattle'][index % 5],
            state: ['NY', 'CA', 'IL', 'FL', 'WA'][index % 5],
            country: 'US',
          },
          classifications: {
            segment: ['Arts & Theatre', 'Music', 'Sports', 'Family', 'Other'][index % 5],
            genre: ['Theatre', 'Concert', 'Football', 'Kids', 'Festival'][index % 5],
            subGenre: index % 3 === 0 ? 'Special' : undefined,
          },
          price_range: {
            min: 25 + (index % 10) * 5,
            max: 75 + (index % 15) * 10,
            currency: 'USD',
          },
          sources:
            index % 3 === 0
              ? {
                  ticketmaster: {
                    url: `https://www.ticketmaster.com/event/mock-${index}`,
                    ticket_availability: 'available',
                  },
                }
              : index % 3 === 1
                ? { eventbrite: { url: `https://www.eventbrite.com/e/mock-${index}` } }
                : undefined,
        }));

      // Use the mock data
      setLatestEvents(mockEvents.slice(0, 6));
      setMoreEvents(mockEvents.slice(6, 12));
      setEditorsChoice(mockEvents.slice(12, 18));
    };

    fetchEvents();
  }, [isAuthChecked, isLoggedIn, username]); // Only re-fetch when auth status changes or login state changes

  return (
    <Master>
      <Section className='white-background'>
        <div className='container'>
          <div className='center'>
            <Heading
              type={1}
              color='gray'
              text={isLoggedIn ? `Welcome back, ${username}` : 'Discover'}
            />
            <p className='gray'>
              {isLoggedIn
                ? 'Here are your personalized event recommendations based on your preferences.'
                : 'Discover, search, and filter best events.'}
            </p>
          </div>
        </div>

        <div className='center'>
          <div className='container'>
            <div className='top-search'>
              <FormSearch />
            </div>
          </div>
        </div>
      </Section>

      <CardGroup
        url='list'
        title={isLoggedIn ? 'Recommended for you' : 'Latest events'}
        color='blue'
        background='gray'
      >
        {latestEvents.length > 0 ? (
          latestEvents.map((event, index) => (
            <EventCard
              key={`latest-${index}`}
              url={
                event.sources?.ticketmaster?.url ||
                event.sources?.eventbrite?.url ||
                `/events/${event._id}`
              }
              color='blue'
              when={event.dto_date_time || 'TBD'}
              name={event.name || 'Event name goes here'}
              venue={event.venue?.name || 'Venue TBD'}
              image={
                event.image_url ||
                'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
              }
              external={!!(event.sources?.ticketmaster?.url || event.sources?.eventbrite?.url)}
            />
          ))
        ) : (
          <p>Loading events...</p>
        )}
      </CardGroup>

      <CardGroup
        url='list'
        title={isLoggedIn ? 'Popular in your area' : 'More events'}
        color='red'
        background='white'
      >
        {moreEvents.length > 0 ? (
          moreEvents.map((event, index) => (
            <EventCard
              key={`more-${index}`}
              url={
                event.sources?.ticketmaster?.url ||
                event.sources?.eventbrite?.url ||
                `/events/${event._id}`
              }
              color='red'
              when={event.dto_date_time || 'TBD'}
              name={event.name || 'Event name goes here'}
              venue={event.venue?.name || 'Venue TBD'}
              image={
                event.image_url ||
                'https://images.unsplash.com/photo-1472691681358-fdf00a4bfcfe?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
              }
              external={!!(event.sources?.ticketmaster?.url || event.sources?.eventbrite?.url)}
            />
          ))
        ) : (
          <p>Loading events...</p>
        )}
      </CardGroup>

      <CardGroup
        url='list'
        title={isLoggedIn ? 'Matching your preferences' : 'Editors choice'}
        color='orange'
        background='gray'
      >
        {editorsChoice.length > 0 ? (
          editorsChoice.map((event, index) => (
            <EventCard
              key={`editors-${index}`}
              url={
                event.sources?.ticketmaster?.url ||
                event.sources?.eventbrite?.url ||
                `/events/${event._id}`
              }
              color='orange'
              when={event.dto_date_time || 'TBD'}
              name={event.name || 'Event name goes here'}
              venue={event.venue?.name || 'Venue TBD'}
              image={
                event.image_url ||
                'https://images.unsplash.com/photo-1561489396-888724a1543d?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
              }
              external={!!(event.sources?.ticketmaster?.url || event.sources?.eventbrite?.url)}
            />
          ))
        ) : (
          <p>Loading events...</p>
        )}
      </CardGroup>
    </Master>
  );
};

export default Page;
