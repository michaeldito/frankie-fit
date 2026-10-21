import type { FrankieNeed } from "./rules";

export type WhineTier = "polite" | "hopeful" | "dramatic";

// Comedic, never guilt: Frankie wants things; the user is never "bad" for not providing them.
// Feed whines are about hearing what the user ate (logging), never about eating more or less.
export const WHINE_LINES: Record<FrankieNeed, Record<WhineTier, string>> = {
  feed: {
    polite: "*stares at the biscuit jar* …(so polite)",
    hopeful: "My bowl and I were wondering what you had today.",
    dramatic: "I'd tell you how I'm doing, but I'm too busy thinking about biscuits."
  },
  walk: {
    polite: "*sits by the door* …just checking.",
    hopeful: "Walk? Even a short one counts. I'm not picky.",
    dramatic: "*leash in mouth* walk? walk. WALK?"
  },
  play: {
    polite: "*drops ball at your feet* …(so polite)",
    hopeful: "Tell me something fun you did today? Then ball?",
    dramatic: "The ball has been lonely ALL DAY."
  },
  snuggle: {
    polite: "How are you feeling today? I'm a good listener.",
    hopeful: "Snuggle check-in? Tell me how today really went.",
    dramatic: "I have been a very good boy and I would like to be held."
  }
};
