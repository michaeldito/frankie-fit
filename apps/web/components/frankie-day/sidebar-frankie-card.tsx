"use client";

import Image from "next/image";
import { FRANKIE_MOOD_ART, FRANKIE_PORTRAIT } from "@/components/frankie/frankie-art";
import { useFrankieDay } from "@/components/frankie-day/frankie-day-context";
import { BiscuitJar, NeedsStrip } from "@/components/frankie-day/needs";

export function SidebarFrankieCard({ fallbackLine }: { fallbackLine: string }) {
  const { day, reaction, openSheet } = useFrankieDay();
  const mood = reaction?.mood ?? day?.mood;
  const line = reaction?.line ?? day?.line ?? fallbackLine;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-3 pb-0 pt-3">
      <button
        aria-label="Open Frankie's Day"
        className="block w-full cursor-pointer text-left disabled:cursor-default"
        disabled={!day}
        onClick={openSheet}
        type="button"
      >
        <p className="relative z-10 max-w-[8.5rem] font-frankie text-lg leading-tight text-frankie">&ldquo;{line}&rdquo;</p>
        <Image
          alt="Frankie"
          className="ff-pop relative -mb-1 ml-auto -mt-6 h-24 w-24 object-contain object-bottom"
          height={96}
          key={mood ?? "portrait"}
          src={mood ? FRANKIE_MOOD_ART[mood] : FRANKIE_PORTRAIT}
          width={96}
        />
      </button>
      {day ? (
        <div className="-mx-3 flex items-center justify-between gap-2 border-t border-border px-3 py-2">
          <NeedsStrip size="sm" />
          <BiscuitJar />
        </div>
      ) : null}
    </div>
  );
}
