import { describe, expect, it } from "vitest";
import { FRANKIE_NEEDS } from "@frankie-fit/companion-core";
import { MAP_WIDTH, SceneRunner, createWorld, refusalLine, stepWorld, type Step } from "./engine";
import { SCENES } from "./scenes";
import { FRANKIE_SPRITES, HUMAN_SPRITES, ITEM_SPRITES, PALETTE } from "./sprites";

function runUntilBlocked(runner: SceneRunner, maxFrames = 2000) {
  for (let i = 0; i < maxFrames && runner.status === "playing"; i += 1) runner.tick();
}

describe("SceneRunner", () => {
  it("resolves instant steps in one frame and stops on prompts until A", () => {
    const runner = new SceneRunner([
      { kind: "prop", prop: "bowl", value: "full" },
      { kind: "prompt", text: "A: chop" },
      { kind: "prop", prop: "board", value: "chopped" }
    ]);

    runner.tick();
    expect(runner.world.props.bowl).toBe("full");
    expect(runner.status).toBe("waitingForA");
    expect(runner.world.text).toBe("A: chop");
    expect(runner.world.prompt).toBe(true);

    runner.tick();
    expect(runner.world.props.board).toBeUndefined();

    runner.pressA();
    runner.tick();
    expect(runner.world.props.board).toBe("chopped");
    expect(runner.status).toBe("done");
  });

  it("moves actors over several frames, faces the direction of travel, and arcs", () => {
    const runner = new SceneRunner([{ kind: "move", actor: "ball", to: { x: 40, y: 0 }, speed: 2, arc: 10 }]);
    Object.assign(runner.world.actors.ball, { x: 0, y: 0 });

    runner.tick();
    expect(runner.world.actors.ball.x).toBe(2);
    expect(runner.world.actors.ball.facing).toBe("right");
    for (let i = 0; i < 9; i += 1) runner.tick();
    expect(runner.world.actors.ball.lift).toBe(10);

    runUntilBlocked(runner);
    expect(runner.world.actors.ball).toMatchObject({ x: 40, y: 0, lift: 0, anim: "idle" });
    expect(runner.status).toBe("done");
  });

  it("waits on the redeem and carries on when the biscuit is spent", () => {
    const runner = new SceneRunner([{ kind: "redeem" }, { kind: "say", text: "Crunch." }]);
    runner.tick();
    expect(runner.status).toBe("redeeming");
    runner.tick();
    expect(runner.status).toBe("redeeming");

    runner.resolveRedeem(null);
    runner.tick();
    expect(runner.world.text).toBe("Crunch.");
  });

  it("stops the scene with a refusal when the redeem is turned down", () => {
    const runner = new SceneRunner([{ kind: "redeem" }, { kind: "say", text: "never shown" }]);
    runner.tick();
    runner.resolveRedeem("not_enough_biscuits");

    expect(runner.status).toBe("refused");
    expect(runner.refusal).toBe("not_enough_biscuits");
    expect(runner.world.text).toBe(refusalLine("not_enough_biscuits"));

    runner.pressA();
    expect(runner.status).toBe("done");
  });

  it("ignores stray redeem answers and A presses while playing", () => {
    const runner = new SceneRunner([{ kind: "wait", frames: 3 }]);
    runner.resolveRedeem("already_filled");
    runner.pressA();
    expect(runner.status).toBe("playing");
    runUntilBlocked(runner);
    expect(runner.status).toBe("done");
  });

  it("switches maps, places actors, and clamps the camera", () => {
    const runner = new SceneRunner([
      { kind: "map", map: "backyard", place: { frankie: { x: 400, y: 60 } }, cameraX: 9999 },
      { kind: "camera", follow: "frankie" }
    ]);
    runner.tick();
    expect(runner.world.map).toBe("backyard");
    expect(runner.world.cameraX).toBe(MAP_WIDTH.backyard - 160);
    expect(runner.world.actors.frankie).toMatchObject({ x: 400, y: 60, visible: true });
  });

  it("carries the ball with Frankie and expires effects", () => {
    const world = createWorld();
    Object.assign(world.actors.frankie, { x: 50, y: 60, facing: "right" });
    world.actors.ball.carriedBy = "frankie";
    world.effects.push({ kind: "hearts", x: 0, y: 0, ttl: 1, total: 1 });

    stepWorld(world);
    expect(world.actors.ball).toMatchObject({ x: 62, y: 64 });
    expect(world.effects).toHaveLength(0);
  });

  it("explains every refusal", () => {
    expect(refusalLine("already_filled")).toMatch(/already/i);
    expect(refusalLine("not_enough_biscuits")).toMatch(/jar/i);
    expect(refusalLine("network")).toMatch(/try again/i);
  });
});

describe("scenes", () => {
  it.each(FRANKIE_NEEDS)("%s spends the biscuit once, after the toss, and finishes", (need) => {
    const steps: readonly Step[] = SCENES[need];
    const redeems = steps.filter((step) => step.kind === "redeem");
    expect(redeems).toHaveLength(1);

    const runner = new SceneRunner(steps);
    let redeemed = 0;
    for (let i = 0; i < 20000 && runner.status !== "done"; i += 1) {
      runner.tick();
      if (runner.status === "waitingForA") runner.pressA();
      if (runner.status === "redeeming") {
        redeemed += 1;
        runner.resolveRedeem(null);
      }
    }
    expect(runner.status).toBe("done");
    expect(redeemed).toBe(1);
  });

  it("feed always refreshes the water", () => {
    expect(SCENES.feed.some((step) => step.kind === "prop" && step.prop === "water" && step.value === "full")).toBe(true);
  });
});

describe("sprites", () => {
  const all = [
    ...Object.values(FRANKIE_SPRITES).flat(),
    ...Object.values(HUMAN_SPRITES).flat(),
    ...Object.values(ITEM_SPRITES)
  ];

  it("are rectangular and only use palette colors", () => {
    for (const grid of all) {
      expect(new Set(grid.map((row) => row.length)).size).toBe(1);
      for (const char of grid.join("")) {
        expect(char === "." || char in PALETTE).toBe(true);
      }
    }
  });

  it("characters are 16×16", () => {
    for (const grid of [...Object.values(FRANKIE_SPRITES).flat(), ...Object.values(HUMAN_SPRITES).flat()]) {
      expect(grid).toHaveLength(16);
      expect(grid[0]).toHaveLength(16);
    }
  });
});
