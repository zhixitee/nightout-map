"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  Circle,
} from "@react-google-maps/api";
import LocationOverlay from "./LocationOverlayComponent";

export type PlaceDetails = {
  name: string;
  address: string;
  photoUrl?: string;
  rating?: number;
  price_level?: number;
  opening_hours?: google.maps.places.PlaceOpeningHours;
};
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import TopBar from "./TopBar";
import styles from "./MapComponent.module.css";

interface MapComponentProps {
  center: { lat: number; lng: number } | null;
  markerPosition: { lat: number; lng: number } | null;
  onMarkerPositionChange: (position: { lat: number; lng: number }) => void;
  radius: number;
}

export default function MapComponent({
  center,
  markerPosition,
  onMarkerPositionChange,
  radius,
}: MapComponentProps) {
  const { user, loading, signOut } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [initialDetailsFetched, setInitialDetailsFetched] = useState(false);
  const [trafficLayer, setTrafficLayer] =
    useState<google.maps.TrafficLayer | null>(null);
  const [showTraffic, setShowTraffic] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const fetchDetails = useCallback(
    (latLng: google.maps.LatLng, placeId?: string) => {
      if (!mapInstance) return;

      setIsLoading(true);
      setPlaceDetails(null);

      const geocoder = new google.maps.Geocoder();
      const placesService = new google.maps.places.PlacesService(mapInstance);

      if (placeId) {
        placesService.getDetails(
          {
            placeId: placeId,
            fields: [
              "name",
              "formatted_address",
              "photos",
              "geometry",
              "rating",
              "opening_hours",
              "price_level",
            ],
          },
          (result, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              result
            ) {
              const photoUrl =
                result.photos && result.photos.length > 0
                  ? result.photos[0].getUrl({ maxWidth: 400 })
                  : undefined;

              setPlaceDetails({
                name: result.name || "Location",
                address: result.formatted_address || "Address not found",
                photoUrl: photoUrl,
                rating: result.rating,
                price_level: result.price_level,
                opening_hours: result.opening_hours,
              });

              if (result.geometry?.location) {
                onMarkerPositionChange(result.geometry.location.toJSON());
              }
            }
            setIsLoading(false);
          }
        );
      } else {
        geocoder.geocode({ location: latLng }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            setPlaceDetails({
              name: results[0].formatted_address,
              address: results[0].formatted_address,
              photoUrl: undefined,
              rating: undefined,
              price_level: undefined,
              opening_hours: undefined,
            });
          }
          setIsLoading(false);
        });
      }
    },
    [mapInstance, onMarkerPositionChange]
  );

  useEffect(() => {
    if (mapInstance && markerPosition && !initialDetailsFetched) {
      setInitialDetailsFetched(true);
      fetchDetails(
        new google.maps.LatLng(markerPosition.lat, markerPosition.lng),
        undefined
      );
    }
  }, [mapInstance, markerPosition, initialDetailsFetched, fetchDetails]);

  useEffect(() => {
    if (trafficLayer && mapInstance) {
      trafficLayer.setMap(showTraffic ? mapInstance : null);
    }
  }, [showTraffic, trafficLayer, mapInstance]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onMarkerPositionChange(e.latLng.toJSON());
        fetchDetails(e.latLng, (e as any).placeId);
      }
    },
    [fetchDetails, onMarkerPositionChange]
  );

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onMarkerPositionChange(e.latLng.toJSON());
        fetchDetails(e.latLng, undefined);
      }
    },
    [fetchDetails, onMarkerPositionChange]
  );

  const handleComponentClose = useCallback(() => {
    setPlaceDetails(null);
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    const traffic = new google.maps.TrafficLayer();
    setTrafficLayer(traffic);
  }, []);

  const handleSearch = (query: string, lat: number, lng: number) => {
    onMarkerPositionChange({ lat, lng });
  };

  if (!isLoaded || !center || !markerPosition || loading)
    return <div>Loading map...</div>;

  return (
    <div className={styles.mapContainer}>
      {(isLoading || placeDetails) && (
        <LocationOverlay
          isLoading={isLoading}
          details={placeDetails}
          onClose={handleComponentClose}
        />
      )}

      <div className={styles.mapControls}>
        <button
          className={`${styles.mapButton} ${showTraffic ? styles.active : ""}`}
          onClick={() => setShowTraffic(!showTraffic)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          Traffic
        </button>
      </div>

      <GoogleMap
        center={center}
        zoom={12}
        mapContainerStyle={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
        onLoad={onMapLoad}
        options={{
          gestureHandling: "auto",
          zoomControl: true,
          clickableIcons: true,
          styles: theme === "dark" ? [] : undefined,
        }}
      >
        {markerPosition && (
          <Marker
            position={markerPosition}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
          />
        )}
{markerPosition && (
          <Circle
            center={markerPosition}
            radius={radius}
            options={{
              strokeColor: "cyan",
              strokeOpacity: 0.0005,
              strokeWeight: 1,
              fillColor: "cyan",
              fillOpacity: 0.35,
              zIndex: 1,
              clickable: false,
              
            }}
          />
        )}

      </GoogleMap>
    </div>
  );
}
