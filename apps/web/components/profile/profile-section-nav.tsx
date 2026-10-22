"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

type ProfileSection = { id: string; label: string };

// Vertical stepper that follows the scroll: the section nearest the top of the scroll area is
// "current", the ones above it read as done.
export function ProfileSectionNav({ sections }: { sections: readonly ProfileSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);
    const scroller = elements[0]?.closest(".ff-scroll") ?? null;

    function update() {
      const top = (scroller?.getBoundingClientRect().top ?? 0) + 120;
      const atBottom = scroller ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4 : false;
      const current = atBottom
        ? elements.at(-1)
        : [...elements].reverse().find((element) => element.getBoundingClientRect().top <= top) ?? elements[0];
      if (current) setActiveId(current.id);
    }

    const target = scroller ?? window;
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      target.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  const activeIndex = Math.max(0, sections.findIndex((section) => section.id === activeId));

  return (
    <nav aria-label="Profile sections" className="sticky top-2">
      <ol className="relative space-y-1">
        <span aria-hidden className="absolute bottom-4 left-[0.95rem] top-4 w-px bg-border" />
        {sections.map((section, index) => {
          const state = index < activeIndex ? "done" : index === activeIndex ? "current" : "upcoming";
          return (
            <li key={section.id}>
              <a
                aria-current={state === "current" ? "step" : undefined}
                className={`group relative flex items-center gap-3 rounded-lg py-1.5 pr-2 text-sm transition ${
                  state === "current" ? "font-semibold text-foreground" : "text-muted hover:text-foreground"
                }`}
                href={`#${section.id}`}
                onClick={() => setActiveId(section.id)}
              >
                <span
                  className={`relative z-10 flex h-[1.9rem] w-[1.9rem] flex-none items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition ${
                    state === "current"
                      ? "border-brand bg-brand text-brand-foreground"
                      : state === "done"
                        ? "border-brand/60 bg-background text-brand"
                        : "border-border-strong bg-background text-muted"
                  }`}
                >
                  {state === "done" ? <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                </span>
                {section.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
