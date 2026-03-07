# Design: Phase 5 - The Fog of War & Tech Debt

## Objective
Introduce negative consequences for suboptimal play. When players rush tickets without matching roles, or if we introduce a "Risk" factor, it should generate Tech Debt. In this phase, Tech Debt manifests as **Bugs** spawning directly into the Kanban board.

## 1. The BugCard Entity
- `BugCard` will extend `TicketCard` but have a distinct visual style (e.g., Red background, warning icons).
- It behaves like a normal ticket: it must be assigned Devs, it has a progress bar, and it must move through the columns to reach 'Done'.
- **Consequence:** Bugs do not reward Budget when completed. Instead, their very existence eats up valuable Dev time during a Sprint. If a Bug is not completed by the end of the Sprint, it could carry a Morale or Reputation penalty in future updates.

## 2. Bug Spawning Logic
How do bugs get generated?
We will introduce a "Risk" or "Quality" tracking mechanic per ticket:
- Every `TicketCard` tracks a hidden (or semi-hidden) `quality` metric (0 to 100).
- If a Ticket is worked on by a Dev with a matching `role`, the quality remains high.
- If a Ticket is worked on by a Dev with a mismatched `role`, the quality drops over time.
- When the Ticket reaches 'Done', we roll a chance based on its `quality`. 
- If the roll fails, a `BugCard` spawns in the 'Backlog' immediately.

## 3. Implementation Steps
1. Create `BugCard.js` extending `TicketCard`.
2. Update `BoardController` to handle spawning new cards dynamically (currently cards are only created in the Scene init).
3. Update `BoardController.update` to calculate `quality` decay when mismatched devs are working.
4. Update the "ticket completed" logic to evaluate quality and potentially spawn a Bug.
