import React from 'react';
import { Popup } from 'react-map-gl';
import Image from 'next/image';
import { EventData } from '../types/event';
import styles from './MapComponents.module.css';
import { format } from 'date-fns';

// Helper function to get color based on event genre
const getMarkerColor = (genre: string): string => {
  const genreMap: Record<string, string> = {
    concert: '#3b82f6', // blue
    music: '#3b82f6',
    theatre: '#8b5cf6', // purple
    arts: '#8b5cf6',
    festival: '#f59e0b', // amber
    sports: '#ef4444', // red
    comedy: '#10b981', // emerald
    family: '#ec4899', // pink
    default: '#6b7280', // gray
  };

  // Normalize genre to lowercase for matching
  const normalizedGenre = genre?.toLowerCase() || '';
  
  // Find matching genre or return default
  for (const [key, value] of Object.entries(genreMap)) {
    if (normalizedGenre.includes(key)) {
      return value;
    }
  }
  
  return genreMap.default;
};

// Format event date
const formatEventDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return format(date, 'EEE, MMM d • h:mm a');
  } catch (error) {
    return dateStr;
  }
};

interface EventPopupProps {
  event: EventData;
  onClose: () => void;
}

const EventPopup: React.FC<EventPopupProps> = ({ event, onClose }) => {
  if (!event.coordinates || !event.coordinates.lat || !event.coordinates.lng) {
    return null;
  }
  
  const {
    name,
    venue,
    classifications,
    date_time,
    image_url,
    sources
  } = event;
  
  const formattedDate = formatEventDate(date_time);
  const genreColor = getMarkerColor(classifications?.genre || 'default');
  
  // Check if event has ticket sources available
  const hasTicketmasterUrl = sources?.ticketmaster?.url && sources.ticketmaster.url.trim() !== '';
  const hasEventbriteUrl = sources?.eventbrite?.url && sources.eventbrite.url.trim() !== '';
  const hasTicketUrl = hasTicketmasterUrl || hasEventbriteUrl;
    
  const handleViewDetails = () => {
    // Get the appropriate URL: Ticketmaster URL if available, else eventbrite URL, 
    // or a fallback to local event page
    let url;
    
    if (hasTicketmasterUrl) {
      url = sources!.ticketmaster!.url;
    } else if (hasEventbriteUrl) {
      url = sources!.eventbrite!.url;
    } else {
      url = `/events/${event._id}`;
    }
    
    window.open(url, '_blank');
  };
    
  const handleShare = async () => {
    const url = `${window.location.origin}/events/${event._id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: `Check out ${name} at ${venue.name}`,
          url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        // Fallback to copy to clipboard
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };
  
  return (
    <Popup
      longitude={Number(event.coordinates.lng)}
      latitude={Number(event.coordinates.lat)}
      closeButton={true}
      closeOnClick={false}
      onClose={onClose}
      anchor="bottom"
      className={styles.eventPopup}
      maxWidth="350px"
      offset={8}
    >
      <div className={styles.popupCard}>
        <div className={styles.popupImageContainer}>
          {image_url && (
            <Image
              src={image_url}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 350px"
              style={{ objectFit: 'cover' }}
              className={styles.popupImage}
            />
          )}
          <div className={styles.popupCategory} style={{ backgroundColor: genreColor }}>
            {classifications?.genre || 'Event'}
          </div>
        </div>
        
        <div className={styles.popupContent}>
          <h3 className={styles.popupTitle}>{name}</h3>
          
          <div className={styles.popupMetadata}>
            <div className={styles.popupMetadataItem}>
              <span className="material-symbols-outlined">calendar_today</span>
              <span>{formattedDate}</span>
            </div>
            
            <div className={styles.popupMetadataItem}>
              <span className="material-symbols-outlined">location_on</span>
              <span>{venue.name}, {venue.city}, {venue.state}</span>
            </div>
            
            {sources?.ticketmaster?.ticket_availability && (
              <div className={styles.popupMetadataItem}>
                <span className="material-symbols-outlined">confirmation_number</span>
                <span className={
                  sources.ticketmaster.ticket_availability.toLowerCase().includes('available')
                    ? styles.availableStatus
                    : styles.unavailableStatus
                }>
                  {sources.ticketmaster.ticket_availability}
                </span>
              </div>
            )}
          </div>
          
          <div className={styles.popupActions}>
            <button 
              onClick={handleViewDetails}
              className={styles.popupButton}
              style={{ backgroundColor: genreColor }}
            >
              <span className="material-symbols-outlined">
                {hasTicketUrl ? 'confirmation_number' : 'info'}
              </span>
              {hasTicketUrl ? 'Get Tickets' : 'View Details'}
            </button>
            
            <button 
              onClick={handleShare} 
              className={styles.popupShareButton}
              aria-label="Share event"
            >
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>
      </div>
    </Popup>
  );
};

export default EventPopup; 