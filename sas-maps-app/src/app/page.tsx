"use client";
import MapComponent from "./components/MapComponent";
import PlacesSearch, { PlaceData } from "../app/components/PlacesComponent";
import { useState } from "react";
import styles from '../app/components/Navigation.module.css';

export default function Home() {

  const [showSearchUI, setShowSearchUI] = useState(false);

  const center = {lat: 55.862422, lng: -4.256248};
  const radius = 5000;
  const [selectedTypes, setSelectedTypes] = useState(["bar"]);

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
        type={selectedTypes}
        onTypeChange={setSelectedTypes}
        onPlacesFetched={handlePlacesFetched}
        onClose={() => setShowSearchUI(false)}
        />
      )}
      </div>
      <MapComponent />
    </div>
  );
}
