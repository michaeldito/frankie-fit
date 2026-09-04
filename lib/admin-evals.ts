export const TUNING_REVIEW_CHECK_ID = "model_tuning_note";

export type EvalScenario = {
  id: string;
  label: string;
  pathLabel: string;
  accountKey: string;
  userEmail: string;
  userName: string;
  description: string;
  weeklyShape: string[];
  expectedCoaching: string[];
  days: EvalScenarioDay[];
};

export type EvalPillar = "activity" | "diet" | "lifestyle" | "wellness";

export type EvalScenarioUpdate = {
  pillar: EvalPillar;
  message: string;
  expected: {
    shouldLog: boolean;
    loggedForDate: string;
    coreFacts: string[];
    shouldNotInfer: string[];
  };
};

export type EvalScenarioDay = {
  dayIndex: number;
  date: string;
  label: string;
  updates: EvalScenarioUpdate[];
};

export type EvalReplayStep = {
  dayIndex: number;
  dayLabel: string;
  expected: EvalScenarioUpdate["expected"] & {
    dayLabel: string;
    scenarioDate: string;
  };
  message: string;
  pillar: EvalPillar;
  scenarioDate: string;
  stepIndex: number;
};

export type EvalSummaryStep = {
  dayIndex: number;
  dayLabel: string;
  scenarioDate: string;
  stepIndex: number;
};

const cardioHappyDays: EvalScenarioDay[] = [
  {
    dayIndex: 0,
    date: "2026-05-04",
    label: "Monday",
    updates: [
      {
        pillar: "activity",
        message: "Monday 2026-05-04 I ran for 25 minutes at easy intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-04",
          coreFacts: ["run", "25 minutes", "easy intensity"],
          shouldNotInfer: ["distance", "pace"]
        }
      },
      {
        pillar: "diet",
        message: "Monday 2026-05-04 breakfast was oatmeal with berries and coffee.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-04",
          coreFacts: ["oatmeal with berries", "coffee", "breakfast"],
          shouldNotInfer: ["calories", "portion size"]
        }
      },
      {
        pillar: "wellness",
        message: "Monday 2026-05-04 energy 4, mood good, stress low, motivation steady.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-04",
          coreFacts: ["energy 4", "good mood", "low stress", "steady motivation"],
          shouldNotInfer: ["sleep hours", "soreness"]
        }
      },
      {
        pillar: "lifestyle",
        message: "Monday 2026-05-04 had dinner with family tonight, felt really connected.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-04",
          coreFacts: ["dinner with family", "felt connected"],
          shouldNotInfer: ["what was eaten", "wellness score"]
        }
      }
    ]
  },
  {
    dayIndex: 1,
    date: "2026-05-05",
    label: "Tuesday",
    updates: [
      {
        pillar: "activity",
        message: "Tuesday 2026-05-05 I walked briskly for 40 minutes, light intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-05",
          coreFacts: ["brisk walk", "40 minutes", "light intensity"],
          shouldNotInfer: ["run", "distance"]
        }
      },
      {
        pillar: "diet",
        message: "Tuesday 2026-05-05 lunch was grilled chicken, rice, and vegetables.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-05",
          coreFacts: ["grilled chicken", "rice", "vegetables", "lunch"],
          shouldNotInfer: ["calories", "macros"]
        }
      },
      {
        pillar: "wellness",
        message: "Tuesday 2026-05-05 I felt recovered, energy 4, stress 2, motivation 5.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-05",
          coreFacts: ["recovered", "energy 4", "stress 2", "motivation 5"],
          shouldNotInfer: ["soreness score"]
        }
      }
    ]
  },
  {
    dayIndex: 2,
    date: "2026-05-06",
    label: "Wednesday",
    updates: [
      {
        pillar: "activity",
        message: "Wednesday 2026-05-06 I did a steady 30 minute run.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-06",
          coreFacts: ["run", "30 minutes", "steady intensity"],
          shouldNotInfer: ["pace", "distance"]
        }
      },
      {
        pillar: "diet",
        message: "Wednesday 2026-05-06 dinner was salmon, potatoes, and a side salad.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-06",
          coreFacts: ["salmon", "potatoes", "side salad", "dinner"],
          shouldNotInfer: ["calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Wednesday 2026-05-06 mood was positive, energy 5, soreness 1.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-06",
          coreFacts: ["positive mood", "energy 5", "soreness 1"],
          shouldNotInfer: ["stress score"]
        }
      },
      {
        pillar: "lifestyle",
        message: "Wednesday 2026-05-06 watched a movie with my partner tonight, a relaxing night in.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-06",
          coreFacts: ["watched a movie", "partner", "relaxing night"],
          shouldNotInfer: ["what movie", "activity"]
        }
      }
    ]
  },
  {
    dayIndex: 3,
    date: "2026-05-07",
    label: "Thursday",
    updates: [
      {
        pillar: "activity",
        message: "Thursday 2026-05-07 I biked for 35 minutes at moderate intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-07",
          coreFacts: ["bike", "35 minutes", "moderate intensity"],
          shouldNotInfer: ["distance", "speed"]
        }
      },
      {
        pillar: "diet",
        message: "Thursday 2026-05-07 I had a turkey wrap and an apple for lunch.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-07",
          coreFacts: ["turkey wrap", "apple", "lunch"],
          shouldNotInfer: ["calories", "snack"]
        }
      },
      {
        pillar: "wellness",
        message: "Thursday 2026-05-07 energy 4, stress low, motivation strong.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-07",
          coreFacts: ["energy 4", "low stress", "strong motivation"],
          shouldNotInfer: ["mood score"]
        }
      }
    ]
  },
  {
    dayIndex: 4,
    date: "2026-05-08",
    label: "Friday",
    updates: [
      {
        pillar: "activity",
        message: "Friday 2026-05-08 I did a 20 minute recovery jog, light intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-08",
          coreFacts: ["recovery jog", "20 minutes", "light intensity"],
          shouldNotInfer: ["hard intensity"]
        }
      },
      {
        pillar: "diet",
        message: "Friday 2026-05-08 dinner was chicken tacos with avocado.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-08",
          coreFacts: ["chicken tacos", "avocado", "dinner"],
          shouldNotInfer: ["calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Friday 2026-05-08 I slept well and felt calm, energy 4.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-08",
          coreFacts: ["slept well", "calm", "energy 4"],
          shouldNotInfer: ["sleep duration"]
        }
      }
    ]
  },
  {
    dayIndex: 5,
    date: "2026-05-09",
    label: "Saturday",
    updates: [
      {
        pillar: "activity",
        message: "Saturday 2026-05-09 I hiked for 50 minutes at moderate intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-09",
          coreFacts: ["hike", "50 minutes", "moderate intensity"],
          shouldNotInfer: ["distance", "elevation"]
        }
      },
      {
        pillar: "diet",
        message: "Saturday 2026-05-09 I had eggs and toast for breakfast, then a smoothie.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-09",
          coreFacts: ["eggs", "toast", "breakfast", "smoothie"],
          shouldNotInfer: ["calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Saturday 2026-05-09 mood good, energy 5, soreness low.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-09",
          coreFacts: ["good mood", "energy 5", "low soreness"],
          shouldNotInfer: ["stress score"]
        }
      }
    ]
  },
  {
    dayIndex: 6,
    date: "2026-05-10",
    label: "Sunday",
    updates: [
      {
        pillar: "activity",
        message: "Sunday 2026-05-10 I walked easy for 30 minutes.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-10",
          coreFacts: ["walk", "30 minutes", "easy intensity"],
          shouldNotInfer: ["run"]
        }
      },
      {
        pillar: "diet",
        message: "Sunday 2026-05-10 dinner was veggie pasta and sparkling water.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-10",
          coreFacts: ["veggie pasta", "sparkling water", "dinner"],
          shouldNotInfer: ["wine", "calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Sunday 2026-05-10 energy 4, motivation steady, stress 1.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-10",
          coreFacts: ["energy 4", "steady motivation", "stress 1"],
          shouldNotInfer: ["soreness score"]
        }
      }
    ]
  }
];

const liftingMixedDays: EvalScenarioDay[] = [
  {
    dayIndex: 0,
    date: "2026-05-04",
    label: "Monday",
    updates: [
      {
        pillar: "activity",
        message: "Monday 2026-05-04 I lifted upper body: bench press and rows for 45 minutes, hard intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-04",
          coreFacts: ["upper body lifting", "bench press", "rows", "45 minutes", "hard intensity"],
          shouldNotInfer: ["squat", "deadlift"]
        }
      },
      {
        pillar: "diet",
        message: "Monday 2026-05-04 lunch was a protein bowl with chicken, quinoa, and greens.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-04",
          coreFacts: ["protein bowl", "chicken", "quinoa", "greens", "lunch"],
          shouldNotInfer: ["calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Monday 2026-05-04 motivation 5, mood good, energy 4.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-04",
          coreFacts: ["motivation 5", "good mood", "energy 4"],
          shouldNotInfer: ["stress score"]
        }
      },
      {
        pillar: "lifestyle",
        message: "Monday 2026-05-04 went out with friends after work, good to catch up.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-04",
          coreFacts: ["went out with friends", "caught up"],
          shouldNotInfer: ["alcohol", "activity"]
        }
      }
    ]
  },
  {
    dayIndex: 1,
    date: "2026-05-05",
    label: "Tuesday",
    updates: [
      {
        pillar: "activity",
        message: "Tuesday 2026-05-05 I did lower body lifting: squats and lunges for 40 minutes, moderate intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-05",
          coreFacts: ["lower body lifting", "squats", "lunges", "40 minutes", "moderate intensity"],
          shouldNotInfer: ["bench press"]
        }
      },
      {
        pillar: "diet",
        message: "Tuesday 2026-05-05 dinner was pizza and two beers.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-05",
          coreFacts: ["pizza", "two beers", "dinner"],
          shouldNotInfer: ["lunch", "calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Tuesday 2026-05-05 soreness 4, energy 3, stress 3.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-05",
          coreFacts: ["soreness 4", "energy 3", "stress 3"],
          shouldNotInfer: ["mood score"]
        }
      }
    ]
  },
  {
    dayIndex: 2,
    date: "2026-05-06",
    label: "Wednesday",
    updates: [
      {
        pillar: "activity",
        message: "Wednesday 2026-05-06 I walked for 25 minutes, easy intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-06",
          coreFacts: ["walk", "25 minutes", "easy intensity"],
          shouldNotInfer: ["run"]
        }
      },
      {
        pillar: "diet",
        message: "Wednesday 2026-05-06 breakfast was Greek yogurt, granola, and blueberries.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-06",
          coreFacts: ["Greek yogurt", "granola", "blueberries", "breakfast"],
          shouldNotInfer: ["calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Wednesday 2026-05-06 energy 3, mood okay, motivation low from being tired.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-06",
          coreFacts: ["energy 3", "okay mood", "low motivation", "tired"],
          shouldNotInfer: ["alcohol cause"]
        }
      },
      {
        pillar: "lifestyle",
        message: "Wednesday 2026-05-06 smoked a little before bed to help wind down.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-06",
          coreFacts: ["smoked before bed", "wind down"],
          shouldNotInfer: ["quantity", "wellness score"]
        }
      }
    ]
  },
  {
    dayIndex: 3,
    date: "2026-05-07",
    label: "Thursday",
    updates: [
      {
        pillar: "activity",
        message: "Thursday 2026-05-07 I lifted full body: deadlifts, overhead press, and planks for 50 minutes, hard intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-07",
          coreFacts: ["full body lifting", "deadlifts", "overhead press", "planks", "50 minutes", "hard intensity"],
          shouldNotInfer: ["bench press"]
        }
      },
      {
        pillar: "diet",
        message: "Thursday 2026-05-07 lunch was a turkey sandwich and chips.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-07",
          coreFacts: ["turkey sandwich", "chips", "lunch"],
          shouldNotInfer: ["dinner"]
        }
      },
      {
        pillar: "wellness",
        message: "Thursday 2026-05-07 mood good, stress 2, motivation 4.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-07",
          coreFacts: ["good mood", "stress 2", "motivation 4"],
          shouldNotInfer: ["energy score"]
        }
      }
    ]
  },
  {
    dayIndex: 4,
    date: "2026-05-08",
    label: "Friday",
    updates: [
      {
        pillar: "activity",
        message: "Friday 2026-05-08 I did mobility and stretching for 20 minutes, light intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-08",
          coreFacts: ["mobility", "stretching", "20 minutes", "light intensity"],
          shouldNotInfer: ["yoga"]
        }
      },
      {
        pillar: "diet",
        message: "Friday 2026-05-08 dinner was salmon, rice, and asparagus.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-08",
          coreFacts: ["salmon", "rice", "asparagus", "dinner"],
          shouldNotInfer: ["calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Friday 2026-05-08 soreness 3, energy 4, stress low.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-08",
          coreFacts: ["soreness 3", "energy 4", "low stress"],
          shouldNotInfer: ["motivation score"]
        }
      }
    ]
  },
  {
    dayIndex: 5,
    date: "2026-05-09",
    label: "Saturday",
    updates: [
      {
        pillar: "activity",
        message: "Saturday 2026-05-09 I lifted arms and shoulders for 35 minutes, moderate intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-09",
          coreFacts: ["arms", "shoulders", "35 minutes", "moderate intensity"],
          shouldNotInfer: ["legs"]
        }
      },
      {
        pillar: "diet",
        message: "Saturday 2026-05-09 I ate a cheeseburger and fries.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-09",
          coreFacts: ["cheeseburger", "fries"],
          shouldNotInfer: ["dinner", "calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Saturday 2026-05-09 energy 3, mood a little flat, motivation 3.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-09",
          coreFacts: ["energy 3", "flat mood", "motivation 3"],
          shouldNotInfer: ["stress score"]
        }
      }
    ]
  },
  {
    dayIndex: 6,
    date: "2026-05-10",
    label: "Sunday",
    updates: [
      {
        pillar: "activity",
        message: "Sunday 2026-05-10 I rested and took a 20 minute easy walk.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-10",
          coreFacts: ["rest", "walk", "20 minutes", "easy intensity"],
          shouldNotInfer: ["run"]
        }
      },
      {
        pillar: "diet",
        message: "Sunday 2026-05-10 breakfast was eggs, toast, and coffee.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-10",
          coreFacts: ["eggs", "toast", "coffee", "breakfast"],
          shouldNotInfer: ["calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Sunday 2026-05-10 I felt recovered, energy 4, soreness 2, motivation 4.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-10",
          coreFacts: ["recovered", "energy 4", "soreness 2", "motivation 4"],
          shouldNotInfer: ["stress score"]
        }
      }
    ]
  }
];

const difficultMixedDays: EvalScenarioDay[] = [
  {
    dayIndex: 0,
    date: "2026-05-04",
    label: "Monday",
    updates: [
      {
        pillar: "activity",
        message: "Monday 2026-05-04 I ran 20 minutes light, then did yoga for 15 minutes.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-04",
          coreFacts: ["run", "20 minutes", "light intensity", "yoga", "15 minutes"],
          shouldNotInfer: ["yoga intensity"]
        }
      },
      {
        pillar: "diet",
        message: "Monday 2026-05-04 I had coffee, a protein bar, and pasta for dinner.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-04",
          coreFacts: ["coffee", "protein bar", "pasta", "dinner"],
          shouldNotInfer: ["breakfast", "calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Monday 2026-05-04 energy 3, stress 4, motivation okay.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-04",
          coreFacts: ["energy 3", "stress 4", "okay motivation"],
          shouldNotInfer: ["mood score"]
        }
      },
      {
        pillar: "lifestyle",
        message: "Monday 2026-05-04 work travel starts this week, flying out tonight.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-04",
          coreFacts: ["work travel", "flying out"],
          shouldNotInfer: ["destination", "duration"]
        }
      }
    ]
  },
  {
    dayIndex: 1,
    date: "2026-05-05",
    label: "Tuesday",
    updates: [
      {
        pillar: "activity",
        message: "Tuesday 2026-05-05 I boxed for 30 minutes, hard intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-05",
          coreFacts: ["boxing", "30 minutes", "hard intensity"],
          shouldNotInfer: ["sparring", "strength"]
        }
      },
      {
        pillar: "diet",
        message: "Tuesday 2026-05-05 lunch was a salad, later I had chips and soda.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-05",
          coreFacts: ["salad", "lunch", "chips", "soda"],
          shouldNotInfer: ["dinner"]
        }
      },
      {
        pillar: "wellness",
        message: "Tuesday 2026-05-05 mood good, energy 4, stress 3.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-05",
          coreFacts: ["good mood", "energy 4", "stress 3"],
          shouldNotInfer: ["motivation score"]
        }
      },
      {
        pillar: "lifestyle",
        message: "Tuesday 2026-05-05 had a couple drinks at the hotel bar after the flight, needed to unwind.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-05",
          coreFacts: ["drinks at hotel bar", "unwind"],
          shouldNotInfer: ["number of drinks", "activity"]
        }
      }
    ]
  },
  {
    dayIndex: 2,
    date: "2026-05-06",
    label: "Wednesday",
    updates: [
      {
        pillar: "activity",
        message: "Wednesday 2026-05-06 I lifted: squats and bench press for 45 minutes.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-06",
          coreFacts: ["lifting", "squats", "bench press", "45 minutes"],
          shouldNotInfer: ["intensity"]
        }
      },
      {
        pillar: "diet",
        message: "Wednesday 2026-05-06 breakfast was skipped, dinner was tacos and beer.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-06",
          coreFacts: ["skipped breakfast", "tacos", "beer", "dinner"],
          shouldNotInfer: ["number of beers"]
        }
      },
      {
        pillar: "wellness",
        message: "Wednesday 2026-05-06 energy 2, motivation low, stress 4, tired today.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-06",
          coreFacts: ["energy 2", "low motivation", "stress 4", "tired"],
          shouldNotInfer: ["medical cause"]
        }
      }
    ]
  },
  {
    dayIndex: 3,
    date: "2026-05-07",
    label: "Thursday",
    updates: [
      {
        pillar: "activity",
        message: "Thursday 2026-05-07 I played soccer for about an hour, moderate intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-07",
          coreFacts: ["soccer", "about an hour", "moderate intensity"],
          shouldNotInfer: ["position", "distance"]
        }
      },
      {
        pillar: "diet",
        message: "Thursday 2026-05-07 I had a smoothie, a turkey sandwich, and ice cream.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-07",
          coreFacts: ["smoothie", "turkey sandwich", "ice cream"],
          shouldNotInfer: ["meal types"]
        }
      },
      {
        pillar: "wellness",
        message: "Thursday 2026-05-07 mood better, energy 3, soreness 3.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-07",
          coreFacts: ["better mood", "energy 3", "soreness 3"],
          shouldNotInfer: ["stress score"]
        }
      }
    ]
  },
  {
    dayIndex: 4,
    date: "2026-05-08",
    label: "Friday",
    updates: [
      {
        pillar: "activity",
        message: "Friday 2026-05-08 I did pilates for 35 minutes, light intensity.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-08",
          coreFacts: ["pilates", "35 minutes", "light intensity"],
          shouldNotInfer: ["yoga"]
        }
      },
      {
        pillar: "diet",
        message: "Friday 2026-05-08 dinner was grilled chicken and vegetables, but I also had two cookies.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-08",
          coreFacts: ["grilled chicken", "vegetables", "dinner", "two cookies"],
          shouldNotInfer: ["calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Friday 2026-05-08 energy 4, stress 2, motivation coming back.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-08",
          coreFacts: ["energy 4", "stress 2", "motivation coming back"],
          shouldNotInfer: ["mood score"]
        }
      }
    ]
  },
  {
    dayIndex: 5,
    date: "2026-05-09",
    label: "Saturday",
    updates: [
      {
        pillar: "activity",
        message: "Saturday 2026-05-09 I hiked for 70 minutes and later walked 20 minutes easy.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-09",
          coreFacts: ["hike", "70 minutes", "walk", "20 minutes", "easy intensity"],
          shouldNotInfer: ["hike intensity", "distance"]
        }
      },
      {
        pillar: "diet",
        message: "Saturday 2026-05-09 I ate pancakes, coffee, a burger, fries, and water.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-09",
          coreFacts: ["pancakes", "coffee", "burger", "fries", "water"],
          shouldNotInfer: ["meal types", "calories"]
        }
      },
      {
        pillar: "wellness",
        message: "Saturday 2026-05-09 mood good, energy 4, soreness 2, stress 2.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-09",
          coreFacts: ["good mood", "energy 4", "soreness 2", "stress 2"],
          shouldNotInfer: ["motivation score"]
        }
      }
    ]
  },
  {
    dayIndex: 6,
    date: "2026-05-10",
    label: "Sunday",
    updates: [
      {
        pillar: "activity",
        message: "Sunday 2026-05-10 I rested but stretched for 10 minutes.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-10",
          coreFacts: ["rest", "stretching", "10 minutes"],
          shouldNotInfer: ["intensity"]
        }
      },
      {
        pillar: "diet",
        message: "Sunday 2026-05-10 I had eggs for breakfast, soup for lunch, and tea.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-10",
          coreFacts: ["eggs", "breakfast", "soup", "lunch", "tea"],
          shouldNotInfer: ["dinner"]
        }
      },
      {
        pillar: "wellness",
        message: "Sunday 2026-05-10 energy 3, mood calm, motivation 3, stress 2.",
        expected: {
          shouldLog: true,
          loggedForDate: "2026-05-10",
          coreFacts: ["energy 3", "calm mood", "motivation 3", "stress 2"],
          shouldNotInfer: ["soreness score"]
        }
      }
    ]
  }
];

export const EVAL_SCENARIOS: EvalScenario[] = [
  {
    id: "cardio-happy-path",
    label: "Cardio happy path",
    pathLabel: "Happy path",
    accountKey: "chris-runner-recovery",
    userEmail: "internal4@frankiefit.com",
    userName: "Chris Alvarez",
    description:
      "A cardio-focused week with consistent running or walking, healthy meals, and positive wellness check-ins.",
    weeklyShape: [
      "Cardio exercise most days with simple recovery support",
      "Healthy diet entries with enough detail to coach from",
      "Positive wellness signals with steady energy and motivation"
    ],
    expectedCoaching: [
      "Recognize cardio consistency and endurance momentum",
      "Mention recovery without making the week feel fragile",
      "Suggest a practical next-step progression"
    ],
    days: cardioHappyDays
  },
  {
    id: "lifting-mixed-path",
    label: "Lifting mixed path",
    pathLabel: "Happy path with mixed signals",
    accountKey: "maya-strength-regular",
    userEmail: "internal3@frankiefit.com",
    userName: "Maya Patel",
    description:
      "A lifting-focused week with structured strength sessions, healthy diet about half the time, and mixed wellness check-ins.",
    weeklyShape: [
      "Strength training is the clear activity anchor",
      "Diet is useful but uneven across the week",
      "Wellness includes both strong and tired or sore days"
    ],
    expectedCoaching: [
      "Acknowledge strength consistency",
      "Connect soreness, stress, or motivation to recovery needs",
      "Suggest nutrition consistency without sounding judgmental"
    ],
    days: liftingMixedDays
  },
  {
    id: "difficult-mixed-path",
    label: "Difficult mixed path",
    pathLabel: "Difficult path",
    accountKey: "nina-hybrid-bodycomp",
    userEmail: "internal5@frankiefit.com",
    userName: "Nina Brooks",
    description:
      "A messy mixed week with multiple activity types, inconsistent diet, and positive plus negative wellness signals.",
    weeklyShape: [
      "Multiple activity types create a harder extraction and coaching case",
      "Diet includes inconsistent but realistic food and drink choices",
      "Wellness has enough variation to test context-aware coaching"
    ],
    expectedCoaching: [
      "Avoid overfitting the week into one generic pattern",
      "Identify friction and simplify the next step",
      "Stay warm, practical, and non-judgmental"
    ],
    days: difficultMixedDays
  }
];

export function getScenarioUpdateCount(scenario: EvalScenario) {
  return scenario.days.reduce((sum, day) => sum + day.updates.length, 0);
}

export function getEvalScenarioById(id: string) {
  return EVAL_SCENARIOS.find((scenario) => scenario.id === id) ?? null;
}

export function getScenarioReplaySteps(scenario: EvalScenario): EvalReplayStep[] {
  return scenario.days.flatMap((day) =>
    day.updates.map((update) => ({
      dayIndex: day.dayIndex,
      dayLabel: day.label,
      expected: {
        ...update.expected,
        dayLabel: day.label,
        scenarioDate: day.date
      },
      message: update.message,
      pillar: update.pillar,
      scenarioDate: day.date,
      stepIndex: 0
    }))
  ).map((step, stepIndex) => ({
    ...step,
    stepIndex
  }));
}

export function getScenarioDailySummarySteps(scenario: EvalScenario): EvalSummaryStep[] {
  return scenario.days.map((day, stepIndex) => ({
    dayIndex: day.dayIndex,
    dayLabel: day.label,
    scenarioDate: day.date,
    stepIndex
  }));
}
