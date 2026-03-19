# UI for Active Incidents and Stakeholder Interactions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the UI components in `UIScene` to display active incidents and stakeholder demands, and wire them to their respective managers.

**Architecture:** We will extend `UIScene` to include two new panels: one for incidents (showing severity and countdowns) and one for stakeholders (showing current product owner demands and pressure). We'll update the `updateUI` method to pull data from `gameManager.extra` (passed from `MainGameScene`) and reflect it in the UI.

**Tech Stack:** Phaser 3, Vitest, JavaScript.

---

### Task 1: Basic Incident UI Panel

**Files:**
- Modify: `src/scenes/UIScene.js`
- Test: `test/UIScene.test.js`

**Step 1: Write the failing test**
Add this to `test/UIScene.test.js` inside a new `describe('Incident UI')` block:
```javascript
it('should display incident panel when incidents exist', () => {
    const mockIncidents = [
        { severity: 3, timeRemaining: 15000 },
        { severity: 2, timeRemaining: 30000 }
    ];
    
    uiScene.updateUI(mockGM(), { incidents: mockIncidents });
    
    expect(uiScene.incidentPanelBg.setVisible).toHaveBeenCalledWith(true);
    expect(uiScene.incidentLines[0].setVisible).toHaveBeenCalledWith(true);
    expect(uiScene.incidentLines[0].setText).toHaveBeenCalledWith(expect.stringContaining('SEV-1'));
    expect(uiScene.incidentLines[1].setVisible).toHaveBeenCalledWith(true);
});
```

**Step 2: Run test to verify it fails**
Run: `npm run test test/UIScene.test.js`
Expected: FAIL because the test expects `incidentPanelBg` and `incidentLines` to be manipulated, which might not be fully configured yet.

**Step 3: Write minimal implementation**
Verify that the incident panel is properly created in `create()` in `src/scenes/UIScene.js` (it seems it might already be there from a previous checkpoint, but we need to ensure it's robustly handled). If it's there, ensure `updateUI` correctly handles the `extra.incidents` payload.

If not present, add it to `create()`:
```javascript
// Incident Panel
const incidentPanelX = this.scale.width - 320;
const incidentPanelY = 60;

this.incidentPanelBg = this.add.rectangle(incidentPanelX, incidentPanelY, 300, 100, 0x330000, 0.85)
    .setOrigin(0, 0).setVisible(false);

this.incidentPanelTitle = this.add.text(incidentPanelX + 10, incidentPanelY + 6, '🚨 INCIDENTS', {
    fontSize: '13px', color: '#ff4444', fontStyle: 'bold'
}).setVisible(false);

this.incidentLines = [];
for (let i = 0; i < 3; i++) {
    this.incidentLines.push(this.add.text(incidentPanelX + 10, incidentPanelY + 24 + i * 22, '', {
        fontSize: '12px', color: '#ffaaaa'
    }).setVisible(false));
}
```

Ensure `updateUI` processes it correctly:
```javascript
// in updateUI(gameManager, extra = {})
const { incidents = [] } = extra;

if (incidents.length > 0) {
    this.incidentPanelBg.setVisible(true);
    this.incidentPanelTitle.setVisible(true);

    const sevLabel = { 1: 'SEV-3', 2: 'SEV-2', 3: 'SEV-1' };
    const sevColor = { 1: '#ffaaaa', 2: '#ff6666', 3: '#ff0000' };

    incidents.slice(0, 3).forEach((inc, i) => {
        const line = this.incidentLines[i];
        const secs = Math.ceil((inc.timeRemaining || 0) / 1000);
        line.setText(`${sevLabel[inc.severity] || 'SEV-?'} — ${secs}s remaining`);
        line.setColor(sevColor[inc.severity] || '#ffaaaa');
        line.setVisible(true);
    });
    for (let i = incidents.length; i < 3; i++) {
        this.incidentLines[i].setVisible(false);
    }
} else {
    this.incidentPanelBg.setVisible(false);
    this.incidentPanelTitle.setVisible(false);
    this.incidentLines.forEach(l => l.setVisible(false));
}
```

**Step 4: Run test to verify it passes**
Run: `npm run test test/UIScene.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add src/scenes/UIScene.js test/UIScene.test.js
git commit -m "feat: add robust incident UI panel"
```

---

### Task 2: Incident Resolve Button

**Files:**
- Modify: `src/scenes/UIScene.js`
- Test: `test/UIScene.test.js`

**Step 1: Write the failing test**
Add this to `test/UIScene.test.js` in the `Incident UI` block:
```javascript
it('should show resolve button and trigger resolution on click', () => {
    const mockIncidents = [{ severity: 3, timeRemaining: 15000 }];
    const mockResolve = vi.fn();
    
    // Mock the main scene access
    uiScene.scene.get.mockReturnValue({
        incidentManager: { resolveIncident: mockResolve },
        boardController: { fogOfWar: {} } // For safety if needed
    });
    
    uiScene.updateUI(mockGM(), { incidents: mockIncidents });
    
    expect(uiScene.resolveButton.setVisible).toHaveBeenCalledWith(true);
    
    // Simulate click
    uiScene.resolveButton.emit('pointerdown');
    expect(mockResolve).toHaveBeenCalledWith(mockIncidents[0]);
});
```

**Step 2: Run test to verify it fails**
Run: `npm run test test/UIScene.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
In `UIScene.js` `create()`:
```javascript
this.resolveButton = this.add.rectangle(incidentPanelX + 250, incidentPanelY + 15, 60, 20, 0x5a2a2a)
    .setOrigin(0.5).setInteractive().setVisible(false);
this.resolveButtonText = this.add.text(incidentPanelX + 250, incidentPanelY + 15, 'RESOLVE', {
    fontSize: '10px', color: '#ffffff'
}).setOrigin(0.5).setVisible(false);

this.resolveButton.on('pointerdown', () => {
    const mainScene = this.scene.get('MainGameScene');
    if (mainScene && mainScene.incidentManager && mainScene.incidentManager.activeIncidents.length > 0) {
        // Resolve most severe incident (assuming sorted or we just take [0])
        const target = mainScene.incidentManager.activeIncidents[0];
        mainScene.incidentManager.resolveIncident(target);
    }
});
```

Update `updateUI()` to toggle visibility:
```javascript
// Inside if (incidents.length > 0)
this.resolveButton.setVisible(true);
this.resolveButtonText.setVisible(true);

// Inside else
this.resolveButton.setVisible(false);
this.resolveButtonText.setVisible(false);
```

**Step 4: Run test to verify it passes**
Run: `npm run test test/UIScene.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add src/scenes/UIScene.js test/UIScene.test.js
git commit -m "feat: add incident resolve button to UI"
```

---

### Task 3: Stakeholder Demand UI Panel

**Files:**
- Modify: `src/scenes/UIScene.js`
- Test: `test/UIScene.test.js`

**Step 1: Write the failing test**
Add this to `test/UIScene.test.js` inside a new `describe('Stakeholder UI')` block:
```javascript
it('should display stakeholder demands when present', () => {
    const mockStakeholder = {
        name: 'Product Owner',
        demandCount: 2,
        pressureLevel: 60
    };
    
    uiScene.updateUI(mockGM(), { stakeholder: mockStakeholder });
    
    expect(uiScene.demandPanelBg.setVisible).toHaveBeenCalledWith(true);
    expect(uiScene.demandText.setText).toHaveBeenCalledWith('📋 Product Owner: 2 demand(s)');
    expect(uiScene.demandPressureText.setText).toHaveBeenCalledWith('Pressure: 60');
});
```

**Step 2: Run test to verify it fails**
Run: `npm run test test/UIScene.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
In `UIScene.js` `create()`:
```javascript
const demandPanelX = this.scale.width - 320;
const demandPanelY = 170;

this.demandPanelBg = this.add.rectangle(demandPanelX, demandPanelY, 300, 80, 0x003333, 0.85)
    .setOrigin(0, 0).setVisible(false);

this.demandText = this.add.text(demandPanelX + 10, demandPanelY + 10, '', {
    fontSize: '13px', color: '#44ff44', fontStyle: 'bold'
}).setVisible(false);

this.demandPressureText = this.add.text(demandPanelX + 10, demandPanelY + 30, '', {
    fontSize: '12px', color: '#ffaaaa'
}).setVisible(false);
```

In `updateUI()`:
```javascript
const { stakeholder = null } = extra;

if (stakeholder && stakeholder.demandCount > 0) {
    this.demandPanelBg.setVisible(true);
    this.demandText.setVisible(true);
    this.demandPressureText.setVisible(true);
    
    this.demandText.setText(`📋 ${stakeholder.name || 'Product Owner'}: ${stakeholder.demandCount} demand(s)`);
    this.demandPressureText.setText(`Pressure: ${stakeholder.pressureLevel || 0}`);
    
    // Color coding for pressure
    if (stakeholder.pressureLevel > 75) {
        this.demandPressureText.setColor('#ff4444');
    } else {
        this.demandPressureText.setColor('#ffaaaa');
    }
} else {
    this.demandPanelBg.setVisible(false);
    this.demandText.setVisible(false);
    this.demandPressureText.setVisible(false);
}
```

**Step 4: Run test to verify it passes**
Run: `npm run test test/UIScene.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add src/scenes/UIScene.js test/UIScene.test.js
git commit -m "feat: add stakeholder demand panel"
```

---

### Task 4: Stakeholder Interaction Buttons

**Files:**
- Modify: `src/scenes/UIScene.js`
- Test: `test/UIScene.test.js`

**Step 1: Write the failing test**
Add to `Stakeholder UI` block in `test/UIScene.test.js`:
```javascript
it('should trigger stakeholder actions on button clicks', () => {
    const mockStakeholder = {
        name: 'Product Owner',
        demandCount: 1,
        fulfillDemand: vi.fn(),
        ignoreDemand: vi.fn(),
        pushBack: vi.fn()
    };
    
    uiScene.scene.get.mockReturnValue({
        stakeholderManager: { getProductOwner: () => mockStakeholder }
    });
    
    uiScene.updateUI(mockGM(), { stakeholder: mockStakeholder });
    
    uiScene.fulfillButton.emit('pointerdown');
    expect(mockStakeholder.fulfillDemand).toHaveBeenCalled();
    
    uiScene.ignoreButton.emit('pointerdown');
    expect(mockStakeholder.ignoreDemand).toHaveBeenCalled();
    
    uiScene.pushBackButton.emit('pointerdown');
    expect(mockStakeholder.pushBack).toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**
Run: `npm run test test/UIScene.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
In `UIScene.js` `create()` (after demandPanel text):
```javascript
const btnY = demandPanelY + 55;

this.fulfillButton = this.add.rectangle(demandPanelX + 50, btnY, 80, 20, 0x2a5a2a).setOrigin(0.5).setInteractive().setVisible(false);
this.fulfillText = this.add.text(demandPanelX + 50, btnY, 'FULFILL', { fontSize: '10px' }).setOrigin(0.5).setVisible(false);

this.ignoreButton = this.add.rectangle(demandPanelX + 150, btnY, 80, 20, 0x5a2a2a).setOrigin(0.5).setInteractive().setVisible(false);
this.ignoreText = this.add.text(demandPanelX + 150, btnY, 'IGNORE', { fontSize: '10px' }).setOrigin(0.5).setVisible(false);

this.pushBackButton = this.add.rectangle(demandPanelX + 250, btnY, 80, 20, 0x5a5a2a).setOrigin(0.5).setInteractive().setVisible(false);
this.pushBackText = this.add.text(demandPanelX + 250, btnY, 'PUSH BACK', { fontSize: '10px' }).setOrigin(0.5).setVisible(false);

// Event Handlers
const getStakeholder = () => {
    const mainScene = this.scene.get('MainGameScene');
    return mainScene?.stakeholderManager?.getProductOwner();
};

this.fulfillButton.on('pointerdown', () => {
    const sh = getStakeholder();
    if (sh && sh.demandCount > 0) sh.fulfillDemand();
});

this.ignoreButton.on('pointerdown', () => {
    const sh = getStakeholder();
    if (sh && sh.demandCount > 0) sh.ignoreDemand();
});

this.pushBackButton.on('pointerdown', () => {
    const sh = getStakeholder();
    if (sh && sh.demandCount > 0) sh.pushBack();
});
```

In `updateUI()` stakeholder block:
```javascript
// Inside if (stakeholder && stakeholder.demandCount > 0)
this.fulfillButton.setVisible(true);
this.fulfillText.setVisible(true);
this.ignoreButton.setVisible(true);
this.ignoreText.setVisible(true);
this.pushBackButton.setVisible(true);
this.pushBackText.setVisible(true);

// Inside else
this.fulfillButton.setVisible(false);
this.fulfillText.setVisible(false);
this.ignoreButton.setVisible(false);
this.ignoreText.setVisible(false);
this.pushBackButton.setVisible(false);
this.pushBackText.setVisible(false);
```

**Step 4: Run test to verify it passes**
Run: `npm run test test/UIScene.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add src/scenes/UIScene.js test/UIScene.test.js
git commit -m "feat: add stakeholder interaction buttons"
```

---

### Task 5: Wire UI Payload in MainGameScene

**Files:**
- Modify: `src/scenes/MainGameScene.js`
- Test: N/A (Tested implicitly via UI tests, but ensure the payload is passed)

**Step 1: Review/Update implementation**
Check `MainGameScene.js`'s `update()` loop. Ensure that when it calls `uiScene.updateUI`, it's passing the full context:
```javascript
const uiScene = this.scene.get('UIScene');
if (uiScene && uiScene.updateUI) {
    uiScene.updateUI(this.gameManager, {
        incidents: this.incidentManager.activeIncidents,
        stakeholder: this.stakeholderManager.getProductOwner(),
        onboardingDevs: this.newHireManager.getOnboardingDevs()
    });
}
```
*(Note: We verified this logic was mostly added in a previous task, but make sure it correctly pulls `getProductOwner()` which might return the active stakeholder).*

**Step 2: Commit**
```bash
git commit -am "chore: ensure MainGameScene passes stakeholder to UI"
```
