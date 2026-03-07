# Sprint Escape MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a functional MVP of "Sprint Escape" demonstrating core Kanban flow, card stacking, and progress bars.

**Architecture:** PhaserJS application. Object-Oriented approach using `Phaser.GameObjects.Container` for cards (`DevCard`, `TicketCard`) and simple spatial zones for `KanbanColumn`. A global `GameManager` tracks sprint state and card interaction logic.

**Tech Stack:** HTML5, Phaser 3, JavaScript/TypeScript (vanilla JS for simplicity in MVP), Vite (bundler)

---

### Task 1: Setup Project & Phaser Boot Scene

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/scenes/BootScene.js`

**Step 1: Initialize Project Files**
Create `package.json` with vite and phaser dependencies.

```json
{
  "name": "sprint-escape-mvp",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "phaser": "^3.80.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

**Step 2: Initialize index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sprint Escape MVP</title>
    <style>body { margin: 0; background: #222; }</style>
</head>
<body>
    <div id="game-container"></div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**Step 3: Create BootScene and Main entry**

```javascript
// src/scenes/BootScene.js
export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }
    preload() {
        // Load simple colored rects as placeholders
        const graphics = this.make.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 100, 150);
        graphics.generateTexture('card_bg', 100, 150);
        graphics.clear();
    }
    create() {
        this.scene.start('MainGameScene');
    }
}
```

```javascript
// src/main.js
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainGameScene from './scenes/MainGameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: [BootScene, MainGameScene]
};
new Phaser.Game(config);
```

**Step 4: Commit**
```bash
git add package.json index.html src/main.js src/scenes/BootScene.js
git commit -m "chore: setup phaser project and boot scene"
```

---

### Task 2: Create MainGameScene & BoardController

**Files:**
- Create: `src/scenes/MainGameScene.js`
- Create: `src/controllers/BoardController.js`

**Step 1: Implement MainGameScene**

```javascript
// src/scenes/MainGameScene.js
import BoardController from '../controllers/BoardController.js';

export default class MainGameScene extends Phaser.Scene {
    constructor() {
        super('MainGameScene');
    }
    create() {
        this.boardController = new BoardController(this);
        this.boardController.createColumns();
    }
    update(time, delta) {
        this.boardController.update(time, delta);
    }
}
```

**Step 2: Implement BoardController with Kanban Columns**

```javascript
// src/controllers/BoardController.js
export default class BoardController {
    constructor(scene) {
        this.scene = scene;
        this.columns = ['Backlog', 'In Progress', 'Review', 'Done'];
        this.columnZones = {};
    }

    createColumns() {
        const colWidth = 200;
        this.columns.forEach((name, index) => {
            const x = index * colWidth + 100;
            // Draw visual line
            this.scene.add.line(0, 0, x - 100, 0, x - 100, 600, 0x555555).setOrigin(0, 0);
            this.scene.add.text(x, 20, name, { color: '#ffffff' }).setOrigin(0.5);
            
            // Store basic bounds for dropping
            this.columnZones[name] = { x: x - 100, width: colWidth };
        });
    }
    
    update(time, delta) {
        // Will handle progress updates here later
    }
}
```

**Step 3: Commit**
```bash
git add src/scenes/MainGameScene.js src/controllers/BoardController.js
git commit -m "feat: add main scene and kanban board columns"
```

---

### Task 3: Base CardContainer and Dragging

**Files:**
- Create: `src/entities/CardContainer.js`

**Step 1: Implement CardContainer**

```javascript
// src/entities/CardContainer.js
export default class CardContainer extends Phaser.GameObjects.Container {
    constructor(scene, x, y, title) {
        super(scene, x, y);
        this.scene.add.existing(this);
        
        this.bg = scene.add.image(0, 0, 'card_bg').setTint(0xaaaaaa);
        this.titleText = scene.add.text(0, -50, title, { color: '#000' }).setOrigin(0.5);
        
        this.add([this.bg, this.titleText]);
        
        this.setSize(100, 150);
        this.setInteractive();
        scene.input.setDraggable(this);
        
        this.on('drag', (pointer, dragX, dragY) => {
            this.x = dragX;
            this.y = dragY;
            this.scene.children.bringToTop(this);
        });
    }
}
```

**Step 2: Spawn dummy cards in MainGameScene**

Modify `MainGameScene.js`:
```javascript
import CardContainer from '../entities/CardContainer.js';
// in create() after createColumns()
new CardContainer(this, 100, 150, "Ticket 1");
new CardContainer(this, 300, 150, "Dev 1");
```

**Step 3: Commit**
```bash
git add src/entities/CardContainer.js src/scenes/MainGameScene.js
git commit -m "feat: add draggable card container"
```

---

### Task 4: Implement DevCard and TicketCard with Stacking

**Files:**
- Create: `src/entities/DevCard.js`
- Create: `src/entities/TicketCard.js`
- Modify: `src/controllers/BoardController.js`
- Modify: `src/scenes/MainGameScene.js`

**Step 1: Subclasses**

```javascript
// src/entities/DevCard.js
import CardContainer from './CardContainer.js';
export default class DevCard extends CardContainer {
    constructor(scene, x, y, name) {
        super(scene, x, y, name);
        this.bg.setTint(0x4488ff); // Blue for dev
        this.currentTicket = null;
    }
}
```

```javascript
// src/entities/TicketCard.js
import CardContainer from './CardContainer.js';
export default class TicketCard extends CardContainer {
    constructor(scene, x, y, title) {
        super(scene, x, y, title);
        this.bg.setTint(0xffaa44); // Orange for ticket
        this.progress = 0;
        this.maxProgress = 100;
        
        this.progressBar = scene.add.graphics();
        this.add(this.progressBar);
        this.updateProgressVisual();
        
        this.stackedDevs = [];
        this.currentColumn = 'Backlog';
    }
    
    updateProgressVisual() {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x00ff00, 1);
        const width = 80;
        const fill = (this.progress / this.maxProgress) * width;
        this.progressBar.fillRect(-40, 50, fill, 10);
    }
}
```

**Step 2: Stacking Logic on Drop**

Modify `BoardController.js`:
```javascript
// Add to constructor: this.tickets = []; this.devs = [];

// Add new method:
handleDrop(card) {
    if (card.constructor.name === 'DevCard') {
        // Check overlap with tickets
        const overlappingTicket = this.tickets.find(t => 
            Math.abs(t.x - card.x) < 50 && Math.abs(t.y - card.y) < 75
        );
        
        if (overlappingTicket) {
            card.x = overlappingTicket.x;
            card.y = overlappingTicket.y + 20; // visual offset
            card.currentTicket = overlappingTicket;
            if (!overlappingTicket.stackedDevs.includes(card)) {
                overlappingTicket.stackedDevs.push(card);
            }
        } else {
            if (card.currentTicket) {
                card.currentTicket.stackedDevs = card.currentTicket.stackedDevs.filter(d => d !== card);
                card.currentTicket = null;
            }
            this.snapToColumn(card);
        }
    } else if (card.constructor.name === 'TicketCard') {
        this.snapToColumn(card);
    }
}

snapToColumn(card) {
    const colIndex = Math.floor(card.x / 200);
    const safeIndex = Math.max(0, Math.min(3, colIndex));
    card.x = safeIndex * 200 + 100;
    if (card.constructor.name === 'TicketCard') {
        card.currentColumn = this.columns[safeIndex];
    }
}
```

Modify `MainGameScene.js`:
```javascript
// in create()
this.input.on('dragend', (pointer, gameObject) => {
    this.boardController.handleDrop(gameObject);
});
// Replace dummy cards with real ones, add to controller arrays
const t1 = new TicketCard(this, 100, 150, "Fix Bug");
const d1 = new DevCard(this, 100, 400, "Alice");
this.boardController.tickets.push(t1);
this.boardController.devs.push(d1);
```

**Step 3: Commit**
```bash
git add src/entities/DevCard.js src/entities/TicketCard.js src/controllers/BoardController.js src/scenes/MainGameScene.js
git commit -m "feat: implement Dev and Ticket cards with stacking logic"
```

---

### Task 5: Progress Loop and Semi-Automatic Sliding

**Files:**
- Modify: `src/controllers/BoardController.js`
- Modify: `src/entities/TicketCard.js`

**Step 1: Update Loop**

Modify `BoardController.js`:
```javascript
update(time, delta) {
    this.tickets.forEach(ticket => {
        if (ticket.stackedDevs.length > 0 && ticket.progress < ticket.maxProgress) {
            // Fill progress
            ticket.progress += (delta / 1000) * 10; // 10 units per second per dev
            ticket.updateProgressVisual();
            
            if (ticket.progress >= ticket.maxProgress) {
                this.slideTicket(ticket);
            }
        }
    });
}

slideTicket(ticket) {
    // Detach devs
    ticket.stackedDevs.forEach(dev => {
        dev.currentTicket = null;
        dev.y += 100; // visually separate
    });
    ticket.stackedDevs = [];
    
    // Move to next column
    const currentIndex = this.columns.indexOf(ticket.currentColumn);
    if (currentIndex < this.columns.length - 1) {
        ticket.currentColumn = this.columns[currentIndex + 1];
        ticket.progress = 0;
        ticket.updateProgressVisual();
        
        // Animate slide
        this.scene.tweens.add({
            targets: ticket,
            x: (currentIndex + 1) * 200 + 100,
            duration: 500,
            ease: 'Power2'
        });
    }
}
```

**Step 2: Commit**
```bash
git add src/controllers/BoardController.js src/entities/TicketCard.js
git commit -m "feat: add progress loop and automatic ticket sliding"
```
