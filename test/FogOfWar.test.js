import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('phaser', () => ({
    default: {
        GameObjects: {
            Container: class MockContainer {
                constructor(scene, x, y) {
                    this.scene = scene; this.x = x; this.y = y; this.list = [];
                    this.alpha = 1; this.visible = true;
                }
                add() { return this; }
                setInteractive() { return this; }
                on() { return this; }
                setAlpha(v) { this.alpha = v; return this; }
                setVisible(v) { this.visible = v; return this; }
            }
        }
    }
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMockTicket(overrides = {}) {
    return {
        constructor: { name: 'TicketCard' },
        title: 'Implement Feature X',
        requirement: 'Frontend',
        quality: 80,
        isHidden: false,
        reveal: vi.fn(),
        getDisplayedInfo: vi.fn(),
        setAlpha: vi.fn(),
        setVisible: vi.fn(),
        currentColumn: 'Product Backlog',
        stackedDevs: [],
        ...overrides
    };
}

function makeMockBug(overrides = {}) {
    return {
        constructor: { name: 'BugCard' },
        title: 'Bug in Feature X',
        isHidden: true,
        escalationChance: 0,
        reveal: vi.fn(),
        setAlpha: vi.fn(),
        setVisible: vi.fn(),
        currentColumn: 'Sprint Commitment',
        stackedDevs: [],
        ...overrides
    };
}

// ── Phase 5a: Card hidden/revealed state ─────────────────────────────────────

describe('Phase 5a — Card Hidden State', () => {

    describe('TicketCard isHidden flag', () => {
        it('a newly created ticket is visible by default (isHidden = false)', () => {
            const ticket = makeMockTicket({ isHidden: false });
            expect(ticket.isHidden).toBe(false);
        });

        it('a hidden ticket has isHidden = true', () => {
            const ticket = makeMockTicket({ isHidden: true });
            expect(ticket.isHidden).toBe(true);
        });
    });

    describe('BugCard isHidden flag', () => {
        it('bugs can spawn hidden', () => {
            const bug = makeMockBug({ isHidden: true });
            expect(bug.isHidden).toBe(true);
        });

        it('revealed bugs have isHidden = false', () => {
            const bug = makeMockBug({ isHidden: false });
            expect(bug.isHidden).toBe(false);
        });
    });
});

// ── Phase 5a: FogOfWarManager ─────────────────────────────────────────────────

import FogOfWarManager from '../src/core/FogOfWarManager.js';

describe('Phase 5a — FogOfWarManager', () => {
    let fogManager;

    beforeEach(() => {
        fogManager = new FogOfWarManager();
    });

    describe('Tracking hidden cards', () => {
        it('starts with no hidden cards', () => {
            expect(fogManager.hiddenCards).toHaveLength(0);
        });

        it('registerHidden() adds a card to the hidden list', () => {
            const ticket = makeMockTicket({ isHidden: true });
            fogManager.registerHidden(ticket);
            expect(fogManager.hiddenCards).toContain(ticket);
        });

        it('registerHidden() does not add already-visible cards', () => {
            const ticket = makeMockTicket({ isHidden: false });
            fogManager.registerHidden(ticket);
            expect(fogManager.hiddenCards).not.toContain(ticket);
        });

        it('hiddenCount returns number of hidden cards', () => {
            fogManager.registerHidden(makeMockTicket({ isHidden: true }));
            fogManager.registerHidden(makeMockTicket({ isHidden: true }));
            expect(fogManager.hiddenCount).toBe(2);
        });
    });

    describe('Revealing cards', () => {
        it('reveal() sets isHidden to false on the card', () => {
            const ticket = makeMockTicket({ isHidden: true });
            fogManager.registerHidden(ticket);
            fogManager.reveal(ticket);
            expect(ticket.isHidden).toBe(false);
        });

        it('reveal() removes the card from the hidden list', () => {
            const ticket = makeMockTicket({ isHidden: true });
            fogManager.registerHidden(ticket);
            fogManager.reveal(ticket);
            expect(fogManager.hiddenCards).not.toContain(ticket);
        });

        it('reveal() calls setAlpha(1) on the card to make it fully visible', () => {
            const ticket = makeMockTicket({ isHidden: true });
            fogManager.registerHidden(ticket);
            fogManager.reveal(ticket);
            expect(ticket.setAlpha).toHaveBeenCalledWith(1);
        });

        it('revealing a card that is not registered does nothing', () => {
            const ticket = makeMockTicket({ isHidden: false });
            expect(() => fogManager.reveal(ticket)).not.toThrow();
        });
    });

    describe('getDisplayedInfo()', () => {
        it('returns masked info for hidden tickets', () => {
            const ticket = makeMockTicket({ isHidden: true, title: 'Secret Feature', requirement: 'Backend' });
            const info = fogManager.getDisplayedInfo(ticket);
            expect(info.title).toBe('???');
            expect(info.requirement).toBeUndefined();
            expect(info.quality).toBeUndefined();
        });

        it('returns full info for visible tickets', () => {
            const ticket = makeMockTicket({ isHidden: false, title: 'Implement Feature X', requirement: 'Frontend', quality: 80 });
            const info = fogManager.getDisplayedInfo(ticket);
            expect(info.title).toBe('Implement Feature X');
            expect(info.requirement).toBe('Frontend');
            expect(info.quality).toBe(80);
        });

        it('returns masked info for hidden bugs', () => {
            const bug = makeMockBug({ isHidden: true, title: 'Critical Bug' });
            const info = fogManager.getDisplayedInfo(bug);
            expect(info.title).toBe('???');
        });

        it('returns full info for revealed bugs', () => {
            const bug = makeMockBug({ isHidden: false, title: 'Critical Bug' });
            const info = fogManager.getDisplayedInfo(bug);
            expect(info.title).toBe('Critical Bug');
        });
    });

    describe('applyVisualState()', () => {
        it('sets alpha to 0.3 for hidden cards', () => {
            const ticket = makeMockTicket({ isHidden: true });
            fogManager.applyVisualState(ticket);
            expect(ticket.setAlpha).toHaveBeenCalledWith(0.3);
        });

        it('sets alpha to 1 for visible cards', () => {
            const ticket = makeMockTicket({ isHidden: false });
            fogManager.applyVisualState(ticket);
            expect(ticket.setAlpha).toHaveBeenCalledWith(1);
        });
    });
});

// ── Phase 5a: Bug escalation ──────────────────────────────────────────────────

describe('Phase 5a — Bug Escalation', () => {
    let fogManager;

    beforeEach(() => {
        fogManager = new FogOfWarManager();
    });

    it('a hidden bug has an escalationChance starting at 0', () => {
        const bug = makeMockBug({ isHidden: true, escalationChance: 0 });
        expect(bug.escalationChance).toBe(0);
    });

    it('tickEscalation() increases escalationChance for hidden bugs', () => {
        const bug = makeMockBug({ isHidden: true, escalationChance: 0 });
        fogManager.registerHidden(bug);
        fogManager.tickEscalation(1000); // 1 second
        expect(bug.escalationChance).toBeGreaterThan(0);
    });

    it('tickEscalation() does not increase escalationChance for revealed bugs', () => {
        const bug = makeMockBug({ isHidden: false, escalationChance: 0 });
        fogManager.tickEscalation(1000);
        expect(bug.escalationChance).toBe(0);
    });

    it('escalationChance is capped at 1.0', () => {
        const bug = makeMockBug({ isHidden: true, escalationChance: 0.95 });
        fogManager.registerHidden(bug);
        fogManager.tickEscalation(60000); // 60 seconds
        expect(bug.escalationChance).toBeLessThanOrEqual(1.0);
    });

    it('revealing a bug resets its escalationChance to 0', () => {
        const bug = makeMockBug({ isHidden: true, escalationChance: 0.5 });
        fogManager.registerHidden(bug);
        fogManager.reveal(bug);
        expect(bug.escalationChance).toBe(0);
    });
});

// ── Phase 5a: Reveal token system ────────────────────────────────────────────

describe('Phase 5a — Reveal Token System', () => {
    let fogManager;

    beforeEach(() => {
        fogManager = new FogOfWarManager();
    });

    it('starts with 0 reveal tokens', () => {
        expect(fogManager.revealTokens).toBe(0);
    });

    it('addRevealTokens(n) increases token count', () => {
        fogManager.addRevealTokens(3);
        expect(fogManager.revealTokens).toBe(3);
    });

    it('revealWithToken() spends a token and reveals the card', () => {
        const ticket = makeMockTicket({ isHidden: true });
        fogManager.registerHidden(ticket);
        fogManager.addRevealTokens(2);

        fogManager.revealWithToken(ticket);

        expect(fogManager.revealTokens).toBe(1);
        expect(ticket.isHidden).toBe(false);
    });

    it('revealWithToken() fails gracefully if no tokens available', () => {
        const ticket = makeMockTicket({ isHidden: true });
        fogManager.registerHidden(ticket);
        // No tokens added

        fogManager.revealWithToken(ticket);

        // Card should still be hidden — no tokens spent
        expect(ticket.isHidden).toBe(true);
        expect(fogManager.revealTokens).toBe(0);
    });

    it('canReveal() returns true when tokens > 0', () => {
        fogManager.addRevealTokens(1);
        expect(fogManager.canReveal()).toBe(true);
    });

    it('canReveal() returns false when tokens = 0', () => {
        expect(fogManager.canReveal()).toBe(false);
    });
});

// ── Phase 5a: Integration with BoardController ────────────────────────────────

describe('Phase 5a — FogOfWarManager integration with BoardController', () => {
    let fogManager;

    beforeEach(() => {
        fogManager = new FogOfWarManager();
    });

    it('registerHidden() accepts both TicketCard and BugCard objects', () => {
        const ticket = makeMockTicket({ isHidden: true });
        const bug = makeMockBug({ isHidden: true });

        fogManager.registerHidden(ticket);
        fogManager.registerHidden(bug);

        expect(fogManager.hiddenCount).toBe(2);
    });

    it('revealAll() reveals every hidden card', () => {
        const t1 = makeMockTicket({ isHidden: true });
        const t2 = makeMockTicket({ isHidden: true });
        const bug = makeMockBug({ isHidden: true });

        fogManager.registerHidden(t1);
        fogManager.registerHidden(t2);
        fogManager.registerHidden(bug);

        fogManager.revealAll();

        expect(t1.isHidden).toBe(false);
        expect(t2.isHidden).toBe(false);
        expect(bug.isHidden).toBe(false);
        expect(fogManager.hiddenCount).toBe(0);
    });

    it('reset() clears all hidden cards and tokens', () => {
        fogManager.registerHidden(makeMockTicket({ isHidden: true }));
        fogManager.addRevealTokens(5);

        fogManager.reset();

        expect(fogManager.hiddenCount).toBe(0);
        expect(fogManager.revealTokens).toBe(0);
    });
});
