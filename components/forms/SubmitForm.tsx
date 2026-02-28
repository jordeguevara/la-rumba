"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseISO } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, CheckCircle2 } from "lucide-react";
import {
  DanceType,
  VenueType,
  FloorType,
  ExtractedEvent,
  DANCE_TYPE_COLORS,
  DANCE_TYPE_LABELS,
  VENUE_TYPE_LABELS,
  FLOOR_TYPE_LABELS,
  EventFormData,
} from "@/lib/types";
import { createEvent } from "@/lib/firestore/events";
import { useAuth } from "@/components/providers";
import { cn } from "@/lib/utils";

const ALL_DANCE_TYPES: DanceType[] = ["salsa", "bachata", "cumbia", "merengue"];

interface SubmitFormProps {
  prefill?: ExtractedEvent;
}

export function SubmitForm({ prefill }: SubmitFormProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(prefill?.name ?? "");
  const [address, setAddress] = useState(prefill?.address ?? "");
  const [dateTime, setDateTime] = useState(prefill?.dateTime ?? "");
  const [danceTypes, setDanceTypes] = useState<DanceType[]>(prefill?.danceTypes ?? []);
  const [venueType, setVenueType] = useState<VenueType>(prefill?.venueType ?? "club");
  const [floorType, setFloorType] = useState<FloorType>(prefill?.floorType ?? "wood");
  const [liveMusic, setLiveMusic] = useState(prefill?.liveMusic ?? false);
  const [coverPrice, setCoverPrice] = useState(String(prefill?.coverPrice ?? "0"));
  const [organizerName, setOrganizerName] = useState(prefill?.organizerName ?? "");
  const [instagramLink, setInstagramLink] = useState(prefill?.instagramLink ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function toggleDanceType(type: DanceType) {
    setDanceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function geocodeAddress(addr: string): Promise<{ lat: number; lng: number } | null> {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return { lat: 34.0522, lng: -118.2437 }; // fallback LA
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${token}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features?.[0]) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("You must be signed in to submit an event.");
      return;
    }
    if (danceTypes.length === 0) {
      setError("Select at least one dance type.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const coords = await geocodeAddress(address);
      if (!coords) throw new Error("Could not geocode address. Please check it.");

      const parsed = dateTime ? parseISO(dateTime) : new Date();

      const data: EventFormData = {
        name,
        address,
        lat: coords.lat,
        lng: coords.lng,
        dateTime: Timestamp.fromDate(parsed),
        danceTypes,
        venueType,
        floorType,
        liveMusic,
        coverPrice: Number(coverPrice) || 0,
        organizerName,
        instagramLink,
      };

      const id = await createEvent(data, user.uid);
      setSuccess(true);
      setTimeout(() => router.push(`/events/${id}`), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-full gradient-pink flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Event Submitted!</h2>
        <p className="text-muted-foreground text-sm text-center">
          Your event is live. Redirecting...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label className="text-foreground text-sm font-semibold">Event Name *</Label>
        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Salsa Saturdays at Echoes"
          className="bg-card border-border text-foreground"
        />
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label className="text-foreground text-sm font-semibold">
          <MapPin className="inline w-3.5 h-3.5 mr-1" />
          Address *
        </Label>
        <Input
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="2314 Sunset Blvd, Los Angeles, CA"
          className="bg-card border-border text-foreground"
        />
      </div>

      {/* Date & Time */}
      <div className="space-y-1.5">
        <Label className="text-foreground text-sm font-semibold">Date & Time *</Label>
        <Input
          required
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="bg-card border-border text-foreground"
        />
      </div>

      {/* Dance Types */}
      <div className="space-y-2">
        <Label className="text-foreground text-sm font-semibold">Dance Types *</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_DANCE_TYPES.map((type) => {
            const active = danceTypes.includes(type);
            const color = DANCE_TYPE_COLORS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleDanceType(type)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold border transition-all",
                  active ? "text-white" : "text-muted-foreground border-border hover:text-foreground"
                )}
                style={active ? { background: color, borderColor: color } : {}}
              >
                {DANCE_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Venue & Floor */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm font-semibold">Venue Type</Label>
          <Select value={venueType} onValueChange={(v) => setVenueType(v as VenueType)}>
            <SelectTrigger className="bg-card border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {(Object.keys(VENUE_TYPE_LABELS) as VenueType[]).map((v) => (
                <SelectItem key={v} value={v} className="text-foreground">
                  {VENUE_TYPE_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm font-semibold">Floor Type</Label>
          <Select value={floorType} onValueChange={(v) => setFloorType(v as FloorType)}>
            <SelectTrigger className="bg-card border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {(Object.keys(FLOOR_TYPE_LABELS) as FloorType[]).map((v) => (
                <SelectItem key={v} value={v} className="text-foreground">
                  {FLOOR_TYPE_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Live Music & Cover */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm font-semibold">Live Music?</Label>
          <div className="flex gap-2">
            {["Yes", "No"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setLiveMusic(opt === "Yes")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-semibold border transition-all",
                  (opt === "Yes" ? liveMusic : !liveMusic)
                    ? "gradient-pink border-0 text-white"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground text-sm font-semibold">Cover Price ($)</Label>
          <Input
            type="number"
            min="0"
            value={coverPrice}
            onChange={(e) => setCoverPrice(e.target.value)}
            placeholder="0"
            className="bg-card border-border text-foreground"
          />
        </div>
      </div>

      {/* Organizer */}
      <div className="space-y-1.5">
        <Label className="text-foreground text-sm font-semibold">Organizer Name</Label>
        <Input
          value={organizerName}
          onChange={(e) => setOrganizerName(e.target.value)}
          placeholder="Your name or organization"
          className="bg-card border-border text-foreground"
        />
      </div>

      {/* Instagram */}
      <div className="space-y-1.5">
        <Label className="text-foreground text-sm font-semibold">Instagram Link</Label>
        <Input
          value={instagramLink}
          onChange={(e) => setInstagramLink(e.target.value)}
          placeholder="https://instagram.com/..."
          className="bg-card border-border text-foreground"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading || !user}
        className="w-full gradient-pink border-0 text-white font-bold h-12 rounded-xl text-base"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Event"
        )}
      </Button>

      {!user && (
        <p className="text-xs text-muted-foreground text-center">
          You need to sign in to submit an event.
        </p>
      )}
    </form>
  );
}
