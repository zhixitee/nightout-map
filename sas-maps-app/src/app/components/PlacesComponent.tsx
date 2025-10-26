import { useState } from "react";
import styles from "./PlacesComponent.module.css";
import { supabase } from "@/lib/supabaseClient";
import { useRoutePlanner } from "@/lib/RoutePlannerContext";
import { useTheme } from "@/lib/ThemeContext";

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

type CSSProperties = {
  [key: string]: string | number;
};

interface PlacesSearchProps {
  center: { lat: number; lng: number };
  radius: number;
  type: string[];
  onPlacesFetched?: (places: PlaceData[]) => void;
  onClose?: () => void;
  onTypeChange?: (types: string[]) => void;
  onRadiusChange?: (newRadius: number) => void;
  onPlaceSelect?: (place: PlaceData) => void;
}

const typeCategories = {
  Activities: [
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
  Location: [
    { name: "Hotel", value: "hotel" },
    { name: "Guest Room", value: "private_guest_room" },
    { name: "Beach", value: "beach" },
  ],
  Sports: [
    { name: "Arena", value: "arena" },
    { name: "Golf Course", value: "golf_course" },
    { name: "Skating Rink", value: "ice_skating_rink" },
    { name: "Stadium", value: "stadium" },
    { name: "Sports Club", value: "sports_club" },
    { name: "Swimming Pool", value: "swimming_pool" },
  ],
};

const PlacesSearch: React.FC<PlacesSearchProps> = ({
  center,
  radius,
  type,
  onPlacesFetched,
  onClose,
  onTypeChange,
  onRadiusChange,
  onPlaceSelect
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<PlaceData[]>([]);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const { addVenue, hasVenue } = useRoutePlanner();
  const { theme } = useTheme();

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
      newTypes = type.filter((t) => t !== typeValue);
    } else {
      newTypes = [...type, typeValue];
    }
    onTypeChange(newTypes);
  };

  const handleRadiusChange = (incrementInKm: number) => {
    if (!onRadiusChange) return;
    const newRadius = radius + incrementInKm * 1000;
    if (newRadius >= 1000) {
      onRadiusChange(newRadius);
    }
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
    backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
    color: theme === 'dark' ? '#e2e8f0' : '#0f172a',
    padding: "2rem",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    maxHeight: "80vh",
    overflowY: "auto",
  };
  const typeButtonStyles: React.CSSProperties = {
    background: theme === 'dark' ? '#334155' : '#f0f0f0',
    border: `1px solid ${theme === 'dark' ? '#475569' : '#ccc'}`,
    color: theme === 'dark' ? '#e2e8f0' : '#0f172a',
    borderRadius: "4px",
    padding: "8px 12px",
    margin: "4px",
    cursor: "pointer",
    fontSize: "14px",
  };
  const selectedTypeButtonStyles: React.CSSProperties = {
    ...typeButtonStyles,
    background: "#667eea",
    color: "white",
    borderColor: "#667eea",
  };
  const radiusButtonStyle: React.CSSProperties = {
    width: "30px",
    height: "30px",
    border: `1px solid ${theme === 'dark' ? '#475569' : '#ccc'}`,
    borderRadius: "50%",
    background: theme === 'dark' ? '#334155' : '#f9f9f9',
    color: theme === 'dark' ? '#e2e8f0' : '#333',
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
    padding: 0,
  };
  const disabledRadiusButtonStyle: React.CSSProperties = {
    ...radiusButtonStyle,
    cursor: "not-allowed",
    background: theme === 'dark' ? '#1e293b' : '#eee',
    color: theme === 'dark' ? '#64748b' : '#aaa',
  };

  return (
    <div className={styles.container}>
      {onClose && (
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close"
        >
          &times;
        </button>
      )}

      <h3 className={styles.title}>Search Places</h3>

      <div className={styles.searchControls}>
        <div className={styles.locationInfo}>
          <strong>Location:</strong> {center.lat.toFixed(6)},{" "}
          {center.lng.toFixed(6)}
        </div>

        <div className={styles.radiusControl}>
          <label className={styles.controlLabel}>
            Radius (km):
          </label>
          <div className={styles.radiusButtons}>
            <button
              type="button"
              onClick={() => handleRadiusChange(-1)}
              style={
                radius <= 1000 ? disabledRadiusButtonStyle : radiusButtonStyle
              }
              disabled={radius <= 1000}
              aria-label="Decrease radius by 1km"
            >
              -
            </button>
            <span
              style={{
                minWidth: "30px",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              {radius / 1000}
            </span>
            <button
              type="button"
              onClick={() => handleRadiusChange(1)}
              style={radiusButtonStyle}
              aria-label="Increase radius by 1km"
            >
              +
            </button>
          </div>
        </div>

        <div className={styles.typeControl}>
          <button
            onClick={() => setIsOverlayOpen(true)}
            className={styles.typeButton}
            aria-label="Select type"
          >
            +
          </button>
          <span className={styles.typeInfo}>
            Current Type(s): <strong>{type.join(", ")}</strong>
          </span>
        </div>
      </div>
      <button
        onClick={searchPlaces}
        disabled={isLoading}
        className={styles.searchButton}
      >
        {isLoading ? "Searching..." : "Search & Store Places"}
      </button>

      {isLoading && (
        <div className={styles.loadingMessage}>
          Searching for {type.join(", ")} places within{" "}
          {(radius / 1000).toFixed(1)}km radius...
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.resultsSection}>
          <h4 className={styles.resultsTitle}>Results ({results.length} places stored):</h4>
          <div className={styles.resultsList}>
            {results.map((place) => {
              const alreadyAdded = hasVenue(place.place_id);

              return (
              <div
                key={place.place_id}
                className={styles.resultItem}
                onClick={() => onPlaceSelect && onPlaceSelect(place)}
              >
                <div className={styles.placeName}>
                  <strong>{place.name}</strong>
                </div>
                <div className={styles.placeAddress}>{place.address}</div>
                <div className={styles.placeRating}>
                  Rating: {place.rating || "N/A"} ({place.userratingcount || 0}{" "}
                  reviews)
                </div>
                  <div className={styles.addButtonWrapper}>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!alreadyAdded) {
                          addVenue(place);
                        }
                      }}
                      className={`${styles.addButton} ${alreadyAdded ? styles.addedButton : ''}`}
                      disabled={alreadyAdded}
                    >
                      {alreadyAdded ? "Added" : "Add to Night Out"}
                    </button>
                  </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {isOverlayOpen && (
        <div style={overlayStyles} onClick={() => setIsOverlayOpen(false)}>
          <div
            style={overlayContentStyles}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOverlayOpen(false)}
              className={styles.overlayCloseButton}
              aria-label="Close Overlay"
            >
              &times;
            </button>

            <h2 className={styles.overlayTitle}>Select Types</h2>
            <p className={styles.overlayCurrent}>
              Current: <strong>{type.join(", ") || "None"}</strong>
            </p>

            {Object.entries(typeCategories).map(([category, items]) => (
              <div key={category} className={styles.categorySection}>
                <h4 className={styles.categoryTitle}>
                  {category}
                </h4>
                <div className={styles.typeButtons}>
                  {items.map((item) => {
                    const isSelected = type.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        onClick={() => handleTypeClick(item.value)}
                        style={
                          isSelected
                            ? selectedTypeButtonStyles
                            : typeButtonStyles
                        }
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
