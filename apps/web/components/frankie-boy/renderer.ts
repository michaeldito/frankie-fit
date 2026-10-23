import { MAP_WIDTH, SCREEN_WIDTH, type Actor, type Effect, type World } from "@/components/frankie-boy/engine";
import { BACKYARD, INTERIOR, PLAYFIELD_HEIGHT } from "@/components/frankie-boy/maps";
import { FOOD_SPRITES, FRANKIE_SPRITES, HUMAN_SPRITES, ITEM_SPRITES, PALETTE, type SpriteGrid } from "@/components/frankie-boy/sprites";

// Game Boy Color–style colors pulled from the Frankie Fit palette.
const C = {
  grass: "#86B86A",
  grassDark: "#6A9E57",
  grassLight: "#9CC97C",
  dirt: "#D9BE8A",
  dirtDark: "#C4A673",
  stone: "#CFC6B4",
  stoneDark: "#B3A893",
  wall: "#F3EBDD",
  wallShade: "#E2D5BF",
  roof: "#A85A3E",
  roofDark: "#8A4630",
  wood: "#8B5E3C",
  woodLight: "#A97A52",
  window: "#9FD3F0",
  windowShine: "#D8F0FB",
  fence: "#EDE3CF",
  fenceShade: "#CDBFA5",
  leaf: "#3F7D4E",
  leafLight: "#5DA35A",
  leafDark: "#2E5E3A",
  trunk: "#6E4A2E",
  coral: "#FF6B6B",
  sun: "#FFD166",
  ink: "#3B2416",
  floor: "#D4AE7E",
  floorLine: "#BE9867",
  counter: "#E9E1D1",
  counterTop: "#B7AA94",
  rug: "#5C8FB8",
  rugLight: "#7FAED2",
  couch: "#3F7D4E",
  couchLight: "#5DA35A",
  tv: "#2B2B33",
  tvGlow: "#7CC3FF",
  bowl: "#3A3F5C",
  food: "#B07A3E",
  water: "#7CC3FF",
  board: "#C99A62",
  carrot: "#F08A3C",
  chicken: "#F3D9B1",
  steel: "#A9B2BC",
  steelDark: "#6F7882",
  roast: "#A8602A"
};

const spriteCache = new Map<string, HTMLCanvasElement>();

function bake(grid: SpriteGrid, mirror: boolean): HTMLCanvasElement {
  const key = `${grid.join("|")}:${mirror}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const width = grid[0].length;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = grid.length;
  const ctx = canvas.getContext("2d")!;
  grid.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const color = PALETTE[char];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(mirror ? width - 1 - x : x, y, 1, 1);
    });
  });
  spriteCache.set(key, canvas);
  return canvas;
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// Stable pseudo-random so grass speckles don't shimmer between frames.
function hash(x: number, y: number) {
  return ((x * 73856093) ^ (y * 19349663)) >>> 0;
}

function drawGrass(ctx: CanvasRenderingContext2D, width: number) {
  rect(ctx, 0, 0, width, PLAYFIELD_HEIGHT, C.grass);
  for (let x = 0; x < width; x += 4) {
    for (let y = 0; y < PLAYFIELD_HEIGHT; y += 4) {
      const h = hash(x, y) % 11;
      if (h === 0) rect(ctx, x + 1, y + 1, 1, 2, C.grassDark);
      if (h === 1) rect(ctx, x + 2, y, 1, 1, C.grassLight);
    }
  }
}

function drawShrub(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x + 2, y + 10, 14, 3, C.grassDark);
  rect(ctx, x + 1, y + 3, 16, 9, C.leaf);
  rect(ctx, x + 3, y + 1, 12, 2, C.leaf);
  rect(ctx, x + 4, y + 3, 4, 2, C.leafLight);
  rect(ctx, x + 11, y + 6, 3, 2, C.leafLight);
  rect(ctx, x + 2, y + 10, 14, 1, C.leafDark);
}

function drawFlowers(ctx: CanvasRenderingContext2D, x: number, y: number) {
  for (const [dx, dy] of [
    [0, 2],
    [5, 0],
    [9, 3],
    [3, 6]
  ]) {
    rect(ctx, x + dx, y + dy, 3, 3, C.coral);
    rect(ctx, x + dx + 1, y + dy + 1, 1, 1, C.sun);
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x - 4, y + 28, 28, 4, C.grassDark);
  rect(ctx, x + 6, y + 14, 8, 16, C.trunk);
  rect(ctx, x + 8, y + 16, 2, 10, C.wood);
  rect(ctx, x - 6, y - 4, 32, 20, C.leaf);
  rect(ctx, x - 2, y - 10, 24, 8, C.leaf);
  rect(ctx, x + 2, y - 14, 16, 6, C.leaf);
  rect(ctx, x, y - 8, 8, 4, C.leafLight);
  rect(ctx, x + 14, y - 2, 6, 3, C.leafLight);
  rect(ctx, x - 6, y + 13, 32, 3, C.leafDark);
}

function drawBackyard(ctx: CanvasRenderingContext2D) {
  const width = MAP_WIDTH.backyard;
  drawGrass(ctx, width);

  // Fence along the back of the yard.
  for (let x = BACKYARD.fenceStart; x < width; x += 8) {
    rect(ctx, x + 1, 2, 5, 18, C.fence);
    rect(ctx, x + 1, 2, 5, 1, C.fenceShade);
    rect(ctx, x + 5, 3, 1, 17, C.fenceShade);
  }
  rect(ctx, BACKYARD.fenceStart, 7, width, 2, C.fenceShade);
  rect(ctx, BACKYARD.fenceStart, 14, width, 2, C.fenceShade);

  // The house's back wall, roof, windows, and door.
  const house = BACKYARD.house;
  rect(ctx, house.x, house.roofBottom, house.width, house.wallBottom - house.roofBottom, C.wall);
  for (let y = house.roofBottom + 4; y < house.wallBottom; y += 6) rect(ctx, house.x, y, house.width, 1, C.wallShade);
  rect(ctx, house.x, 0, house.width, house.roofBottom, C.roof);
  for (let x = 0; x < house.width; x += 6) rect(ctx, x, house.roofBottom - 3, 4, 2, C.roofDark);
  for (const wx of BACKYARD.windows) {
    rect(ctx, wx, 20, 16, 12, C.wood);
    rect(ctx, wx + 1, 21, 14, 10, C.window);
    rect(ctx, wx + 2, 22, 4, 2, C.windowShine);
    rect(ctx, wx + 7, 21, 1, 10, C.wood);
  }
  rect(ctx, BACKYARD.door.x, 20, BACKYARD.door.width, 20, C.wood);
  rect(ctx, BACKYARD.door.x + 2, 22, 12, 7, C.woodLight);
  rect(ctx, BACKYARD.door.x + 12, 31, 2, 2, C.sun);

  // Stone patio.
  const patio = BACKYARD.patio;
  rect(ctx, patio.x, patio.y, patio.width, patio.height, C.stone);
  for (let x = patio.x; x < patio.x + patio.width; x += 8) rect(ctx, x, patio.y, 1, patio.height, C.stoneDark);
  rect(ctx, patio.x, patio.y + 6, patio.width, 1, C.stoneDark);

  // A worn dirt path out to the lawn.
  rect(ctx, 52, patio.y + patio.height, 10, 14, C.dirt);
  rect(ctx, 52, 64, 120, 8, C.dirt);
  rect(ctx, 52, 71, 120, 1, C.dirtDark);

  for (const flower of BACKYARD.flowers) drawFlowers(ctx, flower.x, flower.y);
  for (const shrub of BACKYARD.shrubs) drawShrub(ctx, shrub.x, shrub.y);
  drawTree(ctx, BACKYARD.tree.x, BACKYARD.tree.y);
}

function drawBowl(ctx: CanvasRenderingContext2D, x: number, y: number, fill: string, full: boolean) {
  rect(ctx, x, y + 2, 10, 4, C.bowl);
  rect(ctx, x + 1, y + 1, 8, 1, C.bowl);
  rect(ctx, x + 2, y + 1, 6, 1, full ? fill : "#262A40");
}

// Basin under the window with a faucet; the stream runs while the sink is on.
function drawSink(ctx: CanvasRenderingContext2D, world: World, tick: number) {
  const { x, y } = INTERIOR.sink;
  rect(ctx, x, y, 12, 6, C.steel);
  rect(ctx, x + 1, y + 1, 10, 3, C.steelDark);
  rect(ctx, x + 9, y - 8, 2, 8, C.steelDark);
  rect(ctx, x + 4, y - 8, 7, 2, C.steelDark);
  // The bowl sits in the basin with its rim above the sink's front lip.
  if (world.props.waterAt === "sink") drawBowl(ctx, x + 1, y - 3, C.water, world.props.water === "full");
  rect(ctx, x, y + 4, 12, 2, C.steel);
  if (world.props.sink === "on") {
    rect(ctx, x + 5, y - 6, 1, 4, C.water);
    rect(ctx, x + 5, y - 6 + (tick % 4), 1, 1, C.windowShine);
  }
}

function drawInterior(ctx: CanvasRenderingContext2D, world: World, tick: number) {
  // Floorboards and back wall.
  rect(ctx, 0, 0, SCREEN_WIDTH, PLAYFIELD_HEIGHT, C.floor);
  for (let y = INTERIOR.wallBottom + 6; y < PLAYFIELD_HEIGHT; y += 8) rect(ctx, 0, y, SCREEN_WIDTH, 1, C.floorLine);
  rect(ctx, 0, 0, SCREEN_WIDTH, INTERIOR.wallBottom, C.wall);
  rect(ctx, 0, INTERIOR.wallBottom - 2, SCREEN_WIDTH, 2, C.wallShade);
  rect(ctx, INTERIOR.window.x, 4, INTERIOR.window.width, 12, C.wood);
  rect(ctx, INTERIOR.window.x + 1, 5, INTERIOR.window.width - 2, 10, C.window);
  rect(ctx, INTERIOR.window.x + 3, 6, 5, 2, C.windowShine);

  // Kitchen counter, cutting board, and food.
  const counter = INTERIOR.counter;
  rect(ctx, counter.x, counter.front, counter.width, counter.bottom - counter.front, C.counter);
  rect(ctx, counter.x, counter.top, counter.width, counter.front - counter.top, C.counterTop);
  for (let x = counter.x + 18; x < counter.x + counter.width; x += 18) rect(ctx, x, counter.front + 2, 1, 12, C.wallShade);
  rect(ctx, counter.x, counter.bottom, counter.width, 1, C.stoneDark);

  const board = world.props.board;
  if (board) {
    rect(ctx, INTERIOR.board.x, INTERIOR.board.y, 20, 7, C.board);
    const pieces = board === "chop1" ? 2 : board === "chop2" ? 4 : board === "chopped" ? 7 : board === "whole" ? 0 : -1;
    if (pieces === 0) {
      rect(ctx, INTERIOR.board.x + 1, INTERIOR.board.y + 3, 6, 3, C.carrot);
      ctx.drawImage(bake(FOOD_SPRITES.chicken, false), INTERIOR.board.x + 9, INTERIOR.board.y);
    }
    for (let i = 0; i < pieces; i += 1) {
      const x = INTERIOR.board.x + 2 + i * 2.4;
      const y = INTERIOR.board.y + 2 + (i % 2);
      rect(ctx, x, y, 2, 2, i % 2 ? C.chicken : C.carrot);
      // Chicken slices keep a strip of roasted skin on top.
      if (i % 2) rect(ctx, x, y, 2, 1, C.roast);
    }
  }
  drawSink(ctx, world, tick);
  if (world.props.foods !== "taken") {
    rect(ctx, INTERIOR.foods[0].x, INTERIOR.foods[0].y - 6, 7, 8, C.wood);
    rect(ctx, INTERIOR.foods[0].x + 1, INTERIOR.foods[0].y - 4, 5, 2, C.sun);
    rect(ctx, INTERIOR.foods[1].x, INTERIOR.foods[1].y, 8, 2, C.carrot);
    rect(ctx, INTERIOR.foods[1].x + 7, INTERIOR.foods[1].y - 1, 2, 2, C.leafLight);
    ctx.drawImage(bake(FOOD_SPRITES.chicken, false), INTERIOR.foods[2].x, INTERIOR.foods[2].y - 3);
  }

  // Bowls. The water bowl leaves the floor while it's carried to the sink and back.
  drawBowl(ctx, INTERIOR.bowl.x, INTERIOR.bowl.y, C.food, world.props.bowl === "full");
  const waterAt = world.props.waterAt ?? "floor";
  if (waterAt === "floor") drawBowl(ctx, INTERIOR.water.x, INTERIOR.water.y, C.water, world.props.water === "full");

  // Living room: rug, couch, TV, plant.
  const rug = INTERIOR.rug;
  rect(ctx, rug.x, rug.y, rug.width, rug.height, C.rug);
  rect(ctx, rug.x + 3, rug.y + 3, rug.width - 6, rug.height - 6, C.rugLight);
  rect(ctx, rug.x + 6, rug.y + 6, rug.width - 12, rug.height - 12, C.rug);

  const couch = INTERIOR.couch;
  rect(ctx, couch.x, couch.y, couch.width, 8, C.couch);
  rect(ctx, couch.x, couch.y + 8, couch.width, 12, C.couchLight);
  rect(ctx, couch.x - 3, couch.y + 4, 4, 16, C.couch);
  rect(ctx, couch.x + couch.width - 1, couch.y + 4, 4, 16, C.couch);
  rect(ctx, couch.x + couch.width / 2, couch.y + 9, 1, 10, C.couch);

  const tv = INTERIOR.tv;
  rect(ctx, tv.x + 10, tv.y + 18, 6, 4, C.tv);
  rect(ctx, tv.x, tv.y, 26, 18, C.tv);
  const on = world.props.tv === "on";
  rect(ctx, tv.x + 2, tv.y + 2, 22, 13, on ? (Math.floor(tick / 8) % 3 === 0 ? C.window : C.tvGlow) : "#41414D");
  if (on) rect(ctx, tv.x + 4 + (Math.floor(tick / 6) % 14), tv.y + 8, 4, 3, C.sun);

  rect(ctx, INTERIOR.plant.x + 2, INTERIOR.plant.y + 8, 8, 8, C.roof);
  rect(ctx, INTERIOR.plant.x, INTERIOR.plant.y, 12, 9, C.leaf);
  rect(ctx, INTERIOR.plant.x + 3, INTERIOR.plant.y - 3, 6, 4, C.leafLight);

  // Doormat by the front door at the bottom.
  rect(ctx, INTERIOR.mat.x, PLAYFIELD_HEIGHT - 6, INTERIOR.mat.width, 6, C.wood);
}

function frameOf<T>(frames: readonly T[], tick: number, rate: number) {
  return frames[Math.floor(tick / rate) % frames.length];
}

function drawActor(ctx: CanvasRenderingContext2D, id: string, actor: Actor, tick: number, cameraX: number) {
  if (!actor.visible) return;
  const mirror = actor.facing === "left";
  let grid: SpriteGrid;
  let bob = 0;

  if (id === "frankie") {
    const frames = FRANKIE_SPRITES[actor.anim === "sit" ? "idle" : actor.anim];
    grid = frameOf(frames, tick, actor.anim === "run" ? 3 : 6);
    if (actor.anim === "idle" && Math.floor(tick / 20) % 4 === 0) bob = -1;
  } else if (id === "human") {
    const frames = actor.anim === "walk" || actor.anim === "run" ? HUMAN_SPRITES.walk : actor.anim === "sit" ? HUMAN_SPRITES.sit : HUMAN_SPRITES.idle;
    grid = frameOf(frames, tick, 7);
    if (actor.anim === "walk") bob = Math.floor(tick / 7) % 2 ? -1 : 0;
  } else {
    grid = ITEM_SPRITES[id as keyof typeof ITEM_SPRITES];
  }

  const x = actor.x - cameraX;
  const y = actor.y - actor.lift + bob;
  if (actor.lift > 0 && id !== "biscuit") rect(ctx, x + 3, actor.y + 14, grid[0].length - 4, 2, "rgba(0,0,0,0.18)");
  ctx.drawImage(bake(grid, mirror), Math.round(x), Math.round(y));
}

function drawEffect(ctx: CanvasRenderingContext2D, effect: Effect, cameraX: number) {
  const age = effect.total - effect.ttl;
  const x = effect.x - cameraX;
  const y = effect.y;
  switch (effect.kind) {
    case "crumbs":
      for (let i = 0; i < 5; i += 1) rect(ctx, x + 10 + i * 2, y + 6 + ((age + i * 3) % 8), 1, 1, C.sun);
      break;
    case "chop":
      rect(ctx, x + 6, y + (age < 6 ? age : 12 - age), 2, 8, "#C9CED6");
      rect(ctx, x + 2, y + 10, 12, 1, "#FFFFFF");
      break;
    case "hearts":
      for (let i = 0; i < 3; i += 1) {
        const hx = x + 2 + i * 6;
        const hy = y - 4 - ((age + i * 5) % 18);
        rect(ctx, hx, hy, 2, 2, C.coral);
        rect(ctx, hx + 3, hy, 2, 2, C.coral);
        rect(ctx, hx + 1, hy + 2, 3, 2, C.coral);
      }
      break;
    case "zzz":
      for (let i = 0; i < 3; i += 1) {
        const zy = y - 4 - ((age + i * 12) % 30);
        rect(ctx, x + 12 + i * 3, zy, 3, 1, C.ink);
        rect(ctx, x + 13 + i * 3, zy + 1, 1, 1, C.ink);
        rect(ctx, x + 12 + i * 3, zy + 2, 3, 1, C.ink);
      }
      break;
    case "dust":
      rect(ctx, x + 2 - age / 2, y + 13, 3, 2, C.dirtDark);
      rect(ctx, x - 2 - age / 2, y + 12, 2, 2, C.dirt);
      break;
    case "splash":
      for (let i = 0; i < 4; i += 1) rect(ctx, x + 2 + i * 2, y + 4 - (age % 6) - (i % 2) * 2, 1, 2, C.water);
      break;
  }
}

export function drawWorld(ctx: CanvasRenderingContext2D, world: World, tick: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (world.map === "backyard") {
    ctx.translate(-world.cameraX, 0);
    drawBackyard(ctx);
    ctx.restore();
  } else {
    drawInterior(ctx, world, tick);
    ctx.restore();
  }

  // Back to front by feet position so whoever is lower on screen draws on top.
  const order = (["human", "frankie", "ball", "biscuit"] as const)
    .map((id) => [id, world.actors[id]] as const)
    .sort(([, a], [, b]) => a.y + 16 - (b.y + 16));
  for (const [id, actor] of order) drawActor(ctx, id, actor, tick, world.cameraX);
  if (world.map === "interior" && world.props.waterAt === "hands") {
    const human = world.actors.human;
    drawBowl(ctx, human.x + 3, human.y + 9, C.water, world.props.water === "full");
  }
  for (const effect of world.effects) drawEffect(ctx, effect, world.cameraX);

  // Under the text box.
  rect(ctx, 0, PLAYFIELD_HEIGHT, SCREEN_WIDTH, 144 - PLAYFIELD_HEIGHT, "#F8F6EF");
}

export function hitTestActor(world: World, id: "frankie", point: { x: number; y: number }) {
  const actor = world.actors[id];
  const x = actor.x - world.cameraX;
  const y = actor.y - actor.lift;
  return actor.visible && point.x >= x && point.x <= x + 16 && point.y >= y && point.y <= y + 16;
}
