# Design: Stacking Logic (Phase 1)

## Architecture & State Management
We will update the card entities to maintain a two-way relationship:
1. `TicketCard` will maintain a `stackedDevs` array to support multiple devs later (for Phase 2 pair programming).
2. `DevCard` will maintain a `currentTicket` reference.
3. `BoardController` will act as the orchestrator for overlap detection and updating these relationships.

## Data Flow & Interaction
- **Stacking:** On a `drop` or `dragend` event for a `DevCard`, the `BoardController` will check if it overlaps with a `TicketCard` (using distance or bounding box calculations). If an overlap is found, the `DevCard` is appended to the ticket's `stackedDevs` and visually snapped to the ticket's coordinates with a slight offset (e.g., `y + 30`) so both cards remain legible.
- **Un-stacking:** When a `DevCard` is picked up (on `dragstart`), it will immediately clear its `currentTicket` reference and remove itself from the ticket's `stackedDevs` array, allowing it to move independently.
- **Group Movement:** When a `TicketCard` is dragged, a custom `drag` event listener will iterate through its `stackedDevs` array and apply the exact `x` and `y` movement deltas to each attached dev, creating the "Ticket drags Dev" container effect.

## Error Handling & Edge Cases
- If a `DevCard` is dropped on a `TicketCard` that is already in the 'Done' column, the drop will be rejected and the dev will snap back.
- If a `TicketCard` is moved to a new column, the stacked devs will naturally follow along due to the group movement logic.
