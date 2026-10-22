export type HoverLabelAlign = "start" | "center" | "end";

const PLACEMENT = {
  top: {
    start: "bottom-full left-0 mb-2",
    center: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    end: "bottom-full right-0 mb-2"
  },
  right: {
    start: "left-full top-1/2 ml-3 -translate-y-1/2",
    center: "left-full top-1/2 ml-3 -translate-y-1/2",
    end: "left-full top-1/2 ml-3 -translate-y-1/2"
  }
} as const;

// Styled hover/focus label; the native title tooltip is slow and unstyled. The nearest
// `group relative` ancestor anchors and reveals it.
export function HoverLabel({
  text,
  align = "center",
  side = "top",
  className = ""
}: {
  text: string;
  align?: HoverLabelAlign;
  side?: "top" | "right";
  className?: string;
}) {
  return (
    <span
      className={`pointer-events-none absolute ${PLACEMENT[side][align]} z-50 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-[var(--shadow-card)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 ${className}`}
      role="tooltip"
    >
      {text}
    </span>
  );
}
