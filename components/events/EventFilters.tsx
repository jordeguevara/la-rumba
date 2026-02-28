"use client";

import { DanceType, DateFilter, DANCE_TYPE_COLORS, DANCE_TYPE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  danceTypes: DanceType[];
  dateFilter: DateFilter;
  verifiedOnly: boolean;
}

interface EventFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const ALL_DANCE_TYPES: DanceType[] = ["salsa", "bachata", "cumbia", "merengue"];
const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tonight", label: "Tonight" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "weekend", label: "Weekend" },
];

export function EventFilters({ filters, onChange }: EventFiltersProps) {
  function toggleDanceType(type: DanceType) {
    const next = filters.danceTypes.includes(type)
      ? filters.danceTypes.filter((t) => t !== type)
      : [...filters.danceTypes, type];
    onChange({ ...filters, danceTypes: next });
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {/* Dance type pills */}
      {ALL_DANCE_TYPES.map((type) => {
        const active = filters.danceTypes.includes(type);
        const color = DANCE_TYPE_COLORS[type];
        return (
          <button
            key={type}
            onClick={() => toggleDanceType(type)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all",
              active
                ? "text-white"
                : "text-muted-foreground bg-card/80 hover:text-foreground"
            )}
            style={
              active
                ? { background: color, borderColor: color }
                : { borderColor: "rgba(255,255,255,0.1)" }
            }
          >
            {DANCE_TYPE_LABELS[type]}
          </button>
        );
      })}

      {/* Divider */}
      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Date filter */}
      {DATE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange({ ...filters, dateFilter: opt.value })}
          className={cn(
            "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all",
            filters.dateFilter === opt.value
              ? "bg-foreground text-background border-foreground"
              : "text-muted-foreground bg-card/80 hover:text-foreground border-border"
          )}
        >
          {opt.value === "tonight" && <Flame className="inline w-3 h-3 mr-1" />}
          {opt.label}
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Verified only */}
      <button
        onClick={() => onChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
        className={cn(
          "flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all",
          filters.verifiedOnly
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
            : "text-muted-foreground bg-card/80 hover:text-foreground border-border"
        )}
      >
        <CheckCircle2 className="w-3 h-3" />
        Verified
      </button>
    </div>
  );
}
