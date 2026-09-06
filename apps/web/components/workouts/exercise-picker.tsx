"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { findExercises, slugifyExerciseName } from "@frankie-fit/workout-core";

export type SelectedExercise = { slug: string; name: string };

type ExercisePickerProps = {
  onSelect: (exercise: SelectedExercise) => void;
  placeholder?: string;
};

export function ExercisePicker({ onSelect, placeholder = "Search an exercise…" }: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const matches = query.trim() ? findExercises(query) : [];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }
  }, [open]);

  function selectEntry(entry: SelectedExercise) {
    onSelect(entry);
    setQuery("");
    setOpen(false);
    setHighlightedIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.min(index + 1, matches.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const entry = matches[highlightedIndex];

      if (entry) {
        selectEntry({ slug: entry.slug, name: entry.name });
      } else if (query.trim()) {
        selectEntry({ slug: slugifyExerciseName(query), name: query.trim() });
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        className="ff-input"
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlightedIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        type="text"
        value={query}
      />
      {open && query.trim() ? (
        <div className="ff-card absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto p-2">
          {matches.map((entry, index) => (
            <button
              className={`block w-full cursor-pointer rounded-[1rem] px-3 py-2.5 text-left text-sm ${
                index === highlightedIndex
                  ? "bg-[color:color-mix(in_srgb,var(--surface-contrast)_72%,black_28%)]"
                  : ""
              }`}
              key={entry.slug}
              onClick={() => selectEntry({ slug: entry.slug, name: entry.name })}
              onMouseEnter={() => setHighlightedIndex(index)}
              type="button"
            >
              <span className="font-medium">{entry.name}</span>
              <span className="ml-2 text-xs text-[var(--muted)]">{entry.equipment}</span>
            </button>
          ))}
          <button
            className={`mt-1 block w-full cursor-pointer rounded-[1rem] px-3 py-2.5 text-left text-sm text-[var(--muted)] hover:text-[var(--foreground)] ${
              highlightedIndex === matches.length
                ? "bg-[color:color-mix(in_srgb,var(--surface-contrast)_72%,black_28%)]"
                : ""
            }`}
            onClick={() => selectEntry({ slug: slugifyExerciseName(query), name: query.trim() })}
            onMouseEnter={() => setHighlightedIndex(matches.length)}
            type="button"
          >
            Log &quot;{query.trim()}&quot; as a custom exercise
          </button>
        </div>
      ) : null}
    </div>
  );
}
