import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { Comment } from "../types";

const COMMENTS_COLLECTION = "comments";

export async function getComments(eventId: string): Promise<Comment[]> {
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where("eventId", "==", eventId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
}

export async function addComment(
  eventId: string,
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  text: string
): Promise<void> {
  await addDoc(collection(db, COMMENTS_COLLECTION), {
    eventId,
    userId,
    userName,
    userAvatar: userAvatar ?? null,
    text,
    createdAt: serverTimestamp(),
  });
}
