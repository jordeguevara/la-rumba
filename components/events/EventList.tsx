"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventCard } from "./EventCard";
import { Event } from "@/lib/types";
import { isGoing, markGoing, unmarkGoing } from "@/lib/firestore/attendance";
import { useAuth } from "@/components/providers";

interface EventListProps {
  events: Event[];
  selectedEventId: string | null;
  onSelectEvent: (event: Event) => void;
}

export function EventList({ events, selectedEventId, onSelectEvent }: EventListProps) {
  const { user } = useAuth();
  const [goingMap, setGoingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    Promise.all(
      events.map(async (e) => ({
        id: e.id,
        going: await isGoing(e.id, user.uid),
      }))
    ).then((results) => {
      const map: Record<string, boolean> = {};
      results.forEach(({ id, going }) => (map[id] = going));
      setGoingMap(map);
    });
  }, [events, user?.uid]);

  async function handleToggleGoing(event: Event) {
    if (!user) return;
    const currently = goingMap[event.id] ?? false;
    setGoingMap((prev) => ({ ...prev, [event.id]: !currently }));
    try {
      if (currently) {
        await unmarkGoing(event.id, user.uid);
      } else {
        await markGoing(event.id, user.uid);
      }
    } catch {
      setGoingMap((prev) => ({ ...prev, [event.id]: currently }));
    }
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <p className="text-3xl mb-3">🕺</p>
        <p className="font-semibold text-foreground">No events found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or check back soon.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-3 p-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </p>
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => onSelectEvent(event)}
            className="cursor-pointer"
          >
            <EventCard
              event={event}
              isGoing={goingMap[event.id] ?? false}
              onToggleGoing={() => handleToggleGoing(event)}
            />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
