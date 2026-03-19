# Game UI Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix multiple UI issues including Done card cleanup, budget formatting, broken buttons, empty Services, column sizing, and Product Backlog functionality.

**Architecture:** Systematic fixes across UI components, BoardController layout, and interaction handlers with proper event binding and state management.

**Tech Stack:** Phaser 3 game engine, JavaScript ES modules, Vitest testing framework

---

### Task 1: Done Cards Cleanup on Sprint End

**Files:**
- Modify: `src/scenes/MainGameScene.js:86-91`
- Test: `test/MainGameScene.test.js`

**Step 1: Write the failing test**

```javascript
describe('Done Card Cleanup', () => {
    it('should remove Done cards when sprint ends', () => {
        const scene = new MainGameScene();
        scene.gameManager = { state: 'ACTIVE' };
        scene.boardController = {
            tickets: [
                { currentColumn: 'Done', destroy: vi.fn() },
                { currentColumn: 'In Progress' },
                { currentColumn: 'Done', destroy: vi.fn() }
            ]
        };
        
        // Trigger sprint end
        scene.gameManager.state = 'REVIEW';
        scene.handleStateChange();
        
        // Verify Done cards were destroyed
        expect(scene.boardController.tickets[0].destroy).toHaveBeenCalled();
        expect(scene.boardController.tickets[2].destroy).toHaveBeenCalled();
        expect(scene.boardController.tickets).toHaveLength(1); // Only In Progress remains
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/MainGameScene.test.js`
Expected: FAIL with "destroy not called"

**Step 3: Write minimal implementation**

```javascript
case 'REVIEW':
    this.boardController.handleStateTransition('REVIEW');
    // Reveal all remaining hidden bugs at sprint end
    this.boardController.fogOfWar.revealAll();
    
    // Remove Done cards
    this.boardController.tickets = this.boardController.tickets.filter(ticket => {
        if (ticket.currentColumn === 'Done') {
            if (typeof ticket.destroy === 'function') {
                ticket.destroy();
            }
            return false;
        }
        return true;
    });
    
    this.evaluateSprint();
    break;
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/MainGameScene.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/scenes/MainGameScene.js test/MainGameScene.test.js
git commit -m "feat: remove Done cards when sprint ends"
```

---

### Task 2: Budget Display Formatting

**Files:**
- Modify: `src/scenes/UIScene.js:332`
- Test: `test/UIScene.test.js`

**Step 1: Write the failing test**

```javascript
describe('Budget Display', () => {
    it('should display budget without decimal places', () => {
        const uiScene = new UIScene();
        uiScene.budgetText = { setText: vi.fn() };
        
        uiScene.updateUI({ budget: 10500.75 });
        expect(uiScene.budgetText.setText).toHaveBeenCalledWith('Budget: $10500');
        
        uiScene.updateUI({ budget: 10000 });
        expect(uiScene.budgetText.setText).toHaveBeenCalledWith('Budget: $10000');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/UIScene.test.js`
Expected: FAIL with "Budget: $10500.75"

**Step 3: Write minimal implementation**

```javascript
// Update Budget
this.budgetText.setText(`Budget: $${Math.floor(gameManager.budget)}`);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/UIScene.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/scenes/UIScene.js test/UIScene.test.js
git commit -m "fix: format budget display without decimal places"
```

---

### Task 3: Product Owner Card Button Fixes

**Files:**
- Modify: `src/scenes/UIScene.js:220-233`
- Test: `test/UIScene.test.js`

**Step 1: Write the failing test**

```javascript
describe('Product Owner Buttons', () => {
    it('should call stakeholder methods when buttons clicked', () => {
        const uiScene = new UIScene();
        const mockStakeholder = {
            demandCount: 1,
            fulfillDemand: vi.fn(),
            ignoreDemand: vi.fn(),
            pushBack: vi.fn()
        };
        
        uiScene.scene = { get: vi.fn().mockReturnValue({
            stakeholderManager: { getProductOwner: () => mockStakeholder }
        })};
        
        // Simulate button clicks
        uiScene.fulfillButton.emit('pointerdown');
        expect(mockStakeholder.fulfillDemand).toHaveBeenCalled();
        
        uiScene.ignoreButton.emit('pointerdown');
        expect(mockStakeholder.ignoreDemand).toHaveBeenCalled();
        
        uiScene.pushBackButton.emit('pointerdown');
        expect(mockStakeholder.pushBack).toHaveBeenCalled();
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/UIScene.test.js`
Expected: FAIL with "fulfillDemand not called"

**Step 3: Write minimal implementation**

```javascript
// Event handlers
const getStakeholder = () => {
    const mainScene = this.scene.get('MainGameScene');
    return mainScene?.stakeholderManager?.getProductOwner();
};

// Fix button event binding
this.fulfillButton.on('pointerdown', () => {
    const sh = getStakeholder();
    if (sh && sh.demandCount > 0 && typeof sh.fulfillDemand === 'function') {
        sh.fulfillDemand();
    }
});

this.ignoreButton.on('pointerdown', () => {
    const sh = getStakeholder();
    if (sh && sh.demandCount > 0 && typeof sh.ignoreDemand === 'function') {
        sh.ignoreDemand();
    }
});

this.pushBackButton.on('pointerdown', () => {
    const sh = getStakeholder();
    if (sh && sh.demandCount > 0 && typeof sh.pushBack === 'function') {
        sh.pushBack();
    }
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/UIScene.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/scenes/UIScene.js test/UIScene.test.js
git commit -m "fix: Product Owner button event handlers"
```

---

### Task 4: Reveal Token Button Fix

**Files:**
- Modify: `src/scenes/UIScene.js:370-378`
- Test: `test/UIScene.test.js`

**Step 1: Write the failing test**

```javascript
describe('Reveal Token Button', () => {
    it('should spend token and reveal card when clicked', () => {
        const uiScene = new UIScene();
        const mockGameManager = {
            revealTokens: 2,
            canSpendRevealToken: () => true,
            spendRevealToken: vi.fn()
        };
        const mockBoardController = {
            fogOfWar: { revealRandom: vi.fn() }
        };
        
        uiScene.scene = { 
            get: vi.fn()
                .mockReturnValueOnce(mockGameManager)
                .mockReturnValueOnce({ boardController: mockBoardController })
        };
        
        uiScene.revealButton.emit('pointerdown');
        
        expect(mockGameManager.spendRevealToken).toHaveBeenCalled();
        expect(mockBoardController.fogOfWar.revealRandom).toHaveBeenCalled();
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/UIScene.test.js`
Expected: FAIL with "spendRevealToken not called"

**Step 3: Write minimal implementation**

```javascript
this.revealButton.on('pointerdown', () => {
    const mainScene = this.scene.get('MainGameScene');
    if (mainScene && mainScene.gameManager) {
        if (mainScene.gameManager.canSpendRevealToken()) {
            mainScene.gameManager.spendRevealToken();
            mainScene.boardController.fogOfWar.revealRandom();
        }
    }
});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/UIScene.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/scenes/UIScene.js test/UIScene.test.js
git commit -m "fix: Reveal token button functionality"
```

---

### Task 5: Services Card Implementation

**Files:**
- Create: `src/entities/ServiceCard.js`
- Modify: `src/controllers/BoardController.js:1`
- Test: `test/ServiceCard.test.js`

**Step 1: Write the failing test**

```javascript
describe('ServiceCard', () => {
    it('should create service card with proper styling', () => {
        const scene = { add: { image: vi.fn(), text: vi.fn() } };
        scene.add.image.mockReturnValue({ setTint: vi.fn() });
        scene.add.text.mockReturnValue({ setOrigin: vi.fn() });
        
        const card = new ServiceCard(scene, 100, 100, "API Service");
        
        expect(card.title).toBe("API Service");
        expect(scene.add.image).toHaveBeenCalled();
        expect(scene.add.text).toHaveBeenCalledWith(0, -50, "API Service", expect.any(Object));
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/ServiceCard.test.js`
Expected: FAIL with "ServiceCard not defined"

**Step 3: Write minimal implementation**

```javascript
import CardContainer from './CardContainer.js';

export default class ServiceCard extends CardContainer {
    constructor(scene, x, y, title) {
        super(scene, x, y, title);
        
        // Override visual style for services
        this.bg.setTint(0x4444ff); // Blue for services
        
        // Add service icon
        this.serviceIcon = scene.add.text(0, 30, '🔧', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.add(this.serviceIcon);
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/ServiceCard.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/entities/ServiceCard.js test/ServiceCard.test.js
git commit -m "feat: add ServiceCard entity"
```

---

### Task 6: Column Layout Resizing

**Files:**
- Modify: `src/controllers/BoardController.js:50-100`
- Test: `test/BoardController.test.js`

**Step 1: Write the failing test**

```javascript
describe('Column Layout', () => {
    it('should create narrower columns to fit product backlog', () => {
        const scene = { add: { rectangle: vi.fn(), text: vi.fn() } };
        scene.add.rectangle.mockReturnValue({ setOrigin: vi.fn() });
        const controller = new BoardController(scene);
        
        controller.createColumns();
        
        // Verify columns are narrower (should be ~120px instead of ~200px)
        const columnWidth = scene.add.rectangle.mock.calls[0][3];
        expect(columnWidth).toBeLessThan(150);
        
        // Verify product backlog space exists
        expect(scene.add.rectangle).toHaveBeenCalledWith(
            expect.any(Number),  // x
            expect.any(Number),  // y
            expect.any(Number),  // width (should be positive for backlog)
            expect.any(Number),  // height
            expect.any(Number),  // color
            expect.any(Number)   // alpha
        );
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/BoardController.test.js`
Expected: FAIL with "columnWidth > 150"

**Step 3: Write minimal implementation**

```javascript
createColumns() {
    const columnWidth = 120;
    const columnHeight = 400;
    const startX = 200; // Start further right to leave space for backlog
    const spacing = 140;
    
    // Product Backlog area (left side)
    this.productBacklogZone = {
        x: 20,
        y: 100,
        width: 160,
        height: columnHeight,
        columnName: 'Product Backlog'
    };
    
    // Main columns
    this.columnZones = {
        'Sprint Commitment': {
            x: startX,
            y: 100,
            width: columnWidth,
            height: columnHeight,
            columnName: 'Sprint Commitment'
        },
        'In Progress': {
            x: startX + spacing,
            y: 100,
            width: columnWidth,
            height: columnHeight,
            columnName: 'In Progress'
        },
        'Testing': {
            x: startX + (spacing * 2),
            y: 100,
            width: columnWidth,
            height: columnHeight,
            columnName: 'Testing'
        },
        'Done': {
            x: startX + (spacing * 3),
            y: 100,
            width: columnWidth,
            height: columnHeight,
            columnName: 'Done'
        }
    };
    
    // Create visual elements...
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/BoardController.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/controllers/BoardController.js test/BoardController.test.js
git commit -m "feat: resize columns and add product backlog area"
```

---

### Task 7: Product Backlog Card Generation

**Files:**
- Modify: `src/controllers/BoardController.js:167-224`
- Test: `test/BoardController.test.js`

**Step 1: Write the failing test**

```javascript
describe('Product Backlog Cards', () => {
    it('should create draggable cards in product backlog', () => {
        const scene = { 
            add: { image: vi.fn(), text: vi.fn(), existing: vi.fn() },
            scene: { get: vi.fn() }
        };
        const controller = new BoardController(scene);
        controller.productBacklogTickets = [];
        
        controller.populateProductBacklog(3);
        
        expect(controller.productBacklogTickets).toHaveLength(3);
        expect(controller.productBacklogTickets[0].currentColumn).toBe('Product Backlog');
        expect(controller.productBacklogTickets[0].title).toBeDefined();
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- test/BoardController.test.js`
Expected: FAIL with "productBacklogTickets.length is 0"

**Step 3: Write minimal implementation**

```javascript
populateProductBacklog(ticketCount) {
    this.productBacklogTickets = [];

    const ticketTitles = [
        'Fix login bug', 'Add user profile', 'Optimize database queries',
        'Implement search', 'Add dark mode', 'Mobile responsiveness',
        'API documentation', 'Performance testing', 'Security audit',
        'Data migration', 'Email notifications', 'File uploads'
    ];
    
    const requirements = ['Frontend', 'Backend', 'DevOps', 'Database', 'Security'];
    
    const panelX = this.productBacklogZone.x;
    const panelY = this.productBacklogZone.y;
    const cardSpacing = 90;
    
    for (let i = 0; i < ticketCount && i < ticketTitles.length; i++) {
        const title = ticketTitles[i];
        const requirement = requirements[Math.floor(Math.random() * requirements.length)];
        const x = panelX + 80;
        const y = panelY + 40 + (i * cardSpacing);
        
        try {
            const ticket = new TicketCard(this.scene, x, y, title, requirement);
            ticket.currentColumn = 'Product Backlog';
            this.scene.add.existing(ticket);
            this.productBacklogTickets.push(ticket);
        } catch (e) {
            console.error('Failed to create ticket:', e);
        }
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- test/BoardController.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/controllers/BoardController.js test/BoardController.test.js
git commit -m "feat: generate draggable cards in product backlog"
```

---

## Plan Complete

**Plan complete and saved to `docs/plans/2026-03-18-game-ui-improvements.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
