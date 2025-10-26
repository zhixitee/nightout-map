"use client";

import { useJsApiLoader } from "@react-google-maps/api";

const libraries: ("places" | "core")[] = ["places", "core"];

const loaderOptions = {
  id: "google-maps-script",
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  libraries,
  language: "en",
  region: "US",
};

export function useGoogleMapsLoader() {
  return useJsApiLoader(loaderOptions);
}
