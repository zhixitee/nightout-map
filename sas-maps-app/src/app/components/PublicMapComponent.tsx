"use client";

import { useState, useEffect, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import styles from "./MapComponent.module.css";

export default function PublicMapComponent() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);

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
  });

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPosition({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  }, []);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPosition({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  }, []);

  if (!isLoaded || !userLocation || !markerPosition) return <div>Loading map...</div>;

  return (
    <GoogleMap
      center={userLocation}
      zoom={12}
      mapContainerStyle={{ width: "100%", height: "100vh" }}
      onClick={handleMapClick}
      options={{
        gestureHandling: "auto", 
        zoomControl: true,        
      }}
    >
      <Marker
        position={markerPosition}
        draggable={true}
        onDragEnd={handleMarkerDragEnd}
      />
    </GoogleMap>
  );
}
