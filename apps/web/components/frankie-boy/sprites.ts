// Original pixel art for the Frankie Boy, as palette-indexed rows. "." is transparent. Each sprite
// is baked once into an offscreen canvas (see renderer.ts) and mirrored for the other facing.

export type SpriteGrid = readonly string[];

export const PALETTE: Record<string, string> = {
  k: "#3B2416", // outline (dark brown, never pure black)
  t: "#C58B4B", // Frankie Fur
  b: "#8B5E3C", // Ear Brown
  c: "#F3D9B1", // muzzle and belly cream
  e: "#1F1F1F", // eye and nose
  p: "#E8828A", // tongue
  w: "#FFFFFF", // eye shine
  h: "#5B3A22", // human hair
  s: "#F2C9A0", // human skin
  r: "#2563EB", // human shirt (accent blue)
  j: "#3A3F5C", // human pants
  y: "#E3B23C", // biscuit
  g: "#C9E05A", // tennis ball
  G: "#8DA43A", // tennis ball seam
  o: "#D98B3A", // roast chicken skin
  O: "#A8602A", // roast chicken shade
  L: "#F0B266" // roast chicken shine
};

// Frankie, side view facing right: long dachshund body, floppy ear, short legs.
const FRANKIE_BODY = [
  "................",
  "................",
  "................",
  "..........kkk...",
  ".........ktttk..",
  "........kbttwek.",
  "k.......kbttttke",
  "tk.kkkkkkbtcccck",
  ".ktttttttbbtcck.",
  "..ktttttttttkk..",
  "..ktttttttttk...",
  "..kccccccccck..."
];

const LEGS_A = ["...kt.....kt....", "...kk.....kk....", "................", "................"];
const LEGS_B = ["....kt...kt.....", "....kk...kk.....", "................", "................"];
const LEGS_RUN = ["..kt.......kt...", "..kk.......kk...", "................", "................"];

export const FRANKIE_SPRITES: Record<"idle" | "walk" | "run" | "eat" | "sleep", readonly SpriteGrid[]> = {
  idle: [[...FRANKIE_BODY, ...LEGS_A]],
  walk: [
    [...FRANKIE_BODY, ...LEGS_A],
    [...FRANKIE_BODY, ...LEGS_B]
  ],
  run: [
    [...FRANKIE_BODY, ...LEGS_RUN],
    [...FRANKIE_BODY, ...LEGS_B]
  ],
  // Head dipped toward the bowl, tongue out.
  eat: [
    [
      "................",
      "................",
      "................",
      "................",
      "................",
      "k...............",
      "tk.kkkkkkkk.....",
      ".ktttttttbbkkk..",
      "..ktttttttbtttk.",
      "..ktttttttbtwek.",
      "..kccccccckttttk",
      "...kt.....ktcccp",
      "...kk.....kk.kk.",
      "................",
      "................",
      "................"
    ],
    [
      "................",
      "................",
      "................",
      "................",
      "................",
      "k...............",
      "tk.kkkkkkkk.....",
      ".ktttttttbbkkk..",
      "..ktttttttbtttk.",
      "..ktttttttbtwek.",
      "..kccccccckttttk",
      "...kt.....ktccck",
      "...kk.....kk.pp.",
      "................",
      "................",
      "................"
    ]
  ],
  // Curled up, eyes closed.
  sleep: [
    [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "....kkkkkkkk....",
      "...kttttttttkk..",
      "..kttttttbbttek.",
      "..ktttttttbtttk.",
      "..kcccccccccccck",
      "...kkkkkkkkkkkk.",
      "................",
      "................",
      "................"
    ]
  ]
};

// The human, facing the camera; walking alternates the feet and bobs a pixel.
const HUMAN_TOP = [
  "................",
  ".....kkkkkk.....",
  "....khhhhhhk....",
  "....khhhhhhk....",
  "....khsssshk....",
  "....kseesesk....",
  "....kssssssk....",
  ".....kkssk......",
  "....krrrrrrk....",
  "...krrrrrrrrk...",
  "...ksrrrrrrsk...",
  "...ksrrrrrrsk...",
  "....kjjjjjjk...."
];

// Petting: the right arm reaches out and strokes, the hand moving between two rows.
const PET_ARM: readonly (readonly string[])[] = [
  ["....krrrrrrrkkk.", "...krrrrrrrrrssk", "...ksrrrrrrrkkk.", "...ksrrrrrrsk..."],
  ["....krrrrrrk....", "...krrrrrrrrkkk.", "...ksrrrrrrrrssk", "...ksrrrrrrkkkk."]
];
const HUMAN_TOP_PETTING = PET_ARM.map((arm) => [...HUMAN_TOP.slice(0, 8), ...arm, HUMAN_TOP[12]]);
const STANDING_LEGS = ["....kjjkkjjk....", "....kjjkkjjk....", "....kkk..kkk...."];
const SITTING_LEGS = ["...kjjjjjjjjk...", "...kkkkkkkkkk...", "................", "................"];

export const HUMAN_SPRITES: Record<"idle" | "walk" | "sit" | "pet" | "sitPet", readonly SpriteGrid[]> = {
  idle: [[...HUMAN_TOP, ...STANDING_LEGS]],
  walk: [
    [...HUMAN_TOP, "....kjjkkjjk....", "....kjjk.kkk....", "....kkk........."],
    [...HUMAN_TOP, "....kjjkkjjk....", "....kkk.kjjk....", ".........kkk...."]
  ],
  sit: [[...HUMAN_TOP.slice(0, 12), ...SITTING_LEGS]],
  pet: HUMAN_TOP_PETTING.map((top) => [...top, ...STANDING_LEGS]),
  sitPet: HUMAN_TOP_PETTING.map((top) => [...top.slice(0, 12), ...SITTING_LEGS])
};

export const ITEM_SPRITES: Record<"biscuit" | "ball", SpriteGrid> = {
  biscuit: ["..kkkk..", ".kyyyyk.", "kyykkyyk", "kyyyyyyk", ".kyyyyk.", "..kkkk.."],
  ball: [".kkkk.", "kggGgk", "kgGggk", "kggGgk", ".kkkk."]
};

// A whole roast chicken with a drumstick out the side; chopping turns it into the little slices.
export const FOOD_SPRITES: Record<"chicken", SpriteGrid> = {
  chicken: ["..oooo.....", ".oLLooo....", "oooooooo.cc", "oooooooOOc.", "OoooooOO...", ".OOOOOO...."]
};

