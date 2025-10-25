"use client";
import Image from "next/image";
import MapComponent from "./components/MapComponent";
import PlacesSearch from "./components/PlacesComponent";

export default function Home() {
  const center = {lat: 55.862422, lng: -4.256248};
  const radius = 5000;
  const type = "bar";
  return (
    <div>
          <PlacesSearch 
      center={center} 
      radius={radius} 
      type={type} 
      onPlacesFetched={(places) => console.log('Fetched places:', places)} 
    />
      <MapComponent />
    </div>
  );
}
