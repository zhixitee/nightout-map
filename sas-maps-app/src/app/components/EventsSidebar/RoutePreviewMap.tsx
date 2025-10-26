"use client";

import { useEffect, useMemo, useState } from "react";
import { DirectionsRenderer, GoogleMap } from "@react-google-maps/api";
import type { PlannedVenue } from "@/lib/RoutePlannerContext";
import { useGoogleMapsLoader } from "@/lib/useGoogleMapsLoader";
import { useTheme } from "@/lib/ThemeContext";

interface RoutePreviewMapProps {
  venues: PlannedVenue[];
  onRouteComputed: (orderedPlaceIds: string[]) => void;
}

export default function RoutePreviewMap({ venues, onRouteComputed }: RoutePreviewMapProps) {
  const { isLoaded } = useGoogleMapsLoader();
  const { theme } = useTheme();

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colorScheme, setColorScheme] = useState<google.maps.ColorScheme | undefined>(undefined);

  const mapCenter = useMemo(() => {
    if (venues.length === 0) {
      return { lat: 55.862422, lng: -4.256248 };
    }

    return { lat: venues[0].lat, lng: venues[0].lng };
  }, [venues]);

  const mapColorOptions = useMemo(() => {
    if (!colorScheme) {
      return {};
    }
    return { colorScheme };
  }, [colorScheme]);

  useEffect(() => {
    let isMounted = true;

    async function loadColorScheme() {
      if (!isLoaded) {
        return;
      }

      try {
        const { ColorScheme } = (await google.maps.importLibrary("core")) as {
          ColorScheme: typeof google.maps.ColorScheme;
        };

        if (!isMounted) {
          return;
        }

        setColorScheme(theme === "dark" ? ColorScheme.DARK : ColorScheme.LIGHT);
      } catch (error) {
        console.error("Failed to load core library for color scheme:", error);
      }
    }

    loadColorScheme();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, theme]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (venues.length < 2) {
      setDirections(null);
      setError(null);
      onRouteComputed(venues.map((venue) => venue.place_id));
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const origin = { lat: venues[0].lat, lng: venues[0].lng };
    const destination = {
      lat: venues[venues.length - 1].lat,
      lng: venues[venues.length - 1].lng,
    };
    const waypointVenues = venues.slice(1, -1);

    directionsService.route(
      {
        origin,
        destination,
        waypoints: waypointVenues.map((venue) => ({
          location: { lat: venue.lat, lng: venue.lng },
          stopover: true,
        })),
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          setError(null);

          const orderedPlaceIds: string[] = [];
          if (venues.length > 0) {
            orderedPlaceIds.push(venues[0].place_id);
          }

          const waypointOrder = result.routes?.[0]?.waypoint_order ?? [];
          waypointOrder.forEach((waypointIndex) => {
            const waypointVenue = waypointVenues[waypointIndex];
            if (waypointVenue) {
              orderedPlaceIds.push(waypointVenue.place_id);
            }
          });

          if (venues.length > 1) {
            orderedPlaceIds.push(venues[venues.length - 1].place_id);
          }

          onRouteComputed(orderedPlaceIds);
        } else {
          setDirections(null);
          setError("We couldn't calculate a route with these stops. Try removing one and re-adding.");
          onRouteComputed(venues.map((venue) => venue.place_id));
        }
      }
    );
  }, [isLoaded, venues, onRouteComputed]);

  if (!isLoaded) {
    return (
      <div
        style={{
          width: "100%",
          height: "220px",
          borderRadius: "8px",
          border: "1px solid var(--card-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
        }}
      >
        Loading route...
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {error && (
        <p style={{ color: "#c62828", fontSize: "0.85rem", marginBottom: "0.5rem" }}>{error}</p>
      )}
      <GoogleMap
        center={mapCenter}
        zoom={13}
        mapContainerStyle={{ width: "100%", height: "220px", borderRadius: "8px" }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          ...mapColorOptions,
        }}
      >
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />}
      </GoogleMap>
    </div>
  );
}
