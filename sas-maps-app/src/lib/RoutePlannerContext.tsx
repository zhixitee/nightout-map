"use client";

import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react";
import type { PlaceData } from "@/app/components/PlacesComponent";

export interface PlannedVenue {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface RoutePlannerContextValue {
  venues: PlannedVenue[];
  addVenue: (place: PlaceData) => void;
  removeVenue: (placeId: string) => void;
  clearVenues: () => void;
  hasVenue: (placeId: string) => boolean;
}

const RoutePlannerContext = createContext<RoutePlannerContextValue | undefined>(undefined);

export function RoutePlannerProvider({ children }: { children: ReactNode }) {
  const [venues, setVenues] = useState<PlannedVenue[]>([]);

  const addVenue = useCallback((place: PlaceData) => {
    setVenues((current) => {
      if (!place.place_id) {
        return current;
      }
      if (current.some((venue) => venue.place_id === place.place_id)) {
        return current;
      }

      const nextVenue: PlannedVenue = {
        place_id: place.place_id,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
      };

      return [...current, nextVenue];
    });
  }, []);

  const removeVenue = useCallback((placeId: string) => {
    setVenues((current) => current.filter((venue) => venue.place_id !== placeId));
  }, []);

  const clearVenues = useCallback(() => {
    setVenues([]);
  }, []);

  const hasVenue = useCallback(
    (placeId: string) => venues.some((venue) => venue.place_id === placeId),
    [venues]
  );

  const value = useMemo<RoutePlannerContextValue>(
    () => ({ venues, addVenue, removeVenue, clearVenues, hasVenue }),
    [venues, addVenue, removeVenue, clearVenues, hasVenue]
  );

  return <RoutePlannerContext.Provider value={value}>{children}</RoutePlannerContext.Provider>;
}

export function useRoutePlanner() {
  const context = useContext(RoutePlannerContext);

  if (!context) {
    throw new Error("useRoutePlanner must be used within a RoutePlannerProvider");
  }

  return context;
}
