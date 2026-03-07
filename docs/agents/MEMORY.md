# Memory & Project Overview

*Update this section after major architectural changes. Reference this when planning any new features.*


**Core Architecture:**
- **Entities (`src/entities/`):** Custom Phaser GameObjects (`DevCard`, `TicketCard`, `BugCard`) handling their own visual state, animations (breathing/particles), and basic properties (role, requirement, quality).
- **Controllers (`src/controllers/`):** 
  - `BoardController`: Manages the Kanban board, drag-and-drop logic, card stacking (with cascading offsets), work progress calculation (synergy/multipliers), ticket quality decay, and bug spawning.
- **Core (`src/core/`):**
  - `GameManager`: Handles sprint lifecycle, timer, budget drain, and morale updates based on completed work.
- **Scenes (`src/scenes/`):** 
  - `MainGameScene`: The primary gameplay scene, initializing controllers and entities.
  - `UIScene`: Overlaid scene for displaying gauges (Budget, Morale, Timer) and sprint interaction buttons.
- **Testing (`test/`):** Vitest with JSDOM, using mocked Phaser components to test pure logic in controllers and managers.
