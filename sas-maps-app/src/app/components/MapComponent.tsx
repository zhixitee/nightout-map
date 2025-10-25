"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
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
import TopBar from "./TopBar";
import styles from "./MapComponent.module.css";

export default function MapComponent() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [initialDetailsFetched, setInitialDetailsFetched] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      const fallback = { lat: 55, lng: 3 };
      setUserLocation(fallback);
      setMarkerPosition(fallback);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setMarkerPosition(loc);
      },
      () => {
        const fallback = { lat: 55, lng: 3 };
        setUserLocation(fallback);
        setMarkerPosition(fallback);
      }
    );
  }, []);

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
              "name", "formatted_address", "photos", "geometry",
              "rating", "opening_hours", "price_level"
            ],
          },
          (result, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && result) {
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
                 setMarkerPosition(result.geometry.location.toJSON());
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
    [mapInstance]
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

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        setMarkerPosition(e.latLng.toJSON());
        fetchDetails(e.latLng, (e as any).placeId);
      }
    },
    [fetchDetails]
  );

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        setMarkerPosition(e.latLng.toJSON());
        fetchDetails(e.latLng, undefined);
      }
    },
    [fetchDetails]
  );

  const handleComponentClose = useCallback(() => {
    setPlaceDetails(null);
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const handleSearch = (query: string, lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
  };

  if (!isLoaded || !userLocation || !markerPosition || loading) return <div>Loading map...</div>;

  return (
    <div className={styles.mapContainer}>
      {(isLoading || placeDetails) && (
        <LocationOverlay
          isLoading={isLoading}
          details={placeDetails}
          onClose={handleComponentClose}
        />
      )}

      <GoogleMap
        center={userLocation}
        zoom={12}
        mapContainerStyle={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
        onLoad={onMapLoad}
        options={{
          gestureHandling: "auto",
          zoomControl: true,
          clickableIcons: true,
        }}
      >
        {markerPosition && (
          <Marker
            position={markerPosition}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
          />
        )}
      </GoogleMap>
    </div>
  );
}