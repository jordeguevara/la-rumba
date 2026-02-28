import { Timestamp } from "firebase/firestore";

export type DanceType = "salsa" | "bachata" | "cumbia" | "merengue";
export type VenueType = "club" | "restaurant" | "house_party" | "outdoor";
export type FloorType = "wood" | "tile" | "concrete" | "outdoor";
export type DateFilter = "tonight" | "tomorrow" | "weekend" | "all";

export interface Event {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  geohash: string;
  dateTime: Timestamp | Date;
  danceTypes: DanceType[];
  venueType: VenueType;
  floorType: FloorType;
  liveMusic: boolean;
  coverPrice: number;
  organizerName: string;
  instagramLink: string;
  verified: boolean;
  verificationCount: number;
  createdBy: string;
  createdAt: Timestamp | Date;
  goingCount: number;
}

export type EventFormData = Omit<Event, "id" | "geohash" | "createdAt" | "verificationCount" | "goingCount" | "verified" | "createdBy">;

export interface Attendance {
  eventId: string;
  userId: string;
  createdAt: Timestamp | Date;
}

export interface Comment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Timestamp | Date;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ExtractedEvent {
  name?: string;
  address?: string;
  dateTime?: string;
  danceTypes?: DanceType[];
  venueType?: VenueType;
  floorType?: FloorType;
  liveMusic?: boolean;
  coverPrice?: number;
  organizerName?: string;
  instagramLink?: string;
}

export const DANCE_TYPE_COLORS: Record<DanceType, string> = {
  salsa: "#FF4444",
  bachata: "#FF2D78",
  cumbia: "#FF9500",
  merengue: "#AF52DE",
};

export const DANCE_TYPE_LABELS: Record<DanceType, string> = {
  salsa: "Salsa",
  bachata: "Bachata",
  cumbia: "Cumbia",
  merengue: "Merengue",
};

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  club: "Club",
  restaurant: "Restaurant",
  house_party: "House Party",
  outdoor: "Outdoor",
};

export const FLOOR_TYPE_LABELS: Record<FloorType, string> = {
  wood: "Wood",
  tile: "Tile",
  concrete: "Concrete",
  outdoor: "Outdoor",
};
