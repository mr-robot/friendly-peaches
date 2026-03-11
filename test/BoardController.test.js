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

import BoardController from '../src/controllers/BoardController.js';

function createMockScene() {
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
        gameManager: {
            state: 'PLANNING',
            isOnCallRequired: vi.fn().mockReturnValue(false),
            addSprintCommitment: vi.fn(),
            sprintCommitments: []
        }
    };
}

describe('BoardController', () => {
    let boardController;
    let mockScene;

    beforeEach(() => {
        mockScene = createMockScene();
        boardController = new BoardController(mockScene);
    });

    describe('Column Management', () => {
        it('should initialise with 4 columns', () => {
            expect(boardController.columns).toHaveLength(4);
        });

        it('should have correct column names', () => {
            expect(boardController.columns).toEqual([
                'Sprint Commitment', 'In Progress', 'Review', 'Done'
            ]);
        });

        it('should not contain Icebox or Backlog', () => {
            expect(boardController.columns).not.toContain('Icebox');
            expect(boardController.columns).not.toContain('Backlog');
        });
    });

    describe('Card Operations', () => {
        it('should add a card to Sprint Commitment', () => {
            const card = { id: 'task-1', title: 'Test Task', difficulty: 5, column: 'Sprint Commitment' };
            boardController.addCard(card);
            expect(boardController.getCardsInColumn('Sprint Commitment')).toContain(card);
        });

        it('should move a card from Sprint Commitment to In Progress', () => {
            const card = { id: 'task-1', title: 'Test Task', difficulty: 5, column: 'Sprint Commitment' };
            boardController.addCard(card);
            boardController.moveCard('task-1', 'In Progress');
            expect(boardController.getCardsInColumn('In Progress')).toContain(card);
            expect(boardController.getCardsInColumn('Sprint Commitment')).not.toContain(card);
        });

        it('should remove a card from the board', () => {
            const card = { id: 'task-1', title: 'Test Task', difficulty: 5, column: 'Sprint Commitment' };
            boardController.addCard(card);
            boardController.removeCard('task-1');
            expect(boardController.getCardsInColumn('Sprint Commitment')).not.toContain(card);
        });
    });

    describe('Layout Calculations', () => {
        it('should calculate column width based on screen width divided by 4', () => {
            expect(boardController.calculateColumnWidth()).toBe(1920 / 4); // 480
        });

        it('should calculate correct X position for first column', () => {
            expect(boardController.calculateColumnPosition(0)).toBe(0);
        });

        it('should calculate correct X position for second column', () => {
            expect(boardController.calculateColumnPosition(1)).toBe(480);
        });

        it('should calculate correct X position for last column', () => {
            expect(boardController.calculateColumnPosition(3)).toBe(1440);
        });

        it('should cover full screen width', () => {
            const total = boardController.columns.length * boardController.calculateColumnWidth();
            expect(total).toBe(1920);
        });
    });

    describe('Card Statistics', () => {
        it('should calculate total difficulty in a column', () => {
            boardController.addCard({ id: 'task-1', title: 'Task 1', difficulty: 5, column: 'Sprint Commitment' });
            boardController.addCard({ id: 'task-2', title: 'Task 2', difficulty: 8, column: 'Sprint Commitment' });
            expect(boardController.getTotalDifficulty('Sprint Commitment')).toBe(13);
        });

        it('should count cards in a column', () => {
            boardController.addCard({ id: 'task-1', title: 'Task 1', difficulty: 5, column: 'Sprint Commitment' });
            boardController.addCard({ id: 'task-2', title: 'Task 2', difficulty: 8, column: 'Sprint Commitment' });
            expect(boardController.getCardsInColumn('Sprint Commitment')).toHaveLength(2);
        });
    });

    describe('Product Backlog', () => {
        beforeEach(() => {
            boardController.createColumns();
        });

        it('populateProductBacklog(5) creates 5 tickets', () => {
            boardController.populateProductBacklog(5);
            expect(boardController.productBacklogTickets).toHaveLength(5);
        });

        it('all product backlog tickets start with currentColumn "Product Backlog"', () => {
            boardController.populateProductBacklog(3);
            boardController.productBacklogTickets.forEach(t => {
                expect(t.currentColumn).toBe('Product Backlog');
            });
        });

        it('startSprint() clears uncommitted tickets from the pool', () => {
            boardController.populateProductBacklog(3);
            // Commit only first ticket
            boardController.productBacklogTickets[0].currentColumn = 'Sprint Commitment';
            boardController.startSprint();
            const remaining = boardController.productBacklogTickets.filter(
                t => t.currentColumn === 'Product Backlog'
            );
            expect(remaining).toHaveLength(0);
        });
    });
});
