"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { isToday, isTomorrow, isWeekend, isThisWeek } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { EventFilters, FilterState } from "@/components/events/EventFilters";
import { EventList } from "@/components/events/EventList";
import { EventSheet } from "@/components/events/EventSheet";
import { Event, DateFilter } from "@/lib/types";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { LayoutList, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const EventMap = dynamic(
  () => import("@/components/map/EventMap").then((m) => m.EventMap),
  { ssr: false, loading: () => <MapPlaceholder /> }
);

function MapPlaceholder() {
  return (
    <div className="w-full h-full bg-card animate-pulse flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading map...</p>
    </div>
  );
}

function toDate(dt: Timestamp | Date): Date {
  if (dt instanceof Date) return dt;
  return (dt as Timestamp).toDate();
}

function matchesDateFilter(event: Event, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const date = toDate(event.dateTime);
  if (filter === "tonight") return isToday(date);
  if (filter === "tomorrow") return isTomorrow(date);
  if (filter === "weekend") return isWeekend(date) && isThisWeek(date);
  return true;
}

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    danceTypes: [],
    dateFilter: "all",
    verifiedOnly: false,
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter((event) => {
      if (filters.danceTypes.length > 0) {
        const hasMatch = event.danceTypes.some((t) =>
          filters.danceTypes.includes(t)
        );
        if (!hasMatch) return false;
      }
      if (filters.verifiedOnly && !event.verified) return false;
      if (!matchesDateFilter(event, filters.dateFilter)) return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="fixed inset-0 top-14 flex flex-col md:flex-row">

      {/* ── DESKTOP sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[360px] shrink-0 border-r border-border bg-background overflow-hidden">
        <div className="shrink-0 px-4 py-3 border-b border-border">
          <EventFilters filters={filters} onChange={setFilters} />
        </div>
        {/* flex-1 + min-h-0 lets ScrollArea fill and scroll correctly */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <EventList
            events={filteredEvents}
            selectedEventId={selectedEvent?.id ?? null}
            onSelectEvent={setSelectedEvent}
          />
        </div>
      </aside>

      {/* ── MAP ─────────────────────────────────────────────── */}
      <div className="relative flex-1 h-full">
        <EventMap
          events={filteredEvents}
          selectedEventId={selectedEvent?.id ?? null}
          onSelectEvent={(e) => {
            setSelectedEvent(e);
            setListOpen(false);
          }}
        />

        {/* MOBILE: floating filter bar over the map */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-10 px-3 pt-3 pointer-events-none">
          <div className="glass rounded-2xl px-3 py-2 pointer-events-auto">
            <EventFilters filters={filters} onChange={setFilters} />
          </div>
        </div>

        {/* MOBILE: slide-up list drawer from bottom */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-20">
          {listOpen && (
            <div
              className="fixed inset-0 bg-black/40"
              style={{ zIndex: -1 }}
              onClick={() => setListOpen(false)}
            />
          )}

          <div
            className={cn(
              "bg-background border-t border-border rounded-t-3xl transition-[max-height] duration-300 ease-out overflow-hidden",
              listOpen ? "max-h-[72vh]" : "max-h-16"
            )}
          >
            {/* Handle row */}
            <button
              onClick={() => setListOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 h-16 shrink-0"
            >
              <div className="flex items-center gap-2">
                <LayoutList className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-foreground text-sm">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {listOpen ? "Close" : "See all"}
                </span>
                {listOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* List fills remaining drawer height */}
            <div className="h-[calc(72vh-4rem)] overflow-hidden">
              <EventList
                events={filteredEvents}
                selectedEventId={selectedEvent?.id ?? null}
                onSelectEvent={(e) => {
                  setSelectedEvent(e);
                  setListOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE: event detail bottom sheet (tap a pin) */}
      <div className="md:hidden">
        <EventSheet
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      </div>
    </div>
  );
}
