"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";


export default function MapComponent() {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
      <Map
        center={{ lat: 30, lng: 30 }}
        zoom={1}
        style={{ width: "100%", height: "100vh" }}
        >
          
      </Map>
    </APIProvider>
  );
}
