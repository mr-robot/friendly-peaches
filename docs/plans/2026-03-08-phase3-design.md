# Phase 3: Services, Bugs & Tech Health Design

## Overview
This phase introduces the concept of the systems being built and the stability of those systems. It adds a new spatial area for Services, a new card type for Bugs, and the `Tech Health` resource gauge to penalize poor quality work.

## 1. Services Area & ServiceCards
We need a place to store the things we build.
- **New Zone:** A `Services` area (maybe above or below the Kanban board) to hold `ServiceCard`s.
- **`ServiceCard`:** Represents a piece of the architecture (e.g., "Auth Service", "User Database").
  - Has a name.
  - Currently just a static container, but will later hold Tech Debt.
  - Can visually indicate its state (e.g., wobbling if it has bugs/debt).

## 2. Bug Cards & Ticket Quality
Bugs are a consequence of moving too fast or with low morale.
- **`BugCard`:** A variant of `TicketCard`.
  - Visually distinct (red tint, "BUG" label).
  - Resolving it doesn't earn budget, but restores Tech Health.
- **Spawning Logic:** We already have basic bug spawning in `BoardController`. We need to refine it:
  - Bugs spawn in the Backlog when a low-quality ticket completes.
  - (Future) Bugs might spawn spontaneously from unstable Services.

## 3. Tech Health Resource
A global gauge representing the stability of your systems.
- **State Property:** `GameManager.techHealth` (0 to 100, starts at 100).
- **UI Element:** A persistent visual gauge in the `UIScene`.
- **Impacts on Tech Health:**
  - **Negative:** When a `BugCard` is spawned, Tech Health drops (e.g., -10).
  - **Negative:** Ignoring bugs in the Backlog causes slow drain over time.
  - **Positive:** Completing a `BugCard` restores Tech Health (+10).
- **Consequences of Low Tech Health:**
  - **< 50%:** Incident frequency increases (future phase).
  - **< 25% (Permanent On-Call):** One DevCard is locked out of normal feature work (cannot be placed on regular tickets, only bugs or incidents).
  - **0% (Total Outage):** Game Over, or severe penalty (e.g., sprint halts, massive budget drain until fixed).

## Implementation Tasks (TDD)
1. **`ServiceCard` & Area:** Create `ServiceCard` class and add a Services zone to `MainGameScene`/`BoardController`.
2. **`BugCard` Refinement:** Ensure `BugCard` is distinct and has tests for its specific behaviors (like not earning budget).
3. **`GameManager` Updates:** Add `techHealth`, methods to modify it, and logic for penalties (< 25% on-call state).
4. **`UIScene` Updates:** Add the Tech Health gauge to the UI.
5. **`BoardController` Integration:** Tie bug spawning to Tech Health drops, and bug completion to Tech Health restoration. Implement the "Permanent On-Call" restriction (prevent dev stacking on features if Tech Health < 25%).
