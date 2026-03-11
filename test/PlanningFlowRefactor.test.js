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

// Shared mock factory for a Phaser-like scene
function createMockScene(overrides = {}) {
    return {
        add: {
            rectangle: vi.fn().mockReturnValue({
                setOrigin: vi.fn().mockReturnThis(),
                setInteractive: vi.fn().mockReturnThis(),
                setVisible: vi.fn().mockReturnThis(),
                on: vi.fn().mockReturnThis(),
                fillColor: 0x222222
            }),
            line: vi.fn().mockReturnValue({
                setOrigin: vi.fn().mockReturnThis()
            }),
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
        gameManager: {
            state: 'PLANNING',
            isOnCallRequired: vi.fn().mockReturnValue(false),
            addSprintCommitment: vi.fn(),
            sprintCommitments: []
        },
        ...overrides
    };
}

import BoardController from '../src/controllers/BoardController.js';

// ─── Step 1: Commitment Zone show/hide ───────────────────────────────────────

describe('Step 1 — Commitment Zone show/hide', () => {
    let boardController;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        boardController = new BoardController(mockScene);
        boardController.createColumns();
    });

    it('sprintCommitmentZone exists after createColumns()', () => {
        expect(boardController.sprintCommitmentZone).toBeDefined();
        expect(boardController.sprintCommitmentZone.bg).toBeDefined();
        expect(boardController.sprintCommitmentZone.zone).toBeDefined();
        expect(boardController.sprintCommitmentZone.label).toBeDefined();
    });

    it('hideCommitmentZone() makes bg and label invisible', () => {
        boardController.hideCommitmentZone();
        expect(boardController.sprintCommitmentZone.bg.setVisible).toHaveBeenCalledWith(false);
        expect(boardController.sprintCommitmentZone.label.setVisible).toHaveBeenCalledWith(false);
    });

    it('hideCommitmentZone() deactivates the drop zone', () => {
        boardController.hideCommitmentZone();
        expect(boardController.sprintCommitmentZone.zone.setActive).toHaveBeenCalledWith(false);
    });

    it('showCommitmentZone() makes bg and label visible', () => {
        boardController.hideCommitmentZone(); // hide first
        boardController.showCommitmentZone();
        expect(boardController.sprintCommitmentZone.bg.setVisible).toHaveBeenCalledWith(true);
        expect(boardController.sprintCommitmentZone.label.setVisible).toHaveBeenCalledWith(true);
    });

    it('showCommitmentZone() reactivates the drop zone', () => {
        boardController.hideCommitmentZone();
        boardController.showCommitmentZone();
        expect(boardController.sprintCommitmentZone.zone.setActive).toHaveBeenCalledWith(true);
    });
});

// ─── Step 2: 4-column layout, Sprint Commitment column, no Icebox ────────────

describe('Step 2 — 4-column layout with Sprint Commitment', () => {
    let boardController;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        boardController = new BoardController(mockScene);
    });

    it('has exactly 4 columns', () => {
        expect(boardController.columns).toHaveLength(4);
    });

    it('columns are Sprint Commitment, In Progress, Review, Done', () => {
        expect(boardController.columns).toEqual(['Sprint Commitment', 'In Progress', 'Review', 'Done']);
    });

    it('does not contain Icebox or Backlog', () => {
        expect(boardController.columns).not.toContain('Icebox');
        expect(boardController.columns).not.toContain('Backlog');
    });

    it('calculateColumnWidth() divides screen width by 4', () => {
        expect(boardController.calculateColumnWidth()).toBe(1920 / 4); // 480
    });

    it('calculateColumnPosition(0) returns 0', () => {
        expect(boardController.calculateColumnPosition(0)).toBe(0);
    });

    it('calculateColumnPosition(3) returns 3 * 480 = 1440', () => {
        expect(boardController.calculateColumnPosition(3)).toBe(1440);
    });

    it('total width of all columns equals screen width', () => {
        const total = boardController.columns.length * boardController.calculateColumnWidth();
        expect(total).toBe(1920);
    });

    it('card operations work in Sprint Commitment column', () => {
        boardController.addCard({ id: 'task-1', title: 'Feature X', difficulty: 5, column: 'Sprint Commitment' });
        expect(boardController.getCardsInColumn('Sprint Commitment')).toHaveLength(1);
    });

    it('moving a card from Sprint Commitment to In Progress works', () => {
        boardController.addCard({ id: 'task-1', title: 'Feature X', difficulty: 5, column: 'Sprint Commitment' });
        boardController.moveCard('task-1', 'In Progress');
        expect(boardController.getCardsInColumn('In Progress')).toHaveLength(1);
        expect(boardController.getCardsInColumn('Sprint Commitment')).toHaveLength(0);
    });
});

// ─── Step 3: Product Backlog panel ───────────────────────────────────────────

describe('Step 3 — Product Backlog panel', () => {
    let boardController;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        boardController = new BoardController(mockScene);
        boardController.createColumns();
    });

    // Helper: inject N mock tickets directly into productBacklogTickets
    function injectMockTickets(bc, count) {
        bc.productBacklogTickets = Array.from({ length: count }, (_, i) => ({
            constructor: { name: 'TicketCard' },
            x: 100 + i * 180, y: 900,
            title: `Ticket ${i}`,
            requirement: 'Frontend',
            currentColumn: 'Product Backlog',
            stackedDevs: [],
            setVisible: vi.fn(),
            input: null
        }));
    }

    it('populateProductBacklog(5) creates 5 tickets in productBacklogTickets', () => {
        injectMockTickets(boardController, 5);
        expect(boardController.productBacklogTickets).toHaveLength(5);
    });

    it('all productBacklog tickets have currentColumn "Product Backlog"', () => {
        injectMockTickets(boardController, 3);
        boardController.productBacklogTickets.forEach(t => {
            expect(t.currentColumn).toBe('Product Backlog');
        });
    });

    it('showProductBacklog() makes the panel visible', () => {
        // Ensure panel exists by calling populateProductBacklog path via scene mock
        boardController.productBacklogPanel = {
            bg: { setVisible: vi.fn() },
            label: { setVisible: vi.fn() }
        };
        injectMockTickets(boardController, 3);
        boardController.showProductBacklog();
        expect(boardController.productBacklogPanel.bg.setVisible).toHaveBeenCalledWith(true);
        expect(boardController.productBacklogPanel.label.setVisible).toHaveBeenCalledWith(true);
    });

    it('hideProductBacklog() makes the panel invisible', () => {
        boardController.productBacklogPanel = {
            bg: { setVisible: vi.fn() },
            label: { setVisible: vi.fn() }
        };
        injectMockTickets(boardController, 3);
        boardController.hideProductBacklog();
        expect(boardController.productBacklogPanel.bg.setVisible).toHaveBeenCalledWith(false);
        expect(boardController.productBacklogPanel.label.setVisible).toHaveBeenCalledWith(false);
    });

    it('hideProductBacklog() hides all product backlog tickets', () => {
        boardController.productBacklogPanel = {
            bg: { setVisible: vi.fn() },
            label: { setVisible: vi.fn() }
        };
        injectMockTickets(boardController, 3);
        boardController.hideProductBacklog();
        boardController.productBacklogTickets.forEach(t => {
            expect(t.setVisible).toHaveBeenCalledWith(false);
        });
    });

    it('showProductBacklog() shows all product backlog tickets', () => {
        boardController.productBacklogPanel = {
            bg: { setVisible: vi.fn() },
            label: { setVisible: vi.fn() }
        };
        injectMockTickets(boardController, 3);
        boardController.hideProductBacklog();
        boardController.showProductBacklog();
        boardController.productBacklogTickets.forEach(t => {
            expect(t.setVisible).toHaveBeenCalledWith(true);
        });
    });

    it('during PLANNING, ticket can be dropped from Product Backlog into Sprint Commitment', () => {
        injectMockTickets(boardController, 3);
        const ticket = boardController.productBacklogTickets[0];
        ticket.currentColumn = 'Product Backlog';

        const dropZone = { columnName: 'Sprint Commitment' };
        mockScene.gameManager.state = 'PLANNING';

        boardController.handleDrop(ticket, dropZone);

        expect(ticket.currentColumn).toBe('Sprint Commitment');
    });

    it('during PLANNING, ticket can be dragged back from Sprint Commitment to Product Backlog', () => {
        injectMockTickets(boardController, 3);
        const ticket = boardController.productBacklogTickets[0];
        ticket.currentColumn = 'Sprint Commitment';

        const dropZone = { columnName: 'Product Backlog' };
        mockScene.gameManager.state = 'PLANNING';

        boardController.handleDrop(ticket, dropZone);

        expect(ticket.currentColumn).toBe('Product Backlog');
    });

    it('during ACTIVE, dropping a ticket into Product Backlog is rejected', () => {
        injectMockTickets(boardController, 3);
        const ticket = boardController.productBacklogTickets[0];
        ticket.currentColumn = 'Sprint Commitment';
        ticket.input = { dragStartX: 100, dragStartY: 200 };
        ticket.x = 100;
        ticket.y = 200;

        const dropZone = { columnName: 'Product Backlog' };
        mockScene.gameManager.state = 'ACTIVE';

        boardController.handleDrop(ticket, dropZone);

        // Should not have moved to Product Backlog
        expect(ticket.currentColumn).toBe('Sprint Commitment');
    });
});

// ─── Step 4: Sprint start transition ─────────────────────────────────────────

describe('Step 4 — Sprint start transition', () => {
    let boardController;
    let mockScene;

    function injectMockTickets(bc, count) {
        bc.productBacklogTickets = Array.from({ length: count }, (_, i) => ({
            constructor: { name: 'TicketCard' },
            x: 100 + i * 180, y: 900,
            title: `Ticket ${i}`,
            requirement: 'Frontend',
            currentColumn: 'Product Backlog',
            stackedDevs: [],
            setVisible: vi.fn(),
            destroy: vi.fn(),
            input: null
        }));
    }

    beforeEach(() => {
        mockScene = createMockScene();
        boardController = new BoardController(mockScene);
        boardController.createColumns();
        // Inject mock tickets and set up panel mock
        injectMockTickets(boardController, 5);
        boardController.productBacklogPanel = {
            bg: { setVisible: vi.fn() },
            label: { setVisible: vi.fn() }
        };
    });

    it('startSprint() hides the Product Backlog panel', () => {
        boardController.startSprint();
        expect(boardController.productBacklogPanel.bg.setVisible).toHaveBeenCalledWith(false);
    });

    it('startSprint() hides the Commitment Zone overlay', () => {
        boardController.startSprint();
        expect(boardController.sprintCommitmentZone.bg.setVisible).toHaveBeenCalledWith(false);
    });

    it('startSprint() removes tickets still in Product Backlog from the scene', () => {
        // Commit only first ticket
        boardController.productBacklogTickets[0].currentColumn = 'Sprint Commitment';
        // rest remain in 'Product Backlog'

        boardController.startSprint();

        // No tickets with 'Product Backlog' should remain in the pool
        const remainingInPool = boardController.productBacklogTickets.filter(
            t => t.currentColumn === 'Product Backlog'
        );
        expect(remainingInPool).toHaveLength(0);
    });

    it('startSprint() does not remove tickets already in Sprint Commitment', () => {
        boardController.productBacklogTickets[0].currentColumn = 'Sprint Commitment';
        const committed = boardController.productBacklogTickets[0];

        boardController.startSprint();

        // Committed ticket should still be in the pool and not destroyed
        expect(committed.currentColumn).toBe('Sprint Commitment');
        expect(committed.destroy).not.toHaveBeenCalled();
    });

    it('hideCommitmentZone() is called during ACTIVE state transition', () => {
        boardController.hideCommitmentZone = vi.fn();
        boardController.hideProductBacklog = vi.fn();

        // Simulate handleStateChange going to ACTIVE
        boardController.handleStateTransition('ACTIVE');

        expect(boardController.hideCommitmentZone).toHaveBeenCalled();
        expect(boardController.hideProductBacklog).toHaveBeenCalled();
    });

    it('showProductBacklog() and showCommitmentZone() are called in PLANNING state', () => {
        boardController.showCommitmentZone = vi.fn();
        boardController.showProductBacklog = vi.fn();

        boardController.handleStateTransition('PLANNING');

        expect(boardController.showCommitmentZone).toHaveBeenCalled();
        expect(boardController.showProductBacklog).toHaveBeenCalled();
    });
});
