import { describe, it, expect, vi, beforeEach } from 'vitest';
import BoardController from '../src/controllers/BoardController.js';

describe('BoardController', () => {
    let mockScene;
    let controller;

    beforeEach(() => {
        // Mock the minimal Phaser Scene API needed by BoardController
        const createMockGameObject = () => {
            const obj = {};
            obj.setOrigin = vi.fn().mockReturnValue(obj);
            obj.setAlpha = vi.fn().mockReturnValue(obj);
            obj.setInteractive = vi.fn().mockReturnValue(obj);
            obj.setDropZone = vi.fn().mockReturnValue(obj);
            return obj;
        };

        mockScene = {
            add: {
                line: vi.fn().mockImplementation(createMockGameObject),
                text: vi.fn().mockImplementation(createMockGameObject),
                rectangle: vi.fn().mockImplementation(createMockGameObject),
                zone: vi.fn().mockImplementation(createMockGameObject)
            },
            input: {
                on: vi.fn()
            },
            tweens: {
                add: vi.fn()
            }
        };

        controller = new BoardController(mockScene);
    });

    it('should create exactly 4 columns: Backlog, In Progress, Review, Done', () => {
        controller.createColumns();
        
        expect(controller.columns).toEqual(['Backlog', 'In Progress', 'Review', 'Done']);
        expect(mockScene.add.text).toHaveBeenCalledTimes(4);
    });

    it('should create a background panel and drop zone for each column', () => {
        controller.createColumns();

        // 4 columns * 1 rectangle per column = 4 rectangles
        expect(mockScene.add.rectangle).toHaveBeenCalledTimes(4);
        // 4 columns * 1 drop zone per column = 4 zones
        expect(mockScene.add.zone).toHaveBeenCalledTimes(4);
        
        // Check that setDropZone was called on each created zone
        const zones = mockScene.add.zone.mock.results.map(r => r.value);
        expect(zones.length).toBe(4);
        zones.forEach(zone => {
            expect(zone.setDropZone).toHaveBeenCalled();
        });
    });

    it('should highlight column background on dragenter and revert on dragleave', () => {
        controller.createColumns();
        controller.setupInteractions();

        const dragEnterCall = mockScene.input.on.mock.calls.find(c => c[0] === 'dragenter');
        const dragLeaveCall = mockScene.input.on.mock.calls.find(c => c[0] === 'dragleave');

        expect(dragEnterCall).toBeDefined();
        expect(dragLeaveCall).toBeDefined();

        const dragEnterCb = dragEnterCall[1];
        const dragLeaveCb = dragLeaveCall[1];

        const mockDropZone = { bgPanel: { fillColor: 0x222222 } };
        
        dragEnterCb(null, null, mockDropZone);
        expect(mockDropZone.bgPanel.fillColor).toBe(0x444444);

        dragLeaveCb(null, null, mockDropZone);
        expect(mockDropZone.bgPanel.fillColor).toBe(0x222222);
    });

    it('should assign column and snap to position on native drop event', () => {
        controller.createColumns();
        controller.setupInteractions();

        const dropCall = mockScene.input.on.mock.calls.find(c => c[0] === 'drop');
        expect(dropCall).toBeDefined();

        const dropCb = dropCall[1];
        
        // Mock a ticket card
        const mockCard = {
            constructor: { name: 'TicketCard' },
            x: 0,
            y: 0,
            currentColumn: null
        };

        // Find the "In Progress" zone (index 1)
        // x is 1 * 200 + 100 - 100 = 200, width = 200
        const inProgressZone = {
            x: 200,
            width: 200,
            columnName: 'In Progress'
        };

        dropCb(null, mockCard, inProgressZone);

        // Should snap to the center of In Progress column (x = 300)
        expect(mockCard.x).toBe(300);
        expect(mockCard.currentColumn).toBe('In Progress');
    });

    it('should snap back to original column on dragend without drop', () => {
        controller.createColumns();
        controller.setupInteractions();

        const dragEndCall = mockScene.input.on.mock.calls.find(c => c[0] === 'dragend');
        expect(dragEndCall).toBeDefined();

        const dragEndCb = dragEndCall[1];
        
        // Mock a ticket card that starts in 'Backlog'
        const mockCard = {
            constructor: { name: 'TicketCard' },
            x: 500, // drag it somewhere random
            y: 300,
            currentColumn: 'Backlog',
            input: {
                dragStartX: 100,
                dragStartY: 200
            }
        };

        // Call dragend when dropped parameter is false
        const dropped = false;
        dragEndCb(null, mockCard, dropped);

        // It should snap back to the Backlog column (x = 100) and restore original Y
        expect(mockCard.x).toBe(100);
        expect(mockCard.y).toBe(200);
        expect(mockCard.currentColumn).toBe('Backlog');
    });

    it('should stack DevCard on TicketCard when dropped overlapping', () => {
        controller.setupInteractions();

        const dropCall = mockScene.input.on.mock.calls.find(c => c[0] === 'drop');
        const dropCb = dropCall[1];
        
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            x: 300,
            y: 300,
            stackedDevs: [],
            currentColumn: 'In Progress'
        };
        controller.tickets.push(mockTicket);

        const mockDev = {
            constructor: { name: 'DevCard' },
            x: 310, // Close enough to overlap (within 50x, 75y)
            y: 320,
            currentTicket: null,
            input: { dragStartX: 100, dragStartY: 100 }
        };

        // Trigger drop event (dropZone doesn't matter for DevCard dropping on Ticket)
        dropCb(null, mockDev, {});

        // Should snap to ticket with offset
        expect(mockDev.x).toBe(300);
        expect(mockDev.y).toBe(340); // ticket.y + 40
        expect(mockDev.currentTicket).toBe(mockTicket);
        expect(mockTicket.stackedDevs).toContain(mockDev);
    });

    it('should reject DevCard stacking if TicketCard is in Done column', () => {
        controller.setupInteractions();

        const dropCall = mockScene.input.on.mock.calls.find(c => c[0] === 'drop');
        const dropCb = dropCall[1];
        
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            x: 700,
            y: 300,
            stackedDevs: [],
            currentColumn: 'Done'
        };
        controller.tickets.push(mockTicket);

        const mockDev = {
            constructor: { name: 'DevCard' },
            x: 710,
            y: 320,
            currentTicket: null,
            input: { dragStartX: 100, dragStartY: 100 }
        };

        dropCb(null, mockDev, {});

        // Should NOT snap to ticket, should snap back to original position
        expect(mockDev.x).toBe(100);
        expect(mockDev.y).toBe(100);
        expect(mockDev.currentTicket).toBeNull();
        expect(mockTicket.stackedDevs).not.toContain(mockDev);
    });

    it('should unstack DevCard when drag starts', () => {
        controller.setupInteractions();

        const dragStartCall = mockScene.input.on.mock.calls.find(c => c[0] === 'dragstart');
        expect(dragStartCall).toBeDefined();
        const dragStartCb = dragStartCall[1];

        const mockDev = {
            constructor: { name: 'DevCard' },
            currentTicket: null
        };
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            stackedDevs: [mockDev]
        };
        mockDev.currentTicket = mockTicket;

        // Trigger dragstart on the dev card
        dragStartCb(null, mockDev);

        expect(mockDev.currentTicket).toBeNull();
        expect(mockTicket.stackedDevs).not.toContain(mockDev);
    });

    it('should move stacked DevCards when TicketCard is dragged', () => {
        controller.setupInteractions();

        const dragCall = mockScene.input.on.mock.calls.find(c => c[0] === 'drag');
        expect(dragCall).toBeDefined();
        const dragCb = dragCall[1];

        const mockDev1 = { constructor: { name: 'DevCard' }, x: 100, y: 120 };
        const mockDev2 = { constructor: { name: 'DevCard' }, x: 100, y: 120 };
        
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            x: 100,
            y: 100,
            stackedDevs: [mockDev1, mockDev2]
        };

        // Drag ticket to 150, 150 (dragX, dragY are the new coordinates)
        dragCb(null, mockTicket, 150, 150);

        // Devs should maintain their relative offset (+0x, +20y from new ticket position)
        expect(mockDev1.x).toBe(150);
        expect(mockDev1.y).toBe(170);
        expect(mockDev2.x).toBe(150);
        expect(mockDev2.y).toBe(170);
    });

    it('should start breathing animation when DevCard is stacked on TicketCard', () => {
        controller.setupInteractions();
        const dropCall = mockScene.input.on.mock.calls.find(c => c[0] === 'drop');
        const dropCb = dropCall[1];
        
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            x: 300, y: 300,
            stackedDevs: [],
            currentColumn: 'In Progress'
        };
        controller.tickets.push(mockTicket);

        const mockDev = {
            constructor: { name: 'DevCard' },
            x: 310, y: 320,
            currentTicket: null,
            startBreathing: vi.fn(),
            input: { dragStartX: 100, dragStartY: 100 }
        };

        dropCb(null, mockDev, {});

        expect(mockDev.startBreathing).toHaveBeenCalled();
    });

    it('should stop breathing animation when DevCard is unstacked', () => {
        controller.setupInteractions();
        const dragStartCall = mockScene.input.on.mock.calls.find(c => c[0] === 'dragstart');
        const dragStartCb = dragStartCall[1];

        const mockDev = {
            constructor: { name: 'DevCard' },
            currentTicket: null,
            stopBreathing: vi.fn()
        };
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            stackedDevs: [mockDev]
        };
        mockDev.currentTicket = mockTicket;

        dragStartCb(null, mockDev);

        expect(mockDev.stopBreathing).toHaveBeenCalled();
    });

    it('should control ticket particles during work simulation', () => {
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            stackedDevs: [{}], // Has a dev working on it
            progress: 0,
            maxProgress: 100,
            updateProgressVisual: vi.fn(),
            startParticles: vi.fn(),
            stopParticles: vi.fn()
        };
        controller.tickets.push(mockTicket);

        // Simulate work update
        controller.update(0, 1000); // 1 second delta

        expect(mockTicket.startParticles).toHaveBeenCalled();
        expect(mockTicket.progress).toBeGreaterThan(0);

        // Remove dev, simulate work pause
        mockTicket.stackedDevs = [];
        controller.update(1000, 1000);

        expect(mockTicket.stopParticles).toHaveBeenCalled();
    });

    it('should detach DevCard, stop effects, and slide TicketCard on completion', () => {
        const mockDev = {
            constructor: { name: 'DevCard' },
            y: 100,
            currentTicket: null,
            stopBreathing: vi.fn()
        };
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            currentColumn: 'In Progress',
            progress: 95,
            maxProgress: 100,
            stackedDevs: [mockDev],
            updateProgressVisual: vi.fn(),
            startParticles: vi.fn(),
            stopParticles: vi.fn()
        };
        mockDev.currentTicket = mockTicket;
        controller.tickets.push(mockTicket);

        // Simulate update that pushes progress over max (10 units per sec)
        controller.update(0, 1000);

        // Assertions for Ticket
        expect(mockTicket.progress).toBe(0);
        expect(mockTicket.currentColumn).toBe('Review');
        expect(mockTicket.stackedDevs.length).toBe(0);
        expect(mockTicket.stopParticles).toHaveBeenCalled();

        // Assertions for Dev
        expect(mockDev.currentTicket).toBeNull();
        expect(mockDev.y).toBe(200); // Initial 100 + 100 drop down
        expect(mockDev.stopBreathing).toHaveBeenCalled();
        
        // Assertions for slide animation
        expect(mockScene.tweens.add).toHaveBeenCalled();
    });

    it('should stack multiple DevCards with cascading offsets', () => {
        controller.setupInteractions();
        const dropCall = mockScene.input.on.mock.calls.find(c => c[0] === 'drop');
        const dropCb = dropCall[1];
        
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            x: 300, y: 300,
            stackedDevs: [],
            currentColumn: 'In Progress'
        };
        controller.tickets.push(mockTicket);

        const mockDev1 = { constructor: { name: 'DevCard' }, x: 310, y: 320, currentTicket: null, startBreathing: vi.fn() };
        const mockDev2 = { constructor: { name: 'DevCard' }, x: 310, y: 320, currentTicket: null, startBreathing: vi.fn() };

        // Drop first dev
        dropCb(null, mockDev1, {});
        expect(mockDev1.x).toBe(300);
        expect(mockDev1.y).toBe(340); // base offset

        // Drop second dev
        dropCb(null, mockDev2, {});
        expect(mockDev2.x).toBe(300);
        expect(mockDev2.y).toBe(370); // base + 30 cascading offset
        expect(mockTicket.stackedDevs.length).toBe(2);
    });

    it('should recalculate cascading offsets when a DevCard is unstacked', () => {
        controller.setupInteractions();
        const dragStartCall = mockScene.input.on.mock.calls.find(c => c[0] === 'dragstart');
        const dragStartCb = dragStartCall[1];

        const mockDev1 = { constructor: { name: 'DevCard' }, x: 300, y: 340, stopBreathing: vi.fn() };
        const mockDev2 = { constructor: { name: 'DevCard' }, x: 300, y: 370, stopBreathing: vi.fn() };
        const mockDev3 = { constructor: { name: 'DevCard' }, x: 300, y: 400, stopBreathing: vi.fn() };

        const mockTicket = {
            constructor: { name: 'TicketCard' },
            x: 300, y: 300,
            stackedDevs: [mockDev1, mockDev2, mockDev3]
        };
        mockDev1.currentTicket = mockTicket;
        mockDev2.currentTicket = mockTicket;
        mockDev3.currentTicket = mockTicket;

        // Unstack middle dev
        dragStartCb(null, mockDev2);

        // Remaining devs should shift up to fill gap
        expect(mockTicket.stackedDevs).toEqual([mockDev1, mockDev3]);
        expect(mockDev1.y).toBe(340); // Stays at base
        expect(mockDev3.y).toBe(370); // Shifts up from 400 to 370
    });

    it('should calculate work progress with synergy and role multipliers', () => {
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            requirement: 'Frontend',
            stackedDevs: [],
            progress: 0,
            maxProgress: 100,
            updateProgressVisual: vi.fn(),
            startParticles: vi.fn(),
            stopParticles: vi.fn()
        };
        controller.tickets.push(mockTicket);

        // 1 Dev (No Match) = 10 units per sec
        mockTicket.stackedDevs = [{ role: 'Backend' }];
        controller.update(0, 1000); // 1 second
        expect(mockTicket.progress).toBe(10);

        // Reset progress
        mockTicket.progress = 0;

        // 1 Dev (Match) = 10 * 2.0 = 20 units per sec
        mockTicket.stackedDevs = [{ role: 'Frontend' }];
        controller.update(0, 1000);
        expect(mockTicket.progress).toBe(20);

        // Reset progress
        mockTicket.progress = 0;

        // 2 Devs (Pair Synergy)
        // Dev 1 (Match) = 10 * 1.5 * 2.0 = 30
        // Dev 2 (No Match) = 10 * 1.5 * 1.0 = 15
        // Total = 45 units per sec
        mockTicket.stackedDevs = [{ role: 'Frontend' }, { role: 'Backend' }];
        controller.update(0, 1000);
        expect(mockTicket.progress).toBe(45);

        // Reset progress
        mockTicket.progress = 0;

        // 3 Devs (Mob - No Synergy, 1.0x)
        // Dev 1 (Match) = 10 * 1.0 * 2.0 = 20
        // Dev 2 (Match) = 10 * 1.0 * 2.0 = 20
        // Dev 3 (No Match) = 10 * 1.0 * 1.0 = 10
        // Total = 50 units per sec
        mockTicket.stackedDevs = [{ role: 'Frontend' }, { role: 'Frontend' }, { role: 'Backend' }];
        controller.update(0, 1000);
        expect(mockTicket.progress).toBe(50);
    });
});
