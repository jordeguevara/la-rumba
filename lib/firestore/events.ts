import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
} from "firebase/firestore";
import { geohashForLocation, geohashQueryBounds, distanceBetween } from "geofire-common";
import { db } from "../firebase";
import { Event, EventFormData } from "../types";

const EVENTS_COLLECTION = "events";

export async function getEvents(): Promise<Event[]> {
  const q = query(
    collection(db, EVENTS_COLLECTION),
    orderBy("dateTime", "asc"),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Event));
}

export async function getEventsNearby(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<Event[]> {
  const center: [number, number] = [lat, lng];
  const bounds = geohashQueryBounds(center, radiusKm * 1000);

  const promises = bounds.map(([start, end]) => {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      orderBy("geohash"),
      where("geohash", ">=", start),
      where("geohash", "<=", end)
    );
    return getDocs(q);
  });

  const snapshots = await Promise.all(promises);
  const events: Event[] = [];

  for (const snap of snapshots) {
    for (const d of snap.docs) {
      const data = d.data() as Omit<Event, "id">;
      const distanceKm = distanceBetween([data.lat, data.lng], center);
      if (distanceKm <= radiusKm) {
        events.push({ id: d.id, ...data });
      }
    }
  }

  return events.sort(
    (a, b) =>
      (a.dateTime as Timestamp).toMillis() -
      (b.dateTime as Timestamp).toMillis()
  );
}

export async function getEventById(id: string): Promise<Event | null> {
  const snap = await getDoc(doc(db, EVENTS_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Event;
}

export async function createEvent(
  data: EventFormData,
  userId: string
): Promise<string> {
  const geohash = geohashForLocation([data.lat, data.lng]);
  const ref = await addDoc(collection(db, EVENTS_COLLECTION), {
    ...data,
    geohash,
    verified: false,
    verificationCount: 0,
    goingCount: 0,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function incrementGoingCount(eventId: string): Promise<void> {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    goingCount: increment(1),
  });
}

export async function decrementGoingCount(eventId: string): Promise<void> {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    goingCount: increment(-1),
  });
}
