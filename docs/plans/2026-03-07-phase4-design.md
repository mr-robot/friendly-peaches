# Design: Phase 4 - Resource Gauges & Sprint Cycles

## Objective
To wrap the core interaction loop (dragging, stacking, working) into a meaningful game loop, we need to introduce the passage of time (Sprints) and the resources that restrict the player (Budget, Morale).

## 1. The Sprint Timer
- A visual timer counting down the days/seconds of the current Sprint.
- When the timer reaches 0, the Sprint ends.
- The game pauses, and a "Sprint Review" screen appears showing tickets completed vs missed.

## 2. Resource Gauges (Top Bar UI)
We need a persistent UI layer (likely a new Scene `UIScene` that sits above `MainGameScene`) to display:
- **Budget ($):** 
  - Starts at $10,000.
  - Decreases continuously while Devs are active (e.g., $100 per second per working Dev) simulating burn rate.
  - Completing a Ticket (reaching 'Done' column) adds a burst of Budget (e.g., $2,000) representing delivered value/funding.
- **Morale (😊):**
  - Starts at 100%.
  - If a Dev works continuously without breaks (or is stacked with 3+ mob), morale slowly drains.
  - Low morale could eventually reduce work speed multipliers.

## 3. Sprint Commitment (Planning)
- Before the timer starts, the player must drag tickets from the 'Backlog' into a designated 'Sprint Backlog' or 'Committed' zone.
- Once committed, the Sprint starts.
- Completing committed tickets yields full rewards. Failing them might yield a penalty.

## Proposed Implementation Steps
1. Create a `UIScene` with basic text/bars for Budget, Morale, and Sprint Timer.
2. Implement the `GameManager` logic to track these global stats and listen to events from `BoardController` (e.g., `ticket_completed`, `dev_working`).
3. Implement the Sprint State Machine (Planning -> Active -> Review).
