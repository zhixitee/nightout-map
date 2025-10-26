"use client";

import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react";

type Coordinates = { lat: number; lng: number } | null;

interface MapSearchContextValue {
  center: Coordinates;
  setCenter: (coords: Coordinates) => void;
  radius: number;
  setRadius: (radius: number) => void;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
}

const MapSearchContext = createContext<MapSearchContextValue | undefined>(undefined);

export function MapSearchProvider({ children }: { children: ReactNode }) {
  const [center, setCenterState] = useState<Coordinates>(null);
  const [radius, setRadiusState] = useState<number>(1000);
  const [selectedTypes, setSelectedTypesState] = useState<string[]>(["bar"]);

  const setCenter = useCallback((coords: Coordinates) => {
    setCenterState(coords);
  }, []);

  const setRadius = useCallback((nextRadius: number) => {
    setRadiusState(Math.max(1000, nextRadius));
  }, []);

  const setSelectedTypes = useCallback((types: string[]) => {
    setSelectedTypesState(types);
  }, []);

  const value = useMemo(
    () => ({ center, setCenter, radius, setRadius, selectedTypes, setSelectedTypes }),
    [center, setCenter, radius, setRadius, selectedTypes, setSelectedTypes]
  );

  return <MapSearchContext.Provider value={value}>{children}</MapSearchContext.Provider>;
}

export function useMapSearch() {
  const context = useContext(MapSearchContext);
  if (!context) {
    throw new Error("useMapSearch must be used within a MapSearchProvider");
  }
  return context;
}
