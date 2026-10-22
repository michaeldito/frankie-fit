import { FRANKIE_ACTIONS, type FrankieNeed } from "@frankie-fit/companion-core";
import type { Point, Step } from "@/components/frankie-boy/engine";
import { BACKYARD, INTERIOR } from "@/components/frankie-boy/maps";

// Every scene starts the same way: you toss Frankie a biscuit, he crunches it, and that's the
// moment it's actually spent (the redeem step). Backing out before then costs nothing.
function biscuitToss(human: Point, frankie: Point): Step[] {
  return [
    { kind: "prompt", text: "A: toss Frankie a biscuit" },
    { kind: "set", actor: "biscuit", patch: { x: human.x + 6, y: human.y + 4, visible: true } },
    { kind: "move", actor: "biscuit", to: { x: frankie.x + 12, y: frankie.y + 2 }, speed: 3, arc: 12 },
    { kind: "set", actor: "biscuit", patch: { visible: false } },
    { kind: "effect", effect: "crumbs", at: "frankie" },
    { kind: "anim", actor: "frankie", anim: "eat", frames: 24 },
    { kind: "redeem" }
  ];
}

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

const FETCH_THROWS: Point[] = [
  { x: 210, y: 78 },
  { x: 160, y: 60 },
  { x: 250, y: 88 }
];

export const SCENES: Record<FrankieNeed, Step[]> = {
  feed: [
    insideAtEntry,
    ...biscuitToss(INTERIOR.entry.human, INTERIOR.entry.frankie),
    { kind: "move", actor: "human", to: INTERIOR.atCounter, speed: 1.5 },
    { kind: "prompt", text: "A: grab food off the counter" },
    { kind: "prop", prop: "foods", value: "taken" },
    { kind: "prop", prop: "board", value: "whole" },
    { kind: "prompt", text: "A: chop" },
    { kind: "effect", effect: "chop", at: { x: INTERIOR.board.x + 2, y: INTERIOR.board.y - 4 }, frames: 12 },
    { kind: "prop", prop: "board", value: "chop1" },
    { kind: "prompt", text: "A: chop" },
    { kind: "effect", effect: "chop", at: { x: INTERIOR.board.x + 2, y: INTERIOR.board.y - 4 }, frames: 12 },
    { kind: "prop", prop: "board", value: "chop2" },
    { kind: "prompt", text: "A: chop!" },
    { kind: "effect", effect: "chop", at: { x: INTERIOR.board.x + 2, y: INTERIOR.board.y - 4 }, frames: 12 },
    { kind: "prop", prop: "board", value: "chopped" },
    { kind: "prompt", text: "A: fill the bowl" },
    { kind: "move", actor: "human", to: INTERIOR.atBowls, speed: 1.5 },
    { kind: "prop", prop: "board", value: "empty" },
    { kind: "prop", prop: "bowl", value: "full" },
    { kind: "prompt", text: "A: give it to Frankie" },
    { kind: "move", actor: "frankie", to: INTERIOR.frankieAtBowl, speed: 2, anim: "run" },
    { kind: "anim", actor: "frankie", anim: "eat", frames: 48 },
    { kind: "prop", prop: "bowl", value: "empty" },
    { kind: "prompt", text: "A: refresh the water" },
    { kind: "prop", prop: "water", value: "full" },
    { kind: "effect", effect: "splash", at: { x: INTERIOR.water.x, y: INTERIOR.water.y - 6 }, frames: 18 },
    { kind: "move", actor: "frankie", to: INTERIOR.frankieAtWater, speed: 1 },
    { kind: "anim", actor: "frankie", anim: "eat", frames: 36 },
    reaction("feed")
  ],

  walk: [
    insideAtEntry,
    ...biscuitToss(INTERIOR.entry.human, INTERIOR.entry.frankie),
    { kind: "prompt", text: "A: go outside" },
    outsideAtDoor,
    { kind: "move", actor: "human", to: { x: 48, y: 52 }, speed: 1 },
    { kind: "prompt", text: "A: let him run" },
    { kind: "camera", follow: "frankie" },
    ...RUN_LAPS.flatMap((point): Step[] => [
      { kind: "move", actor: "frankie", to: point, speed: 3, anim: "run" },
      { kind: "effect", effect: "dust", at: "frankie", frames: 10 }
    ]),
    { kind: "camera", follow: "human" },
    { kind: "wait", frames: 24 },
    { kind: "camera", follow: null, x: 0 },
    { kind: "prompt", text: "A: head home" },
    insideAtEntry,
    reaction("walk")
  ],

  play: [
    insideAtEntry,
    ...biscuitToss(INTERIOR.entry.human, INTERIOR.entry.frankie),
    outsideAtDoor,
    { kind: "move", actor: "human", to: BACKYARD.lawn, speed: 1.5 },
    { kind: "move", actor: "frankie", to: { x: BACKYARD.lawn.x + 18, y: BACKYARD.lawn.y + 4 }, speed: 2 },
    ...FETCH_THROWS.flatMap((spot, index): Step[] => [
      { kind: "prompt", text: index === 0 ? "A: throw the ball" : "A: throw it again" },
      { kind: "set", actor: "ball", patch: { x: BACKYARD.lawn.x + 10, y: BACKYARD.lawn.y + 2, visible: true, carriedBy: undefined } },
      { kind: "move", actor: "ball", to: spot, speed: 3, arc: 26 },
      { kind: "move", actor: "frankie", to: { x: spot.x - 8, y: spot.y - 4 }, speed: 3, anim: "run" },
      { kind: "set", actor: "ball", patch: { carriedBy: "frankie" } },
      { kind: "move", actor: "frankie", to: { x: BACKYARD.lawn.x + 18, y: BACKYARD.lawn.y + 4 }, speed: 2.5, anim: "run" },
      { kind: "set", actor: "ball", patch: { carriedBy: undefined, x: BACKYARD.lawn.x + 20, y: BACKYARD.lawn.y + 12 } }
    ]),
    { kind: "set", actor: "ball", patch: { visible: false } },
    { kind: "effect", effect: "hearts", at: "frankie" },
    reaction("play")
  ],

  snuggle: [
    insideAtEntry,
    ...biscuitToss(INTERIOR.entry.human, INTERIOR.entry.frankie),
    { kind: "move", actor: "human", to: { x: INTERIOR.onCouch.x, y: 64 }, speed: 1.5 },
    { kind: "prompt", text: "A: sit on the couch" },
    { kind: "move", actor: "human", to: INTERIOR.onCouch, speed: 1 },
    { kind: "set", actor: "human", patch: { anim: "sit" } },
    { kind: "prop", prop: "tv", value: "on" },
    { kind: "prompt", text: "A: call Frankie up" },
    { kind: "move", actor: "frankie", to: INTERIOR.frankieOnCouch, speed: 2, arc: 10, anim: "run" },
    { kind: "prompt", text: "A: pet him" },
    { kind: "effect", effect: "hearts", at: "frankie" },
    { kind: "wait", frames: 20 },
    { kind: "prompt", text: "A: pet him some more" },
    { kind: "effect", effect: "hearts", at: "frankie" },
    { kind: "set", actor: "frankie", patch: { anim: "sleep" } },
    { kind: "effect", effect: "zzz", at: "frankie", frames: 90 },
    { kind: "wait", frames: 40 },
    reaction("snuggle")
  ]
};
