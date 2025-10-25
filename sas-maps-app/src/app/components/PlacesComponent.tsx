import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PlaceData {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  rating: number | null;
  user_ratings_total: number | null;
  url: string;
  phone: string | null;
  website: string | null;
}

interface PlacesSearchProps {
  center: { lat: number; lng: number };
  radius: number; 
  type: string;
  onPlacesFetched?: (places: PlaceData[]) => void;
}

const PlacesSearch: React.FC<PlacesSearchProps> = ({ 
  center, 
  radius, 
  type, 
  onPlacesFetched 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<PlaceData[]>([]);

  async function storePlaceInDatabase(placeData: PlaceData) {
    try {
      const { data, error } = await supabase
        .from('places')
        .upsert(
          {
            place_id: placeData.place_id,
            name: placeData.name,
            address: placeData.address,
            lat: placeData.lat,
            lng: placeData.lng,
            types: placeData.types,
            rating: placeData.rating,
            user_ratings_total: placeData.user_ratings_total,
            url: placeData.url,
            phone: placeData.phone,
            website: placeData.website,
          },
          {
            onConflict: 'place_id',
            ignoreDuplicates: false
          }
        )
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing place:', error);
      throw error;
    }
  }

  async function searchPlaces() {
    if (!window.google) {
      console.error('Google Maps API not loaded');
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;

      const request = {
        fields: [
          'displayName', 
          'location', 
          'formattedAddress', 
          'googleMapsURI', 
          'types', 
          'rating', 
          'userRatingsTotal', 
          'internationalPhoneNumber', 
          'website',
          'id'
        ],
        locationRestriction: {
          center: center,
          radius: radius,
        },
        includedPrimaryTypes: [type],
        maxResultCount: 500,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
      };

      const { places } = await Place.searchNearby(request);
      const storedPlaces: PlaceData[] = [];

      if (places.length) {
        for (const place of places) {
          if (!place.location) continue;

          const placeData: PlaceData = {
            place_id: place.id || '',
            name: place.displayName || '',
            address: place.formattedAddress || '',
            lat: place.location.lat() || 55.8617,
            lng: place.location.lng() || 4.2583,
            types: place.types || [],
            rating: place.rating || null,
            user_ratings_total: place.rating || null,
            url: place.googleMapsURI || '',
            phone: place.internationalPhoneNumber || null,
            website: place.websiteURI || null
          };

          try {
            await storePlaceInDatabase(placeData);
            storedPlaces.push(placeData);
          } catch (error) {
            console.error('Failed to store place:', placeData.name, error);
          }
        }

        setResults(storedPlaces);
        if (onPlacesFetched) {
          onPlacesFetched(storedPlaces);
        }

        console.log(`Successfully stored ${storedPlaces.length} places in database`);
      } else {
        console.log('No places found');
        if (onPlacesFetched) {
          onPlacesFetched([]);
        }
      }
    } catch (error) {
      console.error('Error searching places:', error);
      if (onPlacesFetched) {
        onPlacesFetched([]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Search Places</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <div><strong>Center:</strong> {center.lat.toFixed(6)}, {center.lng.toFixed(6)}</div>
        <div><strong>Radius:</strong> {(radius / 1000).toFixed(1)} km</div>
        <div><strong>Type:</strong> {type}</div>
      </div>

      <button 
        onClick={searchPlaces}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          backgroundColor: isLoading ? '#ccc' : '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold'
        }}
      >
        {isLoading ? 'Searching...' : 'Search & Store Places'}
      </button>

      {isLoading && (
        <div style={{ marginTop: '10px', color: '#666' }}>
          Searching for {type} places within {(radius / 1000).toFixed(1)}km radius...
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h4>Results ({results.length} places stored):</h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {results.map((place, index) => (
              <div 
                key={place.place_id} 
                style={{ 
                  padding: '8px', 
                  borderBottom: '1px solid #eee',
                  fontSize: '14px'
                }}
              >
                <div><strong>{place.name}</strong></div>
                <div>{place.address}</div>
                <div>Rating: {place.rating || 'N/A'} ({place.user_ratings_total || 0} reviews)</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacesSearch;