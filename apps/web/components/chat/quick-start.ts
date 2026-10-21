export type QuickStartOption = {
  label: string;
  template: string;
};

export type BracketBlank = {
  start: number;
  end: number;
};

export const QUICK_START_OPTIONS: QuickStartOption[] = [
  {
    label: "Exercise",
    template: "Today I did [fill in] for [fill in] minutes at [light/moderate/hard] intensity"
  },
  {
    label: "Diet",
    template: "For [breakfast/lunch/dinner/snack], I ate [fill in]"
  },
  {
    label: "Wellness",
    template:
      "Checking in — energy: [1-5], stress: [1-5], soreness: [1-5], mood: [1-5], motivation: [1-5]"
  },
  {
    label: "Lifestyle",
    template: "Today I [fill in], and it made me feel [fill in]"
  }
];

export function findBracketBlanks(value: string): BracketBlank[] {
  return Array.from(value.matchAll(/\[[^\]]+\]/g)).map((match) => ({
    start: match.index!,
    end: match.index! + match[0].length
  }));
}

export function findNextBlank(blanks: BracketBlank[], fromIndex: number): BracketBlank | undefined {
  return blanks.find((blank) => blank.start >= fromIndex);
}

export function findPreviousBlank(blanks: BracketBlank[], beforeIndex: number): BracketBlank | undefined {
  return [...blanks].reverse().find((blank) => blank.end <= beforeIndex);
}

export type QuickStartSegment =
  | { kind: "text"; text: string }
  | { kind: "input"; id: number; placeholder: string; numeric: boolean }
  | { kind: "choice"; id: number; options: string[] };

// Infers a friendlier placeholder and keyboard for a "[fill in]" blank from the words around it.
function describeFreeBlank(before: string, after: string): { placeholder: string; numeric: boolean } {
  if (/^\s*minutes\b/i.test(after)) return { placeholder: "30", numeric: true };
  if (/\bI did\s*$/i.test(before)) return { placeholder: "what you did", numeric: false };
  if (/\bI ate\s*$/i.test(before)) return { placeholder: "what you ate", numeric: false };
  if (/\bfeel\s*$/i.test(before)) return { placeholder: "how you felt", numeric: false };
  return { placeholder: "fill in", numeric: false };
}

function choiceOptions(label: string): string[] | null {
  const range = /^(\d+)-(\d+)$/.exec(label);
  if (range) {
    const [low, high] = [Number(range[1]), Number(range[2])];
    return high > low && high - low <= 10
      ? Array.from({ length: high - low + 1 }, (_value, index) => String(low + index))
      : null;
  }
  return label.includes("/") ? label.split("/").map((option) => option.trim()).filter(Boolean) : null;
}

/**
 * Splits a quick-start template into text, free-text blanks, and tap-to-pick choices so touch
 * clients can render a fill-in form instead of relying on Tab to jump between "[fill in]"s.
 */
export function parseQuickStartTemplate(template: string): QuickStartSegment[] {
  const segments: QuickStartSegment[] = [];
  let cursor = 0;
  let id = 0;

  for (const blank of findBracketBlanks(template)) {
    if (blank.start > cursor) {
      segments.push({ kind: "text", text: template.slice(cursor, blank.start) });
    }

    const label = template.slice(blank.start + 1, blank.end - 1).trim();
    const options = choiceOptions(label);

    if (options) {
      segments.push({ kind: "choice", id, options });
    } else {
      segments.push({
        kind: "input",
        id,
        ...describeFreeBlank(template.slice(0, blank.start), template.slice(blank.end))
      });
    }

    id += 1;
    cursor = blank.end;
  }

  if (cursor < template.length) {
    segments.push({ kind: "text", text: template.slice(cursor) });
  }

  return segments;
}

/** Joins the filled-in template back into a sentence; null until every blank has a value. */
export function composeQuickStart(segments: QuickStartSegment[], values: Record<number, string>): string | null {
  let message = "";

  for (const segment of segments) {
    if (segment.kind === "text") {
      message += segment.text;
      continue;
    }

    const value = values[segment.id]?.trim();
    if (!value) return null;
    message += value;
  }

  return message;
}
