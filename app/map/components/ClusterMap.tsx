'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Map, Marker, Popup, NavigationControl, FullscreenControl, MapRef } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import Supercluster from 'supercluster';
import { AnyProps, ClusterProperties } from 'supercluster';
import { format } from 'date-fns';
import { initializeGeocoding, geocodeVenues, getStateCentroid } from '../utils/geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';

// Get the Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Types for map props
interface ClusterMapProps {
  events: EventData[];
  height?: string | number;
  width?: string | number;
  onMarkerClick?: (event: EventData) => void;
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  clusteringEnabled?: boolean;
  clusterRadius?: number;
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

// Define GeoJSON Point Feature structure
interface PointFeature {
  type: 'Feature';
  properties: {
    id: string;
    eventData: EventData;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

// Define Cluster Feature structure
interface ClusterFeature {
  type: 'Feature';
  properties: {
    cluster: boolean;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: string | number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

// Type for cluster result - can be either a point or a cluster
type ClusterResult = Supercluster.PointFeature<AnyProps> | Supercluster.ClusterFeature<AnyProps>;

// Helper functions and styling for markers
const getMarkerColor = (genre: string): string => {
  const genreColors: { [key: string]: string } = {
    Concert: '#3B82F6', // blue
    Theatre: '#EF4444', // red
    Festival: '#F59E0B', // amber
    Sports: '#10B981', // green
    Comedy: '#8B5CF6', // purple
    Family: '#EC4899', // pink
    Arts: '#6366F1', // indigo
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

// Type for view state change event
interface ViewStateChangeEvent {
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
}

// Type for marker click event
interface MarkerClickEvent {
  originalEvent: MouseEvent;
}

// Custom marker component with hover effect
interface CustomMarkerProps {
  genre: string;
  onClick: () => void;
  isSelected: boolean;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ genre, onClick, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const color = getMarkerColor(genre);

  const getIconForGenre = (genre: string): string => {
    const genreIcons: { [key: string]: string } = {
      Concert: 'music_note',
      Theatre: 'theater_comedy',
      Festival: 'festival',
      Sports: 'sports',
      Comedy: 'comedy',
      Family: 'family_restroom',
      Arts: 'palette',
    };

    return genreIcons[genre] || 'event';
  };

  return (
    <div
      className='custom-marker'
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: isSelected || isHovered ? '30px' : '24px',
        height: isSelected || isHovered ? '44px' : '36px',
        background: color,
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow:
          isSelected || isHovered
            ? `0 4px 12px rgba(0,0,0,0.4), 0 0 0 4px rgba(255,255,255,0.6)`
            : '0 2px 6px rgba(0,0,0,0.3)',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        zIndex: isSelected ? 10 : isHovered ? 5 : 1,
      }}
      role='button'
      aria-label={`${genre} event marker`}
      tabIndex={0}
    >
      <span
        className='material-symbols-outlined marker-icon'
        style={{
          color: 'white',
          transform: 'rotate(45deg)',
          fontSize: isSelected || isHovered ? '18px' : '14px',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {getIconForGenre(genre)}
      </span>
    </div>
  );
};

// Cluster marker component
interface ClusterMarkerProps {
  count: number;
  onClick: () => void;
}

const ClusterMarker: React.FC<ClusterMarkerProps> = ({ count, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine size based on point count
  const size = Math.min(count * 6, 50) + 20;

  return (
    <div
      className='cluster-marker'
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        border: '4px solid rgba(255, 255, 255, 0.8)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.min(count / 5 + 14, 20),
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: isHovered ? '0 4px 16px rgba(0, 0, 0, 0.3)' : '0 4px 8px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
      role='button'
      aria-label={`Cluster of ${count} events`}
      tabIndex={0}
    >
      {count}
    </div>
  );
};

const ClusterMap: React.FC<ClusterMapProps> = ({
  events,
  height = '500px',
  width = '100%',
  onMarkerClick,
  initialViewState,
  clusteringEnabled = true,
  clusterRadius = 40,
}) => {
  // Set up state
  const [viewState, setViewState] = useState(
    initialViewState || {
      longitude: -98.5795, // Center of US
      latitude: 39.8283,
      zoom: 3,
    }
  );

  const [clusters, setClusters] = useState<ClusterResult[]>([]);
  const [popupInfo, setPopupInfo] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [supercluster, setSupercluster] = useState<Supercluster<AnyProps, AnyProps> | null>(null);
  const [bounds, setBounds] = useState<mapboxgl.LngLatBounds | null>(null);

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

  // Process events to add coordinates
  useEffect(() => {
    const geocodeEventVenues = async () => {
      try {
        // Initialize geocoding service
        initializeGeocoding(MAPBOX_TOKEN);

        // Extract unique venues to geocode
        const uniqueVenues = events
          .map((event) => event.venue)
          .filter(
            (venue, index, self) =>
              index ===
              self.findIndex(
                (v) => v.name === venue.name && v.city === venue.city && v.state === v.state
              )
          );

        // Geocode all venues in batch
        setLoading(true);
        const venueCoordinates = await geocodeVenues(uniqueVenues);

        // Update events with coordinates
        const eventsWithCoordinates = events.map((event) => {
          const cacheKey = [
            event.venue.name,
            event.venue.city,
            event.venue.state,
            event.venue.country,
          ]
            .filter(Boolean)
            .join('|')
            .toLowerCase();

          let coordinates = venueCoordinates.get(cacheKey);

          // If venue geocoding failed, try to use state centroid
          if (!coordinates && event.venue.state) {
            coordinates = getStateCentroid(event.venue.state);
          }

          // Ensure event.coordinates is properly typed
          return {
            ...event,
            coordinates: coordinates
              ? {
                  lat: coordinates.lat,
                  lng: coordinates.lng,
                }
              : undefined,
          };
        });

        // Create GeoJSON features for cluster
        const points: PointFeature[] = eventsWithCoordinates
          .filter((event) => event.coordinates)
          .map((event) => ({
            type: 'Feature',
            properties: {
              id: event._id,
              eventData: event,
            },
            geometry: {
              type: 'Point',
              coordinates: [event.coordinates!.lng, event.coordinates!.lat],
            },
          }));

        // Create the supercluster index
        if (points.length > 0) {
          const newSupercluster = new Supercluster({
            radius: clusterRadius,
            maxZoom: 16,
            minPoints: 3, // Minimum points to form a cluster
          });

          newSupercluster.load(points);
          setSupercluster(newSupercluster);

          // Create the bounds
          const newBounds = new mapboxgl.LngLatBounds();

          points.forEach((point) => {
            newBounds.extend(
              new mapboxgl.LngLat(point.geometry.coordinates[0], point.geometry.coordinates[1])
            );
          });

          setBounds(newBounds);

          // Fit bounds to all markers if there's a map reference
          if (mapRef.current) {
            mapRef.current.fitBounds(newBounds, {
              padding: 40,
              duration: 1000,
            });
          }

          // Generate initial clusters based on current viewport
          generateClusters(
            viewState.zoom,
            [
              viewState.longitude - 180, // expand the bounds to make sure we get all clusters
              viewState.latitude - 90,
              viewState.longitude + 180,
              viewState.latitude + 90,
            ],
            newSupercluster
          );
        }

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
  }, [events, clusterRadius]);

  // Update clusters when the view changes
  const generateClusters = useCallback(
    (
      zoom: number,
      bbox: [number, number, number, number],
      cluster: Supercluster<AnyProps, AnyProps>
    ) => {
      if (clusteringEnabled) {
        const newClusters = cluster.getClusters(bbox, Math.floor(zoom));
        setClusters(newClusters);
      } else {
        // If clustering is disabled, get all points
        const newClusters = cluster.getClusters(bbox, Infinity);
        setClusters(newClusters);
      }
    },
    [clusteringEnabled]
  );

  // Update clusters when the view state changes
  const handleViewStateChange = useCallback(
    (evt: ViewStateChangeEvent) => {
      setViewState(evt.viewState);

      if (supercluster) {
        const bbox: [number, number, number, number] = [
          evt.viewState.longitude - 180 / Math.pow(2, evt.viewState.zoom),
          evt.viewState.latitude - 90 / Math.pow(2, evt.viewState.zoom),
          evt.viewState.longitude + 180 / Math.pow(2, evt.viewState.zoom),
          evt.viewState.latitude + 90 / Math.pow(2, evt.viewState.zoom),
        ];

        generateClusters(evt.viewState.zoom, bbox, supercluster);
      }
    },
    [supercluster, generateClusters]
  );

  // Handle marker click
  const handleMarkerClick = useCallback(
    (event: EventData) => {
      setPopupInfo(event);
      if (onMarkerClick) {
        onMarkerClick(event);
      }

      // Center map on clicked marker with animation
      if (mapRef.current && event.coordinates) {
        mapRef.current.flyTo({
          center: [event.coordinates.lng, event.coordinates.lat],
          zoom: Math.max(viewState.zoom, 12),
          duration: 1000,
        });
      }
    },
    [onMarkerClick, viewState.zoom]
  );

  // Handle cluster click
  const handleClusterClick = useCallback(
    (clusterId: number, longitude: number, latitude: number) => {
      if (!supercluster) return;

      // Get cluster expansion zoom
      const expansionZoom = Math.min(
        supercluster.getClusterExpansionZoom(clusterId),
        16 // Maximum zoom level
      );

      // Fly to the cluster
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: expansionZoom,
          duration: 1000,
        });
      }
    },
    [supercluster]
  );

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
    <div style={{ height, width, position: 'relative' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <div className='loading-spinner'>
            <span className='material-symbols-outlined spinning-icon'>refresh</span>
            <p>Loading map data...</p>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            padding: '20px',
          }}
        >
          <div className='error-message'>
            <span className='material-symbols-outlined error-icon'>error</span>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className='retry-button'>
              Try Again
            </button>
          </div>
        </div>
      )}

      <Map
        {...viewState}
        onMove={handleViewStateChange}
        mapStyle='mapbox://styles/mapbox/streets-v11'
        style={{ width, height }}
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={true}
      >
        <NavigationControl position='top-right' />
        <FullscreenControl position='top-right' />

        {clusters.map((cluster) => {
          // Check if it's a cluster
          const [longitude, latitude] = cluster.geometry.coordinates;

          // Check if it's a cluster using the cluster property
          if (cluster.properties.cluster) {
            return (
              <Marker
                key={`cluster-${cluster.properties.cluster_id}`}
                longitude={longitude}
                latitude={latitude}
                anchor='center'
              >
                <ClusterMarker
                  count={cluster.properties.point_count}
                  onClick={() =>
                    handleClusterClick(cluster.properties.cluster_id, longitude, latitude)
                  }
                />
              </Marker>
            );
          } else {
            // It's a single event marker - here we need to cast it properly
            // We know it's a point feature from our application logic
            const eventData = (cluster.properties as PointFeature['properties']).eventData;

            return (
              <Marker
                key={eventData._id}
                longitude={longitude}
                latitude={latitude}
                anchor='bottom'
                onClick={(e: MarkerClickEvent) => {
                  e.originalEvent.stopPropagation();
                  handleMarkerClick(eventData);
                }}
              >
                <CustomMarker
                  genre={eventData.classifications.genre}
                  onClick={() => handleMarkerClick(eventData)}
                  isSelected={popupInfo?._id === eventData._id}
                />
              </Marker>
            );
          }
        })}

        {popupInfo && (
          <Popup
            longitude={popupInfo.coordinates?.lng || 0}
            latitude={popupInfo.coordinates?.lat || 0}
            anchor='top'
            onClose={handlePopupClose}
            closeOnClick={false}
            className='event-popup'
            maxWidth={isMobile ? '280px' : '320px'}
          >
            <div className='event-popup-content'>
              <div
                className='event-popup-image'
                style={{
                  backgroundImage: `url("${popupInfo.image_url}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '120px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  position: 'relative',
                }}
              >
                <div
                  className='event-popup-badge'
                  style={{ backgroundColor: getMarkerColor(popupInfo.classifications.genre) }}
                >
                  {popupInfo.classifications.genre}
                </div>
              </div>

              <h3 className='event-popup-title'>{popupInfo.name}</h3>

              <div className='event-popup-info'>
                <div className='event-popup-info-item'>
                  <span className='material-symbols-outlined'>calendar_today</span>
                  <span>
                    {popupInfo.dto_date_time || formatEventDate(popupInfo.date_time) || 'Date TBD'}
                  </span>
                </div>

                <div className='event-popup-info-item'>
                  <span className='material-symbols-outlined'>location_on</span>
                  <span>
                    {popupInfo.venue.name}, {popupInfo.venue.city}, {popupInfo.venue.state}
                  </span>
                </div>

                {popupInfo.price_range && (
                  <div className='event-popup-info-item'>
                    <span className='material-symbols-outlined'>paid</span>
                    <span>
                      {formatPrice(
                        popupInfo.price_range.min,
                        popupInfo.price_range.max,
                        popupInfo.price_range.currency
                      )}
                    </span>
                  </div>
                )}

                {popupInfo.sources?.ticketmaster && (
                  <div className='event-popup-info-item'>
                    <span className='material-symbols-outlined'>confirmation_number</span>
                    <span style={{ color: getTicketStatus(popupInfo).color }}>
                      {getTicketStatus(popupInfo).status}
                    </span>
                  </div>
                )}
              </div>

              <div className='event-popup-actions'>
                <a
                  href={getEventUrl(popupInfo)}
                  target={
                    popupInfo.sources?.ticketmaster?.url || popupInfo.sources?.eventbrite?.url
                      ? '_blank'
                      : '_self'
                  }
                  rel='noopener noreferrer'
                  className='event-popup-button'
                  style={{ backgroundColor: getMarkerColor(popupInfo.classifications.genre) }}
                >
                  <span className='material-symbols-outlined'>
                    {popupInfo.sources?.ticketmaster?.url || popupInfo.sources?.eventbrite?.url
                      ? 'confirmation_number'
                      : 'info'}
                  </span>
                  {popupInfo.sources?.ticketmaster?.url || popupInfo.sources?.eventbrite?.url
                    ? 'Get Tickets'
                    : 'View Details'}
                </a>

                <button
                  className='event-popup-share-button'
                  onClick={() => {
                    const url = getEventUrl(popupInfo);
                    if (navigator.share) {
                      navigator
                        .share({
                          title: popupInfo.name,
                          text: `Check out this event: ${popupInfo.name}`,
                          url,
                        })
                        .catch((err) => console.warn('Error sharing:', err));
                    } else {
                      navigator.clipboard
                        .writeText(url)
                        .then(() => alert('Link copied to clipboard!'))
                        .catch((err) => console.warn('Error copying link:', err));
                    }
                  }}
                >
                  <span className='material-symbols-outlined'>share</span>
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      <style jsx>{`
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .spinning-icon {
          font-size: 32px;
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .error-message {
          text-align: center;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          max-width: 320px;
        }

        .error-icon {
          font-size: 40px;
          color: #ef4444;
          margin-bottom: 12px;
        }

        .retry-button {
          margin-top: 12px;
          padding: 8px 16px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .retry-button:hover {
          background-color: #2563eb;
        }

        .event-popup-content {
          padding: 4px;
        }

        .event-popup-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          font-weight: 500;
        }

        .event-popup-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.3;
        }

        .event-popup-info {
          margin-bottom: 12px;
        }

        .event-popup-info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-size: 13px;
          color: #4b5563;
        }

        .event-popup-info-item .material-symbols-outlined {
          font-size: 16px;
          color: #6b7280;
        }

        .event-popup-actions {
          display: flex;
          gap: 8px;
        }

        .event-popup-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          color: white;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .event-popup-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .event-popup-share-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border: none;
          background-color: #f3f4f6;
          color: #4b5563;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .event-popup-share-button:hover {
          background-color: #e5e7eb;
        }

        /* Add this to global styles or component-specific styles */
        :global(.mapboxgl-popup-content) {
          border-radius: 8px !important;
          padding: 12px !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
        }

        :global(.mapboxgl-popup-close-button) {
          font-size: 18px !important;
          padding: 4px 8px !important;
          color: #6b7280 !important;
        }
      `}</style>
    </div>
  );
};

export default ClusterMap;
