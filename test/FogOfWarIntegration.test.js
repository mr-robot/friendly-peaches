import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('phaser', () => ({
    default: {
        GameObjects: {
            Container: class MockContainer {
                constructor(scene, x, y) { this.scene = scene; this.x = x; this.y = y; this.list = []; }
                add() { return this; }
                setInteractive() { return this; }
                on() { return this; }
            }
        }
    }
}));

vi.mock('../src/entities/BugCard.js', () => ({
    default: class MockBugCard {
        constructor(scene, x, y, title, req) {
            this.scene = scene; this.x = x; this.y = y;
            this.title = title; this.requirement = req;
            this.constructor = { name: 'BugCard' };
            this.isHidden = true;
            this.escalationChance = 0;
            this.stackedDevs = [];
            this.setAlpha = vi.fn();
            this.setVisible = vi.fn();
            this.currentColumn = 'Sprint Commitment';
        }
    }
}));

vi.mock('../src/entities/TechDebtCard.js', () => ({
    default: class MockTechDebtCard {
        constructor(scene, x, y, title) {
            this.scene = scene; this.x = x; this.y = y; this.title = title;
            this.constructor = { name: 'TechDebtCard' };
            this.attachToService = vi.fn();
        }
    }
}));

import FogOfWarManager from '../src/core/FogOfWarManager.js';
import GameManager from '../src/core/GameManager.js';
import BoardController from '../src/controllers/BoardController.js';

function createMockScene(state = 'ACTIVE') {
    const gm = new GameManager();
    gm.state = state;
    return {
        add: {
            rectangle: vi.fn().mockReturnValue({
                setOrigin: vi.fn().mockReturnThis(),
                setInteractive: vi.fn().mockReturnThis(),
                setVisible: vi.fn().mockReturnThis(),
                on: vi.fn().mockReturnThis(),
                fillColor: 0x222222
            }),
            line: vi.fn().mockReturnValue({ setOrigin: vi.fn().mockReturnThis() }),
            text: vi.fn().mockReturnValue({
                setOrigin: vi.fn().mockReturnThis(),
                setColor: vi.fn().mockReturnThis(),
                setVisible: vi.fn().mockReturnThis(),
                setText: vi.fn().mockReturnThis()
            }),
            zone: vi.fn().mockReturnValue({
                setOrigin: vi.fn().mockReturnThis(),
                setDropZone: vi.fn().mockReturnThis(),
                setActive: vi.fn().mockReturnThis()
            }),
            existing: vi.fn()
        },
        scale: { width: 1920, height: 1080 },
        input: { on: vi.fn() },
        tweens: { add: vi.fn() },
        scene: { get: vi.fn() },
        gameManager: gm
    };
}

function makeMockTicket(overrides = {}) {
    return {
        constructor: { name: 'TicketCard' },
        title: 'Feature X',
        requirement: 'Frontend',
        quality: 80,
        isHidden: false,
        escalationChance: undefined,
        stackedDevs: [],
        setAlpha: vi.fn(),
        setVisible: vi.fn(),
        currentColumn: 'In Progress',
        rewarded: false,
        progress: 0,
        maxProgress: 100,
        ...overrides
    };
}

function makeMockBug(overrides = {}) {
    return {
        constructor: { name: 'BugCard' },
        title: 'Bug X',
        isHidden: true,
        escalationChance: 0,
        stackedDevs: [],
        setAlpha: vi.fn(),
        setVisible: vi.fn(),
        currentColumn: 'Sprint Commitment',
        ...overrides
    };
}

// ── Phase 5b: FogOfWarManager on BoardController ──────────────────────────────

describe('Phase 5b — BoardController has FogOfWarManager', () => {
    let bc;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        bc = new BoardController(mockScene);
    });

    it('BoardController exposes a fogOfWar property', () => {
        expect(bc.fogOfWar).toBeDefined();
        expect(bc.fogOfWar).toBeInstanceOf(FogOfWarManager);
    });

    it('spawnBug() registers the bug as hidden in FogOfWarManager', () => {
        const bug = makeMockBug({ isHidden: true });
        bc.spawnBugHidden(bug);
        expect(bc.fogOfWar.hiddenCards).toContain(bug);
    });

    it('spawnBug() applies visual state (alpha 0.3) to the hidden bug', () => {
        const bug = makeMockBug({ isHidden: true });
        bc.spawnBugHidden(bug);
        expect(bug.setAlpha).toHaveBeenCalledWith(0.3);
    });

    it('spawnBug() adds the bug to the bugs array', () => {
        const bug = makeMockBug({ isHidden: true });
        bc.spawnBugHidden(bug);
        expect(bc.bugs).toContain(bug);
    });

    it('revealBug() removes bug from hidden list and makes it fully visible', () => {
        const bug = makeMockBug({ isHidden: true });
        bc.spawnBugHidden(bug);
        bc.revealBug(bug);
        expect(bc.fogOfWar.hiddenCards).not.toContain(bug);
        expect(bug.isHidden).toBe(false);
        expect(bug.setAlpha).toHaveBeenCalledWith(1);
    });

    it('tickFog(delta) advances escalation on hidden bugs', () => {
        const bug = makeMockBug({ isHidden: true, escalationChance: 0 });
        bc.spawnBugHidden(bug);
        bc.tickFog(5000); // 5 seconds
        expect(bug.escalationChance).toBeGreaterThan(0);
    });

    it('tickFog(delta) does not affect already-revealed bugs', () => {
        const bug = makeMockBug({ isHidden: false, escalationChance: 0 });
        bc.tickFog(5000);
        expect(bug.escalationChance).toBe(0);
    });
});

// ── Phase 5b: GameManager awards reveal tokens ────────────────────────────────

describe('Phase 5b — GameManager awards reveal tokens on ticket completion', () => {
    let gm;

    beforeEach(() => {
        gm = new GameManager();
        gm.state = 'ACTIVE';
    });

    it('GameManager has a revealTokens counter starting at 0', () => {
        expect(gm.revealTokens).toBe(0);
    });

    it('completeTicket() awards 1 reveal token for a regular ticket', () => {
        const ticket = makeMockTicket({ constructor: { name: 'TicketCard' } });
        gm.completeTicket(ticket);
        expect(gm.revealTokens).toBe(1);
    });

    it('completeTicket() awards 2 reveal tokens for a bug (resolving a bug = better visibility)', () => {
        const bug = makeMockBug({ constructor: { name: 'BugCard' } });
        gm.completeTicket(bug);
        expect(gm.revealTokens).toBe(2);
    });

    it('revealTokens accumulate across multiple completions', () => {
        gm.completeTicket(makeMockTicket({ constructor: { name: 'TicketCard' } }));
        gm.completeTicket(makeMockTicket({ constructor: { name: 'TicketCard' } }));
        gm.completeTicket(makeMockBug({ constructor: { name: 'BugCard' } }));
        expect(gm.revealTokens).toBe(4); // 1 + 1 + 2
    });

    it('spendRevealToken() decrements revealTokens by 1', () => {
        gm.revealTokens = 3;
        gm.spendRevealToken();
        expect(gm.revealTokens).toBe(2);
    });

    it('spendRevealToken() does nothing if no tokens available', () => {
        gm.revealTokens = 0;
        gm.spendRevealToken();
        expect(gm.revealTokens).toBe(0);
    });

    it('canSpendRevealToken() returns true when tokens > 0', () => {
        gm.revealTokens = 1;
        expect(gm.canSpendRevealToken()).toBe(true);
    });

    it('canSpendRevealToken() returns false when tokens = 0', () => {
        expect(gm.canSpendRevealToken()).toBe(false);
    });

    it('startNextSprint() resets revealTokens to 0', () => {
        gm.revealTokens = 5;
        gm.state = 'REVIEW';
        gm.startNextSprint();
        expect(gm.revealTokens).toBe(0);
    });
});

// ── Phase 5b: BoardController.useRevealToken() integration ───────────────────

describe('Phase 5b — useRevealToken() integration', () => {
    let bc;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        bc = new BoardController(mockScene);
    });

    it('useRevealToken(bug) reveals the bug and spends a token from GameManager', () => {
        const bug = makeMockBug({ isHidden: true, escalationChance: 0 });
        bc.spawnBugHidden(bug);
        mockScene.gameManager.revealTokens = 2;

        bc.useRevealToken(bug);

        expect(bug.isHidden).toBe(false);
        expect(mockScene.gameManager.revealTokens).toBe(1);
    });

    it('useRevealToken(bug) does nothing if no tokens available', () => {
        const bug = makeMockBug({ isHidden: true, escalationChance: 0 });
        bc.spawnBugHidden(bug);
        mockScene.gameManager.revealTokens = 0;

        bc.useRevealToken(bug);

        expect(bug.isHidden).toBe(true);
        expect(mockScene.gameManager.revealTokens).toBe(0);
    });

    it('useRevealToken() on a visible card does nothing harmful', () => {
        const ticket = makeMockTicket({ isHidden: false });
        mockScene.gameManager.revealTokens = 1;

        expect(() => bc.useRevealToken(ticket)).not.toThrow();
    });

    it('getHiddenCards() returns all currently hidden cards', () => {
        const b1 = makeMockBug({ isHidden: true });
        const b2 = makeMockBug({ isHidden: true });
        bc.spawnBugHidden(b1);
        bc.spawnBugHidden(b2);

        expect(bc.getHiddenCards()).toContain(b1);
        expect(bc.getHiddenCards()).toContain(b2);
        expect(bc.getHiddenCards()).toHaveLength(2);
    });

    it('getHiddenCards() is empty initially', () => {
        expect(bc.getHiddenCards()).toHaveLength(0);
    });
});
