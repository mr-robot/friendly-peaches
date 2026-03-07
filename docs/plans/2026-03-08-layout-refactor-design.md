# Sprint Planning Refactor & Interaction Design

## 1. Column Layout Refactor
The board will be reorganized to prioritize the planning flow from left to right.

- **Planning Zone (Icebox):** Far Left column. Tickets start here.
- **Backlog (Commitment Zone):** Second column. Dragging from Icebox to Backlog during `PLANNING` state commits the ticket.
- **Sprint Columns:** `In Progress`, `Review`, `Done`.

**Visual Hierarchy:**
1. **Icebox** (Planning)
2. **Backlog** (Committed)
3. **In Progress** (Active)
4. **Review** (Verification)
5. **Done** (Complete)

## 2. Interaction Rules (Tickets & Bugs)
To enforce the Kanban/Sprint flow, movement is restricted:

- **Manual Dragging:**
  - Only allowed from **Backlog** to **In Progress**.
  - Only allowed during the **ACTIVE** sprint state.
  - Movement between other columns is **Automated** based on work completion.
  - Cards **cannot** be dragged back once moved (except during Planning between Icebox and Backlog).
- **Spatial Organization:**
  - Cards can be moved freely *within* their current column to allow players to organize their workspace.
  - Dropping a card inside its current column zone will update its X/Y but maintain its `currentColumn` status.

## 3. DevCard Behavior
Developers are the "active agents" on the board.

- **Movement:** DevCards can be moved anywhere on the screen. They are not bound to columns.
- **Work Restriction:** DevCards only contribute progress to Ticket/Bug cards if the card is **not** in the Backlog or Icebox (i.e., it must be in `In Progress` or `Review`).
- **Attachment:** DevCards "snap" to a Ticket/Bug card when dropped on them, regardless of where that card is positioned within its column.

## 4. State Transitions
- **PLANNING State:**
  - Icebox and Backlog are active.
  - Player drags tickets from Icebox to Backlog.
  - `START SPRINT` hides/disables the Icebox.
- **ACTIVE State:**
  - Player drags from Backlog to `In Progress`.
  - Devs work on cards in `In Progress` and `Review`.
  - Automated transition: `In Progress` -> `Review` -> `Done`.

## 5. Implementation Tasks (TDD)
1. **Refactor `BoardController.columns` order.**
2. **Update `handleDrop` logic for restricted movement.**
3. **Update `DevCard` interaction to check column status before allowing work.**
4. **Enable free movement within the same column zone.**
5. **Detach `DevCard` from column snapping while maintaining Ticket attachment.**

---
**Does this layout and interaction flow match your vision?**
- Icebox is now the first column.
- Manual dragging is strictly for "Starting work" (Backlog -> In Progress).
- Devs move freely but only work in "Sprint Zones".
