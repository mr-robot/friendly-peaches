# Memory & Project Overview

*Update this section after major architectural changes. Reference this when planning any new features.*

## Core Architecture

### Entities (`src/entities/`)
Custom Phaser GameObjects handling their own visual state, animations, and basic properties:
- `DevCard` — developer with role, burnout meter, breathing animation
- `TicketCard` — work item with requirement, quality, progress bar; has `isHidden` flag for fog-of-war
- `BugCard` — urgent issue; has `isHidden` flag and `escalationChance` that grows over time when hidden
- `TechDebtCard` — attaches to services, surfaces as incidents
- `ServiceCard` — production system that accumulates debt
- `StakeholderCard`, `ManagerCard`, `ProductOwnerCard` — people cards with negotiation mechanics

### Controllers (`src/controllers/`)
- **`BoardController`** — manages the Kanban board, drag-and-drop, card stacking, work progress, bug/debt spawning, and Fog of War integration:
  - 4 columns: `Sprint Commitment | In Progress | Review | Done`
  - **Product Backlog panel** — slide-in overlay visible during `PLANNING`; tickets dragged from here into Sprint Commitment
  - **Sprint Commitment column** — the committed work for the current sprint (replaces old Backlog)
  - `spawnBugHidden(bug)` / `revealBug(bug)` — fog-of-war bug lifecycle
  - `useRevealToken(card)` — spends a GameManager token to reveal a hidden card
  - `tickFog(deltaMs)` — advances escalation chance for all hidden bugs (called from update loop)
  - `getHiddenCards()` — returns currently hidden cards from FogOfWarManager
  - `handleStateTransition(state)` — centralises show/hide of planning UI panels
  - `startSprint()` — hides panels, destroys uncommitted tickets, called before `gameManager.startSprint()`

### Core (`src/core/`)
- **`GameManager`** — sprint lifecycle, timer, budget, morale, tech health, reputation:
  - `revealTokens` counter — earns 1 token per ticket completed, 2 per bug resolved
  - `canSpendRevealToken()` / `spendRevealToken()` — token API consumed by BoardController
  - `startNextSprint()` resets `revealTokens` to 0
  - `hiringFrozen`, `activeDemo`, `poachingTarget`, `leadershipConcerned` — stakeholder event flags
- **`FogOfWarManager`** — hidden card registry and reveal mechanics:
  - `registerHidden(card)` / `reveal(card)` / `revealAll()` / `revealWithToken(card)`
  - `applyVisualState(card)` — alpha 0.3 for hidden, 1.0 for visible
  - `getDisplayedInfo(card)` — masked (`???`) for hidden, full info for visible
  - `tickEscalation(deltaMs)` — grows `escalationChance` on hidden bugs; higher severity = faster
  - `checkEscalations()` — returns bugs at/above threshold, reveals them; callers pass to IncidentManager
  - `escalationThreshold` (default 1.0, configurable) — when bugs fire
  - `reset()` — clears all state at sprint boundaries
- **`IncidentManager`** — spawns/tracks/resolves incidents from escalated bugs:
  - `spawnFromBug(bug)` — creates incident, damages tech health by severity
  - `tick(deltaMs)` — counts down timers, escalates severity on expiry (cap SEV-1 = severity 3)
  - `resolveIncident(incident)` — restores tech health, awards reveal tokens
  - `hasSev1Incident()` — returns true if any active severity-3 incident (locks dev feature work)
  - `activeIncidents` / `getIncidentCount()`
- **`AuditManager`** — senior dev audit mechanic:
  - `canAudit(dev)` — true for senior devs not on a ticket
  - `audit(dev, service)` — reveals 1-3 hidden debt on service, locks dev, awards reputation
  - `tick(deltaMs)` — reduces audit timer, unlocks dev on completion
  - `auditDurationMs` (default 30s), `auditingDevs` list
- **`StakeholderManager`** — stakeholder system and mid-sprint events:
  - Product Owner always present; periodic stakeholders (CTO, CFO, VPProduct) unlock by sprint
  - `fulfillDemand(s)` / `ignoreDemand(s)` — budget rewards / reputation penalties
  - `spawnPeriodicStakeholder(type)` — adds to active stakeholders
  - `advanceSprint()` — unlocks pool, resets PO, removes resolved stakeholders
  - `drawEventCard()` / `applyEvent(event)` — 6 event types (AllHandsMeeting, ScopeCreep, etc.)
  - `pushBack(stakeholder)` — delays demand +1 sprint, costs political capital; >3 triggers LeadershipConcerns

### Scenes (`src/scenes/`)
- **`MainGameScene`** — primary gameplay scene:
  - Initialises `BoardController` and `GameManager`
  - `handleStateChange()` calls `boardController.handleStateTransition(state)`
  - Update loop calls `boardController.tickFog(delta)` during `ACTIVE` state
- **`UIScene`** — overlaid scene for gauges and controls:
  - Top bar: Budget, Morale, Timer, Tech Health, Reputation, **Reveal Tokens**
  - `🔍 USE TOKEN` button — visible when tokens > 0; reveals first hidden card via `boardController.useRevealToken()`
  - Sprint Review overlay with Next Sprint button
  - `START SPRINT` button calls `boardController.startSprint()` then `gameManager.startSprint()`

## Board Layout

```
┌────────────────┬───────────────┬──────────────┬──────────┐
│ Sprint         │ In Progress   │ Review       │ Done     │
│ Commitment     │               │              │          │
│ (PLANNING:     │               │              │          │
│ drag from      │               │              │          │
│ Product Backlog│               │              │          │
│ panel below)   │               │              │          │
└────────────────┴───────────────┴──────────────┴──────────┘
╔══════════════ PRODUCT BACKLOG PANEL (PLANNING only) ══════╗
║  [ticket] [ticket] [ticket] [ticket] [ticket]             ║
╚═══════════════════════════════════════════════════════════╝
└──────────────────── SERVICES AREA ────────────────────────┘
```

## Column Flow
- **PLANNING:** Product Backlog panel visible → player drags tickets into Sprint Commitment
- **ACTIVE:** Panel hidden; player drags Sprint Commitment → In Progress; auto-slides In Progress → Review → Done
- **REVIEW:** All planning UI hidden; sprint evaluated; Next Sprint resets to PLANNING

## Testing
Vitest with JSDOM, mocked Phaser (`GameObjects.Container` mock required). All entity imports that extend Phaser classes must be vi.mock'd in tests.

Test files:
- `BoardController.test.js` — column layout, card ops, product backlog
- `LayoutImprovements.test.js` — 4-column responsive layout
- `PlanningFlowRefactor.test.js` — commitment zone, product backlog panel, sprint start
- `InteractionRefactor.test.js` — drop rules, DevCard stacking
- `FogOfWar.test.js` — FogOfWarManager unit tests (hidden state, reveal, tokens, escalation)
- `FogOfWarIntegration.test.js` — BoardController + GameManager fog integration
- Per-entity test files for DevCard, TicketCard, BugCard, etc.
