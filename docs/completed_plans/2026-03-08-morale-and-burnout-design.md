# Phase 2: Morale & Dev Burnout Design

## Overview
Building on our existing pair programming foundation (dev stacking and synergy multipliers), this phase introduces the human element: **Burnout** and **Morale**. These mechanics create the first real trade-offs in the game. Do you push your team to finish a ticket at the cost of their sanity, or let them rest and risk missing a deadline?

## 1. Individual Dev Burnout
Each `DevCard` will now track its own exhaustion level.

- **State Property:** `burnout` (0 to 100).
- **Burnout Accumulation:** 
  - Increases over time when a Dev is attached to a ticket and actively working.
  - *Pair Programming Benefit:* When two devs are stacked on the same ticket, their burnout accumulation rate is reduced by 30% (sharing the load).
- **Resting (Recovery):**
  - Decreases over time when a Dev is detached (idle).
- **Mechanical Impact:**
  - **Exhausted State (>80%):** The Dev's work rate is halved (`0.5x` multiplier). They are less productive.
- **Visual Tells:**
  - Slower "breathing" animation as burnout increases.
  - Color shift (e.g., turning slightly red/gray).
  - A small icon or visual indicator (e.g., a sweat drop or coffee cup) appears when >80%.

## 2. Global Team Morale
A new overarching resource gauge for the entire run.

- **State Property:** `GameManager.morale` (0 to 100, starts at 100).
- **UI Element:** A persistent visual gauge in the `UIScene` (similar to the future Budget gauge).
- **Impacts on Morale:**
  - **Negative:** If a Dev reaches 100% burnout, they "break down", instantly dropping global Morale by a significant chunk (e.g., -10) and resetting their burnout to 50% (enforced rest).
  - **Positive:** Completing a ticket successfully (especially without bugs) or completing a sprint provides a Morale boost.
- **Consequences of Low Morale:**
  - If Morale falls below a critical threshold (e.g., <30), all Devs suffer a baseline speed penalty, and the chance of spawning bugs increases (they stop caring about quality).
  - If Morale hits 0, Game Over condition (Team quits).

## 3. Interaction Refinements
- **Stacking Limit:** Enforce a maximum of 2 DevCards per TicketCard to officially solidify the "Pair Programming" mechanic.
- **UI:** Add a simple health/burnout bar to the `DevCard` itself so the player can monitor their team's status.

## Implementation Tasks (TDD)
1. **Update `DevCard`:** Add `burnout` property, update loop for accumulation/recovery, and visual indicators.
2. **Update `BoardController`:** 
   - Integrate Dev work state with burnout accumulation.
   - Enforce 2-dev maximum on tickets.
   - Apply Pair Programming burnout reduction.
3. **Add Global Morale to `GameManager` & `UIScene`:** Track the stat, implement UI gauge, and handle Game Over state if it hits 0.
4. **Implement Speed & Quality Penalties:** Tie high burnout and low morale into the existing progress calculation logic in `BoardController`.
