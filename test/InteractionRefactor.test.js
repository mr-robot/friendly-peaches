import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the dependencies of BoardController
vi.mock('../src/entities/BugCard.js', () => ({
    default: class MockBugCard {}
}));

// We'll mock BoardController entirely for layout logic or use a lightweight version
// to avoid Phaser's global 'window' dependency during tests.
// For now, let's use the actual BoardController but ensure the scene mock is sufficient.

import BoardController from '../src/controllers/BoardController.js';

describe('Layout and Interaction Refactor', () => {
    let mockScene;
    let controller;

    beforeEach(() => {
        mockScene = {
            add: {
                rectangle: vi.fn().mockReturnValue({
                    setOrigin: vi.fn().mockReturnThis(),
                    setInteractive: vi.fn().mockReturnThis(),
                    setVisible: vi.fn().mockReturnThis(),
                    fillColor: 0x222222
                }),
                line: vi.fn().mockReturnValue({
                    setOrigin: vi.fn().mockReturnThis()
                }),
                text: vi.fn().mockReturnValue({
                    setOrigin: vi.fn().mockReturnThis(),
                    setColor: vi.fn().mockReturnThis()
                }),
                zone: vi.fn().mockReturnValue({
                    setOrigin: vi.fn().mockReturnThis(),
                    setDropZone: vi.fn().mockReturnThis(),
                    setActive: vi.fn().mockReturnThis()
                }),
                existing: vi.fn()
            },
            scale: {
                width: 1920,
                height: 1080
            },
            input: {
                on: vi.fn()
            },
            gameManager: {
                state: 'PLANNING'
            }
        };
        controller = new BoardController(mockScene);
    });

    describe('Column Order', () => {
        it('should have Icebox as the first column', () => {
            // This will fail initially as current order is Backlog, In Progress, Review, Done, Icebox
            expect(controller.columns[0]).toBe('Icebox');
            expect(controller.columns[1]).toBe('Backlog');
        });
    });

    describe('Restricted Movement Rules', () => {
        it('should only allow dragging from Backlog to In Progress during ACTIVE sprint', () => {
            const mockCard = { 
                constructor: { name: 'TicketCard' }, 
                currentColumn: 'Backlog',
                x: 100, y: 100,
                input: { dragStartX: 100, dragStartY: 100 }
            };
            const inProgressZone = { columnName: 'In Progress', x: 200, width: 200, y: 50, height: 1000 };
            const doneZone = { columnName: 'Done', x: 600, width: 200, y: 50, height: 1000 };

            // Mock gameManager state
            mockScene.gameManager.state = 'ACTIVE';

            // Allow Backlog -> In Progress
            controller.handleDrop(mockCard, inProgressZone);
            expect(mockCard.currentColumn).toBe('In Progress');

            // Deny Backlog -> Done (should snap back)
            mockCard.currentColumn = 'Backlog';
            controller.handleDrop(mockCard, doneZone);
            // Current implementation allows this, so this test should fail initially
            expect(mockCard.currentColumn).toBe('Backlog');
        });

        it('should allow movement within the same column for spatial organization', () => {
            const mockCard = { 
                constructor: { name: 'TicketCard' }, 
                currentColumn: 'In Progress',
                x: 250, y: 150 
            };
            const inProgressZone = { columnName: 'In Progress', x: 200, width: 200, y: 50, height: 1000 };
            
            // Move to a new position within the same column
            const newX = 220;
            const newY = 300;
            mockCard.x = newX;
            mockCard.y = newY;
            
            controller.handleDrop(mockCard, inProgressZone);
            
            // Current implementation snaps to center, so this will fail
            expect(mockCard.currentColumn).toBe('In Progress');
            expect(mockCard.x).toBe(newX);
            expect(mockCard.y).toBe(newY);
        });
    });

    describe('DevCard Behavior', () => {
        it('should allow DevCards to move anywhere (not snapped to columns)', () => {
            const mockDev = { 
                constructor: { name: 'DevCard' },
                x: 100, y: 100 
            };
            const anyZone = { columnName: 'Done', x: 600, width: 200, y: 50, height: 1000 };
            
            const initialX = 650;
            const initialY = 150;
            mockDev.x = initialX;
            mockDev.y = initialY;
            
            controller.handleDrop(mockDev, anyZone);
            
            // Devs shouldn't snap to column center, they stay where dropped or snap to ticket
            expect(mockDev.x).toBe(initialX);
            expect(mockDev.y).toBe(initialY);
        });
    });
});
