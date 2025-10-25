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

const MapComponent = () => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [typeSelect, setTypeSelect] = useState<string>('restaurant');
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 40.7128, lng: -74.0060 }); // Default to NYC

  useEffect(() => {
    initMap();
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      nearbySearch();
    }
  }, [typeSelect, center]);

  async function initMap() {
    const { Map, InfoWindow } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
    
    if (!mapElementRef.current) return;

    mapRef.current = new Map(mapElementRef.current, {
      center: center,
      zoom: 12,
      mapTypeControl: false,
    });

    infoWindowRef.current = new InfoWindow();

    // Update center when map is moved
    mapRef.current.addListener('dragend', () => {
      const newCenter = mapRef.current?.getCenter();
      if (newCenter) {
        setCenter({
          lat: newCenter.lat(),
          lng: newCenter.lng()
        });
      }
    });

    // Kick off initial search once map has loaded
    mapRef.current.addListener('idle', () => {
      nearbySearch();
    });
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

  async function nearbySearch() {
    if (!mapRef.current) return;

    const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    const { spherical } = await google.maps.importLibrary('geometry') as google.maps.GeometryLibrary;

    const mapCenter = mapRef.current.getCenter();
    if (!mapCenter) return;

    const bounds = mapRef.current.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const diameter = spherical.computeDistanceBetween(ne, sw);
    const radius = Math.min((diameter / 2), 50000);

    const request = {
      fields: ['displayName', 'location', 'formattedAddress', 'googleMapsURI', 'types', 'rating', 'userRatingsTotal', 'internationalPhoneNumber', 'website'],
      locationRestriction: {
        center: { lat: mapCenter.lat(), lng: mapCenter.lng() },
        radius,
      },
      includedPrimaryTypes: [typeSelect],
      maxResultCount: 20, // Increased to get more results
      rankPreference: SearchNearbyRankPreference.POPULARITY,
    };

    try {
      const { places } = await Place.searchNearby(request);

      if (places.length) {
        const { LatLngBounds } = await google.maps.importLibrary("core") as google.maps.CoreLibrary;
        const newBounds = new LatLngBounds();

        // Clear existing markers
        // markers.forEach(marker => marker.map = null);

        for (const place of places) {
          if (!place.location) continue;
          
          newBounds.extend(place.location);

          const marker = new AdvancedMarkerElement({
            map: mapRef.current,
            position: place.location,
            title: place.displayName,
          });

          // Prepare place data for database
          const placeData: PlaceData = {
            place_id: place.id || '',
            name: place.displayName || '',
            address: place.formattedAddress || '',
            lat: place.location.lat(),
            lng: place.location.lng(),
            types: place.types || [],
            rating: place.rating || null,
            user_ratings_total: place.userRatingsTotal || null,
            url: place.googleMapsURI || '',
            phone: place.internationalPhoneNumber || null,
            website: place.website || null
          };

          // Store place in database
          try {
            await storePlaceInDatabase(placeData);
          } catch (error) {
            console.error('Failed to store place:', placeData.name, error);
          }

          // Build info window content
          const content = document.createElement('div');
          const name = document.createElement('h3');
          name.textContent = place.displayName || '';
          const address = document.createElement('div');
          address.textContent = place.formattedAddress || '';
          const rating = document.createElement('div');
          rating.textContent = `Rating: ${place.rating || 'N/A'} (${place.userRatingsTotal || 0} reviews)`;
          const types = document.createElement('div');
          types.textContent = `Types: ${place.types?.join(', ') || ''}`;
          
          content.append(name, address, rating, types);

          if (place.googleMapsURI) {
            const link = document.createElement('a');
            link.href = place.googleMapsURI;
            link.target = '_blank';
            link.textContent = 'View Details on Google Maps';
            link.style.display = 'block';
            link.style.marginTop = '10px';
            content.appendChild(link);
          }

          marker.addListener('click', () => {
            mapRef.current?.panTo(place.location!);
            updateInfoWindow(place.displayName || '', content, marker);
          });
        }

        mapRef.current.fitBounds(newBounds, 100);
      } else {
        console.log('No results found');
      }
    } catch (error) {
      console.error('Error in nearby search:', error);
    }
  }

  function updateInfoWindow(title: string, content: HTMLElement, anchor: google.maps.marker.AdvancedMarkerElement) {
    if (!infoWindowRef.current) return;
    
    infoWindowRef.current.setContent(content);
    infoWindowRef.current.setOptions({
      headerContent: title,
    });
    infoWindowRef.current.open({
      anchor,
      map: mapRef.current,
    });
  }

  const handleCenterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [lat, lng] = e.target.value.split(',').map(coord => parseFloat(coord.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      setCenter({ lat, lng });
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>
          Center (lat,lng): 
          <input 
            type="text" 
            value={`${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`}
            onChange={handleCenterChange}
            style={{ marginLeft: '5px', padding: '5px' }}
            placeholder="e.g., 40.7128, -74.0060"
          />
        </label>
        
        <label style={{ marginLeft: '20px', marginRight: '10px' }}>
          Place Type:
          <select 
            value={typeSelect} 
            onChange={(e) => setTypeSelect(e.target.value)}
            className="type-select"
            style={{ marginLeft: '5px', padding: '5px' }}
          >
            <option value="restaurant">Restaurant</option>
            <option value="cafe">Cafe</option>
            <option value="bar">Bar</option>
            <option value="store">Store</option>
            <option value="park">Park</option>
            <option value="museum">Museum</option>
            <option value="hotel">Hotel</option>
          </select>
        </label>
      </div>
      
      <div ref={mapElementRef} style={{ height: '500px', width: '100%', border: '1px solid #ccc' }} />
    </div>
  );
};

export default MapComponent;