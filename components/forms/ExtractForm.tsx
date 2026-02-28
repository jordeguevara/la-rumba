"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { ExtractedEvent } from "@/lib/types";

interface ExtractFormProps {
  onExtracted: (data: ExtractedEvent) => void;
}

export function ExtractForm({ onExtracted }: ExtractFormProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Extraction failed");
      const data: ExtractedEvent = await res.json();
      onExtracted(data);
      setText("");
    } catch (err) {
      setError("Could not extract event details. Try filling in the form manually.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full gradient-pink flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">AI Event Extractor</p>
          <p className="text-xs text-muted-foreground">
            Paste an Instagram caption, Facebook post, or event description
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste event caption, flyer text, or post here..."
          className="min-h-[100px] bg-background/50 border-border text-foreground placeholder:text-muted-foreground resize-none text-sm"
        />

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <Button
          onClick={handleExtract}
          disabled={!text.trim() || loading}
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
              Extract Event Details
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
