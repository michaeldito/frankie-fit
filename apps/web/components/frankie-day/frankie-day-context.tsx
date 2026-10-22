"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { FRANKIE_ACTIONS, isFrankieNeed, type FrankieNeed } from "@frankie-fit/companion-core";
import type { FrankieMood } from "@frankie-fit/brand-core";
import type { FrankieDayPayload } from "@/lib/frankie-day";

export type FrankieReaction = { need: FrankieNeed | null; mood: FrankieMood; line: string; at: number };

type RedeemError = "already_filled" | "not_enough_biscuits" | "unknown_action" | "network";

type FrankieDayContextValue = {
  day: FrankieDayPayload | null;
  reaction: FrankieReaction | null;
  sheetOpen: boolean;
  // When opened from a specific action button, the Frankie Boy jumps straight into that scene.
  launchNeed: FrankieNeed | null;
  redeeming: FrankieNeed | null;
  openSheet: (need?: unknown) => void;
  closeSheet: () => void;
  refresh: () => Promise<void>;
  redeem: (need: FrankieNeed) => Promise<RedeemError | null>;
  bellyRub: () => void;
};

const FrankieDayContext = createContext<FrankieDayContextValue | null>(null);

async function fetchDay(): Promise<FrankieDayPayload | null> {
  const response = await fetch("/api/frankie/day", { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as { day?: FrankieDayPayload | null } | null;
  return response.ok ? (payload?.day ?? null) : null;
}

// Frankie's Day is optional chrome: if the biscuit ledger isn't reachable (preview mode, migration
// not applied) `day` stays null and every surface hides itself.
export function FrankieDayProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const [day, setDay] = useState<FrankieDayPayload | null>(null);
  const [reaction, setReaction] = useState<FrankieReaction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [launchNeed, setLaunchNeed] = useState<FrankieNeed | null>(null);
  const [redeeming, setRedeeming] = useState<FrankieNeed | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      setDay(await fetchDay());
    } catch {
      // Keep the last known day.
    }
  }, [enabled]);

  useEffect(() => {
    // Nudge notifications deep-link here with ?frankie=open. Checked even when the ledger can't
    // load, so the Frankie Boy still opens (its redeems will just be refused).
    if (new URLSearchParams(window.location.search).get("frankie") === "open") {
      queueMicrotask(() => setSheetOpen(true));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    fetchDay()
      .then((loaded) => {
        if (cancelled) return;
        setDay(loaded);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Reactions are a moment, not state: they fade back to Frankie's day mood after a few seconds.
  const showReaction = useCallback((next: Omit<FrankieReaction, "at">) => {
    const at = Date.now();
    setReaction({ ...next, at });
    window.setTimeout(() => setReaction((current) => (current?.at === at ? null : current)), 6000);
  }, []);

  const redeem = useCallback(async (need: FrankieNeed): Promise<RedeemError | null> => {
    setRedeeming(need);
    try {
      const response = await fetch("/api/frankie/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: need })
      });
      const payload = (await response.json().catch(() => null)) as {
        day?: FrankieDayPayload | null;
        error?: RedeemError | null;
      } | null;

      if (!response.ok || !payload?.day) {
        return payload?.error ?? "network";
      }

      setDay(payload.day);
      showReaction({ need, mood: FRANKIE_ACTIONS[need].moodAfter, line: FRANKIE_ACTIONS[need].reaction });
      return null;
    } catch {
      return "network";
    } finally {
      setRedeeming(null);
    }
  }, [showReaction]);

  const bellyRub = useCallback(() => {
    showReaction({ need: null, mood: "happy", line: "*happy wiggle* …again?" });
  }, [showReaction]);

  const value = useMemo(
    () => ({
      day,
      reaction,
      sheetOpen,
      launchNeed,
      redeeming,
      // Accepts a need, or anything else (e.g. a click event) to just open the menu.
      openSheet: (need?: unknown) => {
        setLaunchNeed(isFrankieNeed(need) ? need : null);
        setSheetOpen(true);
      },
      closeSheet: () => {
        setSheetOpen(false);
        setLaunchNeed(null);
      },
      refresh,
      redeem,
      bellyRub
    }),
    [day, reaction, sheetOpen, launchNeed, redeeming, refresh, redeem, bellyRub]
  );

  return <FrankieDayContext.Provider value={value}>{children}</FrankieDayContext.Provider>;
}

export function useFrankieDay() {
  const value = useContext(FrankieDayContext);
  if (!value) {
    throw new Error("useFrankieDay must be used inside FrankieDayProvider");
  }
  return value;
}
