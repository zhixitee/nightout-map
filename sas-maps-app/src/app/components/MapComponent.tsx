"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";

export default function MapComponent() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 50, lng: 50 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setUserLocation({ lat: 50, lng: 50 });
      }
    );
  }, []);

  if (!userLocation) return <div>Loading map...</div>;

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
      <Map
        center={userLocation}
        zoom={12}
        style={{ width: "100%", height: "100vh" }}
      >
        <Marker position={userLocation} />
      </Map>
    </APIProvider>
  );
}
