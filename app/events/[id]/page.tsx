"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Music,
  CheckCircle2,
  Users,
  DollarSign,
  Instagram,
  ArrowLeft,
  Send,
  Footprints,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Event, Comment, DANCE_TYPE_COLORS, DANCE_TYPE_LABELS, VENUE_TYPE_LABELS, FLOOR_TYPE_LABELS } from "@/lib/types";
import { getEventById } from "@/lib/firestore/events";
import { getComments, addComment } from "@/lib/firestore/comments";
import { isGoing, markGoing, unmarkGoing } from "@/lib/firestore/attendance";
import { useAuth } from "@/components/providers";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { cn } from "@/lib/utils";

function toDate(dt: Timestamp | Date): Date {
  if (dt instanceof Date) return dt;
  return (dt as Timestamp).toDate();
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [going, setGoing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try mock first, then Firestore
    const mock = MOCK_EVENTS.find((e) => e.id === id);
    if (mock) {
      setEvent(mock);
      setLoading(false);
    } else {
      getEventById(id).then((e) => {
        setEvent(e);
        setLoading(false);
      });
    }

    getComments(id).then(setComments).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!user || !event) return;
    isGoing(event.id, user.uid).then(setGoing);
  }, [event?.id, user?.uid]);

  async function handleToggleGoing() {
    if (!event || !user) return;
    if (going) {
      await unmarkGoing(event.id, user.uid);
      setGoing(false);
      setEvent((prev) => prev ? { ...prev, goingCount: Math.max(0, prev.goingCount - 1) } : prev);
    } else {
      await markGoing(event.id, user.uid);
      setGoing(true);
      setEvent((prev) => prev ? { ...prev, goingCount: prev.goingCount + 1 } : prev);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !user || !event) return;
    setSubmittingComment(true);
    try {
      await addComment(event.id, user.uid, user.displayName ?? "Dancer", user.photoURL ?? undefined, commentText);
      setComments((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          eventId: event.id,
          userId: user.uid,
          userName: user.displayName ?? "Dancer",
          userAvatar: user.photoURL ?? undefined,
          text: commentText,
          createdAt: new Date() as unknown as Timestamp,
        },
      ]);
      setCommentText("");
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-14 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pt-14 flex flex-col items-center justify-center gap-4">
        <p className="text-2xl">🕵️</p>
        <p className="font-bold text-foreground">Event not found</p>
        <Link href="/" className="text-sm text-primary">Back to map</Link>
      </div>
    );
  }

  const date = toDate(event.dateTime);
  const primaryColor = DANCE_TYPE_COLORS[event.danceTypes[0]] ?? "#8c8c99";

  return (
    <div className="min-h-screen pt-14 pb-12">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to map
        </Link>

        {/* Hero card */}
        <div
          className="glass rounded-3xl overflow-hidden mb-6"
          style={{ borderColor: `${primaryColor}33` }}
        >
          {/* Gradient bar */}
          <div
            className="h-1.5"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}66)` }}
          />

          <div className="p-6">
            {/* Name + verified */}
            <div className="flex items-start gap-2 mb-1">
              {event.verified && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <h1 className="text-2xl font-black text-foreground leading-tight">
                {event.name}
              </h1>
            </div>
            <p className="text-muted-foreground mb-4">{event.organizerName}</p>

            {/* Dance type pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {event.danceTypes.map((type) => (
                <span
                  key={type}
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: `${DANCE_TYPE_COLORS[type]}22`,
                    color: DANCE_TYPE_COLORS[type],
                  }}
                >
                  {DANCE_TYPE_LABELS[type]}
                </span>
              ))}
            </div>

            {/* Detail list */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-xl glass flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-foreground">{format(date, "EEEE, MMMM d · h:mm a")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-xl glass flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-foreground">{event.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-xl glass flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-foreground">
                  {event.coverPrice === 0 ? "Free entry" : `$${event.coverPrice} cover`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-xl glass flex items-center justify-center flex-shrink-0">
                  <Music className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-foreground">
                  {event.liveMusic ? "Live music" : "DJ"} · {VENUE_TYPE_LABELS[event.venueType]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-xl glass flex items-center justify-center flex-shrink-0">
                  <Footprints className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-foreground">
                  {FLOOR_TYPE_LABELS[event.floorType]} floor
                </span>
              </div>
            </div>

            {/* CTA row */}
            <div className="flex gap-2">
              <Button
                onClick={handleToggleGoing}
                disabled={!user}
                className={cn(
                  "flex-1 rounded-xl h-11 font-bold",
                  going
                    ? "gradient-pink border-0 text-white"
                    : "border-border bg-transparent text-foreground hover:bg-card"
                )}
                variant={going ? "default" : "outline"}
              >
                <Users className="w-4 h-4 mr-2" />
                {going ? `Going ✓ · ${event.goingCount}` : `Going · ${event.goingCount}`}
              </Button>

              {event.instagramLink && (
                <a
                  href={event.instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
            </div>

            {!user && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Sign in to mark yourself as going.
              </p>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-foreground">
              Comments {comments.length > 0 && `· ${comments.length}`}
            </h2>
          </div>

          {comments.length > 0 && (
            <div className="divide-y divide-border">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={comment.userAvatar} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {comment.userName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-foreground">
                        {comment.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(toDate(comment.createdAt), "MMM d")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          <div className="p-4 border-t border-border">
            {user ? (
              <form onSubmit={handleComment} className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="bg-background/50 border-border text-foreground flex-1"
                />
                <Button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  size="icon"
                  className="gradient-pink border-0 text-white rounded-xl w-10 h-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Sign in to leave a comment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
