"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { EventCard } from "./EventCard";
import { Event } from "@/lib/types";
import { isGoing, markGoing, unmarkGoing } from "@/lib/firestore/attendance";
import { useAuth } from "@/components/providers";

interface EventSheetProps {
  event: Event | null;
  onClose: () => void;
}

export function EventSheet({ event, onClose }: EventSheetProps) {
  const { user } = useAuth();
  const [going, setGoing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!event || !user) {
      setGoing(false);
      return;
    }
    isGoing(event.id, user.uid).then(setGoing);
  }, [event?.id, user?.uid]);

  async function handleToggleGoing() {
    if (!event || !user || loading) return;
    setLoading(true);
    try {
      if (going) {
        await unmarkGoing(event.id, user.uid);
        setGoing(false);
      } else {
        await markGoing(event.id, user.uid);
        setGoing(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={!!event} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-background border-t border-border rounded-t-3xl px-4 pb-10 pt-4 z-30"
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-5" />
        {event && (
          <EventCard
            event={event}
            isGoing={going}
            onToggleGoing={handleToggleGoing}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
