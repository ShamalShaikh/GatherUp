declare module '@mapbox/mapbox-sdk' {
  function mapboxSdk(options: { accessToken: string }): any;
  export = mapboxSdk;
}

declare module '@mapbox/mapbox-sdk/services/geocoding' {
  export interface GeocodeFeature {
    id: string;
    type: string;
    place_type: string[];
    relevance: number;
    properties: Record<string, any>;
    text: string;
    place_name: string;
    center: [number, number]; // [longitude, latitude]
    geometry: {
      type: string;
      coordinates: [number, number];
    };
    context?: Array<{
      id: string;
      text: string;
    }>;
  }

  export interface GeocodeResponse {
    type: string;
    query: string[];
    features: GeocodeFeature[];
    attribution: string;
  }

  export interface GeocodeRequest {
    query: string;
    limit?: number;
    countries?: string[];
    types?: string[];
    language?: string[];
    fuzzyMatch?: boolean;
    routing?: boolean;
    worldview?: string;
  }

  export interface GeocodeGeocoder {
    forwardGeocode(options: GeocodeRequest): {
      send(): Promise<{
        body: {
          features: GeocodeFeature[];
        };
      }>;
    };
    reverseGeocode(options: {
      query: [number, number];
      limit?: number;
      types?: string[];
      language?: string[];
      worldview?: string;
    }): {
      send(): Promise<{
        body: {
          features: GeocodeFeature[];
        };
      }>;
    };
  }

  export default function geocoding(client: any): GeocodeGeocoder;
} 