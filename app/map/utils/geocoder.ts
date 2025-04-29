import { GeocodeFeature, GeocodeGeocoder } from '@mapbox/mapbox-sdk/services/geocoding';
import mapboxgl from 'mapbox-gl';

// Your Mapbox access token will be stored in environment variables
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Use types for venue information
interface Venue {
  name?: string;
  city: string;
  state: string;
  country: string;
}

// Cache to store geocoded results and minimize API calls
// Using a structure that stores by composite key (venue+city+state)
interface GeocodingCache {
  [key: string]: { 
    lat: number; 
    lng: number;
    timestamp: number; // When this entry was cached
  };
}

// Constants for geocoding
const CACHE_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const RATE_LIMIT_BATCH_SIZE = 5;
const RATE_LIMIT_DELAY = 200; // ms between batches
const CACHE_KEY = 'gatherup_geocoding_cache';

// Initialize the cache, loading from localStorage
const geocodingCache: GeocodingCache = 
  typeof window !== 'undefined' && localStorage.getItem(CACHE_KEY)
    ? JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
    : {};

// Helper to save cache to localStorage
const saveCache = (): void => {
  if (typeof window !== 'undefined') {
    try {
      // Clean expired cache entries before saving
      const now = Date.now();
      Object.keys(geocodingCache).forEach(key => {
        if (now - geocodingCache[key].timestamp > CACHE_EXPIRATION) {
          delete geocodingCache[key];
        }
      });
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(geocodingCache));
    } catch (error) {
      console.warn('Failed to save geocoding cache to localStorage:', error);
      // If localStorage is full, try to clear old entries
      try {
        // Keep only the 100 most recent entries
        const entries = Object.entries(geocodingCache)
          .sort((a, b) => b[1].timestamp - a[1].timestamp)
          .slice(0, 100);
        
        const reducedCache = Object.fromEntries(entries);
        localStorage.setItem(CACHE_KEY, JSON.stringify(reducedCache));
      } catch (innerError) {
        console.error('Failed to save reduced geocoding cache:', innerError);
      }
    }
  }
};

// Create a unique key for caching based on venue information
const createCacheKey = (venue: Venue): string => {
  return [
    venue.name, 
    venue.city, 
    venue.state, 
    venue.country
  ].filter(Boolean).join('|').toLowerCase();
};

// Initialize Mapbox geocoding service (will be properly initialized when token is available)
let geocodingService: GeocodeGeocoder | null = null;

// Queue system for geocoding requests to respect rate limits
interface GeocodingQueueItem {
  venue: Venue;
  resolve: (result: { lat: number; lng: number } | null) => void;
  reject: (error: Error) => void;
}

let geocodingQueue: GeocodingQueueItem[] = [];
let isProcessingQueue = false;

// Process the geocoding queue
const processGeocodingQueue = async (): Promise<void> => {
  if (isProcessingQueue || geocodingQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  try {
    while (geocodingQueue.length > 0) {
      // Process in batches to respect rate limits
      const batch = geocodingQueue.splice(0, RATE_LIMIT_BATCH_SIZE);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await geocodeVenueDirect(item.venue);
          item.resolve(result);
        } catch (error) {
          item.reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
      
      await Promise.all(batchPromises);
      
      // Add delay between batches if there are more items
      if (geocodingQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }
  } catch (error) {
    console.error('Error processing geocoding queue:', error);
  } finally {
    isProcessingQueue = false;
  }
};

// Initialize Mapbox - this will be called from the component when token is available
export const initializeGeocoding = (token?: string): void => {
  if (!geocodingService && (token || MAPBOX_ACCESS_TOKEN)) {
    try {
      const mapboxClient = require('@mapbox/mapbox-sdk');
      const geocoding = require('@mapbox/mapbox-sdk/services/geocoding');
      const baseClient = mapboxClient({ accessToken: token || MAPBOX_ACCESS_TOKEN });
      geocodingService = geocoding(baseClient);
      
      // Also initialize mapbox-gl with the token
      mapboxgl.accessToken = token || MAPBOX_ACCESS_TOKEN || '';
    } catch (error) {
      console.error('Failed to initialize geocoding service:', error);
    }
  }
};

// Direct geocoding function (internal use only)
const geocodeVenueDirect = async (venue: Venue): Promise<{ lat: number; lng: number } | null> => {
  try {
    // Check if we have this venue in cache
    const cacheKey = createCacheKey(venue);
    if (geocodingCache[cacheKey]) {
      // Return cached coordinates if not expired
      const now = Date.now();
      if (now - geocodingCache[cacheKey].timestamp < CACHE_EXPIRATION) {
        return geocodingCache[cacheKey];
      }
    }

    // Ensure geocoding service is initialized
    if (!geocodingService) {
      throw new Error('Geocoding service not initialized');
    }

    // Build search query with fallbacks
    let searchQuery = '';
    
    // Try full venue info first
    if (venue.name) {
      searchQuery = `${venue.name}, ${venue.city}, ${venue.state}, ${venue.country}`;
    } else {
      // Fallback to just city and state if no venue name
      searchQuery = `${venue.city}, ${venue.state}, ${venue.country}`;
    }

    // Perform geocoding request
    const response = await geocodingService.forwardGeocode({
      query: searchQuery,
      limit: 1,
      types: ['poi', 'address', 'place'],
    }).send();

    // Check if we got results
    if (response && 
        response.body && 
        response.body.features && 
        response.body.features.length > 0) {
      const feature = response.body.features[0] as GeocodeFeature;
      const [lng, lat] = feature.center;
      
      // Store result in cache
      const coordinates = { 
        lat, 
        lng,
        timestamp: Date.now()
      };
      geocodingCache[cacheKey] = coordinates;
      saveCache();
      
      return coordinates;
    }

    // If venue name geocoding failed, try just city and state
    if (venue.name && searchQuery.includes(venue.name)) {
      const cityStateQuery = `${venue.city}, ${venue.state}, ${venue.country}`;
      
      const fallbackResponse = await geocodingService.forwardGeocode({
        query: cityStateQuery,
        limit: 1,
        types: ['place'],
      }).send();

      if (fallbackResponse && 
          fallbackResponse.body && 
          fallbackResponse.body.features && 
          fallbackResponse.body.features.length > 0) {
        const feature = fallbackResponse.body.features[0] as GeocodeFeature;
        const [lng, lat] = feature.center;
        
        // Store fallback result in cache
        const coordinates = { 
          lat, 
          lng,
          timestamp: Date.now()
        };
        geocodingCache[cacheKey] = coordinates;
        saveCache();
        
        return coordinates;
      }
    }

    // Return null if geocoding fails
    console.warn('Geocoding failed for venue:', {
      name: venue.name || 'N/A',
      city: venue.city,
      state: venue.state,
      country: venue.country
    });
    return null;
  } catch (error) {
    console.error('Error geocoding venue:', {
      name: venue.name || 'N/A',
      city: venue.city,
      state: venue.state,
      country: venue.country
    }, error);
    return null;
  }
};

// Public geocode function that adds to queue
export const geocodeVenue = async (venue: Venue): Promise<{ lat: number; lng: number } | null> => {
  // First check cache for a quick return
  const cacheKey = createCacheKey(venue);
  if (geocodingCache[cacheKey]) {
    // Return cached coordinates if not expired
    const now = Date.now();
    if (now - geocodingCache[cacheKey].timestamp < CACHE_EXPIRATION) {
      return {
        lat: geocodingCache[cacheKey].lat,
        lng: geocodingCache[cacheKey].lng
      };
    }
  }
  
  // Add to queue if not in cache or expired
  return new Promise((resolve, reject) => {
    geocodingQueue.push({ venue, resolve, reject });
    
    // Start queue processing if not already running
    if (!isProcessingQueue) {
      processGeocodingQueue();
    }
  });
};

// Geocode a batch of venues (to optimize API calls)
export const geocodeVenues = async (venues: Venue[]): Promise<Map<string, { lat: number; lng: number } | null>> => {
  const results = new Map<string, { lat: number; lng: number } | null>();
  
  // Check cache first for all venues
  venues.forEach(venue => {
    const cacheKey = createCacheKey(venue);
    if (geocodingCache[cacheKey]) {
      // Use cached coordinates if not expired
      const now = Date.now();
      if (now - geocodingCache[cacheKey].timestamp < CACHE_EXPIRATION) {
        results.set(cacheKey, {
          lat: geocodingCache[cacheKey].lat,
          lng: geocodingCache[cacheKey].lng
        });
      }
    }
  });
  
  // Filter out venues that need geocoding (not in cache or expired)
  const venuesToGeocode = venues.filter(venue => {
    const cacheKey = createCacheKey(venue);
    return !results.has(cacheKey);
  });
  
  // If all venues were in cache, return early
  if (venuesToGeocode.length === 0) {
    return results;
  }
  
  // Process venues in batches
  const batchPromises = venuesToGeocode.map(async (venue) => {
    const cacheKey = createCacheKey(venue);
    const coordinates = await geocodeVenue(venue);
    return { cacheKey, coordinates };
  });
  
  const batchResults = await Promise.all(batchPromises);
  
  // Add results to map
  batchResults.forEach(({ cacheKey, coordinates }) => {
    results.set(cacheKey, coordinates);
  });
  
  return results;
};

// Get fallback coordinates for a state (used when geocoding fails)
export const getStateCentroid = (stateCode: string): { lat: number; lng: number } | null => {
  // Common US state centroids (approximate)
  const stateCentroids: {[key: string]: { lat: number; lng: number }} = {
    'AL': { lat: 32.7794, lng: -86.8287 },
    'AK': { lat: 64.0685, lng: -152.2782 },
    'AZ': { lat: 34.2744, lng: -111.6602 },
    'AR': { lat: 34.8938, lng: -92.4426 },
    'CA': { lat: 37.1841, lng: -119.4696 },
    'CO': { lat: 38.9972, lng: -105.5478 },
    'CT': { lat: 41.6219, lng: -72.7273 },
    'DE': { lat: 38.9896, lng: -75.5050 },
    'FL': { lat: 28.6305, lng: -82.4497 },
    'GA': { lat: 32.6415, lng: -83.4426 },
    'HI': { lat: 20.2927, lng: -156.3737 },
    'ID': { lat: 44.3509, lng: -114.6130 },
    'IL': { lat: 40.0417, lng: -89.1965 },
    'IN': { lat: 39.8942, lng: -86.2816 },
    'IA': { lat: 42.0751, lng: -93.4960 },
    'KS': { lat: 38.4937, lng: -98.3804 },
    'KY': { lat: 37.5347, lng: -85.3021 },
    'LA': { lat: 31.0689, lng: -91.9968 },
    'ME': { lat: 45.3695, lng: -69.2428 },
    'MD': { lat: 39.0550, lng: -76.7909 },
    'MA': { lat: 42.2596, lng: -71.8083 },
    'MI': { lat: 44.3467, lng: -85.4102 },
    'MN': { lat: 46.2807, lng: -94.3053 },
    'MS': { lat: 32.7364, lng: -89.6678 },
    'MO': { lat: 38.3566, lng: -92.4580 },
    'MT': { lat: 47.0527, lng: -109.6333 },
    'NE': { lat: 41.5378, lng: -99.7951 },
    'NV': { lat: 39.3289, lng: -116.6312 },
    'NH': { lat: 43.6805, lng: -71.5811 },
    'NJ': { lat: 40.1907, lng: -74.6728 },
    'NM': { lat: 34.4071, lng: -106.1126 },
    'NY': { lat: 42.9538, lng: -75.5268 },
    'NC': { lat: 35.5557, lng: -79.3877 },
    'ND': { lat: 47.4501, lng: -100.4659 },
    'OH': { lat: 40.2862, lng: -82.7937 },
    'OK': { lat: 35.5889, lng: -97.4943 },
    'OR': { lat: 43.9336, lng: -120.5583 },
    'PA': { lat: 40.8781, lng: -77.7996 },
    'RI': { lat: 41.6762, lng: -71.5562 },
    'SC': { lat: 33.9169, lng: -80.8964 },
    'SD': { lat: 44.4443, lng: -100.2263 },
    'TN': { lat: 35.8580, lng: -86.3505 },
    'TX': { lat: 31.4757, lng: -99.3312 },
    'UT': { lat: 39.3055, lng: -111.6703 },
    'VT': { lat: 44.0687, lng: -72.6658 },
    'VA': { lat: 37.5215, lng: -78.8537 },
    'WA': { lat: 47.3826, lng: -120.4472 },
    'WV': { lat: 38.6409, lng: -80.6227 },
    'WI': { lat: 44.6243, lng: -89.9941 },
    'WY': { lat: 42.9957, lng: -107.5512 },
    'DC': { lat: 38.9101, lng: -77.0147 },
  };
  
  return stateCentroids[stateCode] || null;
}; 