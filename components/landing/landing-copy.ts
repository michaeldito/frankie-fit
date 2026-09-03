export type LandingVariant = "normal" | "option1" | "option2";

export type LandingCopy = {
  heroKicker: string;
  heroTitle: string;
  heroSubtitle: string;
  heroChatUser: string;
  heroChatFrankie: string;
  heroHighlights: Array<{ label: string; value: string; body: string }>;
  problemKicker: string;
  problemTitle: string;
  problemParagraphs: string[];
  howItWorks: Array<{ step: string; title: string; body: string }>;
  pillarsTitle: string;
  pillarsBody: string;
  pillars: Array<{ title: string; body: string }>;
  meetFrankieTitle: string;
  meetFrankieBody: string;
  differentiatorsTitle: string;
  differentiators: string[];
  finalTitle: string;
  finalBody: string;
};

export const LANDING_COPY: Record<LandingVariant, LandingCopy> = {
  normal: {
    heroKicker: "AI-native wellness coaching",
    heroTitle: "Log less. Understand more. Stay consistent.",
    heroSubtitle:
      "Frankie Fit is your AI-native wellness coach for exercise, food, and overall wellness. Talk to Frankie like you would a real coach, and get guidance, logging, and progress insights without turning your life into a spreadsheet.",
    heroChatUser: "Logged a run + eggs for breakfast.",
    heroChatFrankie:
      "Nice, that is your third session this week. I would keep today simple — tell me how you are feeling and I will plan the next workout around it.",
    heroHighlights: [
      { label: "This week", value: "4 workouts", body: "Active, steady, and trending up." },
      {
        label: "Next best step",
        value: "Quick recovery check-in",
        body: "Keep guidance grounded in how the week is actually feeling."
      },
      {
        label: "What Frankie sees",
        value: "More signal, less friction",
        body: "Workouts, food, and wellness stay connected in one running thread."
      }
    ],
    problemKicker: "The problem",
    problemTitle: "Most health apps ask too much and help too little.",
    problemParagraphs: [
      "Frankie Fit exists for the people who want to improve their health without spending every day doing manual admin. You talk. Frankie organizes the signal.",
      "Behind the scenes, the app turns ordinary conversations into structure, memory, summaries, and practical next-step guidance."
    ],
    howItWorks: [
      {
        step: "01",
        title: "Tell Frankie what is going on",
        body: "Log a workout, mention what you ate, or check in on how you are feeling. Natural language is enough."
      },
      {
        step: "02",
        title: "Frankie organizes the signal",
        body: "The system turns conversation into structured records, trends, and context without making you do the tedious part."
      },
      {
        step: "03",
        title: "Get your next best step",
        body: "Frankie helps you understand how things are going and what makes sense next."
      }
    ],
    pillarsTitle: "Built around the parts of health that actually connect.",
    pillarsBody:
      "Health is not one thing. Frankie Fit brings the most important pieces together so your guidance reflects your real life, not isolated data points.",
    pillars: [
      {
        title: "Exercise",
        body: "Log movement in natural language and let Frankie turn it into useful structure, trends, and next-step coaching."
      },
      {
        title: "Diet",
        body: "Track meals without turning every day into calorie accounting. Frankie helps you notice patterns without the pain."
      },
      {
        title: "Wellness",
        body: "Stay aware of energy, stress, recovery, mood, and motivation so the whole plan stays sustainable."
      }
    ],
    meetFrankieTitle: "Calm, thoughtful, grounded.",
    meetFrankieBody:
      "Frankie is the coach at the center of the experience. Not a guilt machine. Not a spreadsheet. Just a steady presence in your corner helping you stay honest about where you are and practical about what comes next.",
    differentiatorsTitle: "Simple on the surface. Smarter underneath.",
    differentiators: [
      "Conversation-first experience",
      "Less manual logging",
      "Structured insights behind the scenes",
      "One place for exercise, diet, and wellness"
    ],
    finalTitle: "Health is hard enough. The app should make it easier.",
    finalBody:
      "Frankie Fit helps you log less, understand more, and keep moving forward with a coach that sees the bigger picture."
  },
  option1: {
    heroKicker: "AI-native wellness coaching (we promise this term means something)",
    heroTitle: "Log less. Overthink more.",
    heroSubtitle:
      "Frankie Fit is an AI coach for exercise, food, and vibes. You talk to it like a person. It pretends to care. Somehow that's more motivating than a spreadsheet.",
    heroChatUser: "Logged a run + eggs for breakfast.",
    heroChatFrankie:
      "Nice, third session this week. Keep today simple — tell me how you're feeling and I'll plan the next one around it.",
    heroHighlights: [
      {
        label: "This week",
        value: "4 workouts",
        body: "Active, steady, mildly smug about it."
      },
      {
        label: "Next best step",
        value: "Quick recovery check-in",
        body: "Your knees would like a word."
      },
      {
        label: "What Frankie sees",
        value: "More signal, less friction",
        body: "Mostly harmless data collection, we swear."
      }
    ],
    problemKicker: "The problem",
    problemTitle: "Most health apps want a data-entry job application before you can log a banana.",
    problemParagraphs: [
      "Frankie Fit exists for people who want to improve their health without doing manual admin. You talk. Frankie organizes the signal.",
      "Behind the scenes it turns ordinary conversations into structure, memory, summaries, and next-step guidance — the boring part, now not your problem."
    ],
    howItWorks: [
      {
        step: "01",
        title: "Tell Frankie what happened",
        body: "Workout, meal, mood — whatever you've got."
      },
      {
        step: "02",
        title: "Frankie quietly organizes it",
        body: "Structure, trends, memory — the boring part, now not your problem."
      },
      {
        step: "03",
        title: "Get a next step",
        body: "Not a lecture. A next step."
      }
    ],
    pillarsTitle: "Built around the parts of health that actually connect.",
    pillarsBody:
      "Health is not one thing. Frankie Fit brings the most important pieces together so your guidance reflects your real life, not isolated data points.",
    pillars: [
      { title: "Exercise", body: "Turns \"I did a thing\" into something resembling data." },
      { title: "Diet", body: "Notices patterns without making you count almonds." },
      {
        title: "Wellness",
        body: "Tracks energy, stress, and mood, so the plan doesn't assume you're a robot."
      }
    ],
    meetFrankieTitle: "Calm. Observant. Mildly smug about your cardio.",
    meetFrankieBody:
      "Frankie will not yell at you for skipping leg day. Frankie might remember you skipped it, though.",
    differentiatorsTitle: "Simple on the surface. Smarter underneath.",
    differentiators: [
      "Conversation-first experience",
      "Less manual logging",
      "Structured insights behind the scenes",
      "Feels slightly seen by a language model"
    ],
    finalTitle: "Health is hard enough. Talk to Frankie.",
    finalBody: "Log less. Understand more. Feel slightly seen by a language model."
  },
  option2: {
    heroKicker: "AI-native wellness coaching (yes, we know how that sounds)",
    heroTitle: "You vs. a chat window that judges your cardio",
    heroSubtitle:
      "Frankie Fit turns \"bro I ran today, kinda, for a bit\" into an actual logged workout, because apparently that's easier than typing numbers into six separate fields like it's 2011.",
    heroChatUser: "yo i ran today",
    heroChatFrankie:
      "Logged: a run. Third session this week. Solid. Tell me how you're feeling — or don't, and I'll just assume 'fine' like everyone else does.",
    heroHighlights: [
      { label: "This week", value: "4 workouts", body: "Trending up, allegedly." },
      {
        label: "Next best step",
        value: "Recovery check-in",
        body: "Your hamstrings have filed a complaint."
      },
      {
        label: "What Frankie sees",
        value: "More signal, less friction",
        body: "Everything stays connected, whether you explained it clearly or not."
      }
    ],
    problemKicker: "The problem",
    problemTitle: "Every fitness app makes logging a sandwich feel like a mortgage application.",
    problemParagraphs: [
      "Frankie skips that. You talk, it does the tedious spreadsheet-brain stuff behind the curtain, and only bugs you when something genuinely doesn't add up.",
      "No dropdowns for \"mood while chewing.\" We checked. There isn't one."
    ],
    howItWorks: [
      {
        step: "01",
        title: "Say the messy version",
        body: "Typos welcome. Grammar optional."
      },
      {
        step: "02",
        title: "Frankie extracts the signal",
        body: "From your chaos, silently, like a very patient intern."
      },
      {
        step: "03",
        title: "Get a next step",
        body: "Not a TED talk about consistency."
      }
    ],
    pillarsTitle: "Built around the parts of health that actually connect.",
    pillarsBody:
      "Health is not one thing. Frankie Fit brings the most important pieces together so your guidance reflects your real life, not isolated data points.",
    pillars: [
      { title: "Exercise", body: "\"Ran today\" becomes an actual entry, not a vibe." },
      { title: "Diet", body: "Pattern-spotting, not calorie-shaming." },
      {
        title: "Wellness",
        body: "Energy, stress, mood — the stuff that explains why you bailed on Tuesday."
      }
    ],
    meetFrankieTitle: "A coach who has clearly seen some things.",
    meetFrankieBody:
      "Frankie stays calm about it, and will never once say \"no days off.\" Frankie believes in days off. Frankie respects days off.",
    differentiatorsTitle: "Simple on the surface. Smarter underneath.",
    differentiators: [
      "Conversation-first experience",
      "Less manual logging",
      "Structured insights behind the scenes",
      "Zero guilt-tripping in all caps"
    ],
    finalTitle: "Life's hard enough without a fitness app guilt-tripping you.",
    finalBody: "Talk to Frankie instead. Frankie gets it."
  }
};
