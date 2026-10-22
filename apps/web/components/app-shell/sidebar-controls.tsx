"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { HoverLabel } from "@/components/app-shell/hover-label";
import {
  SIDEBAR_DEFAULT_WIDTH,
  applySidebarPreference,
  clampSidebarWidth,
  preferenceForDrag,
  readSidebarPreference
} from "@/lib/sidebar-preference";

function toggleCollapsed() {
  const current = readSidebarPreference();
  applySidebarPreference({ ...current, collapsed: !current.collapsed });
}

// Collapsed/expanded rendering is pure CSS (the `sidebar-collapsed:` variant keys off <html>), so
// these controls only write the preference; nothing here re-renders on toggle.
export function SidebarCollapseButton() {
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleCollapsed();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <button
      aria-label="Toggle sidebar (⌘B)"
      className="group relative flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-lg text-muted transition hover:bg-surface-contrast/60 hover:text-foreground"
      onClick={toggleCollapsed}
      type="button"
    >
      <PanelLeftClose aria-hidden className="h-[1.1rem] w-[1.1rem] sidebar-collapsed:hidden" strokeWidth={1.8} />
      <PanelLeftOpen aria-hidden className="hidden h-[1.1rem] w-[1.1rem] sidebar-collapsed:block" strokeWidth={1.8} />
      <HoverLabel className="hidden sidebar-collapsed:block" side="right" text="Expand sidebar (⌘B)" />
    </button>
  );
}

export function SidebarResizeHandle() {
  const dragging = useRef<{ left: number } | null>(null);

  function widthFromPointer(event: PointerEvent<HTMLDivElement>) {
    return event.clientX - (dragging.current?.left ?? 0);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const aside = event.currentTarget.parentElement;
    if (!aside) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = { left: aside.getBoundingClientRect().left };
    document.documentElement.style.cursor = "col-resize";
    document.documentElement.style.userSelect = "none";
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    // Live-apply without persisting; the final width is saved once on release.
    applySidebarPreference(preferenceForDrag(widthFromPointer(event), readSidebarPreference()), false);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    applySidebarPreference(preferenceForDrag(widthFromPointer(event), readSidebarPreference()));
    dragging.current = null;
    document.documentElement.style.cursor = "";
    document.documentElement.style.userSelect = "";
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = readSidebarPreference();
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 16 : -16;
      applySidebarPreference({ width: clampSidebarWidth(current.width + delta), collapsed: false });
    }
  }

  return (
    <div
      aria-label="Resize sidebar"
      aria-orientation="vertical"
      aria-valuemax={360}
      aria-valuemin={200}
      className="group absolute -right-1 top-0 z-30 flex h-full w-2 cursor-col-resize items-center justify-center outline-none sidebar-collapsed:hidden"
      onDoubleClick={() => applySidebarPreference({ width: SIDEBAR_DEFAULT_WIDTH, collapsed: false })}
      onKeyDown={handleKeyDown}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="separator"
      tabIndex={0}
      title="Drag to resize · double-click to reset"
    >
      <span className="h-12 w-[3px] rounded-full bg-border-strong opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
    </div>
  );
}
