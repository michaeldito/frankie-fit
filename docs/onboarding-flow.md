# Frankie Fit Onboarding Flow

## Goal

The onboarding experience should gather enough information for Frankie to be helpful on day one without feeling like a long intake form. The experience should feel conversational, supportive, and fast.

Target completion time: 3 to 5 minutes.

## Onboarding Objectives

- understand who the user is
- understand why they are here
- identify the user's current fitness context
- capture basic diet and wellness context
- surface meaningful constraints and safety considerations
- establish Frankie's coaching tone
- give the user an immediate sense that Frankie understands them

## Core Principle

Collect the minimum needed for useful personalization. Learn the rest over time.

## Flow Overview

### Step 1: Welcome and Framing

Frankie introduces the experience and explains what the app will help with.

Example:

> I am Frankie. I can help you stay on top of workouts, food, and overall wellness without turning your life into a spreadsheet. I will ask a few quick questions so I can personalize things for you.

### Step 2: Primary Goal

Capture the user's main reason for joining.

Questions:

- What are you mainly trying to improve right now?
- Which matters most at the moment: consistency, performance, body composition, energy, stress, or general health?

Structured fields:

- primary_goal
- secondary_goals

### Step 3: Current Baseline

Understand the user's starting point.

Questions:

- How active are you right now?
- How would you describe your fitness experience?
- What types of exercise do you already do, if any?

Structured fields:

- activity_level
- fitness_experience
- current_activities

### Step 4: Preferences and Equipment

Learn what kinds of movement Frankie should lean into.

Questions:

- What kinds of workouts or activities do you enjoy most?
- What equipment do you have access to?
- Do you prefer gym workouts, home workouts, outdoor training, classes, or a mix?

Structured fields:

- preferred_activities
- available_equipment
- training_environment

### Step 5: Schedule and Routine Reality

Capture what the user's life can realistically support.

Questions:

- How many days per week do you realistically want to train?
- How much time do you usually have on a normal day?
- Are there specific days or times that are easiest for you?

Structured fields:

- target_training_days
- typical_session_length
- preferred_schedule

### Step 6: Diet Context

Get enough information to make food guidance feel relevant without turning onboarding into calorie accounting.

Questions:

- Do you follow any specific way of eating?
- Are there foods you avoid, dietary restrictions, or allergies I should know about?
- Is your current eating pattern something you want to improve, simplify, or better understand?

Structured fields:

- diet_preferences
- diet_restrictions
- nutrition_goal

### Step 7: Wellness Context

Capture the user's broader well-being without drifting into clinical territory.

Questions:

- How have your energy and stress levels been lately?
- Is recovery, motivation, or consistency something you want extra help with?
- Would you like Frankie to check in on mood, stress, and recovery along the way?

Structured fields:

- energy_baseline
- stress_baseline
- wellness_support_focus
- wellness_checkin_opt_in

### Step 8: Constraints and Safety

This step is required. Frankie needs enough context to avoid obviously bad guidance.

Questions:

- Do you have any injuries, mobility limitations, or health considerations I should account for?
- Is there anything you want me to avoid when suggesting workouts, routines, or food guidance?

Structured fields:

- injuries_limitations
- health_considerations
- avoidances

### Step 9: Coaching Style

Let the user shape the feel of the relationship.

Questions:

- What kind of coaching style helps you most: gentle, direct, motivating, analytical, or a mix?
- Do you want quick check-ins, deeper reflections, or both?

Structured fields:

- coaching_style
- preferred_checkin_style

### Step 10: Safety Acknowledgement and Summary

Frankie should set expectations clearly before beginning ongoing coaching.

Required acknowledgement:

- Frankie Fit provides wellness guidance and coaching support, not medical or clinical care.

Frankie then gives a short summary back to the user:

> You want to improve consistency and endurance, you are already somewhat active, you enjoy lifting and running, and you want a coach who is direct but supportive. I will keep plans realistic for your schedule and check in lightly during the week.

Structured fields:

- safety_acknowledged
- onboarding_summary

## Day-One Data Model

The first version should be able to store the following onboarding profile fields:

- name
- age_range
- primary_goal
- secondary_goals
- activity_level
- fitness_experience
- current_activities
- preferred_activities
- available_equipment
- training_environment
- target_training_days
- typical_session_length
- preferred_schedule
- diet_preferences
- diet_restrictions
- nutrition_goal
- energy_baseline
- stress_baseline
- wellness_support_focus
- wellness_checkin_opt_in
- injuries_limitations
- health_considerations
- avoidances
- coaching_style
- preferred_checkin_style
- safety_acknowledged

## What Frankie Should Learn Later

These topics should be gathered progressively through normal product use:

- actual adherence patterns
- favorite workout formats
- recurring schedule conflicts
- meal habits and weak points
- recovery trends
- motivation triggers
- which types of feedback drive action
- how proactive Frankie should become for this specific user

## First Session Payoff

Onboarding should end with something immediately useful. Frankie should not simply say "thanks."

At the end of onboarding, Frankie should provide:

- a short summary of what it learned
- a suggested first focus for the week
- one concrete next action
- an invitation to log the user's first activity, meal, or wellness check-in

## Design Notes

- keep the interface conversational, not form-heavy
- allow users to skip non-critical questions where appropriate
- ask safety-related questions clearly and directly
- use progressive disclosure for follow-up questions
- avoid asking for detailed metrics unless they clearly improve recommendations
