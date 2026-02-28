"use client";

import { Marker } from "react-map-gl/mapbox";
import { Event, DanceType, DANCE_TYPE_COLORS } from "@/lib/types";

interface EventMarkerProps {
  event: Event;
  isSelected: boolean;
  onClick: () => void;
}

function getPrimaryColor(danceTypes: DanceType[]): string {
  if (danceTypes.length === 0) return "#8c8c99";
  return DANCE_TYPE_COLORS[danceTypes[0]];
}

export function EventMarker({ event, isSelected, onClick }: EventMarkerProps) {
  const color = getPrimaryColor(event.danceTypes);

  return (
    <Marker
      latitude={event.lat}
      longitude={event.lng}
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick();
      }}
      anchor="bottom"
    >
      <div className="relative cursor-pointer" style={{ transform: isSelected ? "scale(1.25)" : "scale(1)", transition: "transform 0.15s ease" }}>
        {/* Pin body */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2"
          style={{
            background: isSelected
              ? color
              : `${color}22`,
            borderColor: color,
            boxShadow: isSelected
              ? `0 0 0 4px ${color}33, 0 4px 20px ${color}66`
              : `0 2px 8px rgba(0,0,0,0.5)`,
          }}
        >
          <span className="text-base" role="img" aria-label={event.danceTypes[0]}>
            {getDanceEmoji(event.danceTypes[0])}
          </span>
        </div>

        {/* Verified badge */}
        {event.verified && (
          <div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: "#32D74B", fontSize: 9 }}
          >
            ✓
          </div>
        )}

        {/* Going count bubble */}
        {event.goingCount > 0 && (
          <div
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 whitespace-nowrap"
            style={{ background: color, fontSize: 9 }}
          >
            {event.goingCount > 99 ? "99+" : event.goingCount}
          </div>
        )}
      </div>
    </Marker>
  );
}

function getDanceEmoji(type: DanceType | undefined): string {
  switch (type) {
    case "salsa": return "🌶️";
    case "bachata": return "🌹";
    case "cumbia": return "🪗";
    case "merengue": return "🎉";
    default: return "💃";
  }
}
