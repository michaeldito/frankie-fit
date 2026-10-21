import { Footprints, HeartPulse, Leaf, Utensils, type LucideIcon } from "lucide-react";
import type { Pillar } from "@frankie-fit/brand-core";
import type { LoggedEntryKind } from "@/components/chat/logged-entry-format";

export const PILLAR_BY_ENTRY_KIND: Record<LoggedEntryKind, Pillar> = {
  activity: "exercise",
  diet: "diet",
  wellness: "wellness",
  lifestyle: "lifestyle"
};

// Full class strings (not template-built) so Tailwind can see them at build time.
export const PILLAR_STYLES: Record<Pillar, { icon: LucideIcon; label: string; text: string; bg: string; edge: string; soft: string }> = {
  exercise: {
    icon: Footprints,
    label: "Exercise",
    text: "text-pillar-exercise",
    bg: "bg-pillar-exercise",
    edge: "border-l-pillar-exercise",
    soft: "bg-pillar-exercise/12"
  },
  diet: {
    icon: Utensils,
    label: "Diet",
    text: "text-pillar-diet",
    bg: "bg-pillar-diet",
    edge: "border-l-pillar-diet",
    soft: "bg-pillar-diet/12"
  },
  wellness: {
    icon: HeartPulse,
    label: "Wellness",
    text: "text-pillar-wellness",
    bg: "bg-pillar-wellness",
    edge: "border-l-pillar-wellness",
    soft: "bg-pillar-wellness/12"
  },
  lifestyle: {
    icon: Leaf,
    label: "Lifestyle",
    text: "text-pillar-lifestyle",
    bg: "bg-pillar-lifestyle",
    edge: "border-l-pillar-lifestyle",
    soft: "bg-pillar-lifestyle/12"
  }
};
