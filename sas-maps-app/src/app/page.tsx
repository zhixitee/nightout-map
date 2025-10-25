"use client";
import Image from "next/image";
import { useState } from "react";
import MapComponent from "./components/MapComponent";
import PlacesSearch from "./components/PlacesComponent";
import type { PlaceData } from "./components/PlacesComponent";
import styles from "../app/components/Navigation.module.css";

export default function Home() {

  const [showSearchUI, setShowSearchUI] = useState(false);

  const center = {lat: 55.862422, lng: -4.256248};
  const radius = 5000;
  const type = "bar";

  const handlePlacesFetched = (places: PlaceData[]) => {
    console.log("Fetched places:", places);
  }

  return (
    <div>
      <div style = {{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
      <button onClick={() => setShowSearchUI(true)}
        disabled={showSearchUI}
        className={styles.signupButton}
      >Show Places Search</button>
      {showSearchUI && (
      <PlacesSearch
        center={center}
        radius={radius}
        type={type}
        onPlacesFetched={handlePlacesFetched}
        onClose={() => setShowSearchUI(false)}
        />
      )}
      </div>
      <MapComponent />
      
    </div>
  );
}
