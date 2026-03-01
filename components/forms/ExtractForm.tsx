"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2, Sparkles, X } from "lucide-react";
import { ExtractedEvent } from "@/lib/types";

interface ExtractFormProps {
  onExtracted: (data: ExtractedEvent) => void;
}

type Mode = "text" | "photo";

const INSTAGRAM_RE = /instagram\.com\/(p|reel|tv)\//i;

function isInstagramUrl(val: string) {
  try {
    return INSTAGRAM_RE.test(val);
  } catch {
    return false;
  }
}

export function ExtractForm({ onExtracted }: ExtractFormProps) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUrl = isInstagramUrl(text.trim());

  function handleFileChange(file: File | null) {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setError(null);
  }

  function clearPhoto() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function clearAll() {
    clearPhoto();
    setPhotoCaption("");
  }

  async function handleExtract() {
    setLoading(true);
    setError(null);

    try {
      let body: Record<string, string>;

      if (mode === "photo" && imageFile && imagePreview) {
        const base64 = imagePreview.split(",")[1];
        body = { imageBase64: base64, mimeType: imageFile.type };
        if (photoCaption.trim()) body.caption = photoCaption.trim();
      } else if (isUrl) {
        body = { url: text.trim() };
      } else {
        body = { text: text.trim() };
      }

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Extraction failed");
      }

      onExtracted(data as ExtractedEvent);
      setText("");
      clearAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not extract event details. Try filling in the form manually.");
    } finally {
      setLoading(false);
    }
  }

  const canExtract = mode === "photo" ? !!imageFile : !!text.trim();

  return (
    <div className="glass rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full gradient-pink flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">AI Event Extractor</p>
          <p className="text-xs text-muted-foreground">
            Paste a link or caption, or upload a flyer photo
          </p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-background/50 rounded-xl p-1 mb-4 gap-1">
        {(["text", "photo"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); }}
            className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
              mode === m
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "text" ? "Caption / Link" : "Upload Photo"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {mode === "text" ? (
          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(null); }}
              placeholder="Paste Instagram link, caption, or flyer text..."
              className="min-h-25 bg-background/50 border-border text-foreground placeholder:text-muted-foreground resize-none text-sm"
            />
            {isUrl && (
              <span className="absolute bottom-2 right-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                Instagram link detected
              </span>
            )}
          </div>
        ) : (
          <div>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-48 object-cover"
                />
                <button
                  onClick={clearPhoto}
                  className="absolute top-2 right-2 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center hover:bg-background"
                >
                  <X className="w-3.5 h-3.5 text-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-background/30 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Tap to upload flyer or Instagram screenshot
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            {imageFile && (
              <Textarea
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="Paste the Instagram caption here (optional but helps)"
                className="mt-3 min-h-16 bg-background/50 border-border text-foreground placeholder:text-muted-foreground resize-none text-sm"
              />
            )}
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button
          onClick={handleExtract}
          disabled={!canExtract || loading}
          className="w-full gradient-pink border-0 text-white font-semibold rounded-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {mode === "photo"
                ? "Analyze Photo"
                : isUrl
                ? "Fetch from Instagram"
                : "Extract Event Details"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
