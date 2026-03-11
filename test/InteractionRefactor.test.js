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
        constructor(scene, x, y, title, requirement) {
            this.scene = scene; this.x = x; this.y = y;
            this.title = title; this.requirement = requirement;
            this.constructor = { name: 'BugCard' };
        }
    }
}));

vi.mock('../src/entities/TechDebtCard.js', () => ({
    default: class MockTechDebtCard {
        constructor(scene, x, y, title) {
            this.scene = scene; this.x = x; this.y = y; this.title = title;
            this.constructor = { name: 'TechDebtCard' };
        }
        attachToService() {}
    }
}));

import BoardController from '../src/controllers/BoardController.js';

function createMockScene(state = 'PLANNING') {
    return {
        add: {
            rectangle: vi.fn().mockReturnValue({
                setOrigin: vi.fn().mockReturnThis(),
                setInteractive: vi.fn().mockReturnThis(),
                setVisible: vi.fn().mockReturnThis(),
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
            state,
            isOnCallRequired: vi.fn().mockReturnValue(false),
            addSprintCommitment: vi.fn(),
            sprintCommitments: []
        }
    };
}

describe('Layout and Interaction Refactor', () => {
    let mockScene;
    let controller;

    beforeEach(() => {
        mockScene = createMockScene('PLANNING');
        controller = new BoardController(mockScene);
    });

    describe('Column Order', () => {
        it('should have Sprint Commitment as the first column', () => {
            expect(controller.columns[0]).toBe('Sprint Commitment');
        });

        it('should have In Progress as the second column', () => {
            expect(controller.columns[1]).toBe('In Progress');
        });

        it('should have exactly 4 columns', () => {
            expect(controller.columns).toHaveLength(4);
        });

        it('should not include Icebox or Backlog', () => {
            expect(controller.columns).not.toContain('Icebox');
            expect(controller.columns).not.toContain('Backlog');
        });
    });

    describe('Restricted Movement Rules', () => {
        it('should allow dragging from Sprint Commitment to In Progress during ACTIVE sprint', () => {
            const mockCard = {
                constructor: { name: 'TicketCard' },
                currentColumn: 'Sprint Commitment',
                x: 100, y: 100,
                input: { dragStartX: 100, dragStartY: 100 }
            };
            const inProgressZone = { columnName: 'In Progress' };

            mockScene.gameManager.state = 'ACTIVE';
            controller.handleDrop(mockCard, inProgressZone);

            expect(mockCard.currentColumn).toBe('In Progress');
        });

        it('should deny dragging from Sprint Commitment to Done directly', () => {
            const mockCard = {
                constructor: { name: 'TicketCard' },
                currentColumn: 'Sprint Commitment',
                x: 100, y: 100,
                input: { dragStartX: 100, dragStartY: 100 }
            };
            const doneZone = { columnName: 'Done' };

            mockScene.gameManager.state = 'ACTIVE';
            controller.handleDrop(mockCard, doneZone);

            // Should not have moved — snapped back
            expect(mockCard.currentColumn).toBe('Sprint Commitment');
        });

        it('should allow movement within the same column for spatial organization', () => {
            const mockCard = {
                constructor: { name: 'TicketCard' },
                currentColumn: 'In Progress',
                x: 250, y: 150
            };
            const inProgressZone = { columnName: 'In Progress' };

            controller.handleDrop(mockCard, inProgressZone);

            expect(mockCard.currentColumn).toBe('In Progress');
        });

        it('should allow Product Backlog → Sprint Commitment during PLANNING', () => {
            const mockCard = {
                constructor: { name: 'TicketCard' },
                currentColumn: 'Product Backlog',
                x: 100, y: 100,
                input: { dragStartX: 100, dragStartY: 100 }
            };
            const commitZone = { columnName: 'Sprint Commitment' };

            mockScene.gameManager.state = 'PLANNING';
            controller.handleDrop(mockCard, commitZone);

            expect(mockCard.currentColumn).toBe('Sprint Commitment');
        });

        it('should allow Sprint Commitment → Product Backlog during PLANNING (uncommit)', () => {
            const mockCard = {
                constructor: { name: 'TicketCard' },
                currentColumn: 'Sprint Commitment',
                x: 100, y: 100,
                input: { dragStartX: 100, dragStartY: 100 }
            };
            const backlogZone = { columnName: 'Product Backlog' };

            mockScene.gameManager.state = 'PLANNING';
            controller.handleDrop(mockCard, backlogZone);

            expect(mockCard.currentColumn).toBe('Product Backlog');
        });
    });

    describe('DevCard Behavior', () => {
        it('should allow DevCards to move anywhere without snapping to columns', () => {
            const mockDev = {
                constructor: { name: 'DevCard' },
                x: 650, y: 150,
                currentTicket: null
            };
            const anyZone = { columnName: 'Done' };

            controller.handleDrop(mockDev, anyZone);

            // Dev has no overlapping ticket, so stays where placed
            expect(mockDev.x).toBe(650);
            expect(mockDev.y).toBe(150);
        });

        it('should snap a DevCard onto an overlapping ticket in In Progress', () => {
            const mockTicket = {
                constructor: { name: 'TicketCard' },
                currentColumn: 'In Progress',
                x: 300, y: 200,
                requirement: 'Frontend',
                stackedDevs: [],
                progress: 0, maxProgress: 100
            };
            controller.tickets.push(mockTicket);

            const mockDev = {
                constructor: { name: 'DevCard' },
                role: 'Frontend',
                x: 310, y: 210,
                currentTicket: null,
                startBreathing: vi.fn()
            };

            const zone = { columnName: 'In Progress' };
            controller.handleDrop(mockDev, zone);

            expect(mockDev.currentTicket).toBe(mockTicket);
            expect(mockTicket.stackedDevs).toContain(mockDev);
        });
    });
});
