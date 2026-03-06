# Sprint Escape Incremental Development Roadmap

Based on the Game Design Document (v2), the development will follow the staggered "Sprint-by-Sprint" onboarding schedule to build up complexity incrementally.

## Phase 1: The Core Loop Foundation (Target: Sprint 1 Experience)
**Goal:** Establish the basic interactive loop of assigning a developer to a task and completing a sprint.
- **Components:**
  - `DevCard` domain and UI representation.
  - Kanban Board Zones (Backlog, In Progress, Review, Done) using existing `DropZone` mechanics.
  - **Stacking Logic:** Dropping a `DevCard` onto a `TaskCard`.
  - **Work Simulation:** Progress bar fills over time when a Dev is stacked on a Task.
  - **Auto-Flow:** Task automatically slides to the next Kanban column when progress is filled.
  - **Resource:** Basic Budget gauge implementation.

## Phase 2: Morale & Pair Programming (Target: Sprint 2 Experience)
**Goal:** Introduce team management and the first trade-offs.
- **Components:**
  - `Morale` resource gauge.
  - Pair Programming mechanics (Stacking two Devs on one TaskCard).
  - Dev Burnout tracking (visual tells, speed reduction).

## Phase 3: Services, Bugs & Tech Health (Target: Sprint 3 Experience)
**Goal:** Introduce the systems being built and the concept of stability.
- **Components:**
  - `ServiceCard` domain and UI (e.g., API, Database).
  - Bug `TaskCard` variants.
  - `Tech Health` resource gauge.
  - Impact of bugs on Tech Health.

## Phase 4: Planning & Stakeholders (Target: Sprint 4 Experience)
**Goal:** Introduce self-inflicted pressure and sprint commitments.
- **Components:**
  - Sprint Commitment Zone (drag tickets here during planning).
  - First Stakeholder Card (`Product Owner`).
  - Sprint Evaluation logic (Rewards/Penalties for hitting/missing commitments).

## Phase 5: The Fog of War (Target: Sprint 5 Experience)
**Goal:** The signature mechanic—Hidden Tech Debt.
- **Components:**
  - Tech Debt spawning (shortcuts, forced completion).
  - Face-down attachment of Debt to ServiceCards.
  - Leading indicators (wobbling services, speech bubbles).
  - `ManagerCard` and `Reputation` resource gauge.

---

*This document will serve as our high-level compass. Detailed implementation plans for each phase will be created in separate documents.*
