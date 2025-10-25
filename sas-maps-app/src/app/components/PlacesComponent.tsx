import { useEffect, useRef, useState } from 'react';

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

interface PlacesFetcherProps {
  map: google.maps.Map | null;
  center: { lat: number; lng: number };
  onPlacesFetched?: (places: PlaceData[]) => void;
}
const PlacesFetcher: React.FC<PlacesFetcherProps> = ({ map, center, onPlacesFetched }) => {
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [typeSelect, setTypeSelect] = useState<string>('restaurant');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  useEffect(() => {
    if (map) {
      initPlacesFetcher();
    }
  }, [map]);

  useEffect(() => {
    if (map) {
      nearbySearch();
    }
  }, [typeSelect, center, map]);

  async function initPlacesFetcher() {
    if (!map) return;

    const { InfoWindow } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
    infoWindowRef.current = new InfoWindow();
  }

  async function storePlaceInDatabase(placeData: PlaceData) {
    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(placeData),
      });

      if (!response.ok) {
        throw new Error('Failed to store place in database');
      }

      const result = await response.json();
      console.log('Place stored successfully:', result);
      return result;
    } catch (error) {
      console.error('Error storing place in database:', error);
      throw error;
    }
  }

  function clearMarkers() {
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];
  }

  async function nearbySearch() {
    if (!map) return;

    setIsLoading(true);
    clearMarkers();

    try {
      const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      const { spherical } = await google.maps.importLibrary('geometry') as google.maps.GeometryLibrary;

      const bounds = map.getBounds(); //for radius of search
      if (!bounds) return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const diameter = spherical.computeDistanceBetween(ne, sw);
      const radius = Math.min((diameter / 2), 50000);

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
          radius,
        },
        includedPrimaryTypes: [typeSelect],
        maxResultCount: 50,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
      };

      const { places } = await Place.searchNearby(request);

      if (places.length) {
        const { LatLngBounds } = await google.maps.importLibrary("core") as google.maps.CoreLibrary;
        const newBounds = new LatLngBounds();
        const storedPlaces: PlaceData[] = [];

        for (const place of places) {
          if (!place.location) continue;
          
          newBounds.extend(place.location);

          // Create marker
          const marker = new AdvancedMarkerElement({
            map: map,
            position: place.location,
            title: place.displayName,
          });

          markersRef.current.push(marker);

          // Prepare place data for database
          const placeData: PlaceData = {
            place_id: place.id || '',
            name: place.displayName || '',
            address: place.formattedAddress || '',
            lat: place.location.lat(),
            lng: place.location.lng(),
            types: place.types || [],
            rating: place.rating || null,
            user_ratings_total: place.rating || null,
            url: place.googleMapsURI || '',
            phone: place.internationalPhoneNumber || null,
            website: place.websiteURI || null
          };

          storedPlaces.push(placeData);

          // Store place in database
          try {
            await storePlaceInDatabase(placeData);
          } catch (error) {
            console.error('Failed to store place:', placeData.name, error);
          }

          // Build info window content
          
        }

        // Notify parent component about fetched places
        if (onPlacesFetched) {
          onPlacesFetched(storedPlaces);
        }

        // Adjust map bounds to show all markers
        map.fitBounds(newBounds, 100);
      } else {
        console.log('No results found');
        if (onPlacesFetched) {
          onPlacesFetched([]);
        }
      }
    } catch (error) {
      console.error('Error in nearby search:', error);
      if (onPlacesFetched) {
        onPlacesFetched([]);
      }
    } finally {
      setIsLoading(false);
    }
  }


  const handleSearchClick = () => {
    nearbySearch();
  };

  return (
    <div style={{ 
      position: 'absolute', 
      top: '10px', 
      left: '10px', 
      zIndex: 1000,
      background: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      minWidth: '250px'
    }}>
      <h3 style={{ margin: '0 0 15px 0' }}>Find Places</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Place Type:
        </label>
        <select 
          value={typeSelect} 
          onChange={(e) => setTypeSelect(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        >
          <option value="restaurant">Restaurant</option>
          <option value="cafe">Cafe</option>
          <option value="bar">Bar</option>
          <option value="store">Store</option>
          <option value="supermarket">Supermarket</option>
          <option value="park">Park</option>
          <option value="museum">Museum</option>
          <option value="hotel">Hotel</option>
          <option value="gas_station">Gas Station</option>
          <option value="pharmacy">Pharmacy</option>
        </select>
      </div>

      <div style={{ marginBottom: '15px', fontSize: '12px', color: '#666' }}>
        <div>Current Center:</div>
        <div>Lat: {center.lat.toFixed(6)}, Lng: {center.lng.toFixed(6)}</div>
      </div>

      <button 
        onClick={handleSearchClick}
        disabled={isLoading || !map}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: isLoading ? '#ccc' : '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold'
        }}
      >
        {isLoading ? 'Searching...' : 'Search Places'}
      </button>

      {isLoading && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '10px',
          fontSize: '14px',
          color: '#666'
        }}>
          Fetching places and storing in database...
        </div>
      )}
    </div>
  );
};

export default PlacesFetcher;



  