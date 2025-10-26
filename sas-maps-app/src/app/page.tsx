"use client";
import MapComponent from "./components/MapComponent";
import PlacesSearch, { PlaceData } from "../app/components/PlacesComponent";
import { useState, useEffect } from "react";
import styles from "../app/components/Navigation.module.css";

export default function Home() {
  const [showSearchUI, setShowSearchUI] = useState(false);

  const [searchCenter, setSearchCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [radius, setRadius] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState(["bar"]);

  useEffect(() => {
    if (!navigator.geolocation) {
      const fallback = { lat: 55.862422, lng: -4.256248 };
      setSearchCenter(fallback);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSearchCenter(loc);
      },
      () => {
        const fallback = { lat: 55.862422, lng: -4.256248 };
        setSearchCenter(fallback);
      }
    );
  }, []);

  const handlePlacesFetched = (places: PlaceData[]) => {
    console.log("Fetched places:", places);
  };

  return (
    <div>
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1000,
          background: "white",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <button
          onClick={() => setShowSearchUI(true)}
          disabled={showSearchUI}
          className={styles.signupButton}
        >
          Show Places Search
        </button>

        {showSearchUI && searchCenter && (
          <PlacesSearch
            center={searchCenter}
            radius={radius}
            type={selectedTypes}
            onTypeChange={setSelectedTypes}
            onPlacesFetched={handlePlacesFetched}
            onClose={() => setShowSearchUI(false)}
            onRadiusChange={setRadius}
          />
        )}
      </div>

      <MapComponent
        center={searchCenter}
        markerPosition={searchCenter}
        onMarkerPositionChange={setSearchCenter}
        radius={radius}
      />
    </div>
  );
}
