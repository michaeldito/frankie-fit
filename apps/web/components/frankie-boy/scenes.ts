import { FRANKIE_ACTIONS, type FrankieNeed } from "@frankie-fit/companion-core";
import type { Point, Step } from "@/components/frankie-boy/engine";
import { BACKYARD, INTERIOR } from "@/components/frankie-boy/maps";

// The day's first play of a scene starts with a biscuit toss: he crunches it, and that's the moment
// it's actually spent (the redeem step). Backing out before then costs nothing.
function biscuitToss(human: Point, frankie: Point): Step[] {
  return [
    { kind: "prompt", text: "Toss Frankie a biscuit" },
    { kind: "set", actor: "biscuit", patch: { x: human.x + 6, y: human.y + 4, visible: true } },
    { kind: "move", actor: "biscuit", to: { x: frankie.x + 12, y: frankie.y + 2 }, speed: 3, arc: 12 },
    { kind: "set", actor: "biscuit", patch: { visible: false } },
    { kind: "effect", effect: "crumbs", at: "frankie" },
    { kind: "anim", actor: "frankie", anim: "eat", frames: 24 },
    { kind: "redeem" }
  ];
}

// Replays are free: a pat instead of a biscuit, and nothing is redeemed. Frankie trots up to the
// human's hand first, so the petting arm lands on his head.
const freePat: Step[] = [
  { kind: "prompt", text: "Again? Give Frankie a pat" },
  { kind: "move", actor: "frankie", to: { x: INTERIOR.entry.frankie.x - 6, y: INTERIOR.entry.frankie.y }, speed: 1 },
  { kind: "set", actor: "human", patch: { anim: "pet" } },
  { kind: "effect", effect: "hearts", at: "frankie" },
  { kind: "wait", frames: 30 },
  { kind: "set", actor: "human", patch: { anim: "idle" } }
];

const insideAtEntry: Step = {
  kind: "map",
  map: "interior",
  place: { human: INTERIOR.entry.human, frankie: INTERIOR.entry.frankie, ball: { x: 0, y: 0, visible: false } }
};

const outsideAtDoor: Step = {
  kind: "map",
  map: "backyard",
  place: { human: BACKYARD.doorstep.human, frankie: BACKYARD.doorstep.frankie, ball: { x: 0, y: 0, visible: false } }
};

function reaction(need: FrankieNeed): Step {
  return { kind: "say", text: FRANKIE_ACTIONS[need].reaction };
}

const RUN_LAPS: Point[] = [
  { x: 120, y: 70 },
  { x: 260, y: 82 },
  { x: 390, y: 56 },
  { x: 452, y: 78 },
  { x: 330, y: 92 },
  { x: 190, y: 74 },
  { x: 260, y: 58 },
  { x: 120, y: 80 },
  { x: 66, y: 56 }
];

// Each throw goes farther down the yard, clear of the tree and shrubs.
const FETCH_THROWS: Point[] = [
  { x: 230, y: 76 },
  { x: 340, y: 60 },
  { x: 430, y: 72 }
];

const FETCH_SPOT: Point = { x: BACKYARD.lawn.x + 18, y: BACKYARD.lawn.y + 4 };

// Everything after the opening; buildScene adds the biscuit toss or the free pat in front.
const SCENE_BODIES: Record<FrankieNeed, Step[]> = {
  feed: [
    { kind: "move", actor: "human", to: INTERIOR.atCounter, speed: 1.5 },
    { kind: "prompt", text: "Grab food off the counter" },
    { kind: "prop", prop: "foods", value: "taken" },
    { kind: "prop", prop: "board", value: "whole" },
    { kind: "prompt", text: "Chop" },
    { kind: "effect", effect: "chop", at: { x: INTERIOR.board.x + 2, y: INTERIOR.board.y - 4 }, frames: 12 },
    { kind: "prop", prop: "board", value: "chop1" },
    { kind: "prompt", text: "Chop" },
    { kind: "effect", effect: "chop", at: { x: INTERIOR.board.x + 2, y: INTERIOR.board.y - 4 }, frames: 12 },
    { kind: "prop", prop: "board", value: "chop2" },
    { kind: "prompt", text: "Chop!" },
    { kind: "effect", effect: "chop", at: { x: INTERIOR.board.x + 2, y: INTERIOR.board.y - 4 }, frames: 12 },
    { kind: "prop", prop: "board", value: "chopped" },
    { kind: "prompt", text: "Fill the bowl" },
    { kind: "move", actor: "human", to: INTERIOR.atBowls, speed: 1.5 },
    { kind: "prop", prop: "board", value: "empty" },
    { kind: "prop", prop: "bowl", value: "full" },
    { kind: "prompt", text: "Give it to Frankie" },
    { kind: "move", actor: "frankie", to: INTERIOR.frankieAtBowl, speed: 2, anim: "run" },
    { kind: "anim", actor: "frankie", anim: "eat", frames: 48 },
    { kind: "prop", prop: "bowl", value: "empty" },
    { kind: "prompt", text: "Grab the water bowl" },
    { kind: "prop", prop: "waterAt", value: "hands" },
    { kind: "move", actor: "human", to: INTERIOR.atSink, speed: 1.5 },
    { kind: "prompt", text: "Turn on the sink" },
    { kind: "prop", prop: "waterAt", value: "sink" },
    { kind: "prop", prop: "sink", value: "on" },
    { kind: "wait", frames: 30 },
    { kind: "prop", prop: "water", value: "full" },
    { kind: "wait", frames: 12 },
    { kind: "prop", prop: "sink", value: "off" },
    { kind: "prompt", text: "Bring it to Frankie" },
    { kind: "prop", prop: "waterAt", value: "hands" },
    { kind: "move", actor: "human", to: INTERIOR.atBowls, speed: 1.5 },
    { kind: "prop", prop: "waterAt", value: "floor" },
    { kind: "effect", effect: "splash", at: { x: INTERIOR.water.x, y: INTERIOR.water.y - 6 }, frames: 18 },
    { kind: "move", actor: "frankie", to: INTERIOR.frankieAtWater, speed: 1 },
    { kind: "anim", actor: "frankie", anim: "eat", frames: 36 },
    reaction("feed")
  ],

  walk: [
    { kind: "prompt", text: "Go outside" },
    outsideAtDoor,
    { kind: "move", actor: "human", to: { x: 48, y: 52 }, speed: 1 },
    { kind: "prompt", text: "Let him run" },
    { kind: "camera", follow: "frankie" },
    ...RUN_LAPS.flatMap((point): Step[] => [
      { kind: "move", actor: "frankie", to: point, speed: 3, anim: "run" },
      { kind: "effect", effect: "dust", at: "frankie", frames: 10 }
    ]),
    { kind: "camera", follow: "human" },
    { kind: "wait", frames: 24 },
    { kind: "camera", follow: null, x: 0 },
    { kind: "prompt", text: "Head home" },
    insideAtEntry,
    reaction("walk")
  ],

  play: [
    outsideAtDoor,
    { kind: "move", actor: "human", to: BACKYARD.lawn, speed: 1.5 },
    { kind: "move", actor: "frankie", to: FETCH_SPOT, speed: 2 },
    ...FETCH_THROWS.flatMap((spot, index): Step[] => [
      { kind: "prompt", text: index === 0 ? "Throw the ball" : "Throw it farther" },
      { kind: "set", actor: "ball", patch: { x: BACKYARD.lawn.x + 10, y: BACKYARD.lawn.y + 2, visible: true, carriedBy: undefined } },
      // Following the ball tracks the throw, waits where it lands for Frankie, then rides back with him.
      { kind: "camera", follow: "ball" },
      { kind: "move", actor: "ball", to: spot, speed: 4, arc: 30 },
      { kind: "move", actor: "frankie", to: { x: spot.x - 8, y: spot.y - 4 }, speed: 4, anim: "run" },
      { kind: "effect", effect: "dust", at: "frankie", frames: 10 },
      { kind: "set", actor: "ball", patch: { carriedBy: "frankie" } },
      { kind: "move", actor: "frankie", to: FETCH_SPOT, speed: 3, anim: "run" },
      { kind: "set", actor: "ball", patch: { carriedBy: undefined, x: BACKYARD.lawn.x + 20, y: BACKYARD.lawn.y + 12 } }
    ]),
    { kind: "camera", follow: "human" },
    { kind: "set", actor: "ball", patch: { visible: false } },
    { kind: "effect", effect: "hearts", at: "frankie" },
    reaction("play")
  ],

  snuggle: [
    { kind: "move", actor: "human", to: { x: INTERIOR.onCouch.x, y: 64 }, speed: 1.5 },
    { kind: "prompt", text: "Sit on the couch" },
    { kind: "move", actor: "human", to: INTERIOR.onCouch, speed: 1 },
    { kind: "set", actor: "human", patch: { anim: "sit" } },
    { kind: "prop", prop: "tv", value: "on" },
    { kind: "prompt", text: "Call Frankie up" },
    { kind: "move", actor: "frankie", to: INTERIOR.frankieOnCouch, speed: 2, arc: 10, anim: "run" },
    { kind: "prompt", text: "Pet him" },
    { kind: "set", actor: "human", patch: { anim: "sitPet" } },
    { kind: "effect", effect: "hearts", at: "frankie" },
    { kind: "wait", frames: 36 },
    { kind: "set", actor: "human", patch: { anim: "sit" } },
    { kind: "prompt", text: "Pet him some more" },
    { kind: "set", actor: "human", patch: { anim: "sitPet" } },
    { kind: "effect", effect: "hearts", at: "frankie" },
    { kind: "wait", frames: 24 },
    { kind: "set", actor: "frankie", patch: { anim: "sleep" } },
    { kind: "effect", effect: "zzz", at: "frankie", frames: 90 },
    { kind: "wait", frames: 40 },
    { kind: "set", actor: "human", patch: { anim: "sit" } },
    reaction("snuggle")
  ]
};

export function buildScene(need: FrankieNeed, { replay = false }: { replay?: boolean } = {}): Step[] {
  const opening = replay ? freePat : biscuitToss(INTERIOR.entry.human, INTERIOR.entry.frankie);
  return [insideAtEntry, ...opening, ...SCENE_BODIES[need]];
}
