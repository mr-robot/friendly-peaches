# Phase 4: Planning & Stakeholders Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce sprint commitment mechanics and stakeholder pressure through the Product Owner card and sprint evaluation system.

**Architecture:** Add a Sprint Commitment zone to BoardController, create StakeholderCard system with Product Owner as first implementation, and implement sprint phase management in GameManager with evaluation logic.

**Tech Stack:** Phaser.js game entities, Vitest testing, existing Kanban board system

---

### Task 1: Sprint Commitment Zone

**Files:**
- Modify: `src/controllers/BoardController.js:67-100`
- Test: `test/BoardController.test.js`

**Step 1: Write the failing test**

```javascript
describe('Sprint Commitment Zone', () => {
    it('should create a Sprint Commitment zone during column creation', () => {
        controller.createColumns();
        expect(controller.sprintCommitmentZone).toBeDefined();
        expect(controller.sprintCommitmentZone.zone.setDropZone).toHaveBeenCalled();
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- BoardController`
Expected: FAIL with "sprintCommitmentZone is not defined"

**Step 3: Write minimal implementation**

```javascript
// In createColumns method, after existing column creation:
// Create Sprint Commitment Zone
const commitmentWidth = 200;
const commitmentX = this.scene.scale.width - commitmentWidth - 20;
const commitmentY = 50;
const commitmentHeight = 150;

this.sprintCommitmentZone = {
    bg: this.scene.add.rectangle(commitmentX, commitmentY, commitmentWidth, commitmentHeight, 0x2d4a2b).setOrigin(0, 0),
    zone: this.scene.add.zone(commitmentX, commitmentY, commitmentWidth, commitmentHeight).setOrigin(0, 0).setDropZone(),
    x: commitmentX,
    y: commitmentY,
    width: commitmentWidth,
    height: commitmentHeight
};

this.scene.add.text(commitmentX + 10, commitmentY + 10, 'SPRINT\nCOMMITMENT', {
    color: '#ffffff',
    fontSize: '14px',
    fontStyle: 'bold'
});

this.sprintCommitmentZone.zone.columnName = 'Sprint Commitment';
```

**Step 4: Run test to verify it passes**

Run: `npm test -- BoardController`
Expected: PASS

**Step 5: Commit**

```bash
git add src/controllers/BoardController.js test/BoardController.test.js
git commit -m "feat: add Sprint Commitment zone to BoardController"
```

---

### Task 2: StakeholderCard Base Class

**Files:**
- Create: `src/entities/StakeholderCard.js`
- Test: `test/StakeholderCard.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import StakeholderCard from '../src/entities/StakeholderCard.js';

describe('StakeholderCard', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                rectangle: vi.fn().mockReturnValue({ setTint: vi.fn(), setOrigin: vi.fn() }),
                text: vi.fn().mockReturnValue({ setOrigin: vi.fn() })
            }
        };
    });

    it('should initialize with stakeholder type and gold tint', () => {
        const stakeholder = new StakeholderCard(mockScene, 0, 0, 'Product Owner');
        
        expect(stakeholder.type).toBe('Product Owner');
        expect(stakeholder.bg.setTint).toHaveBeenCalledWith(0xffd700); // Gold tint
        expect(stakeholder.title).toBe('Product Owner');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- StakeholderCard`
Expected: FAIL with "Cannot find module '../src/entities/StakeholderCard.js'"

**Step 3: Write minimal implementation**

```javascript
import CardContainer from './CardContainer.js';

export default class StakeholderCard extends CardContainer {
    constructor(scene, x, y, type) {
        super(scene, x, y, type);
        
        // Gold tint to distinguish stakeholders from other cards
        this.bg.setTint(0xffd700);
        
        this.type = type;
        
        // Stakeholders can't be dragged by default
        this.setInteractive(false);
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- StakeholderCard`
Expected: PASS

**Step 5: Commit**

```bash
git add src/entities/StakeholderCard.js test/StakeholderCard.test.js
git commit -m "feat: create StakeholderCard base class with gold tint"
```

---

### Task 3: Product Owner Card

**Files:**
- Create: `src/entities/ProductOwnerCard.js`
- Test: `test/ProductOwnerCard.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ProductOwnerCard from '../src/entities/ProductOwnerCard.js';

describe('ProductOwnerCard', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                rectangle: vi.fn().mockReturnValue({ setTint: vi.fn(), setOrigin: vi.fn() }),
                text: vi.fn().mockReturnValue({ setOrigin: vi.fn() })
            }
        };
    });

    it('should extend StakeholderCard with Product Owner type', () => {
        const po = new ProductOwnerCard(mockScene, 0, 0);
        
        expect(po.type).toBe('Product Owner');
        expect(po.bg.setTint).toHaveBeenCalledWith(0xffd700);
        expect(po.title).toBe('Product Owner');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- ProductOwnerCard`
Expected: FAIL with "Cannot find module '../src/entities/ProductOwnerCard.js'"

**Step 3: Write minimal implementation**

```javascript
import StakeholderCard from './StakeholderCard.js';

export default class ProductOwnerCard extends StakeholderCard {
    constructor(scene, x, y) {
        super(scene, x, y, 'Product Owner');
        
        // Product Owner specific properties
        this.ticketBacklog = [];
        this.demands = [];
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- ProductOwnerCard`
Expected: PASS

**Step 5: Commit**

```bash
git add src/entities/ProductOwnerCard.js test/ProductOwnerCard.test.js
git commit -m "feat: create ProductOwnerCard extending StakeholderCard"
```

---

### Task 4: Sprint Phase Management

**Files:**
- Modify: `src/core/GameManager.js:10-15`
- Test: `test/GameManager.test.js`

**Step 1: Write the failing test**

```javascript
describe('Sprint Phase Management', () => {
    it('should initialize in PLANNING phase', () => {
        expect(manager.state).toBe('PLANNING');
    });

    it('should transition to ACTIVE when startSprint is called', () => {
        manager.startSprint();
        expect(manager.state).toBe('ACTIVE');
    });

    it('should track sprint commitments', () => {
        const ticket = { id: 'ticket1' };
        manager.addSprintCommitment(ticket);
        expect(manager.sprintCommitments).toContain(ticket);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- GameManager`
Expected: FAIL with "state is not PLANNING" and "startSprint is not a function"

**Step 3: Write minimal implementation**

```javascript
// In GameManager constructor:
this.state = 'PLANNING';
this.sprintCommitments = [];
this.currentSprint = 1;

// Add new methods:
startSprint() {
    this.state = 'ACTIVE';
}

endSprint() {
    this.state = 'REVIEW';
    this.evaluateSprint();
}

addSprintCommitment(ticket) {
    this.sprintCommitments.push(ticket);
}

removeSprintCommitment(ticket) {
    const index = this.sprintCommitments.indexOf(ticket);
    if (index > -1) {
        this.sprintCommitments.splice(index, 1);
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- GameManager`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/GameManager.js test/GameManager.test.js
git commit -m "feat: add sprint phase management to GameManager"
```

---

### Task 5: Sprint Evaluation Logic

**Files:**
- Modify: `src/core/GameManager.js:80-100`
- Test: `test/GameManager.test.js`

**Step 1: Write the failing test**

```javascript
describe('Sprint Evaluation', () => {
    it('should reward budget for completed commitments', () => {
        const ticket = { id: 'ticket1', currentColumn: 'Done' };
        manager.sprintCommitments = [ticket];
        
        const initialBudget = manager.budget;
        manager.evaluateSprint();
        
        expect(manager.budget).toBeGreaterThan(initialBudget);
    });

    it('should penalize budget for missed commitments', () => {
        const ticket = { id: 'ticket1', currentColumn: 'In Progress' };
        manager.sprintCommitments = [ticket];
        
        const initialBudget = manager.budget;
        manager.evaluateSprint();
        
        expect(manager.budget).toBeLessThan(initialBudget);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- GameManager`
Expected: FAIL with "evaluateSprint is not defined"

**Step 3: Write minimal implementation**

```javascript
evaluateSprint() {
    const completed = this.sprintCommitments.filter(ticket => 
        ticket.currentColumn === 'Done'
    );
    const missed = this.sprintCommitments.filter(ticket => 
        ticket.currentColumn !== 'Done'
    );
    
    // Rewards: +1000 budget per completed commitment
    this.budget += completed.length * 1000;
    
    // Penalties: -500 budget per missed commitment
    this.budget -= missed.length * 500;
    
    // Clear commitments for next sprint
    this.sprintCommitments = [];
    this.currentSprint++;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- GameManager`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/GameManager.js test/GameManager.test.js
git commit -m "feat: add sprint evaluation logic with rewards and penalties"
```

---

### Task 6: Commitment Zone Drop Logic

**Files:**
- Modify: `src/controllers/BoardController.js:350-380`
- Test: `test/BoardController.test.js`

**Step 1: Write the failing test**

```javascript
describe('Sprint Commitment Logic', () => {
    it('should allow dropping tickets into Sprint Commitment zone during PLANNING', () => {
        const mockGameManager = { state: 'PLANNING' };
        controller.scene.gameManager = mockGameManager;
        
        const ticket = { 
            constructor: { name: 'TicketCard' },
            currentColumn: 'Backlog'
        };
        const dropZone = { columnName: 'Sprint Commitment' };
        
        controller.handleDrop(ticket, dropZone);
        
        expect(ticket.currentColumn).toBe('Sprint Commitment');
        expect(mockGameManager.addSprintCommitment).toHaveBeenCalledWith(ticket);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- BoardController`
Expected: FAIL with "addSprintCommitment was not called"

**Step 3: Write minimal implementation**

```javascript
// In handleDrop method, add new condition for Sprint Commitment:
if (dropZone && dropZone.columnName === 'Sprint Commitment') {
    const gameManager = this.scene.gameManager;
    const isPlanning = gameManager && gameManager.state === 'PLANNING';
    
    if (isPlanning && (card.constructor.name === 'TicketCard' || card.constructor.name === 'BugCard')) {
        card.currentColumn = 'Sprint Commitment';
        this.updateTicketArrays(card);
        
        // Track commitment in GameManager
        if (gameManager && typeof gameManager.addSprintCommitment === 'function') {
            gameManager.addSprintCommitment(card);
        }
        
        // Position card in commitment zone
        card.x = this.sprintCommitmentZone.x + this.sprintCommitmentZone.width / 2;
        card.y = this.sprintCommitmentZone.y + 50 + (this.sprintCommitments.length * 30);
        return;
    }
    
    // Snap back if not in planning phase
    if (card.input) {
        card.x = card.input.dragStartX;
        card.y = card.input.dragStartY;
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- BoardController`
Expected: PASS

**Step 5: Commit**

```bash
git add src/controllers/BoardController.js test/BoardController.test.js
git commit -m "feat: add Sprint Commitment zone drop logic"
```

---

### Task 7: Sprint Phase UI Indicators

**Files:**
- Modify: `src/scenes/UIScene.js:28-35`
- Test: `test/UIScene.test.js`

**Step 1: Write the failing test**

```javascript
describe('Sprint Phase UI', () => {
    it('should display current sprint phase', () => {
        const mockGameManager = { state: 'PLANNING', currentSprint: 1 };
        uiScene.updateUI(mockGameManager);
        
        expect(uiScene.sprintPhaseText.text).toContain('PLANNING');
        expect(uiScene.sprintPhaseText.text).toContain('Sprint 1');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- UIScene`
Expected: FAIL with "sprintPhaseText is not defined"

**Step 3: Write minimal implementation**

```javascript
// In create() method:
this.sprintPhaseText = this.add.text(400, 15, 'Sprint 1 - PLANNING', {
    fontSize: '18px',
    color: '#ffff00',
    fontStyle: 'bold'
}).setOrigin(0.5);

// In updateUI() method:
this.sprintPhaseText.setText(`Sprint ${gameManager.currentSprint} - ${gameManager.state}`);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- UIScene`
Expected: PASS

**Step 5: Commit**

```bash
git add src/scenes/UIScene.js test/UIScene.test.js
git commit -m "feat: add sprint phase UI indicator"
```

---

**Plan complete and saved to `docs/plans/2026-03-08-phase4-planning-stakeholders.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
