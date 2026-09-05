export type ExerciseCategory =
  | "barbell"
  | "dumbbell"
  | "kettlebell"
  | "bodyweight"
  | "core"
  | "monostructural";

export type ExerciseCatalogEntry = {
  slug: string;
  name: string;
  category: ExerciseCategory;
  equipment: string;
  aliases: string[];
};

export const exerciseCatalog: ExerciseCatalogEntry[] = [
  // Barbell / olympic
  { slug: "back-squat", name: "Back Squat", category: "barbell", equipment: "Barbell", aliases: ["squat"] },
  { slug: "front-squat", name: "Front Squat", category: "barbell", equipment: "Barbell", aliases: [] },
  { slug: "overhead-squat", name: "Overhead Squat", category: "barbell", equipment: "Barbell", aliases: ["ohs"] },
  { slug: "deadlift", name: "Deadlift", category: "barbell", equipment: "Barbell", aliases: ["dl"] },
  { slug: "sumo-deadlift", name: "Sumo Deadlift", category: "barbell", equipment: "Barbell", aliases: [] },
  { slug: "romanian-deadlift", name: "Romanian Deadlift", category: "barbell", equipment: "Barbell", aliases: ["rdl"] },
  { slug: "bench-press", name: "Bench Press", category: "barbell", equipment: "Barbell", aliases: ["bp", "flat bench"] },
  { slug: "incline-bench-press", name: "Incline Bench Press", category: "barbell", equipment: "Barbell", aliases: ["incline bench"] },
  { slug: "overhead-press", name: "Overhead Press", category: "barbell", equipment: "Barbell", aliases: ["ohp", "strict press", "shoulder press"] },
  { slug: "push-press", name: "Push Press", category: "barbell", equipment: "Barbell", aliases: [] },
  { slug: "push-jerk", name: "Push Jerk", category: "barbell", equipment: "Barbell", aliases: ["jerk"] },
  { slug: "barbell-row", name: "Barbell Row", category: "barbell", equipment: "Barbell", aliases: ["bent over row"] },
  { slug: "thruster", name: "Thruster", category: "barbell", equipment: "Barbell", aliases: [] },
  { slug: "power-clean", name: "Power Clean", category: "barbell", equipment: "Barbell", aliases: [] },
  { slug: "hang-power-clean", name: "Hang Power Clean", category: "barbell", equipment: "Barbell", aliases: [] },
  { slug: "clean", name: "Clean", category: "barbell", equipment: "Barbell", aliases: ["squat clean"] },
  { slug: "clean-and-jerk", name: "Clean and Jerk", category: "barbell", equipment: "Barbell", aliases: ["c&j"] },
  { slug: "snatch", name: "Snatch", category: "barbell", equipment: "Barbell", aliases: [] },
  { slug: "power-snatch", name: "Power Snatch", category: "barbell", equipment: "Barbell", aliases: [] },
  { slug: "sumo-deadlift-high-pull", name: "Sumo Deadlift High Pull", category: "barbell", equipment: "Barbell", aliases: ["sdhp"] },
  { slug: "hip-thrust", name: "Hip Thrust", category: "barbell", equipment: "Barbell", aliases: [] },
  { slug: "good-morning", name: "Good Morning", category: "barbell", equipment: "Barbell", aliases: [] },
  { slug: "front-rack-lunge", name: "Front Rack Lunge", category: "barbell", equipment: "Barbell", aliases: [] },
  { slug: "back-rack-lunge", name: "Back Rack Lunge", category: "barbell", equipment: "Barbell", aliases: [] },

  // Dumbbell
  { slug: "dumbbell-bench-press", name: "Dumbbell Bench Press", category: "dumbbell", equipment: "Dumbbell", aliases: ["db bench"] },
  { slug: "dumbbell-row", name: "Dumbbell Row", category: "dumbbell", equipment: "Dumbbell", aliases: ["db row", "single arm row"] },
  { slug: "dumbbell-shoulder-press", name: "Dumbbell Shoulder Press", category: "dumbbell", equipment: "Dumbbell", aliases: ["db shoulder press"] },
  { slug: "dumbbell-bicep-curl", name: "Dumbbell Bicep Curl", category: "dumbbell", equipment: "Dumbbell", aliases: ["db curl", "curl"] },
  { slug: "dumbbell-tricep-extension", name: "Dumbbell Tricep Extension", category: "dumbbell", equipment: "Dumbbell", aliases: ["skull crusher"] },
  { slug: "goblet-squat", name: "Goblet Squat", category: "dumbbell", equipment: "Dumbbell", aliases: [] },
  { slug: "dumbbell-lunge", name: "Dumbbell Lunge", category: "dumbbell", equipment: "Dumbbell", aliases: ["db lunge"] },
  { slug: "dumbbell-step-up", name: "Dumbbell Step-Up", category: "dumbbell", equipment: "Dumbbell", aliases: ["step up"] },
  { slug: "dumbbell-snatch", name: "Dumbbell Snatch", category: "dumbbell", equipment: "Dumbbell", aliases: ["db snatch"] },
  { slug: "dumbbell-clean", name: "Dumbbell Clean", category: "dumbbell", equipment: "Dumbbell", aliases: ["db clean"] },
  { slug: "dumbbell-thruster", name: "Dumbbell Thruster", category: "dumbbell", equipment: "Dumbbell", aliases: ["db thruster"] },
  { slug: "dumbbell-deadlift", name: "Dumbbell Deadlift", category: "dumbbell", equipment: "Dumbbell", aliases: ["db deadlift"] },
  { slug: "dumbbell-romanian-deadlift", name: "Dumbbell Romanian Deadlift", category: "dumbbell", equipment: "Dumbbell", aliases: ["db rdl"] },
  { slug: "lateral-raise", name: "Lateral Raise", category: "dumbbell", equipment: "Dumbbell", aliases: ["side raise"] },
  { slug: "front-raise", name: "Front Raise", category: "dumbbell", equipment: "Dumbbell", aliases: [] },
  { slug: "dumbbell-fly", name: "Dumbbell Fly", category: "dumbbell", equipment: "Dumbbell", aliases: ["chest fly"] },
  { slug: "renegade-row", name: "Renegade Row", category: "dumbbell", equipment: "Dumbbell", aliases: [] },

  // Kettlebell
  { slug: "kettlebell-swing", name: "Kettlebell Swing", category: "kettlebell", equipment: "Kettlebell", aliases: ["kb swing"] },
  { slug: "kettlebell-goblet-squat", name: "Kettlebell Goblet Squat", category: "kettlebell", equipment: "Kettlebell", aliases: ["kb goblet squat"] },
  { slug: "kettlebell-clean", name: "Kettlebell Clean", category: "kettlebell", equipment: "Kettlebell", aliases: ["kb clean"] },
  { slug: "kettlebell-snatch", name: "Kettlebell Snatch", category: "kettlebell", equipment: "Kettlebell", aliases: ["kb snatch"] },
  { slug: "kettlebell-clean-and-jerk", name: "Kettlebell Clean and Jerk", category: "kettlebell", equipment: "Kettlebell", aliases: ["kb c&j"] },
  { slug: "turkish-get-up", name: "Turkish Get-Up", category: "kettlebell", equipment: "Kettlebell", aliases: ["tgu"] },
  { slug: "kettlebell-deadlift", name: "Kettlebell Deadlift", category: "kettlebell", equipment: "Kettlebell", aliases: ["kb deadlift"] },
  { slug: "kettlebell-row", name: "Kettlebell Row", category: "kettlebell", equipment: "Kettlebell", aliases: ["kb row"] },
  { slug: "kettlebell-press", name: "Kettlebell Press", category: "kettlebell", equipment: "Kettlebell", aliases: ["kb press"] },
  { slug: "kettlebell-halo", name: "Kettlebell Halo", category: "kettlebell", equipment: "Kettlebell", aliases: ["kb halo"] },
  { slug: "kettlebell-windmill", name: "Kettlebell Windmill", category: "kettlebell", equipment: "Kettlebell", aliases: ["kb windmill"] },
  { slug: "kettlebell-lunge", name: "Kettlebell Lunge", category: "kettlebell", equipment: "Kettlebell", aliases: ["kb lunge"] },

  // Bodyweight — pull/push/dip
  { slug: "pull-up", name: "Pull-Up", category: "bodyweight", equipment: "Bodyweight", aliases: ["pullup", "pull ups"] },
  { slug: "chin-up", name: "Chin-Up", category: "bodyweight", equipment: "Bodyweight", aliases: ["chinup"] },
  { slug: "kipping-pull-up", name: "Kipping Pull-Up", category: "bodyweight", equipment: "Bodyweight", aliases: ["kipping pullup"] },
  { slug: "chest-to-bar-pull-up", name: "Chest-to-Bar Pull-Up", category: "bodyweight", equipment: "Bodyweight", aliases: ["c2b"] },
  { slug: "muscle-up", name: "Muscle-Up", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "push-up", name: "Push-Up", category: "bodyweight", equipment: "Bodyweight", aliases: ["pushup", "push ups"] },
  { slug: "diamond-push-up", name: "Diamond Push-Up", category: "bodyweight", equipment: "Bodyweight", aliases: ["diamond pushup"] },
  { slug: "decline-push-up", name: "Decline Push-Up", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "handstand-push-up", name: "Handstand Push-Up", category: "bodyweight", equipment: "Bodyweight", aliases: ["hspu"] },
  { slug: "dip", name: "Dip", category: "bodyweight", equipment: "Bodyweight", aliases: ["dips", "ring dip"] },
  { slug: "bench-dip", name: "Bench Dip", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "air-squat", name: "Air Squat", category: "bodyweight", equipment: "Bodyweight", aliases: ["bodyweight squat"] },
  { slug: "pistol-squat", name: "Pistol Squat", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "lunge", name: "Lunge", category: "bodyweight", equipment: "Bodyweight", aliases: ["walking lunge"] },
  { slug: "burpee", name: "Burpee", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "box-jump", name: "Box Jump", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "military-push-up", name: "Military Push-Up", category: "bodyweight", equipment: "Bodyweight", aliases: ["elbows-in push-up"] },
  { slug: "wide-front-pull-up", name: "Wide-Front Pull-Up", category: "bodyweight", equipment: "Bodyweight", aliases: ["wide grip pull-up"] },
  { slug: "closer-grip-pull-up", name: "Closer-Grip Pull-Up", category: "bodyweight", equipment: "Bodyweight", aliases: ["close grip pull-up"] },
  { slug: "corn-cob-pull-up", name: "Corn Cob Pull-Up", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "wide-fly-push-up", name: "Wide-Fly Push-Up", category: "bodyweight", equipment: "Bodyweight", aliases: ["fly push-up"] },
  { slug: "calf-raise", name: "Calf Raise", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "squat-jump", name: "Squat Jump", category: "bodyweight", equipment: "Bodyweight", aliases: ["jump squat"] },
  { slug: "jump-lunge", name: "Jump Lunge", category: "bodyweight", equipment: "Bodyweight", aliases: ["lunge jump"] },
  { slug: "lateral-jump", name: "Lateral Jump", category: "bodyweight", equipment: "Bodyweight", aliases: ["skater jump"] },
  { slug: "jab-cross", name: "Jab-Cross Combo", category: "bodyweight", equipment: "Bodyweight", aliases: ["punch combo"] },
  { slug: "front-kick", name: "Front Kick", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "roundhouse-kick", name: "Roundhouse Kick", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "horse-stance-punch", name: "Horse-Stance Punch", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "downward-dog", name: "Downward Dog", category: "bodyweight", equipment: "Bodyweight", aliases: ["down dog"] },
  { slug: "warrior-pose", name: "Warrior Pose", category: "bodyweight", equipment: "Bodyweight", aliases: ["warrior 1", "warrior 2"] },
  { slug: "chair-pose", name: "Chair Pose", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "triangle-pose", name: "Triangle Pose", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "tree-pose", name: "Tree Pose", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "cobra-pose", name: "Cobra Pose", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "seated-forward-bend", name: "Seated Forward Bend", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "hip-flexor-stretch", name: "Hip Flexor Stretch", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "hamstring-stretch", name: "Hamstring Stretch", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "quad-stretch", name: "Standing Quad Stretch", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "shoulder-stretch", name: "Cross-Body Shoulder Stretch", category: "bodyweight", equipment: "Bodyweight", aliases: [] },
  { slug: "cat-cow-stretch", name: "Cat-Cow Stretch", category: "bodyweight", equipment: "Bodyweight", aliases: [] },

  // Core
  { slug: "plank", name: "Plank", category: "core", equipment: "Bodyweight", aliases: [] },
  { slug: "side-plank", name: "Side Plank", category: "core", equipment: "Bodyweight", aliases: [] },
  { slug: "sit-up", name: "Sit-Up", category: "core", equipment: "Bodyweight", aliases: ["situp", "sit ups"] },
  { slug: "abmat-sit-up", name: "AbMat Sit-Up", category: "core", equipment: "Bodyweight", aliases: ["abmat situp"] },
  { slug: "crunch", name: "Crunch", category: "core", equipment: "Bodyweight", aliases: [] },
  { slug: "hanging-leg-raise", name: "Hanging Leg Raise", category: "core", equipment: "Bodyweight", aliases: ["leg raise"] },
  { slug: "hanging-knee-raise", name: "Hanging Knee Raise", category: "core", equipment: "Bodyweight", aliases: ["knee raise"] },
  { slug: "toes-to-bar", name: "Toes-to-Bar", category: "core", equipment: "Bodyweight", aliases: ["t2b"] },
  { slug: "hollow-hold", name: "Hollow Hold", category: "core", equipment: "Bodyweight", aliases: ["hollow body hold"] },
  { slug: "russian-twist", name: "Russian Twist", category: "core", equipment: "Bodyweight", aliases: [] },
  { slug: "ab-wheel-rollout", name: "Ab Wheel Rollout", category: "core", equipment: "Ab Wheel", aliases: ["ab rollout"] },
  { slug: "v-up", name: "V-Up", category: "core", equipment: "Bodyweight", aliases: [] },
  { slug: "flutter-kick", name: "Flutter Kick", category: "core", equipment: "Bodyweight", aliases: [] },
  { slug: "mountain-climber", name: "Mountain Climber", category: "core", equipment: "Bodyweight", aliases: [] },
  { slug: "bicycle-crunch", name: "Bicycle Crunch", category: "core", equipment: "Bodyweight", aliases: ["bicycles"] },
  { slug: "crunchy-frog", name: "Crunchy Frog", category: "core", equipment: "Bodyweight", aliases: [] },
  { slug: "fifer-scissors", name: "Fifer Scissors", category: "core", equipment: "Bodyweight", aliases: ["scissor kick"] },
  { slug: "hip-rock-and-raise", name: "Hip Rock and Raise", category: "core", equipment: "Bodyweight", aliases: [] },
  { slug: "pulse-up", name: "Pulse-Up", category: "core", equipment: "Bodyweight", aliases: [] },
  { slug: "oblique-v-up", name: "Oblique V-Up", category: "core", equipment: "Bodyweight", aliases: [] },
  { slug: "leg-climb", name: "Leg Climb", category: "core", equipment: "Bodyweight", aliases: [] },
  { slug: "mason-twist", name: "Mason Twist", category: "core", equipment: "Bodyweight", aliases: ["twist"] },
  { slug: "cherry-picker", name: "Cherry Picker", category: "core", equipment: "Bodyweight", aliases: [] },

  // Monostructural / conditioning (used by CrossFit-style circuits and WODs)
  { slug: "run", name: "Run", category: "monostructural", equipment: "None", aliases: ["running"] },
  { slug: "high-knee-run", name: "High Knees", category: "monostructural", equipment: "None", aliases: ["high knee running"] },
  { slug: "row-erg", name: "Row (Erg)", category: "monostructural", equipment: "Rower", aliases: ["row", "rowing", "row machine"] },
  { slug: "bike-erg", name: "Bike (Erg)", category: "monostructural", equipment: "Bike", aliases: ["bike", "echo bike", "assault bike"] },
  { slug: "double-under", name: "Double Under", category: "monostructural", equipment: "Jump Rope", aliases: ["du", "double unders"] },
  { slug: "single-under", name: "Single Under", category: "monostructural", equipment: "Jump Rope", aliases: ["jump rope"] },
  { slug: "wall-ball", name: "Wall Ball", category: "monostructural", equipment: "Medicine Ball", aliases: [] },
  { slug: "farmers-carry", name: "Farmers Carry", category: "monostructural", equipment: "Dumbbell", aliases: ["farmer carry"] },
  { slug: "sled-push", name: "Sled Push", category: "monostructural", equipment: "Sled", aliases: [] },
  { slug: "swim", name: "Swim", category: "monostructural", equipment: "None", aliases: ["swimming"] }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function findExercises(query: string, limit = 8): ExerciseCatalogEntry[] {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  const scored = exerciseCatalog
    .map((entry) => {
      const normalizedName = normalize(entry.name);
      const aliasMatch = entry.aliases.some((alias) => normalize(alias).includes(normalizedQuery));

      if (normalizedName.startsWith(normalizedQuery)) {
        return { entry, score: 0 };
      }

      if (entry.aliases.some((alias) => normalize(alias).startsWith(normalizedQuery))) {
        return { entry, score: 1 };
      }

      if (normalizedName.includes(normalizedQuery) || aliasMatch) {
        return { entry, score: 2 };
      }

      return null;
    })
    .filter((value): value is { entry: ExerciseCatalogEntry; score: number } => value !== null)
    .sort((a, b) => a.score - b.score || a.entry.name.localeCompare(b.entry.name));

  return scored.slice(0, limit).map((value) => value.entry);
}

export function slugifyExerciseName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "custom-exercise";
}
