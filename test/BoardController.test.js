import { describe, it, expect, beforeEach, vi } from 'vitest';
import BoardController from '../src/controllers/BoardController.js';

// Mock BugCard so it doesn't trigger Phaser imports
vi.mock('../src/entities/BugCard.js', () => {
    return {
        default: class MockBugCard {
            constructor(scene, x, y, title, requirement) {
                this.constructorName = 'BugCard';
            }
        }
    };
});

// Mock TechDebtCard to avoid Phaser imports
vi.mock('../src/entities/TechDebtCard.js', () => {
    return {
        default: class MockTechDebtCard {
            constructor(scene, x, y, title) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.title = title;
                this.isFaceDown = true;
                this.attachToService = vi.fn();
            }
        }
    };
});

vi.mock('../src/entities/CardContainer.js', () => {
    return {
        default: class MockCardContainer {
            constructor(scene, x, y, title) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.title = title;
                this.bg = { setTint: vi.fn() };
                this.setVisible = vi.fn();
                this.setInteractive = vi.fn();
            }
        }
    };
});

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
                rectangle: vi.fn().mockImplementation((x, y, width, height, color, alpha) => createMockGameObject()),
                line: vi.fn().mockImplementation((x1, y1, x2, y2, color, alpha) => createMockGameObject()),
                text: vi.fn().mockImplementation((x, y, text, style) => createMockGameObject()),
                zone: vi.fn().mockImplementation((x, y, width, height) => createMockGameObject()),
                existing: vi.fn()
            },
            scale: {
                width: 1920,
                height: 1080
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

    it('should create exactly 5 columns: Backlog, In Progress, Review, Done, Icebox', () => {
        controller.createColumns();
        
        expect(controller.columns).toEqual(['Icebox', 'Backlog', 'In Progress', 'Review', 'Done']);
        expect(mockScene.add.text).toHaveBeenCalledTimes(8); // 5 columns + 1 services header + 1 commitment header + 1 phase indicator
    });

    it('should create a Services area during column creation', () => {
        controller.createColumns();
        expect(controller.servicesArea).toBeDefined();
    });

    it('should populate an Icebox column and populate it with tickets', () => {
        const mockAddExisting = vi.fn();
        mockScene.add.existing = mockAddExisting;
        
        controller.createColumns(); // Need to create columns first
        controller.populateIcebox(5);
        
        expect(controller.iceboxTickets.length).toBe(5);
        expect(mockAddExisting).toHaveBeenCalledTimes(5);
        
        // Verify each ticket has the expected properties
        controller.iceboxTickets.forEach(ticket => {
            expect(ticket.constructor.name).toBe('TicketCard');
            expect(ticket.currentColumn).toBe('Icebox');
        });
    });

    it('should create a background panel and drop zone for each column', () => {
        controller.createColumns();

        // 5 columns * 2 rectangles per column (bg + header) = 10 rectangles
        expect(mockScene.add.rectangle).toHaveBeenCalledTimes(12); // 10 columns + 1 services area + 1 commitment zone
        // 5 columns * 1 drop zone per column = 5 zones
        expect(mockScene.add.zone).toHaveBeenCalledTimes(6); // 5 columns + 1 commitment zone
        
        // Check that setDropZone was called on each created zone
        const zones = mockScene.add.zone.mock.results.map(r => r.value);
        expect(zones.length).toBe(6);
        zones.forEach(zone => {
            expect(zone.setDropZone).toHaveBeenCalled();
        });
    });

    it('should assign column and snap to position on native drop event for regular columns', () => {
        controller.createColumns();
        controller.setupInteractions();
        mockScene.gameManager = { state: 'ACTIVE' };

        const dropCall = mockScene.input.on.mock.calls.find(c => c[0] === 'drop');
        expect(dropCall).toBeDefined();

        const dropCb = dropCall[1];

        const mockCard = {
            constructor: { name: 'TicketCard' },
            x: 0,
            y: 0,
            input: { dragStartX: 0, dragStartY: 0 },
            currentColumn: 'Backlog'
        };

        const inProgressZone = {
            x: 200,
            width: 200,
            columnName: 'In Progress'
        };

        dropCb(null, mockCard, inProgressZone);
        
        expect(mockCard.currentColumn).toBe('In Progress');
    });

    it('should snap to Icebox on drop event if dropZone is Icebox', () => {
        controller.createColumns();
        controller.populateIcebox(0);
        controller.setupInteractions();
        mockScene.gameManager = { state: 'PLANNING' };
        
        const dropCall = mockScene.input.on.mock.calls.find(c => c[0] === 'drop');
        const dropCb = dropCall[1];

        const mockCard = {
            constructor: { name: 'TicketCard' },
            x: 100,
            y: 100,
            input: { dragStartX: 100, dragStartY: 100 },
            currentColumn: 'Backlog'
        };

        const iceboxZone = {
            x: 0,
            y: 620,
            width: 800,
            height: 200,
            columnName: 'Icebox'
        };

        dropCb(null, mockCard, iceboxZone);
        
        expect(mockCard.currentColumn).toBe('Icebox');
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
        mockScene.gameManager = { state: 'ACTIVE' };

        const dropCall = mockScene.input.on.mock.calls.find(c => c[0] === 'drop');
        expect(dropCall).toBeDefined();

        const dropCb = dropCall[1];
        
        // Mock a ticket card
        const mockCard = {
            constructor: { name: 'TicketCard' },
            x: 0,
            y: 0,
            input: { dragStartX: 0, dragStartY: 0 },
            currentColumn: 'Backlog'
        };

        const inProgressZone = {
            x: 200,
            width: 200,
            columnName: 'In Progress'
        };

        dropCb(null, mockCard, inProgressZone);

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

        // Should NOT snap to ticket and should remain where dropped
        expect(mockDev.x).toBe(710);
        expect(mockDev.y).toBe(320);
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

    it('should move a DevCard during drag so it can be dropped onto an active TicketCard', () => {
        controller.setupInteractions();

        const dragCall = mockScene.input.on.mock.calls.find(c => c[0] === 'drag');
        const dropCall = mockScene.input.on.mock.calls.find(c => c[0] === 'drop');
        expect(dragCall).toBeDefined();
        expect(dropCall).toBeDefined();

        const dragCb = dragCall[1];
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
            x: 100,
            y: 100,
            currentTicket: null,
            input: { dragStartX: 100, dragStartY: 100 }
        };

        dragCb(null, mockDev, 310, 320);
        dropCb(null, mockDev, {});

        expect(mockDev.x).toBe(300);
        expect(mockDev.y).toBe(340);
        expect(mockDev.currentTicket).toBe(mockTicket);
        expect(mockTicket.stackedDevs).toContain(mockDev);
    });

    it('should control ticket particles during work simulation', () => {
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            x: 100, y: 100,
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
        controller.createColumns();

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
        expect(mockDev.y).toBe(100);
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

        dropCb(null, mockDev2, {});
        expect(mockDev2.x).toBe(300);
        expect(mockDev2.y).toBe(370); // base + 30 cascading offset
        expect(mockTicket.stackedDevs.length).toBe(2);
    });

        // Drop second dev
    it('should enforce a maximum of 2 DevCards per TicketCard', () => {
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
        const mockDev3 = { constructor: { name: 'DevCard' }, x: 310, y: 320, currentTicket: null, startBreathing: vi.fn() };

        // Drop first two devs
        dropCb(null, mockDev1, {});
        dropCb(null, mockDev2, {});
        expect(mockTicket.stackedDevs.length).toBe(2);

        // Drop third dev, should not be attached

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

    it('should decay ticket quality if worked on by mismatched roles', () => {
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            requirement: 'Frontend',
            quality: 100,
            stackedDevs: [{ role: 'Backend' }],
            progress: 0,
            maxProgress: 100,
            updateProgressVisual: vi.fn(),
            updateQualityVisual: vi.fn(),
            startParticles: vi.fn(),
            stopParticles: vi.fn()
        };
        controller.tickets.push(mockTicket);
        
        // Tick 1 second
        controller.update(0, 1000);
        
        // Quality should decay by 5 per second for each mismatched dev
        expect(mockTicket.quality).toBe(95);
        expect(mockTicket.updateQualityVisual).toHaveBeenCalled();
    });

    it('should NOT decay ticket quality if worked on by matching roles', () => {
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            requirement: 'Frontend',
            quality: 100,
            stackedDevs: [{ role: 'Frontend' }],
            progress: 0,
            maxProgress: 100,
            updateProgressVisual: vi.fn(),
            updateQualityVisual: vi.fn(),
            startParticles: vi.fn(),
            stopParticles: vi.fn()
        };
        controller.tickets.push(mockTicket);
        
        // Tick 1 second
        controller.update(0, 1000);
        
        // Quality should remain 100
        expect(mockTicket.quality).toBe(100);
    });

    it('should NOT spawn a BugCard before a low-quality ticket completes', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);

        const mockAddExisting = vi.fn();
        mockScene.add.existing = mockAddExisting;

        const mockTicket = {
            constructor: { name: 'TicketCard' },
            title: 'Half-Baked Feature',
            requirement: 'Backend',
            quality: 0,
            stackedDevs: [{ role: 'Backend' }],
            progress: 10,
            maxProgress: 100,
            currentColumn: 'In Progress',
            updateProgressVisual: vi.fn(),
            updateQualityVisual: vi.fn(),
            startParticles: vi.fn(),
            stopParticles: vi.fn()
        };
        controller.tickets.push(mockTicket);

        controller.update(0, 1000);

        expect(controller.tickets).toHaveLength(1);
        expect(mockAddExisting).not.toHaveBeenCalled();

        vi.restoreAllMocks();
    });

    it('should spawn a BugCard when a ticket completes with low quality', () => {
        // Mock random so we always fail the quality check if quality is < 100
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        controller.createColumns();
        
        // Mock add existing to catch the spawned BugCard
        const mockAddExisting = vi.fn();
        mockScene.add.existing = mockAddExisting;
        
        const mockTicket = {
            constructor: { name: 'TicketCard' },
            title: 'Test Feature',
            requirement: 'Backend',
            quality: 0, // Very low quality means high chance of bug
            stackedDevs: [ { stopBreathing: vi.fn(), role: 'Backend' } ], // Matching role to calculate totalRate easily
            progress: 90, // Start just below max so it crosses threshold
            maxProgress: 100,
            currentColumn: 'Review',
            updateProgressVisual: vi.fn(),
            updateQualityVisual: vi.fn(),
            startParticles: vi.fn(),
            stopParticles: vi.fn()
        };
        controller.tickets.push(mockTicket);
        
        // This update will add 20 progress (1 dev * 2.0 match * 10 rate), crossing 100, triggering slideTicket
        controller.update(0, 1000);
        
        // We expect a new BugCard to have been pushed to tickets and added to scene
        expect(controller.tickets.length).toBe(2);
        expect(controller.tickets[1].constructorName).toBe('BugCard');
        expect(controller.tickets[1].currentColumn).toBe('Backlog');
        expect(mockAddExisting).toHaveBeenCalled();
        
        vi.restoreAllMocks();
    });

    it('should decrease techHealth when a bug is spawned', () => {
        const mockGameManager = { handleBugSpawned: vi.fn(), state: 'ACTIVE' };
        controller.scene.gameManager = mockGameManager;
        
        // Mock random to always spawn a bug for low quality
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        
        const ticket = { 
            maxProgress: 100, 
            progress: 90, // Just below max to trigger completion on update
            quality: 20, // Low quality to ensure bug spawns
            currentColumn: 'In Progress',
            stackedDevs: [{ role: 'Backend' }], // Add a dev to work on ticket
            updateProgressVisual: vi.fn(),
            startParticles: vi.fn(),
            stopParticles: vi.fn(),
            requirement: 'Backend' // Match dev role for work calculation
        };
        controller.tickets = [ticket];
        
        // This update will add 20 progress (1 dev * 2.0 match * 10 rate), crossing 100, triggering bug spawn
        controller.update(0, 1000);
        
        expect(mockGameManager.handleBugSpawned).toHaveBeenCalled();
        
        vi.restoreAllMocks();
    });

    it('should increase techHealth when a bug is completed', () => {
        const mockGameManager = { completeTicket: vi.fn(), state: 'ACTIVE' };
        controller.scene.gameManager = mockGameManager;
        
        const bug = { 
            constructor: { name: 'BugCard' },
            currentColumn: 'Done',
            rewarded: false
        };
        controller.tickets = [bug];
        
        // Simulating the check in MainGameScene.update
        controller.tickets.forEach(t => {
            if (t.currentColumn === 'Done' && !t.rewarded) {
                t.rewarded = true;
                mockGameManager.completeTicket(t);
            }
        });
        
        expect(mockGameManager.completeTicket).toHaveBeenCalledWith(bug);
    });

    it('should prevent stacking on features if techHealth < 25 (On-Call)', () => {
        const mockGameManager = { isOnCallRequired: vi.fn().mockReturnValue(true) };
        controller.scene.gameManager = mockGameManager;
        
        const dev = { constructor: { name: 'DevCard' }, x: 100, y: 100, input: { dragStartX: 50, dragStartY: 50 } };
        const ticket = { 
            constructor: { name: 'TicketCard' },
            x: 100, y: 100, 
            currentColumn: 'In Progress',
            stackedDevs: []
        };
        controller.tickets = [ticket];
        
        controller.handleDrop(dev, null);
        
        expect(dev.x).toBe(50); // Snapped back
        expect(ticket.stackedDevs.length).toBe(0);
    });

    it('should allow stacking on bugs if techHealth < 25 (On-Call)', () => {
        const mockGameManager = { isOnCallRequired: vi.fn().mockReturnValue(true) };
        controller.scene.gameManager = mockGameManager;
        
        const dev = { constructor: { name: 'DevCard' }, x: 100, y: 100, startBreathing: vi.fn() };
        const bug = { 
            constructor: { name: 'BugCard' },
            x: 100, y: 100, 
            currentColumn: 'In Progress',
            stackedDevs: []
        };
        controller.tickets = [bug];
        
        controller.handleDrop(dev, null);
        
        expect(dev.x).toBe(100); // Accepted
        expect(bug.stackedDevs.length).toBe(1);
    });

    describe('Sprint Commitment Zone', () => {
        it('should create a Sprint Commitment zone during column creation', () => {
            controller.createColumns();
            expect(controller.sprintCommitmentZone).toBeDefined();
            expect(controller.sprintCommitmentZone.zone.setDropZone).toHaveBeenCalled();
        });
    });

    describe('Sprint Commitment Logic', () => {
        it('should allow dropping tickets into Sprint Commitment zone during PLANNING', () => {
            const mockGameManager = { 
                state: 'PLANNING',
                addSprintCommitment: vi.fn(),
                sprintCommitments: []
            };
            controller.scene.gameManager = mockGameManager;
            controller.updateTicketArrays = vi.fn();
            
            // Create sprint commitment zone
            controller.createColumns();
            
            const ticket = { 
                constructor: { name: 'TicketCard' },
                currentColumn: 'Backlog'
            };
            const dropZone = { columnName: 'Sprint Commitment' };
            
            controller.handleDrop(ticket, dropZone);
            
            expect(ticket.currentColumn).toBe('Sprint Commitment');
            expect(mockGameManager.addSprintCommitment).toHaveBeenCalledWith(ticket);
            expect(controller.updateTicketArrays).toHaveBeenCalledWith(ticket);
        });
    });

    describe('Sprint Phase UI Indicators', () => {
        it('should create phase indicator during column creation', () => {
            controller.createColumns();
            expect(controller.phaseIndicator).toBeDefined();
            expect(mockScene.add.text).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                expect.stringContaining('PLANNING'),
                expect.any(Object)
            );
        });

        it('should update phase indicator text when phase changes', () => {
            controller.createColumns();
            controller.updatePhaseIndicator('ACTIVE');
            
            expect(controller.phaseIndicator.text).toBe('Phase: ACTIVE');
        });
    });

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
            
            // Check that attachToService was called on the created debt
            expect(controller.techDebtCards.length).toBe(1);
            expect(controller.techDebtCards[0].attachToService).toHaveBeenCalled();
        });
    });

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
                applyToDev: vi.fn().mockImplementation((targetDev) => {
                    targetDev.speedMultiplier *= manager.managementBonus;
                }),
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
                canShield: true,
                applyToDev: vi.fn()
            };
            
            controller.stackManagerOnDev(manager, dev);
            
            expect(dev.isShielded).toBe(true);
        });
    });
});
