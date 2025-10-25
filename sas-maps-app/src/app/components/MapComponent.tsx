"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useAuth } from "@/lib/AuthContext";
import TopBar from "./TopBar";
import styles from "./MapComponent.module.css";

export default function InteractiveMap() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mapZoom, setMapZoom] = useState(12);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

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

  const handleSearch = (query: string, lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    setMapZoom(15);
  };

  if (!isLoaded || !userLocation || !markerPosition || loading) return <div>Loading map...</div>;

  return (
    <div className={styles.mapContainer}>
      <TopBar onSearch={handleSearch} userLocation={userLocation} />
      <GoogleMap
        center={markerPosition}
        zoom={mapZoom}
        mapContainerStyle={{ width: "100%", height: "calc(100vh - 57px)" }}
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
    </div>
  );
}
