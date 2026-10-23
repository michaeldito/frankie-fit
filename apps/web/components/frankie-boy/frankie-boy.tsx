"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { FRANKIE_NEEDS, HOW_BISCUITS_WORK, type FrankieNeed } from "@frankie-fit/companion-core";
import { SceneRunner, SCREEN_HEIGHT, SCREEN_WIDTH, createWorld, stepWorld, type World } from "@/components/frankie-boy/engine";
import { BACKYARD } from "@/components/frankie-boy/maps";
import { drawWorld, hitTestActor } from "@/components/frankie-boy/renderer";
import { buildScene } from "@/components/frankie-boy/scenes";
import { useFrankieDay } from "@/components/frankie-day/frankie-day-context";

const ACTION_LABELS: Record<FrankieNeed, string> = {
  feed: "Feed",
  walk: "Run",
  play: "Play",
  snuggle: "Snuggle"
};

type Mode = { kind: "greeting" } | { kind: "menu" } | { kind: "scene"; need: FrankieNeed } | { kind: "help" };

function computeScale() {
  const byWidth = (window.innerWidth - 72) / SCREEN_WIDTH;
  const byHeight = (window.innerHeight - 330) / SCREEN_HEIGHT;
  return Math.max(1.25, Math.min(3, Math.floor(Math.min(byWidth, byHeight) * 4) / 4));
}

function createIdleWorld(): World {
  const world = createWorld("backyard");
  Object.assign(world.actors.human, { ...BACKYARD.doorstep.human });
  Object.assign(world.actors.frankie, { x: 96, y: 70 });
  return world;
}

// Frankie potters around the visible lawn between scenes.
function wander(world: World, tick: number, target: { current: { x: number; y: number } }) {
  const frankie = world.actors.frankie;
  if (tick % 150 === 0) {
    target.current = { x: 70 + ((tick * 37) % 70), y: 58 + ((tick * 13) % 30) };
  }
  const dx = target.current.x - frankie.x;
  const dy = target.current.y - frankie.y;
  if (Math.abs(dx) + Math.abs(dy) < 2) {
    frankie.anim = "idle";
    return;
  }
  frankie.anim = "walk";
  if (Math.abs(dx) >= 1) frankie.facing = dx > 0 ? "right" : "left";
  if (tick % 2 === 0) {
    frankie.x += Math.sign(dx);
    if (Math.abs(dy) >= 1 && tick % 4 === 0) frankie.y += Math.sign(dy);
  }
}

function TextBox({ text, prompt, revealRef }: { text: string; prompt: boolean; revealRef: { current: { done: boolean; finish: () => void } } }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setShown((current) => {
        if (current >= text.length) window.clearInterval(id);
        return Math.min(text.length, current + 1);
      });
    }, 28);
    return () => window.clearInterval(id);
  }, [text]);

  useEffect(() => {
    revealRef.current = { done: shown >= text.length, finish: () => setShown(text.length) };
  }, [revealRef, shown, text.length]);

  return (
    <div className="relative h-full border-[calc(var(--s)*2px)] border-[#3B2416] bg-[#F8F6EF] px-[calc(var(--s)*6px)] py-[calc(var(--s)*5px)] text-[#3B2416]">
      <p aria-hidden className="leading-[1.55]">{text.slice(0, shown)}</p>
      {shown >= text.length ? (
        <span aria-hidden className="absolute bottom-[calc(var(--s)*3px)] right-[calc(var(--s)*5px)] animate-pulse">
          {prompt ? "Ⓐ" : "▼"}
        </span>
      ) : null}
    </div>
  );
}

function FrankieBoyDevice() {
  const { day, closeSheet, redeem, refresh, bellyRub, launchNeed } = useFrankieDay();
  // A need already filled today replays for free; only the day's first play spends a biscuit.
  const sceneFor = useCallback(
    (need: FrankieNeed) => buildScene(need, { replay: day?.needs[need] === "filled" }),
    [day]
  );
  const [scale, setScale] = useState(computeScale);
  // Opened from a specific action button: start in that scene. Otherwise greet, with the menu
  // cursor on whatever Frankie wants most.
  const [mode, setMode] = useState<Mode>(() => (launchNeed ? { kind: "scene", need: launchNeed } : { kind: "greeting" }));
  const [menuIndex, setMenuIndex] = useState(() =>
    Math.max(0, FRANKIE_NEEDS.indexOf(launchNeed ?? day?.mostPressingNeed ?? "feed"))
  );
  const [sceneText, setSceneText] = useState<{ text: string; prompt: boolean } | null>(null);
  const [helpPage, setHelpPage] = useState(0);
  const [pressed, setPressed] = useState<"a" | "b" | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const idleWorld = useRef<World>(createIdleWorld());
  const runnerRef = useRef<SceneRunner | null>(launchNeed ? new SceneRunner(sceneFor(launchNeed)) : null);
  const redeemPending = useRef(false);
  const wanderTarget = useRef({ x: 96, y: 70 });
  const revealRef = useRef({ done: true, finish: () => {} });
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const onResize = () => setScale(computeScale());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const startScene = useCallback((need: FrankieNeed) => {
    runnerRef.current = new SceneRunner(sceneFor(need));
    redeemPending.current = false;
    setSceneText(null);
    setMode({ kind: "scene", need });
  }, [sceneFor]);

  const endScene = useCallback(() => {
    runnerRef.current = null;
    setSceneText(null);
    idleWorld.current = createIdleWorld();
    setMode({ kind: "greeting" });
  }, []);

  // The render loop: ~30fps, fixed-step so motion is the same on every display.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = 0;
    let tick = 0;
    let lastText = "";

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      tick += 1;

      const runner = runnerRef.current;
      const current = modeRef.current;
      let world: World;

      if (current.kind === "scene" && runner) {
        runner.tick();
        world = runner.world;
        if (runner.status === "redeeming" && !redeemPending.current) {
          redeemPending.current = true;
          void redeem(current.need).then((error) => {
            // Filled in another tab since this one loaded: play on as a free replay.
            if (error === "already_filled") {
              void refresh();
              runner.resolveRedeem(null);
            } else {
              runner.resolveRedeem(error);
            }
          });
        }
        if (runner.status === "done") {
          endScene();
          return;
        }
        const key = `${world.text ?? ""}|${world.prompt}`;
        if (key !== lastText) {
          lastText = key;
          setSceneText(world.text ? { text: world.text, prompt: world.prompt } : null);
        }
      } else {
        world = idleWorld.current;
        stepWorld(world);
        wander(world, tick, wanderTarget);
      }

      drawWorld(ctx, world, tick);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [endScene, redeem, refresh]);

  const pressA = useCallback(() => {
    if (!revealRef.current.done) {
      revealRef.current.finish();
      return;
    }
    const current = modeRef.current;
    if (current.kind === "greeting") setMode({ kind: "menu" });
    else if (current.kind === "menu") startScene(FRANKIE_NEEDS[menuIndex]);
    else if (current.kind === "help") setHelpPage((page) => (page + 1) % HOW_BISCUITS_WORK.length);
    else runnerRef.current?.pressA();
  }, [menuIndex, startScene]);

  const pressB = useCallback(() => {
    const current = modeRef.current;
    if (current.kind === "scene") endScene();
    else if (current.kind === "menu" || current.kind === "help") setMode({ kind: "greeting" });
    else closeSheet();
  }, [closeSheet, endScene]);

  const moveCursor = useCallback((delta: number) => {
    if (modeRef.current.kind === "menu") setMenuIndex((index) => (index + delta + FRANKIE_NEEDS.length) % FRANKIE_NEEDS.length);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if ([" ", "enter", "z", "a"].includes(key)) {
        event.preventDefault();
        setPressed("a");
        pressA();
      } else if (["escape", "x", "b", "backspace"].includes(key)) {
        event.preventDefault();
        setPressed("b");
        pressB();
      } else if (key === "arrowright" || key === "arrowdown") {
        event.preventDefault();
        moveCursor(key === "arrowright" ? 1 : 2);
      } else if (key === "arrowleft" || key === "arrowup") {
        event.preventDefault();
        moveCursor(key === "arrowleft" ? -1 : -2);
      }
    }
    function onKeyUp() {
      setPressed(null);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [moveCursor, pressA, pressB]);

  function handleScreenClick(event: ReactMouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = { x: ((event.clientX - bounds.left) / bounds.width) * SCREEN_WIDTH, y: ((event.clientY - bounds.top) / bounds.height) * SCREEN_HEIGHT };
    if (modeRef.current.kind !== "scene" && hitTestActor(idleWorld.current, "frankie", point)) {
      bellyRub();
      idleWorld.current.effects.push({ kind: "hearts", x: idleWorld.current.actors.frankie.x, y: idleWorld.current.actors.frankie.y, ttl: 30, total: 30 });
    }
  }

  const greeting = day?.line ?? "Hey. You came back. Obviously.";
  const textBox =
    mode.kind === "greeting"
      ? { text: greeting, prompt: false }
      : mode.kind === "scene"
        ? sceneText
        : null;

  return (
    <div
      aria-label="Frankie Boy"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm"
      onClick={closeSheet}
      role="dialog"
      style={{ ["--s" as string]: scale }}
    >
      <div
        className="relative select-none rounded-[22px_22px_72px_22px] bg-[#EFE6D4] px-[18px] pb-6 pt-4 shadow-[0_24px_60px_rgba(0,0,0,0.35),inset_0_-4px_0_rgba(0,0,0,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-semibold tracking-[0.18em] text-[#8B5E3C]">
          <span>FRANKIE&apos;S HOUSE</span>
          <button aria-label="Turn off Frankie Boy" className="cursor-pointer rounded px-1.5 hover:bg-black/5" onClick={closeSheet} type="button">
            OFF ✕
          </button>
        </div>

        {/* Screen bezel */}
        <div className="rounded-[10px_10px_36px_10px] bg-[#5B4636] px-[14px] pb-[18px] pt-[10px]">
          <div className="mb-2 flex items-center justify-between text-[9px] tracking-[0.12em] text-[#E8D3B5]">
            <span className="flex items-center gap-1">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${day ? "bg-[#FF6B6B]" : "bg-[#7A6656]"}`} /> BATTERY
            </span>
          </div>

          <div
            className="relative mx-auto overflow-hidden rounded-[3px] font-[family-name:var(--font-pixel)] text-[calc(var(--s)*7px)]"
            onClick={handleScreenClick}
            style={{ width: `calc(var(--s) * ${SCREEN_WIDTH}px)`, height: `calc(var(--s) * ${SCREEN_HEIGHT}px)` }}
          >
            <canvas
              aria-hidden
              className="block h-full w-full [image-rendering:pixelated]"
              height={SCREEN_HEIGHT}
              ref={canvasRef}
              width={SCREEN_WIDTH}
            />

            {day ? (
              <div className="absolute right-[calc(var(--s)*3px)] top-[calc(var(--s)*3px)] border-[calc(var(--s)*1px)] border-[#3B2416] bg-[#F8F6EF] px-[calc(var(--s)*3px)] py-[calc(var(--s)*1px)] text-[#3B2416]">
                🦴{day.balance}
              </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 h-[calc(var(--s)*40px)]">
              {mode.kind === "menu" ? (
                <div className="grid h-full grid-cols-2 gap-x-[calc(var(--s)*4px)] border-[calc(var(--s)*2px)] border-[#3B2416] bg-[#F8F6EF] px-[calc(var(--s)*5px)] py-[calc(var(--s)*4px)] text-[#3B2416]">
                  {FRANKIE_NEEDS.map((need, index) => {
                    const done = day?.needs[need] === "filled";
                    return (
                      <button
                        className="flex cursor-pointer items-center gap-[calc(var(--s)*2px)] text-left"
                        key={need}
                        onClick={(event) => {
                          event.stopPropagation();
                          setMenuIndex(index);
                          startScene(need);
                        }}
                        onMouseEnter={() => setMenuIndex(index)}
                        type="button"
                      >
                        <span className="w-[calc(var(--s)*6px)]">{menuIndex === index ? "▶" : ""}</span>
                        <span>{ACTION_LABELS[need]}</span>
                        <span className="ml-auto pr-[calc(var(--s)*2px)]">{done ? "FREE" : "1🦴"}</span>
                      </button>
                    );
                  })}
                </div>
              ) : mode.kind === "help" ? (
                <div className="h-full border-[calc(var(--s)*2px)] border-[#3B2416] bg-[#F8F6EF] px-[calc(var(--s)*5px)] py-[calc(var(--s)*3px)] leading-[1.45] text-[#3B2416]">
                  <p>{HOW_BISCUITS_WORK[helpPage].heading.toUpperCase()} ({helpPage + 1}/{HOW_BISCUITS_WORK.length})</p>
                  <p className="text-[calc(var(--s)*5.5px)]">{HOW_BISCUITS_WORK[helpPage].points.slice(0, 2).join(" ")}</p>
                </div>
              ) : textBox ? (
                <TextBox key={textBox.text} prompt={textBox.prompt} revealRef={revealRef} text={textBox.text} />
              ) : null}
            </div>

            <p aria-live="polite" className="sr-only">
              {mode.kind === "menu"
                ? `Choose an action: ${FRANKIE_NEEDS.map((need) => ACTION_LABELS[need]).join(", ")}. Selected ${ACTION_LABELS[FRANKIE_NEEDS[menuIndex]]}.`
                : textBox?.text ?? ""}
            </p>
          </div>
        </div>

        <div className="mb-5 mt-3 px-1 font-frankie text-[26px] leading-none text-[#8B5E3C]">
          Frankie Boy<sup className="ml-0.5 font-sans text-[10px] font-semibold">TM</sup>
        </div>

        <div className="flex items-center justify-between px-2">
          {/* D-pad: only left/right move the menu for now. */}
          <div className="relative h-[84px] w-[84px]">
            <div className="absolute left-[28px] top-0 h-[84px] w-[28px] rounded-[4px] bg-[#3A3A3A]" />
            <div className="absolute left-0 top-[28px] h-[28px] w-[84px] rounded-[4px] bg-[#3A3A3A]" />
            <button aria-label="Left" className="absolute left-0 top-[28px] h-[28px] w-[28px] cursor-pointer" onClick={() => moveCursor(-1)} type="button" />
            <button aria-label="Right" className="absolute right-0 top-[28px] h-[28px] w-[28px] cursor-pointer" onClick={() => moveCursor(1)} type="button" />
            <button aria-label="Up" className="absolute left-[28px] top-0 h-[28px] w-[28px] cursor-pointer" onClick={() => moveCursor(-2)} type="button" />
            <button aria-label="Down" className="absolute bottom-0 left-[28px] h-[28px] w-[28px] cursor-pointer" onClick={() => moveCursor(2)} type="button" />
          </div>

          <div className="flex -rotate-[24deg] items-end gap-4 pr-1">
            <div className="text-center">
              <button
                aria-label="B (back)"
                className={`h-11 w-11 cursor-pointer rounded-full bg-[#C58B4B] shadow-[0_3px_0_#8B5E3C] transition active:translate-y-[2px] active:shadow-none ${pressed === "b" ? "translate-y-[2px] shadow-none" : ""}`}
                onClick={pressB}
                type="button"
              />
              <div className="mt-1 text-[11px] font-semibold text-[#8B5E3C]">B</div>
            </div>
            <div className="-mt-4 text-center">
              <button
                aria-label="A (action)"
                className={`h-11 w-11 cursor-pointer rounded-full bg-[#3F7D4E] shadow-[0_3px_0_#2C5A37] transition active:translate-y-[2px] active:shadow-none ${pressed === "a" ? "translate-y-[2px] shadow-none" : ""}`}
                onClick={pressA}
                type="button"
              />
              <div className="mt-1 text-[11px] font-semibold text-[#8B5E3C]">A</div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-center gap-6">
          {[
            ["SELECT", () => undefined],
            ["START", () => setMode((current) => (current.kind === "help" ? { kind: "greeting" } : { kind: "help" }))]
          ].map(([label, onClick]) => (
            <div className="text-center" key={label as string}>
              <button
                aria-label={label === "START" ? "Start (how biscuits work)" : "Select"}
                className="h-[11px] w-12 -rotate-[24deg] cursor-pointer rounded-full bg-[#A8998A]"
                onClick={onClick as () => void}
                type="button"
              />
              <div className="mt-1.5 text-[10px] font-semibold tracking-[0.12em] text-[#8B5E3C]">{label as string}</div>
            </div>
          ))}
        </div>

        {/* Speaker grille */}
        <div aria-hidden className="absolute bottom-7 right-7 flex rotate-[-24deg] gap-[5px]">
          {[0, 1, 2, 3, 4].map((line) => (
            <span className="h-9 w-[4px] rounded-full bg-black/10" key={line} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Frankie's Day lives inside the Frankie Boy: same open/close state as the old sheet.
export function FrankieBoy() {
  const { sheetOpen } = useFrankieDay();
  return sheetOpen ? <FrankieBoyDevice /> : null;
}
