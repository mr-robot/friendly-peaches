---
trigger: always_on
---
## A. Task Tracker
Please refer to and update `docs/agents/TASKS.md` for the current list of features and bugs.

When creating planning documents, store plans in `docs/plans/`, once a plan is complete, move it to `docs/complete_plans/`.

## B. Context & Technical Guidelines
- **Framework:** Phaser 3
- **Development Approach:** ALWAYS use the `test-driven-development` skill. Write tests before implementing features.
- **Testing Command:** Run tests using `npm run test` (uses Vitest). Ensure all tests pass before considering a task complete.
- **Architecture:** Keep entity logic separate from controller logic. Use event-driven communication and modular design.

## C. Design Profile
**Target User:** IT professionals, Software Engineers, Agile Scrum Masters, and DevOps engineers.
**Tone & Humor:** Sarcastic, wry, and highly relatable to the tech industry. 
- Lean into common industry pain points (e.g., useless meetings, scope creep, "it works on my machine", undocumented legacy code).
- The game should feel like a cynical, slightly exaggerated, but ultimately rewarding simulation of modern software development.

## D. Memory & Game Design Overview
Please refer to and update `docs/agents/MEMORY.md` after major architectural changes and when planning new features.

Please refer to `docs/context/2026-02-09-sprint-escape-game-design-v2.md` for the full game design document.
