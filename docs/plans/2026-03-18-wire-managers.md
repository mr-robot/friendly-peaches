# Wire Managers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the completed `IncidentManager`, `AuditManager`, and `StakeholderManager` into the core game loop in `MainGameScene` and UI so their mechanics affect gameplay.

**Architecture:** The managers are currently initialized in `MainGameScene` but their effects are incomplete or missing UI. We need to hook `IncidentManager.hasSev1Incident()` into the `BoardController`'s drop logic to prevent feature work. We need to add visual indicators for active incidents (timers) and stakeholder demands. Finally, we need to wire `StakeholderManager.advanceSprint()` correctly into the sprint review flow.

**Tech Stack:** Phaser 3, JavaScript (ES6), Vitest

---

### Task 1: Wire StakeholderManager into Sprint Review Flow

**Files:**
- Modify: `src/scenes/MainGameScene.js`
- Test: `test/MainGameScene.test.js` (create if missing, or test via integration)

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MainGameScene from '../src/scenes/MainGameScene.js';

vi.mock('../src/controllers/BoardController.js', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            createColumns: vi.fn(),
            populateProductBacklog: vi.fn(),
            setupInteractions: vi.fn(),
            handleStateTransition: vi.fn(),
            fogOfWar: { reset: vi.fn(), revealAll: vi.fn() },
            tickets: [],
            devs: []
        }))
    };
});

// Mock Phaser Scene methods
const mockScene = { launch: vi.fn(), get: vi.fn() };
const mockAdd = { existing: vi.fn() };

describe('MainGameScene Stakeholder Integration', () => {
    let scene;

    beforeEach(() => {
        scene = new MainGameScene();
        scene.scene = mockScene;
        scene.add = mockAdd;
        scene.create();
    });

    it('should call stakeholderManager.advanceSprint() when transitioning to PLANNING', () => {
        const advanceSpy = vi.spyOn(scene.stakeholderManager, 'advanceSprint');
        
        // Force state transition
        scene.gameManager.state = 'PLANNING';
        scene.handleStateChange();
        
        expect(advanceSpy).toHaveBeenCalled();
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test test/MainGameScene.test.js`
Expected: Test should actually pass because `this.stakeholderManager.advanceSprint()` is already in `MainGameScene.js` line 75, but we need to ensure it's called correctly during the review cycle. Let's write a test that ensures `evaluateSprint` handles stakeholders. Wait, the actual missing piece is wiring the UI buttons to accept/reject stakeholder demands. Let's adjust Task 1 to focus on Stakeholder UI interactions.

*Correction: Task 1 should be wiring Stakeholder UI interactions.*

### Task 1: Wire Stakeholder UI Interactions

**Files:**
- Modify: `src/scenes/UIScene.js`
- Test: `test/UIScene.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UIScene from '../src/scenes/UIScene.js';

describe('UIScene Stakeholder Interactions', () => {
    let uiScene;
    let mockGameManager;
    let mockStakeholder;

    beforeEach(() => {
        uiScene = new UIScene();
        uiScene.add = { text: vi.fn().mockReturnValue({ setOrigin: vi.fn(), setInteractive: vi.fn(), on: vi.fn(), destroy: vi.fn() }), rectangle: vi.fn().mockReturnValue({ setOrigin: vi.fn(), setInteractive: vi.fn(), setStrokeStyle: vi.fn(), on: vi.fn(), destroy: vi.fn() }), container: vi.fn().mockReturnValue({ setPosition: vi.fn(), add: vi.fn(), destroy: vi.fn() }) };
        uiScene.input = { on: vi.fn() };
        uiScene.events = { emit: vi.fn(), on: vi.fn() };
        
        mockGameManager = { budget: 100, morale: 100 };
        mockStakeholder = { 
            name: 'CTO', 
            demandCount: 1, 
            demandType: 'infrastructure',
            fulfillDemand: vi.fn(),
            ignoreDemand: vi.fn(),
            pushBack: vi.fn()
        };
    });

    it('should create stakeholder demand UI when a stakeholder is present', () => {
        uiScene.create();
        uiScene.updateUI(mockGameManager, { stakeholder: mockStakeholder });
        
        // Should have created a container for the stakeholder UI
        expect(uiScene.stakeholderContainer).toBeDefined();
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test test/UIScene.test.js`
Expected: FAIL with "uiScene.stakeholderContainer is undefined"

**Step 3: Write minimal implementation**

```javascript
// In src/scenes/UIScene.js, update updateUI method:
updateUI(gameManager, extraData = {}) {
    // ... existing top bar updates ...

    if (extraData.stakeholder && extraData.stakeholder.demandCount > 0) {
        if (!this.stakeholderContainer) {
            this.stakeholderContainer = this.add.container(20, 100);
            
            const bg = this.add.rectangle(0, 0, 200, 100, 0x333333).setOrigin(0);
            bg.setStrokeStyle(2, 0xffaa00);
            
            const text = this.add.text(10, 10, `${extraData.stakeholder.name} Demand:\n${extraData.stakeholder.demandType}`, { fontSize: '14px', fill: '#fff' });
            
            const fulfillBtn = this.add.text(10, 60, '[Fulfill]', { fill: '#0f0' })
                .setInteractive()
                .on('pointerdown', () => {
                    extraData.stakeholder.fulfillDemand();
                    this.updateUI(gameManager, { ...extraData, stakeholder: null });
                });
                
            const ignoreBtn = this.add.text(80, 60, '[Ignore]', { fill: '#f00' })
                .setInteractive()
                .on('pointerdown', () => {
                    extraData.stakeholder.ignoreDemand();
                    this.updateUI(gameManager, { ...extraData, stakeholder: null });
                });

            this.stakeholderContainer.add([bg, text, fulfillBtn, ignoreBtn]);
        }
    } else if (this.stakeholderContainer && !extraData.stakeholder) {
        this.stakeholderContainer.destroy();
        this.stakeholderContainer = null;
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test test/UIScene.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/scenes/UIScene.js test/UIScene.test.js
git commit -m "feat: add basic stakeholder demand UI"
```

### Task 2: Connect SEV-1 Incidents to Developer Work Restrictions

**Files:**
- Modify: `src/controllers/BoardController.js`
- Test: `test/BoardController.test.js`

**Step 1: Write the failing test**

```javascript
// In test/BoardController.test.js, add:
describe('SEV-1 Restrictions', () => {
    it('should reject dev drops on feature tickets when a SEV-1 incident is active', () => {
        // Setup scene with a mock incident manager reporting a SEV-1
        scene.incidentManager = { hasSev1Incident: () => true };
        
        const dev = { type: 'DevCard', currentColumn: 'Devs' };
        const ticket = { type: 'TicketCard', currentColumn: 'Sprint Commitment', requirement: 'Frontend', quality: 1, maxQuality: 3, stackedDevs: [] };
        
        boardController.tickets = [ticket];
        boardController.devs = [dev];
        
        const candidates = boardController.getDropCandidates(50, 50, 'Sprint Commitment');
        // If hasSev1Incident, shouldn't allow dropping on normal tickets
        // For testing handleDrop, we need to mock the pointer event
        
        const isMatch = boardController.isValidDevDrop(dev, ticket);
        expect(isMatch).toBe(false);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test test/BoardController.test.js`
Expected: FAIL, `isValidDevDrop` currently allows it. (Note: `isValidDevDrop` might not exist, you might need to test `handleDrop` directly depending on BoardController structure).

**Step 3: Write minimal implementation**

```javascript
// In src/controllers/BoardController.js, inside the dev drop logic:
// (Find where dev drops on tickets are evaluated)

// Example implementation inside handleDrop for devs:
if (ticket.type === 'TicketCard') {
    // If there is a SEV-1 incident, devs can only work on bugs or debt, not feature tickets
    if (this.scene.incidentManager && this.scene.incidentManager.hasSev1Incident()) {
        console.warn("Cannot work on feature tickets during a SEV-1 incident!");
        // Return to original position or reject drop
        return false; 
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test test/BoardController.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/controllers/BoardController.js test/BoardController.test.js
git commit -m "feat: prevent feature work during SEV-1 incidents"
```

### Task 3: Add UI for Active Incidents

**Files:**
- Modify: `src/scenes/UIScene.js`
- Test: `test/UIScene.test.js`

**Step 1: Write the failing test**

```javascript
// In test/UIScene.test.js
it('should display active incidents with countdown timers', () => {
    uiScene.create();
    
    const mockIncident = { severity: 3, timeRemaining: 15000 };
    
    uiScene.updateUI(mockGameManager, { incidents: [mockIncident] });
    
    expect(uiScene.incidentContainer).toBeDefined();
    // Verify text includes severity and time
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test test/UIScene.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**

```javascript
// In src/scenes/UIScene.js, updateUI method:
if (extraData.incidents && extraData.incidents.length > 0) {
    if (!this.incidentContainer) {
        this.incidentContainer = this.add.container(this.cameras.main.width - 220, 100);
        this.incidentTextObjects = [];
    }
    
    // Clear old text
    this.incidentTextObjects.forEach(t => t.destroy());
    this.incidentTextObjects = [];
    
    // Create new text for each incident
    extraData.incidents.forEach((inc, index) => {
        const color = inc.severity === 3 ? '#ff0000' : '#ffa500';
        const text = this.add.text(0, index * 25, 
            `SEV-${inc.severity} Incident: ${Math.ceil(inc.timeRemaining / 1000)}s`, 
            { fontSize: '14px', fill: color, backgroundColor: '#333', padding: { x: 5, y: 5 } }
        );
        this.incidentContainer.add(text);
        this.incidentTextObjects.push(text);
    });
} else if (this.incidentContainer && (!extraData.incidents || extraData.incidents.length === 0)) {
    this.incidentContainer.destroy();
    this.incidentContainer = null;
    this.incidentTextObjects = [];
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test test/UIScene.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/scenes/UIScene.js test/UIScene.test.js
git commit -m "feat: display active incidents in UI"
```

### Task 4: Hook Incident Resolution into Gameplay

**Files:**
- Modify: `src/controllers/BoardController.js`
- Modify: `src/scenes/MainGameScene.js`

**Step 1: Implement resolution logic**
Currently, `IncidentManager.resolveIncident()` exists, but there's no way to trigger it. We need a way for players to resolve incidents. This usually means completing the `BugCard` that spawned it.

```javascript
// In src/scenes/MainGameScene.js update()
this.boardController.tickets.forEach(t => {
    if (t.currentColumn === 'Done' && !t.rewarded) {
        t.rewarded = true;
        this.gameManager.completeTicket(t);
        
        // If it's a bug, resolve associated incidents
        if (t.type === 'BugCard') {
            const relatedIncident = this.incidentManager.activeIncidents.find(i => i.sourceBug === t);
            if (relatedIncident) {
                this.incidentManager.resolveIncident(relatedIncident);
            }
        }
    }
});
```

**Step 2: Commit**

```bash
git add src/scenes/MainGameScene.js
git commit -m "feat: resolve incidents when associated bugs are completed"
```
