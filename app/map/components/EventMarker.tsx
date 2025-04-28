import React, { useState } from 'react';
import styles from './MapComponents.module.css';

interface EventMarkerProps {
  genre: string;
  isSelected: boolean;
  onClick: () => void;
}

// Helper function to get marker color based on genre
const getMarkerColor = (genre: string): string => {
  const genreMap: Record<string, string> = {
    'concert': '#3b82f6', // blue
    'music': '#3b82f6',
    'theatre': '#8b5cf6', // purple
    'arts': '#8b5cf6',
    'festival': '#f59e0b', // amber
    'sports': '#ef4444', // red
    'comedy': '#10b981', // emerald
    'family': '#ec4899', // pink
    'default': '#6b7280', // gray
  };

  // Normalize genre to lowercase for matching
  const normalizedGenre = genre.toLowerCase();
  
  // Find matching genre or return default
  for (const [key, value] of Object.entries(genreMap)) {
    if (normalizedGenre.includes(key)) {
      return value;
    }
  }
  
  return genreMap.default;
};

// Helper to get appropriate icon for genre
const getIconForGenre = (genre: string): string => {
  const normalizedGenre = genre.toLowerCase();
  
  if (normalizedGenre.includes('music') || normalizedGenre.includes('concert')) {
    return 'music_note';
  } else if (normalizedGenre.includes('theatre') || normalizedGenre.includes('arts')) {
    return 'theater_comedy';
  } else if (normalizedGenre.includes('festival')) {
    return 'festival';
  } else if (normalizedGenre.includes('sports')) {
    return 'sports';
  } else if (normalizedGenre.includes('comedy')) {
    return 'sentiment_very_satisfied';
  } else if (normalizedGenre.includes('family')) {
    return 'family_restroom';
  }
  
  return 'event';
};

const EventMarker: React.FC<EventMarkerProps> = ({ genre, isSelected, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const color = getMarkerColor(genre);
  const icon = getIconForGenre(genre);
  
  return (
    <div 
      className={styles.eventMarker}
      style={{
        borderColor: color,
        backgroundColor: isSelected ? color : '#ffffff',
        transform: (isSelected || isHovered) ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: (isSelected || isHovered) 
          ? `0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 2px ${color}` 
          : `0 2px 6px rgba(0, 0, 0, 0.1), 0 0 0 2px ${color}`,
        zIndex: isSelected ? 2 : isHovered ? 1 : 0
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${genre} event marker${isSelected ? ' (selected)' : ''}`}
      aria-pressed={isSelected}
    >
      <span 
        className="material-symbols-outlined"
        style={{ 
          color: isSelected ? '#ffffff' : color,
          fontSize: (isSelected || isHovered) ? '16px' : '14px',
          transition: 'all 0.2s ease'
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      
      {/* Show a pin indicator below the marker */}
      <div 
        className={styles.markerPin}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
    </div>
  );
};

export default EventMarker; 