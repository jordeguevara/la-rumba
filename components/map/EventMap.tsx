"use client";

import { useRef, useCallback } from "react";
import Map, { NavigationControl, GeolocateControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { EventMarker } from "./EventMarker";
import { Event } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const LA_CENTER = {
  longitude: -118.2437,
  latitude: 34.0522,
  zoom: 12,
};

interface EventMapProps {
  events: Event[];
  selectedEventId: string | null;
  onSelectEvent: (event: Event | null) => void;
}

export function EventMap({ events, selectedEventId, onSelectEvent }: EventMapProps) {
  const mapRef = useRef(null);

  const handleMapClick = useCallback(() => {
    onSelectEvent(null);
  }, [onSelectEvent]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card">
        <div className="text-center px-6 max-w-sm">
          <p className="text-3xl mb-4">🗺️</p>
          <h3 className="font-bold text-foreground mb-2">Map not configured</h3>
          <p className="text-muted-foreground text-sm">
            Add{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs text-primary">
              NEXT_PUBLIC_MAPBOX_TOKEN
            </code>{" "}
            to your{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">
              .env.local
            </code>{" "}
            file to enable the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      initialViewState={LA_CENTER}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      onClick={handleMapClick}
    >
      <NavigationControl position="bottom-right" />
      <GeolocateControl
        position="bottom-right"
        trackUserLocation
        showUserHeading
      />

      {events.map((event) => (
        <EventMarker
          key={event.id}
          event={event}
          isSelected={selectedEventId === event.id}
          onClick={() => onSelectEvent(event)}
        />
      ))}
    </Map>
  );
}
