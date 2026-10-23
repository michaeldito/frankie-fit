// A tiny cutscene runner for the Frankie Boy. Scenes are flat lists of steps; the runner advances
// them one frame at a time and pauses on prompts (waiting for A) and on the biscuit redeem (waiting
// for the server). It has no canvas or React in it, so it is unit-tested directly.

export type MapId = "backyard" | "interior";
export type ActorId = "human" | "frankie" | "ball" | "biscuit";
export type Anim = "idle" | "walk" | "run" | "eat" | "sit" | "sleep" | "pet" | "sitPet";
export type EffectKind = "crumbs" | "chop" | "hearts" | "zzz" | "dust" | "splash";

export type Point = { x: number; y: number };

export type Actor = Point & {
  visible: boolean;
  facing: "left" | "right";
  anim: Anim;
  // Pixels above the ground, for arcs and hops; drawn as an offset, not a position change.
  lift: number;
  carriedBy?: ActorId;
};

export type Effect = { kind: EffectKind; x: number; y: number; ttl: number; total: number };

export type World = {
  map: MapId;
  cameraX: number;
  cameraFollow: ActorId | null;
  actors: Record<ActorId, Actor>;
  props: Record<string, string>;
  effects: Effect[];
  text: string | null;
  prompt: boolean;
};

export type Step =
  | { kind: "map"; map: MapId; place: Partial<Record<ActorId, Point & { visible?: boolean }>>; cameraX?: number }
  | { kind: "say"; text: string }
  | { kind: "prompt"; text: string }
  | { kind: "move"; actor: ActorId; to: Point; speed: number; arc?: number; anim?: Anim }
  | { kind: "anim"; actor: ActorId; anim: Anim; frames: number }
  | { kind: "set"; actor: ActorId; patch: Partial<Actor> }
  | { kind: "prop"; prop: string; value: string }
  | { kind: "effect"; effect: EffectKind; at: ActorId | Point; frames?: number }
  | { kind: "camera"; follow: ActorId | null; x?: number }
  | { kind: "wait"; frames: number }
  | { kind: "redeem" };

export type RunnerStatus = "playing" | "waitingForA" | "redeeming" | "refused" | "done";

export const SCREEN_WIDTH = 160;
export const SCREEN_HEIGHT = 144;
export const MAP_WIDTH: Record<MapId, number> = { backyard: 480, interior: 160 };

function actor(x: number, y: number, visible = true): Actor {
  return { x, y, visible, facing: "right", anim: "idle", lift: 0 };
}

export function createWorld(map: MapId = "backyard"): World {
  return {
    map,
    cameraX: 0,
    cameraFollow: null,
    actors: {
      human: actor(60, 52),
      frankie: actor(80, 62),
      ball: actor(0, 0, false),
      biscuit: actor(0, 0, false)
    },
    props: {},
    effects: [],
    text: null,
    prompt: false
  };
}

function clampCamera(world: World, x: number) {
  return Math.max(0, Math.min(MAP_WIDTH[world.map] - SCREEN_WIDTH, Math.round(x)));
}

/** Per-frame world upkeep shared by scenes and the idle screen: effects, carried props, camera. */
export function stepWorld(world: World) {
  world.effects = world.effects
    .map((effect) => ({ ...effect, ttl: effect.ttl - 1 }))
    .filter((effect) => effect.ttl > 0);

  for (const id of Object.keys(world.actors) as ActorId[]) {
    const item = world.actors[id];
    if (item.carriedBy) {
      const carrier = world.actors[item.carriedBy];
      item.x = carrier.x + (carrier.facing === "right" ? 12 : -2);
      item.y = carrier.y + 4;
      item.lift = carrier.lift;
    }
  }

  if (world.cameraFollow) {
    const target = clampCamera(world, world.actors[world.cameraFollow].x - SCREEN_WIDTH / 2 + 8);
    world.cameraX += Math.round((target - world.cameraX) * 0.15);
  }
}

export class SceneRunner {
  readonly world: World;
  status: RunnerStatus = "playing";
  refusal: string | null = null;
  private index = 0;
  private frame = 0;
  private moveFrom: Point | null = null;

  constructor(
    private readonly steps: readonly Step[],
    world: World = createWorld()
  ) {
    this.world = world;
  }

  get stepIndex() {
    return this.index;
  }

  /** Advance one frame. Instant steps resolve in the same frame until something blocks. */
  tick() {
    stepWorld(this.world);
    if (this.status !== "playing") return;

    for (let guard = 0; guard < 64 && this.status === "playing"; guard += 1) {
      const step = this.steps[this.index];
      if (!step) {
        this.status = "done";
        this.world.text = null;
        return;
      }
      if (!this.run(step)) return;
      this.next();
    }
  }

  /** A pressed: continues past a prompt, or closes the refusal message. */
  pressA() {
    if (this.status === "waitingForA") {
      this.world.text = null;
      this.world.prompt = false;
      this.status = "playing";
      this.next();
    } else if (this.status === "refused") {
      this.world.text = null;
      this.status = "done";
    }
  }

  /** The server's answer to the biscuit redeem: null means it was spent. */
  resolveRedeem(error: string | null) {
    if (this.status !== "redeeming") return;
    if (error) {
      this.refusal = error;
      this.world.text = refusalLine(error);
      this.world.prompt = false;
      this.status = "refused";
      return;
    }
    this.status = "playing";
    this.next();
  }

  private next() {
    this.index += 1;
    this.frame = 0;
    this.moveFrom = null;
  }

  // Returns true when the step is finished and the runner should move on.
  private run(step: Step): boolean {
    const world = this.world;

    switch (step.kind) {
      case "map": {
        world.map = step.map;
        world.effects = [];
        for (const [id, place] of Object.entries(step.place) as [ActorId, Point & { visible?: boolean }][]) {
          Object.assign(world.actors[id], { x: place.x, y: place.y, visible: place.visible ?? true, lift: 0, anim: "idle" });
        }
        world.cameraX = clampCamera(world, step.cameraX ?? 0);
        return true;
      }
      case "say":
      case "prompt":
        world.text = step.text;
        world.prompt = step.kind === "prompt";
        this.status = "waitingForA";
        return false;
      case "move":
        return this.move(step);
      case "anim": {
        const target = world.actors[step.actor];
        target.anim = step.anim;
        this.frame += 1;
        if (this.frame >= step.frames) {
          target.anim = "idle";
          return true;
        }
        return false;
      }
      case "set":
        Object.assign(world.actors[step.actor], step.patch);
        return true;
      case "prop":
        world.props[step.prop] = step.value;
        return true;
      case "effect": {
        const at = typeof step.at === "string" ? world.actors[step.at] : step.at;
        const total = step.frames ?? 24;
        world.effects.push({ kind: step.effect, x: at.x, y: at.y, ttl: total, total });
        return true;
      }
      case "camera":
        world.cameraFollow = step.follow;
        if (step.x !== undefined) world.cameraX = clampCamera(world, step.x);
        return true;
      case "wait":
        this.frame += 1;
        return this.frame >= step.frames;
      case "redeem":
        this.status = "redeeming";
        return false;
    }
  }

  private move(step: Extract<Step, { kind: "move" }>): boolean {
    const target = this.world.actors[step.actor];
    if (!this.moveFrom) {
      this.moveFrom = { x: target.x, y: target.y };
      target.visible = true;
      if (step.to.x !== target.x) target.facing = step.to.x > target.x ? "right" : "left";
    }

    const from = this.moveFrom;
    const distance = Math.hypot(step.to.x - from.x, step.to.y - from.y);
    const frames = Math.max(1, Math.ceil(distance / step.speed));
    this.frame += 1;
    const progress = Math.min(1, this.frame / frames);

    target.x = Math.round(from.x + (step.to.x - from.x) * progress);
    target.y = Math.round(from.y + (step.to.y - from.y) * progress);
    target.lift = step.arc ? Math.round(Math.sin(Math.PI * progress) * step.arc) : 0;
    target.anim = progress < 1 ? (step.anim ?? "walk") : "idle";
    return progress >= 1;
  }
}

export function refusalLine(error: string): string {
  if (error === "already_filled") return "Already did that today. Nice try.";
  if (error === "not_enough_biscuits") return "No biscuits in the jar. Log something and come back.";
  return "Couldn't reach Frankie. Try again?";
}
