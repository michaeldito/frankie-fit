import type { Point } from "@/components/frankie-boy/engine";

// Shared geometry for the renderer and the scene scripts. Coordinates are screen pixels at the
// Frankie Boy's native 160×144. Scenery fills the whole screen, but the text box covers the bottom
// 40px whenever it's up, so actors stay in the playfield (0–104) where they're always visible.
// Actor positions are the top-left of their 16×16 sprite.

export const PLAYFIELD_HEIGHT = 104;

export const BACKYARD = {
  house: { x: 0, width: 112, roofBottom: 14, wallBottom: 40 },
  door: { x: 48, width: 16 },
  windows: [16, 80],
  patio: { x: 24, width: 80, y: 40, height: 12 },
  fenceStart: 112,
  tree: { x: 222, y: 30 },
  shrubs: [
    { x: 132, y: 26 },
    { x: 304, y: 30 },
    { x: 362, y: 22 },
    { x: 446, y: 40 },
    { x: 168, y: 90 },
    { x: 412, y: 88 },
    { x: 8, y: 92 },
    { x: 58, y: 118 },
    { x: 196, y: 124 },
    { x: 338, y: 116 },
    { x: 452, y: 126 }
  ],
  flowers: [
    { x: 6, y: 44 },
    { x: 106, y: 46 },
    { x: 278, y: 84 },
    { x: 330, y: 64 },
    { x: 470, y: 70 },
    { x: 18, y: 130 },
    { x: 128, y: 112 },
    { x: 262, y: 132 },
    { x: 400, y: 114 }
  ],
  // Standing spots
  doorstep: { human: { x: 48, y: 40 }, frankie: { x: 66, y: 46 } } satisfies Record<string, Point>,
  lawn: { x: 96, y: 66 } satisfies Point
} as const;

export const INTERIOR = {
  wallBottom: 24,
  window: { x: 52, width: 24 },
  counter: { x: 4, width: 74, top: 14, front: 22, bottom: 36 },
  board: { x: 46, y: 14 },
  sink: { x: 66, y: 15 },
  foods: [
    { x: 10, y: 12, kind: "kibble" },
    { x: 22, y: 13, kind: "carrot" },
    { x: 33, y: 13, kind: "chicken" }
  ],
  bowl: { x: 20, y: 80 },
  water: { x: 36, y: 80 },
  tv: { x: 114, y: 4 },
  couch: { x: 100, y: 42, width: 52 },
  rug: { x: 96, y: 66, width: 58, height: 26 },
  plant: { x: 146, y: 26 },
  mat: { x: 68, width: 24 },
  // The front of the house seen from outside, below the room (birds-eye cutaway): roof eave,
  // siding with the front door under the mat, and the front yard.
  front: {
    eaveBottom: 108,
    wallBottom: 124,
    door: { x: 72, width: 16 },
    windows: [20, 124],
    lights: [67, 91],
    shrubs: [-6, 44, 96, 148],
    flowers: [22, 126]
  },
  // Standing spots
  entry: { human: { x: 70, y: 82 }, frankie: { x: 88, y: 86 } } satisfies Record<string, Point>,
  atCounter: { x: 34, y: 34 } satisfies Point,
  atSink: { x: 64, y: 34 } satisfies Point,
  atBowls: { x: 12, y: 66 } satisfies Point,
  // Placed so his mouth (rows 10–11 of the eat sprite) lands on the bowl's rim, not the floor below
  // it: he walks up facing left to the food, then steps right to the water.
  frankieAtBowl: { x: 20, y: 71 } satisfies Point,
  frankieAtWater: { x: 28, y: 71 } satisfies Point,
  onCouch: { x: 112, y: 40 } satisfies Point,
  // Close enough that the human's petting hand reaches his back.
  frankieOnCouch: { x: 124, y: 44 } satisfies Point
} as const;
