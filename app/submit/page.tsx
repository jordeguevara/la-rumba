"use client";

import { useState } from "react";
import { ExtractForm } from "@/components/forms/ExtractForm";
import { SubmitForm } from "@/components/forms/SubmitForm";
import { ExtractedEvent } from "@/lib/types";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function SubmitPage() {
  const [prefill, setPrefill] = useState<ExtractedEvent | undefined>(undefined);

  return (
    <div className="min-h-screen pt-14 pb-12">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to map
          </Link>
          <h1 className="text-3xl font-black text-foreground">
            Add an Event
          </h1>
          <p className="text-muted-foreground mt-1">
            Share a Latin dance event with the community.
          </p>
        </div>

        {/* AI Extractor */}
        <div className="mb-6">
          <ExtractForm onExtracted={setPrefill} />
        </div>

        {prefill && (
          <div className="mb-4 flex items-center gap-2 text-sm text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <span>Event details pre-filled! Review and confirm below.</span>
          </div>
        )}

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-background text-xs text-muted-foreground">
              Event Details
            </span>
          </div>
        </div>

        {/* Form */}
        <SubmitForm prefill={prefill} />
      </div>
    </div>
  );
}
