"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import {
  MapPin,
  Clock,
  Music,
  CheckCircle2,
  Users,
  DollarSign,
  Instagram,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Event,
  DanceType,
  DANCE_TYPE_COLORS,
  DANCE_TYPE_LABELS,
  VENUE_TYPE_LABELS,
} from "@/lib/types";
import { useAuth } from "@/components/providers";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  isGoing?: boolean;
  onToggleGoing?: () => void;
  compact?: boolean;
}

function toDate(dt: Timestamp | Date): Date {
  if (dt instanceof Date) return dt;
  return (dt as Timestamp).toDate();
}

export function EventCard({ event, isGoing, onToggleGoing, compact }: EventCardProps) {
  const { user } = useAuth();
  const date = toDate(event.dateTime);
  const primaryColor = DANCE_TYPE_COLORS[event.danceTypes[0]] ?? "#8c8c99";

  return (
    <div
      className="glass rounded-2xl overflow-hidden"
      style={{ borderColor: `${primaryColor}22` }}
    >
      {/* Accent bar */}
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${primaryColor}, transparent)` }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {event.verified && (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              )}
              <h3 className="font-bold text-foreground leading-tight truncate">
                {event.name}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {event.organizerName}
            </p>
          </div>

          {/* Dance type badges */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            {event.danceTypes.slice(0, 2).map((type) => (
              <span
                key={type}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: `${DANCE_TYPE_COLORS[type]}22`,
                  color: DANCE_TYPE_COLORS[type],
                }}
              >
                {DANCE_TYPE_LABELS[type]}
              </span>
            ))}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{format(date, "EEE, MMM d · h:mm a")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{event.address.split(",")[0]}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{event.coverPrice === 0 ? "Free" : `$${event.coverPrice} cover`}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Music className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{event.liveMusic ? "Live music" : "DJ"} · {VENUE_TYPE_LABELS[event.venueType]}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2">
          {/* Going button */}
          <Button
            size="sm"
            variant={isGoing ? "default" : "outline"}
            className={cn(
              "rounded-full h-8 px-4 text-xs font-semibold flex-1",
              isGoing
                ? "gradient-pink border-0 text-white"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
            onClick={onToggleGoing}
            disabled={!user}
          >
            <Users className="w-3.5 h-3.5 mr-1.5" />
            {isGoing ? "Going ✓" : "Going"} · {event.goingCount}
          </Button>

          {/* Instagram link */}
          {event.instagramLink && (
            <a
              href={event.instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
          )}

          {/* View detail */}
          <Link
            href={`/events/${event.id}`}
            className="w-8 h-8 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
