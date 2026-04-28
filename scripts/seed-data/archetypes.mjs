import {
  activityTemplate,
  buildWeek,
  mealTemplate,
  wellnessTemplate
} from "./weekly-rhythm.mjs"

const internalAccounts = [
  {
    key: "ava-endurance-lifter",
    email: "internal1@frankiefit.com",
    accountType: "internal_test",
    timeShiftMinutes: -8,
    profile: {
      fullName: "Ava Torres",
      ageRange: "25-34",
      primaryGoal: "Improve endurance without losing strength",
      secondaryGoals: ["Performance", "Recovery", "Energy"],
      activityLevel: "Consistently active",
      fitnessExperience: "Experienced",
      currentActivities: ["Running three times a week", "Lifting four times a week"],
      preferredActivities: ["Lifting", "Running"],
      availableEquipment: ["Full gym", "Cardio machines"],
      trainingEnvironment: "Mix of environments",
      targetTrainingDays: 5,
      typicalSessionLength: 45,
      preferredScheduleNotes: "Weekday evenings are reliable and Saturday mornings are open.",
      dietPreferences: ["High-protein", "Flexible"],
      dietRestrictions: [],
      nutritionGoal: "support endurance training without losing strength",
      energyBaseline: "Steady",
      stressBaseline: "Moderate",
      wellnessSupportFocus: ["Recovery", "Energy", "Consistency"],
      injuriesLimitations: [],
      healthConsiderations: [],
      avoidances: ["Overly rigid meal rules"],
      coachingStyle: "Direct but warm",
      preferredCheckinStyle: "Both"
    },
    week: buildWeek({
      activities: [
        activityTemplate({
          message: "I ran for 35 minutes today and kept it pretty easy.",
          activityType: "Running",
          description: "easy base run",
          durationMinutes: 35,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Lifted after work for about 50 minutes.",
          activityType: "Strength training",
          description: "full-body lift after work",
          durationMinutes: 50,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Did a shorter walk today, around 30 minutes.",
          activityType: "Walking",
          description: "short midday walk",
          durationMinutes: 30,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Mobility work for 20 minutes tonight.",
          activityType: "Mobility",
          description: "mobility and recovery work",
          durationMinutes: 20,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Ran for 40 minutes and held a steady pace.",
          activityType: "Running",
          description: "steady endurance run",
          durationMinutes: 40,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Longer strength session today, around 55 minutes and pretty heavy.",
          activityType: "Strength training",
          description: "longer heavy strength session",
          durationMinutes: 55,
          intensity: "Hard"
        }),
        activityTemplate({
          message: "Wrapped up the week with a 45 minute walk.",
          activityType: "Walking",
          description: "long reset walk",
          durationMinutes: 45,
          intensity: "Light"
        })
      ],
      meals: [
        mealTemplate({
          message: "Breakfast was eggs, fruit, and toast.",
          mealType: "breakfast",
          description: "eggs, fruit, and toast"
        }),
        mealTemplate({
          message: "Lunch was chicken, rice, and vegetables.",
          mealType: "lunch",
          description: "chicken, rice, and vegetables"
        }),
        mealTemplate({
          message: "Snack was greek yogurt, berries, and almonds.",
          mealType: "snack",
          description: "greek yogurt, berries, and almonds",
          confidence: 0.88
        }),
        mealTemplate({
          message: "Dinner was salmon, potatoes, and salad.",
          mealType: "dinner",
          description: "salmon, potatoes, and salad"
        }),
        mealTemplate({
          message: "Lunch was a turkey sandwich and fruit.",
          mealType: "lunch",
          description: "turkey sandwich and fruit"
        }),
        mealTemplate({
          message: "Dinner was pasta with chicken and vegetables.",
          mealType: "dinner",
          description: "pasta with chicken and vegetables"
        }),
        mealTemplate({
          message: "Breakfast was protein oats and a banana.",
          mealType: "breakfast",
          description: "protein oats and a banana"
        })
      ],
      wellness: [
        wellnessTemplate({
          message: "Energy feels solid, stress is low, and motivation is good today.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "A little sore but overall I feel pretty steady.",
          energyScore: 4,
          sorenessScore: 3,
          moodScore: 4,
          stressScore: 3,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Energy is okay today and stress is a bit higher from work.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 4,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Legs are a little tired and I am keeping recovery in mind today.",
          energyScore: 3,
          sorenessScore: 4,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Energy bounced back and motivation feels high.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 3,
          motivationScore: 5
        }),
        wellnessTemplate({
          message: "Feeling strong today, low stress, and very ready to train.",
          energyScore: 5,
          sorenessScore: 3,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 5
        }),
        wellnessTemplate({
          message: "Energy is steady and I feel reset heading into the next week.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        })
      ]
    })
  },
  {
    key: "jordan-busy-consistency",
    email: "internal2@frankiefit.com",
    accountType: "internal_test",
    timeShiftMinutes: 4,
    profile: {
      fullName: "Jordan Lee",
      ageRange: "35-44",
      primaryGoal: "Rebuild consistency around a busy schedule",
      secondaryGoals: ["Consistency", "Energy", "General health"],
      activityLevel: "Moderately active",
      fitnessExperience: "Intermediate",
      currentActivities: ["Walking most days", "Lifting when the week allows"],
      preferredActivities: ["Walking", "Lifting", "Mobility"],
      availableEquipment: ["Full gym", "Dumbbells", "Bodyweight only"],
      trainingEnvironment: "Mix of environments",
      targetTrainingDays: 4,
      typicalSessionLength: 30,
      preferredScheduleNotes: "Early evenings and weekend mornings work best.",
      dietPreferences: ["High-protein", "Flexible"],
      dietRestrictions: [],
      nutritionGoal: "eat more consistently during busy workdays",
      energyBaseline: "Up and down",
      stressBaseline: "High",
      wellnessSupportFocus: ["Consistency", "Stress", "Energy"],
      injuriesLimitations: [],
      healthConsiderations: [],
      avoidances: ["All or nothing language"],
      coachingStyle: "Balanced mix",
      preferredCheckinStyle: "Quick check-ins"
    },
    week: buildWeek({
      activities: [
        activityTemplate({
          message: "Got in a 30 minute walk before dinner.",
          activityType: "Walking",
          description: "evening walk before dinner",
          durationMinutes: 30,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Lifted for about 35 minutes after work.",
          activityType: "Strength training",
          description: "short after-work lift",
          durationMinutes: 35,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Just did 20 minutes of mobility today.",
          activityType: "Mobility",
          description: "mobility reset session",
          durationMinutes: 20,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Walked for 40 minutes today.",
          activityType: "Walking",
          description: "longer walk to stay consistent",
          durationMinutes: 40,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Back in the gym for a 40 minute lift.",
          activityType: "Strength training",
          description: "return-to-gym strength session",
          durationMinutes: 40,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Got another long walk in, a little over 45 minutes.",
          activityType: "Walking",
          description: "weekend long walk",
          durationMinutes: 45,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Finished the week with 20 minutes of stretching and mobility.",
          activityType: "Mobility",
          description: "stretching and mobility finish",
          durationMinutes: 20,
          intensity: "Light"
        })
      ],
      meals: [
        mealTemplate({
          message: "Breakfast was a protein shake and toast.",
          mealType: "breakfast",
          description: "protein shake and toast"
        }),
        mealTemplate({
          message: "Lunch was chicken, rice, and fruit.",
          mealType: "lunch",
          description: "chicken, rice, and fruit"
        }),
        mealTemplate({
          message: "Snack was a protein bar and coffee.",
          mealType: "snack",
          description: "protein bar and coffee",
          confidence: 0.86
        }),
        mealTemplate({
          message: "Dinner was ground turkey, potatoes, and vegetables.",
          mealType: "dinner",
          description: "ground turkey, potatoes, and vegetables"
        }),
        mealTemplate({
          message: "Lunch was a sandwich and yogurt.",
          mealType: "lunch",
          description: "sandwich and yogurt"
        }),
        mealTemplate({
          message: "Dinner was tacos and a side salad.",
          mealType: "dinner",
          description: "tacos and a side salad"
        }),
        mealTemplate({
          message: "Breakfast was oatmeal, fruit, and a shake.",
          mealType: "breakfast",
          description: "oatmeal, fruit, and a shake"
        })
      ],
      wellness: [
        wellnessTemplate({
          message: "Energy is decent and motivation is steady today.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "A little tight from lifting but overall okay.",
          energyScore: 3,
          sorenessScore: 3,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Stress is high today and energy feels a bit low.",
          energyScore: 2,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 4,
          motivationScore: 2
        }),
        wellnessTemplate({
          message: "Mood is steady and I feel a little more settled.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Energy is better and motivation is back up today.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 3,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Low stress today and I feel good about the week.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Energy is steady and recovery feels fine heading into Monday.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 3
        })
      ]
    })
  },
  {
    key: "maya-strength-regular",
    email: "internal3@frankiefit.com",
    accountType: "internal_test",
    timeShiftMinutes: 11,
    profile: {
      fullName: "Maya Patel",
      ageRange: "25-34",
      primaryGoal: "Push strength and body composition",
      secondaryGoals: ["Performance", "Body composition", "Recovery"],
      activityLevel: "Consistently active",
      fitnessExperience: "Experienced",
      currentActivities: ["Lifting five days a week", "Walking for recovery"],
      preferredActivities: ["Lifting", "Walking"],
      availableEquipment: ["Full gym", "Dumbbells", "Cardio machines"],
      trainingEnvironment: "Gym",
      targetTrainingDays: 5,
      typicalSessionLength: 60,
      preferredScheduleNotes: "Training is easiest before work and on weekend mornings.",
      dietPreferences: ["High-protein", "Low-carb"],
      dietRestrictions: [],
      nutritionGoal: "support strength progress while staying leaner",
      energyBaseline: "Strong",
      stressBaseline: "Moderate",
      wellnessSupportFocus: ["Recovery", "Consistency", "Motivation"],
      injuriesLimitations: [],
      healthConsiderations: [],
      avoidances: ["Generic motivational fluff"],
      coachingStyle: "Motivating",
      preferredCheckinStyle: "Both"
    },
    week: buildWeek({
      activities: [
        activityTemplate({
          message: "Lower body session today for about 60 minutes.",
          activityType: "Strength training",
          description: "lower body strength session",
          durationMinutes: 60,
          intensity: "Hard"
        }),
        activityTemplate({
          message: "Did a 35 minute walk for recovery.",
          activityType: "Walking",
          description: "recovery walk",
          durationMinutes: 35,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Upper body lift after work for 55 minutes.",
          activityType: "Strength training",
          description: "upper body strength session",
          durationMinutes: 55,
          intensity: "Hard"
        }),
        activityTemplate({
          message: "Mobility and stretching for 20 minutes tonight.",
          activityType: "Mobility",
          description: "mobility and stretching session",
          durationMinutes: 20,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Full body training today, around 50 minutes.",
          activityType: "Strength training",
          description: "full body strength session",
          durationMinutes: 50,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Long walk this morning for 50 minutes.",
          activityType: "Walking",
          description: "weekend long walk",
          durationMinutes: 50,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Shorter accessory lift today for 35 minutes.",
          activityType: "Strength training",
          description: "short accessory strength session",
          durationMinutes: 35,
          intensity: "Moderate"
        })
      ],
      meals: [
        mealTemplate({
          message: "Breakfast was eggs, avocado, and coffee.",
          mealType: "breakfast",
          description: "eggs, avocado, and coffee"
        }),
        mealTemplate({
          message: "Lunch was chicken, vegetables, and rice.",
          mealType: "lunch",
          description: "chicken, vegetables, and rice"
        }),
        mealTemplate({
          message: "Snack was greek yogurt and a protein shake.",
          mealType: "snack",
          description: "greek yogurt and a protein shake",
          confidence: 0.88
        }),
        mealTemplate({
          message: "Dinner was steak, potatoes, and salad.",
          mealType: "dinner",
          description: "steak, potatoes, and salad"
        }),
        mealTemplate({
          message: "Lunch was turkey, fruit, and rice cakes.",
          mealType: "lunch",
          description: "turkey, fruit, and rice cakes"
        }),
        mealTemplate({
          message: "Dinner was salmon and roasted vegetables.",
          mealType: "dinner",
          description: "salmon and roasted vegetables"
        }),
        mealTemplate({
          message: "Breakfast was oatmeal, berries, and a shake.",
          mealType: "breakfast",
          description: "oatmeal, berries, and a shake"
        })
      ],
      wellness: [
        wellnessTemplate({
          message: "Feeling strong and motivated today.",
          energyScore: 5,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 5
        }),
        wellnessTemplate({
          message: "A little sore from yesterday but energy is still good.",
          energyScore: 4,
          sorenessScore: 3,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Upper body feels good and mood is solid.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 3,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Recovering today and keeping the day easier.",
          energyScore: 3,
          sorenessScore: 4,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Energy is back up and I feel focused.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 5
        }),
        wellnessTemplate({
          message: "Low stress today and feeling locked in.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 5,
          stressScore: 1,
          motivationScore: 5
        }),
        wellnessTemplate({
          message: "A little tired but overall in a good place.",
          energyScore: 3,
          sorenessScore: 3,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        })
      ]
    })
  },
  {
    key: "chris-runner-recovery",
    email: "internal4@frankiefit.com",
    accountType: "internal_test",
    timeShiftMinutes: -3,
    profile: {
      fullName: "Chris Alvarez",
      ageRange: "35-44",
      primaryGoal: "Improve running while managing stress and recovery",
      secondaryGoals: ["Performance", "Stress", "Recovery"],
      activityLevel: "Consistently active",
      fitnessExperience: "Intermediate",
      currentActivities: ["Running four days a week", "Walking and mobility"],
      preferredActivities: ["Running", "Walking", "Mobility"],
      availableEquipment: ["Bodyweight only", "Cardio machines"],
      trainingEnvironment: "Outdoors",
      targetTrainingDays: 5,
      typicalSessionLength: 45,
      preferredScheduleNotes: "Morning runs feel best and Sundays are lighter.",
      dietPreferences: ["Mediterranean", "Flexible"],
      dietRestrictions: [],
      nutritionGoal: "support recovery and keep meals simple",
      energyBaseline: "Up and down",
      stressBaseline: "High",
      wellnessSupportFocus: ["Stress", "Recovery", "Energy"],
      injuriesLimitations: ["tight calves when volume climbs too fast"],
      healthConsiderations: [],
      avoidances: ["Overly aggressive training jumps"],
      coachingStyle: "Gentle and steady",
      preferredCheckinStyle: "Both"
    },
    week: buildWeek({
      activities: [
        activityTemplate({
          message: "Ran for 30 minutes this morning at an easy pace.",
          activityType: "Running",
          description: "easy morning run",
          durationMinutes: 30,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Walked for 40 minutes and kept it relaxed.",
          activityType: "Walking",
          description: "relaxed recovery walk",
          durationMinutes: 40,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Ran again today for 38 minutes and it felt steady.",
          activityType: "Running",
          description: "steady endurance run",
          durationMinutes: 38,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Did 20 minutes of mobility work tonight.",
          activityType: "Mobility",
          description: "mobility for calves and hips",
          durationMinutes: 20,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Got in a 32 minute run after work.",
          activityType: "Running",
          description: "post-work run",
          durationMinutes: 32,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Longer walk today for 55 minutes.",
          activityType: "Walking",
          description: "long recovery walk",
          durationMinutes: 55,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Finished the week with a 25 minute easy run.",
          activityType: "Running",
          description: "short easy finish run",
          durationMinutes: 25,
          intensity: "Light"
        })
      ],
      meals: [
        mealTemplate({
          message: "Breakfast was oatmeal, berries, and yogurt.",
          mealType: "breakfast",
          description: "oatmeal, berries, and yogurt"
        }),
        mealTemplate({
          message: "Lunch was a chicken wrap and fruit.",
          mealType: "lunch",
          description: "chicken wrap and fruit"
        }),
        mealTemplate({
          message: "Snack was a banana and a protein shake.",
          mealType: "snack",
          description: "banana and a protein shake",
          confidence: 0.88
        }),
        mealTemplate({
          message: "Dinner was rice, salmon, and vegetables.",
          mealType: "dinner",
          description: "rice, salmon, and vegetables"
        }),
        mealTemplate({
          message: "Lunch was turkey, potatoes, and salad.",
          mealType: "lunch",
          description: "turkey, potatoes, and salad"
        }),
        mealTemplate({
          message: "Dinner was pasta, chicken, and greens.",
          mealType: "dinner",
          description: "pasta, chicken, and greens"
        }),
        mealTemplate({
          message: "Breakfast was eggs, toast, and fruit.",
          mealType: "breakfast",
          description: "eggs, toast, and fruit"
        })
      ],
      wellness: [
        wellnessTemplate({
          message: "Energy is decent and stress is manageable today.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Mood is better after the walk and I feel calmer.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "A little tight in the calves but overall okay.",
          energyScore: 3,
          sorenessScore: 3,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Stress is high today and energy feels a little low.",
          energyScore: 2,
          sorenessScore: 2,
          moodScore: 2,
          stressScore: 4,
          motivationScore: 2
        }),
        wellnessTemplate({
          message: "Feeling more settled and motivation is back up.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 3,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Low stress today and recovery feels good.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 1,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Energy is steady and I feel ready for another week.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        })
      ]
    })
  },
  {
    key: "nina-hybrid-bodycomp",
    email: "internal5@frankiefit.com",
    accountType: "internal_test",
    timeShiftMinutes: 7,
    profile: {
      fullName: "Nina Brooks",
      ageRange: "25-34",
      primaryGoal: "Improve body composition with a balanced routine",
      secondaryGoals: ["Body composition", "Consistency", "Energy"],
      activityLevel: "Moderately active",
      fitnessExperience: "Intermediate",
      currentActivities: ["Lifting three times a week", "Cycling once or twice a week"],
      preferredActivities: ["Lifting", "Cycling", "Walking"],
      availableEquipment: ["Full gym", "Dumbbells", "Cardio machines"],
      trainingEnvironment: "Mix of environments",
      targetTrainingDays: 4,
      typicalSessionLength: 45,
      preferredScheduleNotes: "Midday workouts on flexible days and weekend rides work well.",
      dietPreferences: ["High-protein", "Mediterranean"],
      dietRestrictions: [],
      nutritionGoal: "keep meals balanced and easy to repeat",
      energyBaseline: "Steady",
      stressBaseline: "Moderate",
      wellnessSupportFocus: ["Consistency", "Energy", "Recovery"],
      injuriesLimitations: [],
      healthConsiderations: [],
      avoidances: ["Very restrictive food framing"],
      coachingStyle: "Balanced mix",
      preferredCheckinStyle: "Weekly reflection"
    },
    week: buildWeek({
      activities: [
        activityTemplate({
          message: "Lifted for 45 minutes today.",
          activityType: "Strength training",
          description: "balanced strength session",
          durationMinutes: 45,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Went for a 40 minute ride after work.",
          activityType: "Cycling",
          description: "after-work cycling session",
          durationMinutes: 40,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Did a 30 minute walk today.",
          activityType: "Walking",
          description: "midday walk",
          durationMinutes: 30,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Mobility session tonight for about 20 minutes.",
          activityType: "Mobility",
          description: "mobility and stretching",
          durationMinutes: 20,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Back to lifting for 50 minutes.",
          activityType: "Strength training",
          description: "return lift session",
          durationMinutes: 50,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Longer ride today, around 55 minutes.",
          activityType: "Cycling",
          description: "longer weekend ride",
          durationMinutes: 55,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Finished the week with a 35 minute walk.",
          activityType: "Walking",
          description: "end-of-week walk",
          durationMinutes: 35,
          intensity: "Light"
        })
      ],
      meals: [
        mealTemplate({
          message: "Breakfast was eggs, berries, and yogurt.",
          mealType: "breakfast",
          description: "eggs, berries, and yogurt"
        }),
        mealTemplate({
          message: "Lunch was salmon, rice, and vegetables.",
          mealType: "lunch",
          description: "salmon, rice, and vegetables"
        }),
        mealTemplate({
          message: "Snack was a smoothie and almonds.",
          mealType: "snack",
          description: "a smoothie and almonds",
          confidence: 0.84
        }),
        mealTemplate({
          message: "Dinner was chicken, potatoes, and greens.",
          mealType: "dinner",
          description: "chicken, potatoes, and greens"
        }),
        mealTemplate({
          message: "Lunch was turkey, rice, and fruit.",
          mealType: "lunch",
          description: "turkey, rice, and fruit"
        }),
        mealTemplate({
          message: "Dinner was pasta, salad, and grilled chicken.",
          mealType: "dinner",
          description: "pasta, salad, and grilled chicken"
        }),
        mealTemplate({
          message: "Breakfast was oatmeal, banana, and a shake.",
          mealType: "breakfast",
          description: "oatmeal, banana, and a shake"
        })
      ],
      wellness: [
        wellnessTemplate({
          message: "Energy is good and motivation feels solid today.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "A little leg soreness from the ride but overall good.",
          energyScore: 4,
          sorenessScore: 3,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Energy is okay and work stress is moderate today.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Taking recovery a bit more seriously today.",
          energyScore: 3,
          sorenessScore: 4,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Feeling better and ready to push a little again.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Low stress and pretty good energy today.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Steady mood and a good recovery day overall.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 3
        })
      ]
    })
  }
]

const syntheticAccounts = [
  {
    key: "leo-home-workouts",
    email: "synthetic1@frankiefit.com",
    accountType: "synthetic_demo",
    timeShiftMinutes: -10,
    profile: {
      fullName: "Leo Martinez",
      ageRange: "35-44",
      primaryGoal: "Stay consistent with short home sessions",
      secondaryGoals: ["Consistency", "Energy", "General health"],
      activityLevel: "Lightly active",
      fitnessExperience: "Getting back into it",
      currentActivities: ["Walking a few days a week", "Short home workouts"],
      preferredActivities: ["Lifting", "Mobility", "Walking"],
      availableEquipment: ["Dumbbells", "Resistance bands", "Bodyweight only"],
      trainingEnvironment: "Home",
      targetTrainingDays: 4,
      typicalSessionLength: 30,
      preferredScheduleNotes: "Short morning sessions are easiest to keep.",
      dietPreferences: ["Flexible"],
      dietRestrictions: [],
      nutritionGoal: "keep meals simple enough to repeat consistently",
      energyBaseline: "Up and down",
      stressBaseline: "Moderate",
      wellnessSupportFocus: ["Consistency", "Energy", "Motivation"],
      injuriesLimitations: [],
      healthConsiderations: [],
      avoidances: ["Overcomplicated programming"],
      coachingStyle: "Gentle and steady",
      preferredCheckinStyle: "Quick check-ins"
    },
    week: buildWeek({
      activities: [
        activityTemplate({
          message: "Did a 25 minute home workout this morning.",
          activityType: "Strength training",
          description: "short home workout",
          durationMinutes: 25,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Walked for 35 minutes after dinner.",
          activityType: "Walking",
          description: "after-dinner walk",
          durationMinutes: 35,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Mobility work for 15 minutes today.",
          activityType: "Mobility",
          description: "brief mobility session",
          durationMinutes: 15,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Another short home workout, about 20 minutes.",
          activityType: "Strength training",
          description: "short bodyweight and dumbbell workout",
          durationMinutes: 20,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Went for a 30 minute walk during lunch.",
          activityType: "Walking",
          description: "lunchtime walk",
          durationMinutes: 30,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Home workout for 30 minutes today.",
          activityType: "Strength training",
          description: "weekend home workout",
          durationMinutes: 30,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Finished the week with 20 minutes of stretching and mobility.",
          activityType: "Mobility",
          description: "stretching and mobility reset",
          durationMinutes: 20,
          intensity: "Light"
        })
      ],
      meals: [
        mealTemplate({
          message: "Breakfast was oatmeal and coffee.",
          mealType: "breakfast",
          description: "oatmeal and coffee"
        }),
        mealTemplate({
          message: "Lunch was chicken and rice.",
          mealType: "lunch",
          description: "chicken and rice"
        }),
        mealTemplate({
          message: "Snack was yogurt and fruit.",
          mealType: "snack",
          description: "yogurt and fruit",
          confidence: 0.86
        }),
        mealTemplate({
          message: "Dinner was tacos and salad.",
          mealType: "dinner",
          description: "tacos and salad"
        }),
        mealTemplate({
          message: "Lunch was a sandwich and an apple.",
          mealType: "lunch",
          description: "a sandwich and an apple"
        }),
        mealTemplate({
          message: "Dinner was pasta with chicken.",
          mealType: "dinner",
          description: "pasta with chicken"
        }),
        mealTemplate({
          message: "Breakfast was eggs and toast.",
          mealType: "breakfast",
          description: "eggs and toast"
        })
      ],
      wellness: [
        wellnessTemplate({
          message: "Energy is okay and motivation is decent today.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Mood is good after the walk and stress is lower.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "A little tired today but still moving.",
          energyScore: 2,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 2
        }),
        wellnessTemplate({
          message: "Energy is a bit better and recovery feels fine.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Stress is manageable and motivation is back up.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Feeling good today and more settled overall.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Energy is steady and I feel ready to keep the routine going.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 3
        })
      ]
    })
  },
  {
    key: "priya-vegetarian-energy",
    email: "synthetic2@frankiefit.com",
    accountType: "synthetic_demo",
    timeShiftMinutes: 2,
    profile: {
      fullName: "Priya Shah",
      ageRange: "25-34",
      primaryGoal: "Improve daily energy and training consistency",
      secondaryGoals: ["Energy", "Consistency", "General health"],
      activityLevel: "Moderately active",
      fitnessExperience: "Intermediate",
      currentActivities: ["Yoga classes twice a week", "Walking most days"],
      preferredActivities: ["Classes", "Walking", "Yoga"],
      availableEquipment: ["Bodyweight only", "Resistance bands"],
      trainingEnvironment: "Mix of environments",
      targetTrainingDays: 4,
      typicalSessionLength: 45,
      preferredScheduleNotes: "Evening classes and morning walks fit best.",
      dietPreferences: ["Vegetarian", "High-protein"],
      dietRestrictions: [],
      nutritionGoal: "eat in a way that supports steadier energy",
      energyBaseline: "Up and down",
      stressBaseline: "Moderate",
      wellnessSupportFocus: ["Energy", "Consistency", "Mental clarity"],
      injuriesLimitations: [],
      healthConsiderations: [],
      avoidances: ["Harsh guilt-driven coaching"],
      coachingStyle: "Balanced mix",
      preferredCheckinStyle: "Both"
    },
    week: buildWeek({
      activities: [
        activityTemplate({
          message: "Walked for 35 minutes this morning.",
          activityType: "Walking",
          description: "morning walk",
          durationMinutes: 35,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Yoga class tonight for 45 minutes.",
          activityType: "Yoga",
          description: "evening yoga class",
          durationMinutes: 45,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Did a 25 minute walk during lunch.",
          activityType: "Walking",
          description: "lunchtime walk",
          durationMinutes: 25,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Another yoga session today, around 40 minutes.",
          activityType: "Yoga",
          description: "second yoga session",
          durationMinutes: 40,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Walked for 30 minutes after work.",
          activityType: "Walking",
          description: "after-work walk",
          durationMinutes: 30,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Longer walk today for 50 minutes.",
          activityType: "Walking",
          description: "longer weekend walk",
          durationMinutes: 50,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Did 20 minutes of mobility and stretching.",
          activityType: "Mobility",
          description: "mobility and stretching",
          durationMinutes: 20,
          intensity: "Light"
        })
      ],
      meals: [
        mealTemplate({
          message: "Breakfast was greek yogurt, berries, and granola.",
          mealType: "breakfast",
          description: "greek yogurt, berries, and granola"
        }),
        mealTemplate({
          message: "Lunch was lentils, rice, and vegetables.",
          mealType: "lunch",
          description: "lentils, rice, and vegetables"
        }),
        mealTemplate({
          message: "Snack was a smoothie and nuts.",
          mealType: "snack",
          description: "a smoothie and nuts",
          confidence: 0.84
        }),
        mealTemplate({
          message: "Dinner was tofu, noodles, and vegetables.",
          mealType: "dinner",
          description: "tofu, noodles, and vegetables"
        }),
        mealTemplate({
          message: "Lunch was a chickpea wrap and fruit.",
          mealType: "lunch",
          description: "a chickpea wrap and fruit"
        }),
        mealTemplate({
          message: "Dinner was paneer, potatoes, and salad.",
          mealType: "dinner",
          description: "paneer, potatoes, and salad"
        }),
        mealTemplate({
          message: "Breakfast was oats, banana, and a protein shake.",
          mealType: "breakfast",
          description: "oats, banana, and a protein shake"
        })
      ],
      wellness: [
        wellnessTemplate({
          message: "Energy feels okay and mood is steady.",
          energyScore: 3,
          sorenessScore: 1,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Feeling calmer after class and energy is a little better.",
          energyScore: 4,
          sorenessScore: 1,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Stress is moderate and I feel slightly tired today.",
          energyScore: 2,
          sorenessScore: 1,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 2
        }),
        wellnessTemplate({
          message: "Mood is good and I feel more reset today.",
          energyScore: 3,
          sorenessScore: 1,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Energy is more solid and motivation is back up.",
          energyScore: 4,
          sorenessScore: 1,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Low stress today and I feel good overall.",
          energyScore: 4,
          sorenessScore: 1,
          moodScore: 4,
          stressScore: 1,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Steady energy and a clear head heading into the week.",
          energyScore: 3,
          sorenessScore: 1,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 3
        })
      ]
    })
  },
  {
    key: "marcus-recovery-first",
    email: "synthetic3@frankiefit.com",
    accountType: "synthetic_demo",
    timeShiftMinutes: -5,
    profile: {
      fullName: "Marcus Reed",
      ageRange: "45-54",
      primaryGoal: "Reduce stress and rebuild sustainable momentum",
      secondaryGoals: ["Stress", "Consistency", "Recovery"],
      activityLevel: "Lightly active",
      fitnessExperience: "Getting back into it",
      currentActivities: ["Walking a few times a week", "Occasional bike rides"],
      preferredActivities: ["Walking", "Mobility", "Cycling"],
      availableEquipment: ["Bodyweight only", "Cardio machines"],
      trainingEnvironment: "Outdoors",
      targetTrainingDays: 4,
      typicalSessionLength: 30,
      preferredScheduleNotes: "Short sessions after work and longer weekend walks are realistic.",
      dietPreferences: ["Flexible"],
      dietRestrictions: [],
      nutritionGoal: "make daily choices feel less chaotic",
      energyBaseline: "Low",
      stressBaseline: "High",
      wellnessSupportFocus: ["Stress", "Recovery", "Consistency"],
      injuriesLimitations: ["some low back tightness when inactive too long"],
      healthConsiderations: [],
      avoidances: ["Punishing language"],
      coachingStyle: "Gentle and steady",
      preferredCheckinStyle: "Quick check-ins"
    },
    week: buildWeek({
      activities: [
        activityTemplate({
          message: "Walked for 25 minutes after work.",
          activityType: "Walking",
          description: "after-work walk",
          durationMinutes: 25,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Did 15 minutes of mobility today.",
          activityType: "Mobility",
          description: "mobility reset",
          durationMinutes: 15,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Short bike ride for 30 minutes tonight.",
          activityType: "Cycling",
          description: "short evening bike ride",
          durationMinutes: 30,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Walked again today for 35 minutes.",
          activityType: "Walking",
          description: "steady walk",
          durationMinutes: 35,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Mobility work for 20 minutes and it felt good.",
          activityType: "Mobility",
          description: "mobility and stretching",
          durationMinutes: 20,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Longer walk today, around 45 minutes.",
          activityType: "Walking",
          description: "longer weekend walk",
          durationMinutes: 45,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Easy bike ride for 25 minutes today.",
          activityType: "Cycling",
          description: "easy recovery bike ride",
          durationMinutes: 25,
          intensity: "Light"
        })
      ],
      meals: [
        mealTemplate({
          message: "Breakfast was eggs and toast.",
          mealType: "breakfast",
          description: "eggs and toast"
        }),
        mealTemplate({
          message: "Lunch was chicken soup and bread.",
          mealType: "lunch",
          description: "chicken soup and bread"
        }),
        mealTemplate({
          message: "Snack was yogurt and a banana.",
          mealType: "snack",
          description: "yogurt and a banana",
          confidence: 0.86
        }),
        mealTemplate({
          message: "Dinner was rice, chicken, and vegetables.",
          mealType: "dinner",
          description: "rice, chicken, and vegetables"
        }),
        mealTemplate({
          message: "Lunch was a turkey sandwich and fruit.",
          mealType: "lunch",
          description: "a turkey sandwich and fruit"
        }),
        mealTemplate({
          message: "Dinner was pasta and salad.",
          mealType: "dinner",
          description: "pasta and salad"
        }),
        mealTemplate({
          message: "Breakfast was oatmeal and berries.",
          mealType: "breakfast",
          description: "oatmeal and berries"
        })
      ],
      wellness: [
        wellnessTemplate({
          message: "Stress is high today and energy feels low.",
          energyScore: 2,
          sorenessScore: 2,
          moodScore: 2,
          stressScore: 4,
          motivationScore: 2
        }),
        wellnessTemplate({
          message: "A little calmer today and my back feels better.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Still carrying some stress but mood is more steady.",
          energyScore: 2,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 4,
          motivationScore: 2
        }),
        wellnessTemplate({
          message: "Energy is okay and I feel a little more settled.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Lower stress today and motivation is improving.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 2,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Feeling pretty good after the longer walk.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Steady mood and a decent reset day overall.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 3
        })
      ]
    })
  },
  {
    key: "elena-analytical-planner",
    email: "synthetic4@frankiefit.com",
    accountType: "synthetic_demo",
    timeShiftMinutes: 9,
    profile: {
      fullName: "Elena Kim",
      ageRange: "35-44",
      primaryGoal: "Build a structured training rhythm with useful insight",
      secondaryGoals: ["Performance", "Consistency", "Mental clarity"],
      activityLevel: "Moderately active",
      fitnessExperience: "Experienced",
      currentActivities: ["Running twice a week", "Lifting twice a week", "Cycling on weekends"],
      preferredActivities: ["Running", "Lifting", "Cycling"],
      availableEquipment: ["Full gym", "Cardio machines"],
      trainingEnvironment: "Mix of environments",
      targetTrainingDays: 5,
      typicalSessionLength: 45,
      preferredScheduleNotes: "Structured weekday sessions and a longer weekend ride fit best.",
      dietPreferences: ["Mediterranean"],
      dietRestrictions: [],
      nutritionGoal: "keep meals stable enough to support training quality",
      energyBaseline: "Steady",
      stressBaseline: "Moderate",
      wellnessSupportFocus: ["Consistency", "Mental clarity", "Recovery"],
      injuriesLimitations: [],
      healthConsiderations: [],
      avoidances: ["Vague coaching"],
      coachingStyle: "Analytical",
      preferredCheckinStyle: "Weekly reflection"
    },
    week: buildWeek({
      activities: [
        activityTemplate({
          message: "Ran for 32 minutes this morning.",
          activityType: "Running",
          description: "structured morning run",
          durationMinutes: 32,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Strength session today for about 45 minutes.",
          activityType: "Strength training",
          description: "weekday strength session",
          durationMinutes: 45,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Walked for 30 minutes at lunch.",
          activityType: "Walking",
          description: "lunchtime walk",
          durationMinutes: 30,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Another run today, 36 minutes and steady.",
          activityType: "Running",
          description: "steady run",
          durationMinutes: 36,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Lifted after work for 40 minutes.",
          activityType: "Strength training",
          description: "second weekly lift",
          durationMinutes: 40,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Longer cycling session today for 60 minutes.",
          activityType: "Cycling",
          description: "long weekend cycling session",
          durationMinutes: 60,
          intensity: "Moderate"
        }),
        activityTemplate({
          message: "Mobility work for 20 minutes as a reset.",
          activityType: "Mobility",
          description: "reset mobility session",
          durationMinutes: 20,
          intensity: "Light"
        })
      ],
      meals: [
        mealTemplate({
          message: "Breakfast was oats, berries, and yogurt.",
          mealType: "breakfast",
          description: "oats, berries, and yogurt"
        }),
        mealTemplate({
          message: "Lunch was chicken, rice, and salad.",
          mealType: "lunch",
          description: "chicken, rice, and salad"
        }),
        mealTemplate({
          message: "Snack was fruit and a protein shake.",
          mealType: "snack",
          description: "fruit and a protein shake",
          confidence: 0.86
        }),
        mealTemplate({
          message: "Dinner was salmon, potatoes, and greens.",
          mealType: "dinner",
          description: "salmon, potatoes, and greens"
        }),
        mealTemplate({
          message: "Lunch was turkey, vegetables, and rice.",
          mealType: "lunch",
          description: "turkey, vegetables, and rice"
        }),
        mealTemplate({
          message: "Dinner was pasta, chicken, and salad.",
          mealType: "dinner",
          description: "pasta, chicken, and salad"
        }),
        mealTemplate({
          message: "Breakfast was eggs, toast, and fruit.",
          mealType: "breakfast",
          description: "eggs, toast, and fruit"
        })
      ],
      wellness: [
        wellnessTemplate({
          message: "Energy is solid and my head feels clear today.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "A little upper body soreness but otherwise steady.",
          energyScore: 4,
          sorenessScore: 3,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Moderate stress today but mood is still okay.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Energy is steady and motivation is good for today's run.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "A little tired after the week but still focused.",
          energyScore: 3,
          sorenessScore: 3,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Low stress today and I feel really settled.",
          energyScore: 4,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 1,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Good recovery day and clear head overall.",
          energyScore: 3,
          sorenessScore: 2,
          moodScore: 4,
          stressScore: 1,
          motivationScore: 3
        })
      ]
    })
  },
  {
    key: "sam-gentle-builder",
    email: "synthetic5@frankiefit.com",
    accountType: "synthetic_demo",
    timeShiftMinutes: -1,
    profile: {
      fullName: "Sam Rivera",
      ageRange: "25-34",
      primaryGoal: "Build consistency and feel better week to week",
      secondaryGoals: ["Consistency", "Energy", "Recovery"],
      activityLevel: "Lightly active",
      fitnessExperience: "Beginner",
      currentActivities: ["Walking regularly", "Occasional yoga"],
      preferredActivities: ["Walking", "Mobility", "Yoga"],
      availableEquipment: ["Bodyweight only"],
      trainingEnvironment: "Home",
      targetTrainingDays: 4,
      typicalSessionLength: 30,
      preferredScheduleNotes: "Simple routines in the evening are most realistic.",
      dietPreferences: ["Flexible"],
      dietRestrictions: [],
      nutritionGoal: "feel more stable and less random around meals",
      energyBaseline: "Up and down",
      stressBaseline: "Moderate",
      wellnessSupportFocus: ["Consistency", "Energy", "Recovery"],
      injuriesLimitations: [],
      healthConsiderations: [],
      avoidances: ["Intense or pushy language"],
      coachingStyle: "Gentle and steady",
      preferredCheckinStyle: "Quick check-ins"
    },
    week: buildWeek({
      activities: [
        activityTemplate({
          message: "Walked for 25 minutes today.",
          activityType: "Walking",
          description: "easy daily walk",
          durationMinutes: 25,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Did a 20 minute yoga session tonight.",
          activityType: "Yoga",
          description: "short yoga session",
          durationMinutes: 20,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Walked again today for 30 minutes.",
          activityType: "Walking",
          description: "second daily walk",
          durationMinutes: 30,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Mobility for 15 minutes today.",
          activityType: "Mobility",
          description: "short mobility session",
          durationMinutes: 15,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Went for another 30 minute walk.",
          activityType: "Walking",
          description: "steady walk",
          durationMinutes: 30,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Yoga class video at home for 25 minutes.",
          activityType: "Yoga",
          description: "at-home yoga class",
          durationMinutes: 25,
          intensity: "Light"
        }),
        activityTemplate({
          message: "Finished the week with a 35 minute walk.",
          activityType: "Walking",
          description: "reset walk",
          durationMinutes: 35,
          intensity: "Light"
        })
      ],
      meals: [
        mealTemplate({
          message: "Breakfast was yogurt, fruit, and toast.",
          mealType: "breakfast",
          description: "yogurt, fruit, and toast"
        }),
        mealTemplate({
          message: "Lunch was chicken and rice.",
          mealType: "lunch",
          description: "chicken and rice"
        }),
        mealTemplate({
          message: "Snack was a smoothie.",
          mealType: "snack",
          description: "a smoothie",
          confidence: 0.8
        }),
        mealTemplate({
          message: "Dinner was pasta and vegetables.",
          mealType: "dinner",
          description: "pasta and vegetables"
        }),
        mealTemplate({
          message: "Lunch was turkey and fruit.",
          mealType: "lunch",
          description: "turkey and fruit"
        }),
        mealTemplate({
          message: "Dinner was chicken tacos.",
          mealType: "dinner",
          description: "chicken tacos"
        }),
        mealTemplate({
          message: "Breakfast was oatmeal and berries.",
          mealType: "breakfast",
          description: "oatmeal and berries"
        })
      ],
      wellness: [
        wellnessTemplate({
          message: "Energy is okay and mood feels steady today.",
          energyScore: 3,
          sorenessScore: 1,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "A little more relaxed after yoga.",
          energyScore: 3,
          sorenessScore: 1,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Energy is a bit low today but I still moved.",
          energyScore: 2,
          sorenessScore: 1,
          moodScore: 3,
          stressScore: 3,
          motivationScore: 2
        }),
        wellnessTemplate({
          message: "Feeling okay today and not too stressed.",
          energyScore: 3,
          sorenessScore: 1,
          moodScore: 3,
          stressScore: 2,
          motivationScore: 3
        }),
        wellnessTemplate({
          message: "Motivation is better and energy is coming back.",
          energyScore: 3,
          sorenessScore: 1,
          moodScore: 4,
          stressScore: 2,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Pretty calm today and in a good headspace.",
          energyScore: 4,
          sorenessScore: 1,
          moodScore: 4,
          stressScore: 1,
          motivationScore: 4
        }),
        wellnessTemplate({
          message: "Steady energy and a nice reset day overall.",
          energyScore: 3,
          sorenessScore: 1,
          moodScore: 4,
          stressScore: 1,
          motivationScore: 3
        })
      ]
    })
  }
]

export const seedAccounts = [...internalAccounts, ...syntheticAccounts]
