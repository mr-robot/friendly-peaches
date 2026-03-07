# Phase 4/6: Sprint Planning & Stakeholders Design

## Overview
This phase introduces the **Sprint Planning** loop. Before time starts ticking, the player must commit to a set of work. The tension comes from natural economic pressure: committing to too little work will result in insufficient budget rewards to survive the next sprint, while over-committing risks burning out the team and spawning tech debt bugs.

## Core Mechanics

### 1. State Machine & Phases
The `GameManager` will be updated to handle strict state transitions:
- **`PLANNING` State:** Time is paused. The player receives a pool of random tickets in an "Icebox" zone. They must drag tickets they want to commit to into the `Backlog` column.
- **`ACTIVE` State:** Time ticks. The Icebox is hidden/disabled. The Backlog is locked from adding new tickets, but tickets can be pulled from it to be worked on.
- **`REVIEW` State:** The sprint timer ends. The board pauses. The game evaluates the completed tickets and rewards budget.

### 2. The Icebox (Planning Zone)
- **Visuals:** A dedicated zone (e.g., at the bottom of the screen or an overlay panel) that appears only during `PLANNING`.
- **Generation:** At the start of a sprint, the game generates 5-8 random tickets (varying sizes/roles) and places them in the Icebox.
- **Interaction:** The player drags cards from the Icebox to the `Backlog` column's drop zone. Cards can be moved back to the Icebox if the player changes their mind.
- **Lock-in:** When the player clicks `START SPRINT`, any cards remaining in the Icebox are discarded (or hidden), and the Backlog becomes the official commitment list.

### 3. Natural Economic Pressure (The Stakeholder Proxy)
Instead of an annoying AI stakeholder forcing cards onto the board, the pressure is systemic:
- Completing a sprint deducts a base operating cost (e.g., 50 Budget) for salaries/overhead.
- Completing tickets rewards Budget (e.g., 20 per ticket).
- If the player only commits to 2 tickets, they earn 40 Budget, losing a net 10 Budget. They will eventually run out of money.
- This forces the player to take risks and commit to 3+ tickets, knowing they might not have the time or Devs to finish them safely.

### 4. Sprint Evaluation & End Screen
When the sprint timer hits 0:
- All uncompleted cards in `In Progress` or `Review` are penalized or rolled over.
- An overlay `SprintReviewScene` appears showing:
  - Tickets Completed vs Committed.
  - Total Budget Earned vs Burn Rate.
  - Final Budget balance.
- A "Start Next Sprint" button resets the board state back to `PLANNING` and generates a new Icebox.

## Implementation Steps (TDD)

1. **Update `GameManager` State Logic:**
   - Add `PLANNING` and `REVIEW` states.
   - Implement `endSprint` logic to calculate rewards based on the `Done` column.

2. **Implement Icebox Logic in `BoardController`:**
   - Create an Icebox drop zone active only in `PLANNING` state.
   - Implement logic to generate `n` random tickets into the Icebox.
   - Allow drag-and-drop between Icebox and Backlog.

3. **Sprint Start/End Transitions:**
   - Wire the "START SPRINT" button to trigger the transition, hiding the Icebox.
   - When sprint ends, display the Review overlay.

4. **Economic Balancing:**
   - Tweak budget drain and reward values to ensure the "Natural Economic Pressure" is felt immediately.
