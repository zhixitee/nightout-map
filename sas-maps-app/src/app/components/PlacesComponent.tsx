import { useState } from "react";
import styles from "../components/Navigation.module.css";
import { supabase } from "@/lib/supabaseClient";

export interface PlaceData {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  rating: number | null;
  userratingcount: number | null;
  websiteuri: string | null;
  url: string;
  phone: string | null;
}

interface PlacesSearchProps {
  center: { lat: number; lng: number };
  radius: number;
  type: string[];
  onPlacesFetched?: (places: PlaceData[]) => void;
  onClose?: () => void;
  onTypeChange?: (types: string[]) => void; 
}

const typeCategories = {
  "Activities": [
    { name: "Bowling", value: "bowling_alley" },
    { name: "Casino", value: "casino" },
    { name: "Event Venue", value: "event_venue" },
    { name: "Movie Theater", value: "movie_theater" },
    { name: "Night Club", value: "night_club" },
    { name: "Picnic Ground", value: "picnic_ground" },
    { name: "Video Arcade", value: "video_arcade" },
  ],
  "Food & Drink": [
    { name: "Bar", value: "bar" },
    { name: "Pub", value: "pub" },
    { name: "Restaurant", value: "restaurant" },
  ],
  "Location": [
    { name: "Hotel", value: "hotel" },
    { name: "Guest Room", value: "private_guest_room" },
    { name: "Beach", value: "beach" },
  ],
  "Sports": [
    { name: "Arena", value: "arena" },
    { name: "Golf Course", value: "golf_course" },
    { name: "Skating Rink", value: "ice_skating_rink" },
    { name: "Stadium", value: "stadium" },
    { name: "Sports Club", value: "sports_club" },
    { name: "Swimming Pool", value: "swimming_pool" },
  ]
};

const PlacesSearch: React.FC<PlacesSearchProps> = ({
  center,
  radius,
  type,
  onPlacesFetched,
  onClose,
  onTypeChange, 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<PlaceData[]>([]);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  
  async function storePlaceInDatabase(placeData: PlaceData) {
   
    try {
      const { data, error } = await supabase
        .from("places")
        .upsert(
          {
            place_id: placeData.place_id,
            name: placeData.name,
            address: placeData.address,
            lat: placeData.lat,
            lng: placeData.lng,
            types: placeData.types,
            rating: placeData.rating,
            userratingcount: placeData.userratingcount,
            websiteuri: placeData.websiteuri,
            url: placeData.url,
            phone: placeData.phone,
          },
          {
            onConflict: "place_id",
            ignoreDuplicates: false,
          }
        )
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error storing place:", error);
      throw error;
    }
  }

  async function searchPlaces() {
    
    if (!window.google) {
      console.error("Google Maps API not loaded");
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      const { Place, SearchNearbyRankPreference } =
        (await google.maps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary;

      const request = {
        fields: [
          "displayName",
          "location",
          "formattedAddress",
          "googleMapsURI",
          "types",
          "rating",
          "userRatingCount",
          "internationalPhoneNumber",
          "websiteURI",
          "id",
        ],
        locationRestriction: {
          center: center,
          radius: radius,
        },
        includedPrimaryTypes: type,
        maxResultCount: 20,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
      };

      const { places } = await Place.searchNearby(request);
      const storedPlaces: PlaceData[] = [];

      if (places.length) {
        for (const place of places) {
          if (!place.location) continue;

          const placeData: PlaceData = {
            place_id: place.id || "",
            name: place.displayName || "",
            address: place.formattedAddress || "",
            lat: place.location.lat() || 55.8617,
            lng: place.location.lng() || 4.2583,
            types: place.types || [],
            rating: place.rating || null,
            userratingcount: place.userRatingCount || null,
            url: place.googleMapsURI || "",
            websiteuri: place.websiteURI || null,
            phone: place.internationalPhoneNumber || null,
          };

          try {
            await storePlaceInDatabase(placeData);
            storedPlaces.push(placeData);
          } catch (error) {
            console.error("Failed to store place:", placeData.name, error);
          }
        }

        setResults(storedPlaces);
        if (onPlacesFetched) {
          onPlacesFetched(storedPlaces);
        }

        console.log(
          `Successfully stored ${storedPlaces.length} places in database`
        );
      } else {
        console.log("No places found");
        if (onPlacesFetched) {
          onPlacesFetched([]);
        }
      }
    } catch (error) {
      console.error("Error searching places:", error);
      if (onPlacesFetched) {
        onPlacesFetched([]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  
  const handleTypeClick = (typeValue: string) => {
    if (!onTypeChange) return; 

    const isSelected = type.includes(typeValue);
    let newTypes: string[];

    if (isSelected) {
      
      newTypes = type.filter(t => t !== typeValue);
    } else {
      
      newTypes = [...type, typeValue];
    }
    
    onTypeChange(newTypes); 
  };


  const overlayStyles: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const overlayContentStyles: React.CSSProperties = {
    position: "relative",
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    maxHeight: "80vh", 
    overflowY: "auto",  
  };

  
  const typeButtonStyles: React.CSSProperties = {
    background: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '8px 12px',
    margin: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  };

  const selectedTypeButtonStyles: React.CSSProperties = {
    ...typeButtonStyles,
    background: '#1976d2',
    color: 'white',
    borderColor: '#1976d2',
  };

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        position: "relative",
        backgroundColor: "white",
      }}
    >
      {onClose && (
        
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "8px",
            right: "10px",
            background: "transparent",
            border: "none",
            fontSize: "24px",
            lineHeight: "1",
            cursor: "pointer",
            padding: "0 5px",
          }}
          aria-label="Close"
        >
          &times;
        </button>
      )}

      <h3>Search Places</h3>

      <div style={{ marginBottom: "15px" }}>
      
        <div>
          <strong>Center:</strong> {center.lat.toFixed(6)},{" "}
          {center.lng.toFixed(6)}
        </div>
        <div>
          <strong>Radius:</strong> {(radius / 1000).toFixed(1)} km
        </div>
        <div
          style={{ display: "flex", alignItems: "center", marginTop: "5px" }}
        >
          <button
            onClick={() => setIsOverlayOpen(true)}
            style={{
              cursor: "pointer",
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              fontSize: "16px",
              lineHeight: "22px",
              textAlign: "center",
              marginRight: "8px",
              padding: 0,
            }}
            aria-label="Select type"
          >
            +
          </button>

          <span>
            Current Type(s): <strong>{type.join(", ")}</strong>
          </span>
        </div>
      </div>
      <button
        onClick={searchPlaces}
        
        disabled={isLoading}
        className={styles.signupButton}
        style={{
          padding: "10px 20px",
          backgroundColor: isLoading ? "#ccc" : "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {isLoading ? "Searching..." : "Search & Store Places"}
      </button>

      {isLoading && (
        
        <div style={{ marginTop: "10px", color: "#666" }}>
          Searching for {type.join(", ")} places within{" "}
          {(radius / 1000).toFixed(1)}km radius...
        </div>
      )}

      {results.length > 0 && (
        
        <div style={{ marginTop: "15px" }}>
          <h4>Results ({results.length} places stored):</h4>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {results.map((place, index) => (
              <div
                key={place.place_id}
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #eee",
                  fontSize: "14px",
                }}
              >
                <div>
                  <strong>{place.name}</strong>
                </div>
                <div>{place.address}</div>
                <div>
                  Rating: {place.rating || "N/A"} ({place.userratingcount || 0}{" "}
                  reviews)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. UPDATE THE OVERLAY CONTENT */}
      {isOverlayOpen && (
        <div style={overlayStyles} onClick={() => setIsOverlayOpen(false)}>
          <div
            style={overlayContentStyles}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOverlayOpen(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "transparent",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
              }}
              aria-label="Close Overlay"
            >
              &times;
            </button>
            
            <h2 style={{ marginTop: '0' }}>Select Types</h2>
            <p>Current: <strong>{type.join(', ') || 'None'}</strong></p>

            {/* Map over the categories and render the buttons */}
            {Object.entries(typeCategories).map(([category, items]) => (
              <div key={category} style={{ marginBottom: '15px' }}>
                <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                  {category}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {items.map(item => {
                    const isSelected = type.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        onClick={() => handleTypeClick(item.value)}
                        style={isSelected ? selectedTypeButtonStyles : typeButtonStyles}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          </div>
        </div>
      )}
    </div>
  );
};

export default PlacesSearch;