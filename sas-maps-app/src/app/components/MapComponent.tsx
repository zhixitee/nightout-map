"use client";

import { useState, useEffect, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import LocationOverlay from "./LocationOverlayComponent";

export default function InteractiveMap() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);

  const [isComponentOpen, setIsComponentOpen] = useState(false);

  
  useEffect(() => {
    if (!navigator.geolocation) {
      const fallback = { lat: 55, lng: 3 };
      setUserLocation(fallback);
      setMarkerPosition(fallback);
      setIsComponentOpen(true); 
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
        setIsComponentOpen(true); 
      },
      () => {
        const fallback = { lat: 55, lng: 3 };
        setUserLocation(fallback);
        setMarkerPosition(fallback);
        setIsComponentOpen(true); 
      }
    );
  }, []);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = e.latLng.toJSON();
      setMarkerPosition(newPos);
      setIsComponentOpen(true); 
    }
  }, []);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = e.latLng.toJSON();
      setMarkerPosition(newPos);
      setIsComponentOpen(true); 
    }
  }, []);

  
  const handleComponentClose = useCallback(() => {
    setIsComponentOpen(false);
  }, []);
  
  
  const handleMarkerClick = useCallback(() => {
     setIsComponentOpen(true); 
  }, []);

  if (!isLoaded || !userLocation || !markerPosition) return <div>Loading map...</div>;

  return (
    
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      
      {isComponentOpen && (
        <LocationOverlay
          location={markerPosition}
          onClose={handleComponentClose}
        />
      )}

      
      <GoogleMap
        center={userLocation}
        zoom={12}
        mapContainerStyle={{ width: "100%", height: "100%" }}
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
          onClick={handleMarkerClick}
        />
      </GoogleMap>
    </div>
  );
}