# Task Tracker

*Update this list every time a task (bug or feature) is added, modified, or completed.*

### Features

- [x] Phase 3: Services, Bugs & Tech Health — Complete TDD implementation
  - [x] ServiceCard class and Services zone
  - [x] BugCard refinement (no budget reward, affects Tech Health)
  - [x] Tech Health in GameManager (drops, gains, on-call thresholds, total outage)
  - [x] Tech Health gauge in UIScene
  - [x] Tech Health integration in BoardController (spawning drops health, completion restores, on-call restrictions)

- [x] Planning Flow Refactor
  - [x] Remove Commitment Zone overlay bug (never hidden on ACTIVE transition)
  - [x] Remove Icebox column; replace with Product Backlog panel (visible during PLANNING only)
  - [x] Rename Backlog → Sprint Commitment (4 columns: Sprint Commitment, In Progress, Review, Done)
  - [x] Product Backlog panel: show/hide, populate, ticket drag into Sprint Commitment
  - [x] Sprint start transition: hide panel, destroy uncommitted tickets
  - [x] Wire UIScene START SPRINT button → boardController.startSprint() + gameManager.startSprint()
  - [x] BoardController.handleStateTransition(state) centralises all show/hide logic
  - [x] Update BoardController.test.js and LayoutImprovements.test.js for 4-column layout
  - [x] Fix InteractionRefactor.test.js (Phaser mock + stale column assertions)

- [x] Phase 5a: Fog of War — FogOfWarManager
  - [x] FogOfWarManager: registerHidden, reveal, revealAll, reset
  - [x] getDisplayedInfo() — masked info for hidden cards
  - [x] applyVisualState() — alpha 0.3 for hidden, 1.0 for visible
  - [x] tickEscalation() — escalationChance grows over time for hidden bugs
  - [x] Reveal token system: addRevealTokens, canReveal, revealWithToken
  - [x] 32 passing tests in FogOfWar.test.js

- [x] Phase 5b: Fog of War — Integration
  - [x] FogOfWarManager wired into BoardController (fogOfWar property)
  - [x] BoardController.spawnBugHidden(bug) — registers hidden, applies alpha 0.3
  - [x] BoardController.revealBug(bug) — unconditional reveal
  - [x] BoardController.useRevealToken(card) — spends GameManager token, reveals card
  - [x] BoardController.tickFog(deltaMs) — escalation tick (called from MainGameScene update)
  - [x] BoardController.getHiddenCards() — exposes fogOfWar.hiddenCards
  - [x] GameManager.revealTokens counter (0 on construction, reset on startNextSprint)
  - [x] GameManager.completeTicket() awards +1 token (ticket) or +2 tokens (bug)
  - [x] GameManager.canSpendRevealToken() / spendRevealToken()
  - [x] MainGameScene.update() calls boardController.tickFog(delta) during ACTIVE

- [x] Phase 5c: Fog of War — Reveal Token UI
  - [x] UIScene: Reveal token count display (🔍 Reveal: N)
  - [x] UIScene: USE TOKEN button — visible when tokens > 0, reveals first hidden card
  - [x] UIScene.updateUI() updates token count and button visibility

### Bugs

- [ ] Replace temporary UI elements with polished graphical assets
- [ ] Optimize drag-and-drop hit detection for dense card stacks
- [x] Spawn bug cards into Backlog only when low-quality tickets complete

- [x] Phase 5d: Bug escalation → IncidentManager
  - [x] FogOfWarManager.checkEscalations() — returns bugs at/above threshold, reveals them
  - [x] FogOfWarManager.escalationThreshold (default 1.0, configurable)
  - [x] Severity-weighted escalation rate (higher severity = faster escalation)
  - [x] IncidentManager: spawnFromBug, tick (countdown + severity escalation), resolveIncident
  - [x] hasSev1Incident() — SEV-1 locks dev feature work
  - [x] Resolving incidents restores tech health + awards reveal tokens
  - [x] 29 passing tests in BugEscalation.test.js

- [x] Phase 5e: Audit mechanic — AuditManager
  - [x] canAudit(dev) — senior devs only, not already on a ticket
  - [x] audit(dev, service) — reveals 1-3 hidden debt cards, locks dev, awards reputation
  - [x] tick(deltaMs) — audit timer, unlocks dev on completion
  - [x] 19 passing tests in AuditMechanic.test.js

- [x] Phase 5f: Stakeholder system — StakeholderManager
  - [x] Product Owner always present with per-sprint demand count
  - [x] fulfillDemand / ignoreDemand — budget rewards / reputation penalties
  - [x] Periodic stakeholders: CTO (sprint 4+), VPProduct (sprint 4+), CFO (sprint 6+)
  - [x] demandType per stakeholder: infrastructure / budget / pivot
  - [x] drawEventCard() / applyEvent() — 6 event types
  - [x] pushBack() — political capital tracking, LeadershipConcerns trigger at >3
  - [x] advanceSprint() — lifecycle management
  - [x] 29 passing tests in StakeholderSystem.test.js

### Up Next

- [ ] Wire IncidentManager, AuditManager, StakeholderManager into MainGameScene
- [ ] Wire StakeholderManager.advanceSprint() into sprint review / next sprint flow
- [ ] Wire IncidentManager.hasSev1Incident() into BoardController on-call restriction
- [ ] New hire onboarding reveals debt cards (fresh eyes mechanic)
- [ ] Card pack / sprint review polish (animated reveals, sound design hooks)
- [ ] UI for active incidents (countdown timer display, severity indicator)
- [ ] UI for stakeholder demands and push-back interaction
