"use client";

import { useEffect, useState } from "react";
import { thinkingLine } from "@frankie-fit/brand-core";
import { FrankieAvatar } from "@/components/frankie/frankie-avatar";

export function FrankieThinking({ className = "" }: { className?: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setStep((current) => current + 1), 1800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div aria-live="polite" className={`flex items-center gap-3 ${className}`} role="status">
      <FrankieAvatar className="animate-pulse" mood="focused" size={40} />
      <p className="font-frankie text-lg text-frankie">{thinkingLine(step)}</p>
    </div>
  );
}
