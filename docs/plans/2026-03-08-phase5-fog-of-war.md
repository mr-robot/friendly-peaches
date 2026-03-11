# Phase 5: The Fog of War Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement hidden tech debt mechanics with face-down cards, leading indicators, and ManagerCard with Reputation system.

**Architecture:** Create TechDebtCard system with face-down/face-up mechanics, add debt spawning logic to BoardController, implement visual indicators for services with debt, create ManagerCard and Reputation resource in GameManager.

**Tech Stack:** Phaser.js game entities, Vitest testing, existing card and resource systems

---

### Task 1: TechDebtCard Base Class

**Files:**
- Create: `src/entities/TechDebtCard.js`
- Test: `test/TechDebtCard.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TechDebtCard from '../src/entities/TechDebtCard.js';

describe('TechDebtCard', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                rectangle: vi.fn().mockReturnValue({ setTint: vi.fn(), setOrigin: vi.fn() }),
                text: vi.fn().mockReturnValue({ setOrigin: vi.fn() })
            }
        };
    });

    it('should initialize face-down with dark red tint', () => {
        const debt = new TechDebtCard(mockScene, 0, 0, 'Database Shortcut');
        
        expect(debt.title).toBe('Database Shortcut');
        expect(debt.isFaceDown).toBe(true);
        expect(debt.bg.setTint).toHaveBeenCalledWith(0x8b0000); // Dark red
        expect(debt.setVisible).toHaveBeenCalledWith(false); // Hidden when face-down
    });

    it('should flip face-up to reveal content', () => {
        const debt = new TechDebtCard(mockScene, 0, 0, 'API Hack');
        debt.flipFaceUp();
        
        expect(debt.isFaceDown).toBe(false);
        expect(debt.setVisible).toHaveBeenCalledWith(true);
        expect(debt.bg.setTint).toHaveBeenCalledWith(0xff4444); // Brighter red when visible
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- TechDebtCard`
Expected: FAIL with "Cannot find module '../src/entities/TechDebtCard.js'"

**Step 3: Write minimal implementation**

```javascript
import CardContainer from './CardContainer.js';

export default class TechDebtCard extends CardContainer {
    constructor(scene, x, y, title) {
        super(scene, x, y, title);
        
        this.isFaceDown = true;
        this.impact = 10; // Tech Health impact when revealed
        this.serviceAttached = null; // Which service this debt is attached to
        
        // Dark red tint for debt cards
        this.bg.setTint(0x8b0000);
        
        // Hide when face-down
        this.setVisible(false);
        
        // Debt cards are not interactive by default
        this.setInteractive(false);
    }
    
    flipFaceUp() {
        this.isFaceDown = false;
        this.setVisible(true);
        this.bg.setTint(0xff4444); // Brighter red when revealed
    }
    
    flipFaceDown() {
        this.isFaceDown = true;
        this.setVisible(false);
        this.bg.setTint(0x8b0000);
    }
    
    attachToService(serviceCard) {
        this.serviceAttached = serviceCard;
        serviceCard.debtCards.push(this);
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- TechDebtCard`
Expected: PASS

**Step 5: Commit**

```bash
git add src/entities/TechDebtCard.js test/TechDebtCard.test.js
git commit -m "feat: create TechDebtCard with face-down/face-up mechanics"
```

---

### Task 2: ManagerCard Class

**Files:**
- Create: `src/entities/ManagerCard.js`
- Test: `test/ManagerCard.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ManagerCard from '../src/entities/ManagerCard.js';

describe('ManagerCard', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                rectangle: vi.fn().mockReturnValue({ setTint: vi.fn(), setOrigin: vi.fn() }),
                text: vi.fn().mockReturnValue({ setOrigin: vi.fn() })
            }
        };
    });

    it('should initialize with blue tint and management properties', () => {
        const manager = new ManagerCard(mockScene, 0, 0, 'Engineering Manager');
        
        expect(manager.title).toBe('Engineering Manager');
        expect(manager.bg.setTint).toHaveBeenCalledWith(0x4169e1); // Royal blue
        expect(manager.managementBonus).toBe(1.5); // 50% speed boost
        expect(manager.canShield).toBe(true); // Can shield from interrupts
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- ManagerCard`
Expected: FAIL with "Cannot find module '../src/entities/ManagerCard.js'"

**Step 3: Write minimal implementation**

```javascript
import CardContainer from './CardContainer.js';

export default class ManagerCard extends CardContainer {
    constructor(scene, x, y, title) {
        super(scene, x, y, title);
        
        // Blue tint for managers
        this.bg.setTint(0x4169e1);
        
        // Management properties
        this.managementBonus = 1.5; // 50% speed boost for devs
        this.canShield = true; // Can protect from stakeholder interrupts
        this.stakeholderNegotiationPower = 1; // Base negotiation power
        
        // Managers are not draggable by default
        this.setInteractive(false);
    }
    
    applyToDev(devCard) {
        // Apply management bonus to a dev
        if (devCard.speedMultiplier) {
            devCard.speedMultiplier *= this.managementBonus;
        }
    }
    
    shieldFromInterrupt(interruptCard) {
        // Manager can shield team from stakeholder interrupts
        return this.canShield;
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- ManagerCard`
Expected: PASS

**Step 5: Commit**

```bash
git add src/entities/ManagerCard.js test/ManagerCard.test.js
git commit -m "feat: create ManagerCard with management bonuses"
```

---

### Task 3: Reputation Resource in GameManager

**Files:**
- Modify: `src/core/GameManager.js:10-15`
- Test: `test/GameManager.test.js`

**Step 1: Write the failing test**

```javascript
describe('Reputation Resource', () => {
    it('should initialize reputation at 0', () => {
        expect(manager.reputation).toBe(0);
    });

    it('should increase reputation when addReputation is called', () => {
        manager.addReputation(50);
        expect(manager.reputation).toBe(50);
    });

    it('should cap reputation at 1000', () => {
        manager.addReputation(2000);
        expect(manager.reputation).toBe(1000);
    });

    it('should check escape eligibility at 500 reputation', () => {
        manager.reputation = 500;
        expect(manager.canEscape()).toBe(true);
        
        manager.reputation = 499;
        expect(manager.canEscape()).toBe(false);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- GameManager`
Expected: FAIL with "reputation is not defined"

**Step 3: Write minimal implementation**

```javascript
// In GameManager constructor:
this.reputation = 0;
this.maxReputation = 1000;
this.escapeThreshold = 500;

// Add new methods:
addReputation(amount) {
    this.reputation = Math.min(this.maxReputation, this.reputation + amount);
}

subtractReputation(amount) {
    this.reputation = Math.max(0, this.reputation - amount);
}

canEscape() {
    return this.reputation >= this.escapeThreshold;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- GameManager`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/GameManager.js test/GameManager.test.js
git commit -m "feat: add reputation resource to GameManager"
```

---

### Task 4: Tech Debt Spawning Logic

**Files:**
- Modify: `src/controllers/BoardController.js:440-470`
- Test: `test/BoardController.test.js`

**Step 1: Write the failing test**

```javascript
describe('Tech Debt Spawning', () => {
    it('should spawn tech debt when ticket is rushed', () => {
        const ticket = {
            title: 'Quick Feature',
            requirement: 'Frontend',
            wasRushed: true,
            currentColumn: 'Done'
        };
        
        controller.spawnTechDebtForTicket(ticket);
        
        expect(controller.techDebtCards.length).toBe(1);
        expect(controller.techDebtCards[0].title).toContain('Quick Feature');
        expect(controller.techDebtCards[0].isFaceDown).toBe(true);
    });

    it('should attach debt to random service', () => {
        const service1 = { debtCards: [] };
        const service2 = { debtCards: [] };
        controller.serviceCards = [service1, service2];
        
        const ticket = {
            title: 'Database Hack',
            requirement: 'Backend',
            wasRushed: true,
            currentColumn: 'Done'
        };
        
        controller.spawnTechDebtForTicket(ticket);
        
        // Debt should be attached to one of the services
        const totalDebt = service1.debtCards.length + service2.debtCards.length;
        expect(totalDebt).toBe(1);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- BoardController`
Expected: FAIL with "spawnTechDebtForTicket is not defined"

**Step 3: Write minimal implementation**

```javascript
// Add to BoardController constructor:
this.techDebtCards = [];
this.serviceCards = [];

// Add new method:
spawnTechDebtForTicket(ticket) {
    // Only spawn debt if ticket was rushed or had low quality
    if (!ticket.wasRushed && (!ticket.quality || ticket.quality >= 50)) {
        return;
    }
    
    const debtTitle = `Tech Debt: ${ticket.title}`;
    const debt = new TechDebtCard(this.scene, 0, 0, debtTitle);
    
    // Attach to random service if available
    if (this.serviceCards.length > 0) {
        const randomService = this.serviceCards[Math.floor(Math.random() * this.serviceCards.length)];
        debt.attachToService(randomService);
    }
    
    this.techDebtCards.push(debt);
    this.scene.add.existing(debt);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- BoardController`
Expected: PASS

**Step 5: Commit**

```bash
git add src/controllers/BoardController.js test/BoardController.test.js
git commit -m "feat: add tech debt spawning logic"
```

---

### Task 5: Service Leading Indicators

**Files:**
- Modify: `src/entities/ServiceCard.js:10-20`
- Test: `test/ServiceCard.test.js`

**Step 1: Write the failing test**

```javascript
describe('Service Leading Indicators', () => {
    it('should show visual degradation when debt accumulates', () => {
        const service = new ServiceCard(mockScene, 0, 0, 'Auth Service');
        
        // Add debt cards
        const debt1 = { isFaceDown: true };
        const debt2 = { isFaceDown: true };
        service.debtCards = [debt1, debt2];
        
        service.updateVisualIndicators();
        
        expect(service.wobbleAnimation).toBe(true);
        expect(service.warningIndicator).toBe(true);
    });

    it('should increase wobble intensity with more debt', () => {
        const service = new ServiceCard(mockScene, 0, 0, 'Payment Service');
        
        service.debtCards = [{}, {}]; // 2 debt cards
        service.updateVisualIndicators();
        expect(service.wobbleIntensity).toBe(0.2);
        
        service.debtCards = [{}, {}, {}, {}]; // 4 debt cards
        service.updateVisualIndicators();
        expect(service.wobbleIntensity).toBe(0.4);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- ServiceCard`
Expected: FAIL with "updateVisualIndicators is not defined"

**Step 3: Write minimal implementation**

```javascript
// Add to ServiceCard class:
updateVisualIndicators() {
    const debtCount = this.debtCards.length;
    
    if (debtCount === 0) {
        this.wobbleAnimation = false;
        this.warningIndicator = false;
        this.wobbleIntensity = 0;
        return;
    }
    
    // Enable visual indicators based on debt count
    this.wobbleAnimation = true;
    this.warningIndicator = debtCount >= 2;
    this.wobbleIntensity = Math.min(debtCount * 0.1, 0.5); // Max 50% intensity
    
    // Update visual effects
    if (this.wobbleAnimation && !this.wobbleTween) {
        this.startWobbleAnimation();
    }
}

startWobbleAnimation() {
    this.wobbleTween = this.scene.tweens.add({
        targets: this,
        angle: this.wobbleIntensity * 10, // Wobble angle based on intensity
        duration: 1000 + Math.random() * 1000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
    });
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- ServiceCard`
Expected: PASS

**Step 5: Commit**

```bash
git add src/entities/ServiceCard.js test/ServiceCard.test.js
git commit -m "feat: add visual leading indicators for services with debt"
```

---

### Task 6: Manager-Dev Stacking Logic

**Files:**
- Modify: `src/controllers/BoardController.js:280-320`
- Test: `test/BoardController.test.js`

**Step 1: Write the failing test**

```javascript
describe('Manager-Dev Stacking', () => {
    it('should apply speed bonus when manager stacked on dev', () => {
        const dev = { 
            constructor: { name: 'DevCard' },
            speedMultiplier: 1.0,
            x: 100, y: 100
        };
        const manager = { 
            constructor: { name: 'ManagerCard' },
            managementBonus: 1.5,
            applyToDev: vi.fn(),
            x: 100, y: 100
        };
        
        controller.handleManagerStack(manager, dev);
        
        expect(manager.applyToDev).toHaveBeenCalledWith(dev);
        expect(dev.speedMultiplier).toBe(1.5);
    });

    it('should allow manager to shield dev from interrupts', () => {
        const dev = { 
            constructor: { name: 'DevCard' },
            isShielded: false
        };
        const manager = { 
            constructor: { name: 'ManagerCard' },
            canShield: true
        };
        
        controller.stackManagerOnDev(manager, dev);
        
        expect(dev.isShielded).toBe(true);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- BoardController`
Expected: FAIL with "handleManagerStack is not defined"

**Step 3: Write minimal implementation**

```javascript
// Add to BoardController:
handleManagerStack(manager, target) {
    if (target.constructor.name === 'DevCard') {
        this.stackManagerOnDev(manager, target);
    } else if (target.constructor.name === 'StakeholderCard') {
        this.stackManagerOnStakeholder(manager, target);
    }
}

stackManagerOnDev(manager, dev) {
    // Apply management bonus
    manager.applyToDev(dev);
    
    // Position manager on top of dev
    manager.x = dev.x;
    manager.y = dev.y - 20;
    
    // Shield dev from interrupts
    if (manager.canShield) {
        dev.isShielded = true;
        dev.shieldingManager = manager;
    }
    
    // Track the stacking
    dev.stackedManager = manager;
    manager.currentDev = dev;
}

stackManagerOnStakeholder(manager, stakeholder) {
    // Negotiation logic
    manager.x = stakeholder.x;
    manager.y = stakeholder.y - 20;
    
    // Reduce stakeholder demands
    if (stakeholder.reduceDemands) {
        stakeholder.reduceDemands(manager.stakeholderNegotiationPower);
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- BoardController`
Expected: PASS

**Step 5: Commit**

```bash
git add src/controllers/BoardController.js test/BoardController.test.js
git commit -m "feat: add manager-dev and manager-stakeholder stacking logic"
```

---

### Task 7: Reputation UI Display

**Files:**
- Modify: `src/scenes/UIScene.js:28-35`
- Test: `test/UIScene.test.js`

**Step 1: Write the failing test**

```javascript
describe('Reputation UI', () => {
    it('should display reputation with color coding', () => {
        const mockGameManager = { reputation: 250 };
        uiScene.updateUI(mockGameManager);
        
        expect(uiScene.reputationText.text).toContain('Reputation: 250');
        expect(uiScene.reputationText.color).toBe('#00ff00'); // Green for good reputation
    });

    it('should show red text for low reputation', () => {
        const mockGameManager = { reputation: 50 };
        uiScene.updateUI(mockGameManager);
        
        expect(uiScene.reputationText.color).toBe('#ff0000'); // Red for low reputation
    });

    it('should show escape availability at 500 reputation', () => {
        const mockGameManager = { reputation: 500, canEscape: vi.fn().mockReturnValue(true) };
        uiScene.updateUI(mockGameManager);
        
        expect(uiScene.escapeIndicator.visible).toBe(true);
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- UIScene`
Expected: FAIL with "reputationText is not defined"

**Step 3: Write minimal implementation**

```javascript
// In create() method:
this.reputationText = this.add.text(800, 15, 'Reputation: 0', {
    fontSize: '18px',
    color: '#00ff00',
    fontStyle: 'bold'
});

this.escapeIndicator = this.add.text(400, 50, 'ESCAPE AVAILABLE!', {
    fontSize: '24px',
    color: '#00ff00',
    fontStyle: 'bold'
}).setOrigin(0.5).setVisible(false);

// In updateUI() method:
this.reputationText.setText(`Reputation: ${Math.floor(gameManager.reputation)}`);

// Color code reputation
if (gameManager.reputation < 100) {
    this.reputationText.setColor('#ff0000'); // Red - very low
} else if (gameManager.reputation < 300) {
    this.reputationText.setColor('#ffaa00'); // Orange - low
} else {
    this.reputationText.setColor('#00ff00'); // Green - good
}

// Show escape indicator
if (gameManager.canEscape && gameManager.canEscape()) {
    this.escapeIndicator.setVisible(true);
} else {
    this.escapeIndicator.setVisible(false);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- UIScene`
Expected: PASS

**Step 5: Commit**

```bash
git add src/scenes/UIScene.js test/UIScene.test.js
git commit -m "feat: add reputation UI display with escape indicator"
```

---

**Plan complete and saved to `docs/plans/2026-03-08-phase5-fog-of-war.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
