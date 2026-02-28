import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { incrementGoingCount, decrementGoingCount } from "./events";

const ATTENDANCE_COLLECTION = "attendance";

function attendanceId(eventId: string, userId: string): string {
  return `${eventId}_${userId}`;
}

export async function isGoing(eventId: string, userId: string): Promise<boolean> {
  const snap = await getDoc(
    doc(db, ATTENDANCE_COLLECTION, attendanceId(eventId, userId))
  );
  return snap.exists();
}

export async function markGoing(eventId: string, userId: string): Promise<void> {
  await setDoc(doc(db, ATTENDANCE_COLLECTION, attendanceId(eventId, userId)), {
    eventId,
    userId,
    createdAt: serverTimestamp(),
  });
  await incrementGoingCount(eventId);
}

export async function unmarkGoing(eventId: string, userId: string): Promise<void> {
  await deleteDoc(
    doc(db, ATTENDANCE_COLLECTION, attendanceId(eventId, userId))
  );
  await decrementGoingCount(eventId);
}
