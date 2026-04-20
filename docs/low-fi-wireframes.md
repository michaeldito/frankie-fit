# Frankie Fit Low-Fidelity Wireframes

## Purpose

This document turns the current product decisions into low-fidelity wireframes for the first web experience. These are intentionally simple and structural. They are meant to help us evaluate layout, hierarchy, and flow before visual design or implementation.

## Assumptions

- desktop-first web layouts
- authenticated app uses a left navigation rail
- Chat is the default landing screen after login
- Exercise, Diet, and Wellness live inside one shared Dashboard shell
- Frankie should be visible across the app, but not dominate every screen equally

## Fidelity Notes

These are not polished mocks. They are layout sketches that answer:

- what is on the page
- what appears first
- where the user's eye should go
- what the clearest next action is

---

## 1. Landing Page

### Purpose

Introduce the product clearly, build trust, and drive early-access conversion.

```text
+----------------------------------------------------------------------------------+
| Frankie Fit                            Product  How It Works  Frankie  Privacy   |
|                                                                     [Early Access]|
+----------------------------------------------------------------------------------+
|                                                                                  |
|  Log less. Understand more. Stay consistent.                                     |
|                                                                                  |
|  Frankie Fit is your AI-native wellness coach for exercise, food, and overall    |
|  wellness. Talk to Frankie like you would a real coach, and get guidance,        |
|  logging, and progress insights without turning your life into a spreadsheet.     |
|                                                                                  |
|  [Get Early Access]     [See How It Works]                 [Product Mockup]      |
|                                                                                  |
+----------------------------------------------------------------------------------+
| Most health apps ask too much and help too little.                               |
| Short problem framing and contrast with traditional tracking.                     |
+----------------------------------------------------------------------------------+
| One conversation. Three pillars. A lot less friction.                            |
| [1 Tell Frankie]   [2 Frankie organizes the signal]   [3 Get your next step]    |
+----------------------------------------------------------------------------------+
| [Exercise Card]              [Diet Card]                [Wellness Card]          |
| Natural movement logging     Plain-language food        Energy, recovery, mood,  |
| and smarter next steps       awareness without pain     stress, and sustainability|
+----------------------------------------------------------------------------------+
| Simple on the surface. Smarter underneath.                                       |
| Conversation-first | Less manual logging | Personalized guidance | Trends         |
+----------------------------------------------------------------------------------+
| Meet Frankie                                                                     |
| Calm, thoughtful, grounded. Not a guilt machine.                                 |
+----------------------------------------------------------------------------------+
| Privacy and Trust                                                                |
| Strong boundaries. Wellness coaching, not medical care.                          |
+----------------------------------------------------------------------------------+
| Health is hard enough. The app should make it easier.                            |
| [Get Early Access]                                              [See How Frankie]|
+----------------------------------------------------------------------------------+
```

### Primary Eye Path

1. hero headline
2. subheadline
3. CTA
4. three-step explanation
5. trust/privacy section

### Primary Action

Get early access

---

## 2. Authenticated App Shell

### Purpose

Provide a stable home for the logged-in experience.

```text
+----------------------------------------------------------------------------------+
| Frankie Fit                                                                      |
+-------------+--------------------------------------------------------------------+
| Chat        |                                                                    |
| Dashboard   |                         Main Content Area                           |
| Profile     |                                                                    |
|             |                                                                    |
|-------------|                                                                    |
| Goal:       |                                                                    |
| Build more  |                                                                    |
| consistency |                                                                    |
|             |                                                                    |
| Next step   |                                                                    |
| [Compact    |                                                                    |
| action]     |                                                                    |
|             |                                                                    |
| [Avatar]    |                                                                    |
+-------------+--------------------------------------------------------------------+
```

### Persistent Elements

- navigation
- current goal snapshot
- compact recommended next action
- profile access

### Primary Design Intent

The shell should feel calm, predictable, and not overloaded.

---

## 3. Chat Screen

### Purpose

This is the main home of the product and the default landing experience.

```text
+----------------------------------------------------------------------------------+
| Chat with Frankie                                           [Today: Focus on     |
| Log something, ask a question, or get a plan.               recovery + movement] |
+----------------------------------------------------------------------------------+
| Frankie: Good to see you. Want to log something, check in, or plan today?        |
|                                                                                  |
| You: I lifted yesterday and walked this morning.                                 |
|                                                                                  |
| Frankie: Nice. That gives us a good base for today. If energy is solid, a light  |
| run or mobility session could make sense. If not, recovery is still a good call. |
|                                                                                  |
| [Workout logged]   [Meal logged]   [Check-in complete]                           |
|                                                                                  |
| Frankie: Based on your week so far, a short check-in would help me guide you     |
| better.                                                                          |
|                                                                                  |
| ------------------------------------------------------------------------------   |
| [Log workout] [Log meal] [Check in] [Ask for a plan]                             |
|                                                                                  |
| Tell Frankie what you did, ate, or how you are feeling...            [Send]      |
+----------------------------------------------------------------------------------+
```

### Hierarchy

- conversation first
- quick actions second
- composer always accessible

### Primary Action

Send a message or tap a quick action

---

## 4. Dashboard Shell

### Purpose

Give the user a structured read on progress without replacing Chat.

```text
+----------------------------------------------------------------------------------+
| Your Dashboard                                                   Next best step   |
| A simple read on how things are going.                          [Log today's meal]|
+----------------------------------------------------------------------------------+
| [Exercise] [Diet] [Wellness]                                                   |
+----------------------------------------------------------------------------------+
|                                                                                  |
|                           Active Tab Content Area                                |
|                                                                                  |
+----------------------------------------------------------------------------------+
```

### Primary Design Intent

The dashboard should feel lighter than a traditional analytics tool. One main chart and one main Frankie insight per tab.

---

## 4A. Dashboard: Exercise Tab

```text
+----------------------------------------------------------------------------------+
| Your Dashboard                                                   Next best step   |
| A simple read on how things are going.                          [Log workout]     |
+----------------------------------------------------------------------------------+
| [Exercise] [Diet] [Wellness]                                                   |
+----------------------------------------------------------------------------------+
| [Weekly Summary]          [Trend Chart]                                          |
| Workouts: 4               Activity over last 4 weeks                             |
| Active days: 5            simple bars or line chart                              |
| Minutes: 210                                                                    |
+----------------------------------------------------------------------------------+
| [Activity Breakdown]      [Recent Logs]                                          |
| Running 40%               Tue - Upper body                                       |
| Lifting 35%               Wed - 35 min walk                                      |
| Walking 25%               Thu - Easy run                                         |
+----------------------------------------------------------------------------------+
| Frankie's read                                                                   |
| You are staying active well. The next opportunity is keeping the rhythm steady   |
| rather than trying to force more volume.                                         |
+----------------------------------------------------------------------------------+
```

### Primary Action

Log a workout or ask Frankie what to do next

---

## 4B. Dashboard: Diet Tab

```text
+----------------------------------------------------------------------------------+
| Your Dashboard                                                   Next best step   |
| A simple read on how things are going.                          [Log today's meal]|
+----------------------------------------------------------------------------------+
| [Exercise] [Diet] [Wellness]                                                   |
+----------------------------------------------------------------------------------+
| [Weekly Summary]          [Pattern Summary]                                      |
| Meals logged: 12           Weekdays look more consistent than weekends            |
| Days with food logs: 6     Lunch is your most stable meal                        |
| Goal alignment: moderate   Protein awareness could improve                       |
+----------------------------------------------------------------------------------+
| [Recent Meals]                                                                  |
| Thu - eggs, toast, fruit                                                         |
| Thu - chicken bowl                                                               |
| Thu - pasta and salad                                                            |
+----------------------------------------------------------------------------------+
| Frankie's read                                                                   |
| You already have enough signal here to improve without obsessing over detail.    |
| The next useful move is more consistency, not more perfection.                   |
+----------------------------------------------------------------------------------+
```

### Primary Action

Log a meal or ask Frankie for food guidance

---

## 4C. Dashboard: Wellness Tab

```text
+----------------------------------------------------------------------------------+
| Your Dashboard                                                   Next best step   |
| A simple read on how things are going.                          [Complete check-in]|
+----------------------------------------------------------------------------------+
| [Exercise] [Diet] [Wellness]                                                   |
+----------------------------------------------------------------------------------+
| [Weekly Summary]          [Trend View]                                           |
| Check-ins: 5               Energy     ---/----                                    |
| Energy: steady             Stress     --/---                                      |
| Recovery: slightly down    Soreness   ----/--                                     |
+----------------------------------------------------------------------------------+
| [Recent Check-Ins]                                                               |
| Thu - Energy good, soreness moderate                                             |
| Wed - Energy lower, stress high                                                  |
| Tue - Recovery solid                                                             |
+----------------------------------------------------------------------------------+
| Frankie's read                                                                   |
| The week looks productive, but recovery started thinning out midweek. Protecting |
| one lighter day earlier may help keep things sustainable.                        |
+----------------------------------------------------------------------------------+
```

### Primary Action

Complete a check-in or ask Frankie how to adjust

---

## 5. Profile Screen

### Purpose

Let the user review and update the context Frankie uses.

```text
+----------------------------------------------------------------------------------+
| Profile                                                                          |
| Your coaching context and preferences                                            |
+----------------------------------------------------------------------------------+
| [Profile Summary]                                                                |
| Michael | Primary goal: consistency + endurance                                  |
+----------------------------------------------------------------------------------+
| [Goals]                     [Activity Preferences]                                |
| Primary goal                Preferred activities                                  |
| Secondary goals             Equipment access                                      |
| [Edit]                      Training environment                                  |
+----------------------------------------------------------------------------------+
| [Diet + Wellness]           [Coaching Preferences]                               |
| Dietary preferences         Coaching style: supportive/accountable                |
| Restrictions                Check-ins: quick + weekly reflection                  |
| Wellness focus                                                                    |
+----------------------------------------------------------------------------------+
|                                                      [Update Profile Settings]    |
+----------------------------------------------------------------------------------+
```

### Primary Action

Update the context Frankie should use

---

## 6. Admin Overview

### Purpose

Give the founder the smallest useful privacy-conscious view of product health.

```text
+----------------------------------------------------------------------------------+
| Admin Overview                                                                   |
| A privacy-conscious read on product health and user value.                       |
+----------------------------------------------------------------------------------+
| [Active Users]     [Onboarding Completion]     [Retention]     [Usage by Pillar] |
| 128                74%                         Week 1: 42%     Ex 45 / Di 30 / W 25|
+----------------------------------------------------------------------------------+
| [Common Requests]                         [Top Friction Points]                   |
| More workout planning                     Diet logging drop-off after day 4       |
| Better weekly summaries                   Users unsure what to log first          |
| Recovery guidance                         Low check-in completion                 |
+----------------------------------------------------------------------------------+
| [Product Suggestions]                                                           |
| 1. Improve first-week guidance                                                   |
| 2. Make meal logging prompts clearer                                             |
| 3. Add stronger recovery summary wording                                         |
+----------------------------------------------------------------------------------+
| [Test Accounts]                                                                  |
| Internal test users | Synthetic demo users | [Review Test Sessions]              |
+----------------------------------------------------------------------------------+
```

### Primary Action

Investigate a product signal or inspect a test account

---

## 7. Empty and Low-Data States

### New User Chat

```text
+----------------------------------------------------------------------------------+
| Chat with Frankie                                                                |
+----------------------------------------------------------------------------------+
| Frankie: Tell me what you did today, what you ate, or how you are feeling, and   |
| I will help organize the rest.                                                   |
|                                                                                  |
| [Log workout] [Log meal] [Check in] [Ask for a plan]                             |
|                                                                                  |
| Tell Frankie what you did, ate, or how you are feeling...            [Send]      |
+----------------------------------------------------------------------------------+
```

### Low-Data Dashboard State

```text
+----------------------------------------------------------------------------------+
| Your Dashboard                                                   Next best step   |
| A simple read on how things are going.                          [Log first meal]  |
+----------------------------------------------------------------------------------+
| [Exercise] [Diet] [Wellness]                                                   |
+----------------------------------------------------------------------------------+
| Not much data yet, which is totally fine.                                        |
| A few simple logs will give Frankie enough signal to start spotting patterns.    |
+----------------------------------------------------------------------------------+
| [Log workout]   [Log meal]   [Complete check-in]                                 |
+----------------------------------------------------------------------------------+
```

## Next Visual Questions

- Should the app shell feel more premium-minimal or more warm and coach-like?
- Should Frankie appear as an avatar, a subtle badge, or mostly through text?
- How much contrast do we want between user surfaces and admin surfaces?
- Do we want the dashboard to feel airy and editorial, or more structured and utility-first?
