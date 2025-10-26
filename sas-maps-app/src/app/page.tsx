"use client";
import MapComponent from "./components/MapComponent";
import { useEffect } from "react";
import { useMapSearch } from "@/lib/MapSearchContext";

export default function Home() {
  const { center, setCenter, radius } = useMapSearch();

  useEffect(() => {
    if (!navigator.geolocation) {
      const fallback = { lat: 55.862422, lng: -4.256248 };
      setCenter(fallback);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(loc);
      },
      () => {
        const fallback = { lat: 55.862422, lng: -4.256248 };
        setCenter(fallback);
      }
    );
  }, [setCenter]);

  return (
    <main style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'relative'
    }}>
      <MapComponent
        center={center}
        markerPosition={center}
        onMarkerPositionChange={setCenter}
        radius={radius}
      />
    </main>
  );
}
