import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser inline to avoid hoisting issues
vi.mock('phaser', () => ({
    default: {
        Scene: class MockScene {
            constructor(config) {
                this.key = config?.key || 'MockScene';
            }
        },
        GameObjects: {
            Container: class MockContainer {
                constructor(scene, x, y) {
                    this.scene = scene;
                    this.x = x;
                    this.y = y;
                    this.list = [];
                }
                add() { return this; }
                setInteractive() { return this; }
                on() { return this; }
            }
        }
    }
}));

// Mock all entities
vi.mock('../src/entities/CardContainer.js', () => ({
    default: class MockCardContainer {
        constructor(scene, x, y, title) {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.title = title;
        }
    }
}));

vi.mock('../src/entities/TicketCard.js', () => ({
    default: class MockTicketCard {
        constructor(scene, x, y, title, requirement) {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.title = title;
            this.requirement = requirement;
            this.type = 'TicketCard';
            this.currentColumn = 'Product Backlog';
            this.rewarded = false;
            this.stackedDevs = [];
        }
    }
}));

vi.mock('../src/entities/BugCard.js', () => ({
    default: class MockBugCard {
        constructor(scene, x, y, title, severity) {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.title = title;
            this.severity = severity;
            this.type = 'BugCard';
            this.currentColumn = 'Product Backlog';
            this.rewarded = false;
            this.stackedDevs = [];
        }
    }
}));

vi.mock('../src/entities/DevCard.js', () => ({
    default: class MockDevCard {
        constructor(scene, x, y, name, role) {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.name = name;
            this.role = role;
            this.type = 'DevCard';
            this.seniority = 'mid';
            this.isOnboarding = false;
            this.stopBreathing = vi.fn();
        }
    }
}));

// Mock all managers
vi.mock('../src/controllers/BoardController.js', () => ({
    default: class MockBoardController {
        constructor(scene) {
            this.scene = scene;
            this.tickets = [];
            this.devs = [];
            this.fogOfWar = {
                reset: vi.fn(),
                checkEscalations: vi.fn().mockReturnValue([]),
                revealAll: vi.fn()
            };
        }
        createColumns = vi.fn();
        populateProductBacklog = vi.fn();
        setupInteractions = vi.fn();
        handleStateTransition = vi.fn();
        update = vi.fn();
        tickFog = vi.fn();
    }
}));

vi.mock('../src/core/GameManager.js', () => ({
    default: class MockGameManager {
        constructor() {
            this.state = 'PLANNING';
            this.budget = 100;
            this.morale = 75;
            this.techHealth = 80;
            this.sprintTime = 0;
            this.sprintCommitments = [];
        }
        tick = vi.fn();
        isOnCallRequired = vi.fn().mockReturnValue(false);
        evaluateSprint = vi.fn().mockReturnValue({ completed: 2, committed: 3 });
        completeTicket = vi.fn();
    }
}));

vi.mock('../src/core/IncidentManager.js', () => ({
    default: class MockIncidentManager {
        constructor(gameManager) {
            this.gameManager = gameManager;
            this.activeIncidents = [];
            this.incidents = [];
        }
        spawnFromBug = vi.fn();
        tick = vi.fn();
        hasSev1Incident = vi.fn().mockReturnValue(false);
        resolveIncident = vi.fn();
    }
}));

vi.mock('../src/core/AuditManager.js', () => ({
    default: class MockAuditManager {
        constructor(gameManager) {
            this.gameManager = gameManager;
        }
        tick = vi.fn();
    }
}));

vi.mock('../src/core/StakeholderManager.js', () => ({
    default: class MockStakeholderManager {
        constructor(gameManager) {
            this.gameManager = gameManager;
        }
        drawEventCard = vi.fn().mockReturnValue({ type: 'test-event' });
        applyEvent = vi.fn();
        advanceSprint = vi.fn();
        getProductOwner = vi.fn().mockReturnValue(null);
    }
}));

vi.mock('../src/core/NewHireManager.js', () => ({
    default: class MockNewHireManager {
        constructor(gameManager) {
            this.gameManager = gameManager;
        }
        tick = vi.fn();
        getOnboardingDevs = vi.fn().mockReturnValue([]);
    }
}));

import MainGameScene from '../src/scenes/MainGameScene.js';

describe('MainGameScene', () => {
    let scene;

    beforeEach(() => {
        scene = new MainGameScene();
        scene.scene = { launch: vi.fn(), get: vi.fn() };
        scene.add = { existing: vi.fn() };
        scene.create();
    });

    describe('Initialization', () => {
        it('should create all managers on construction', () => {
            expect(scene.gameManager).toBeDefined();
            expect(scene.incidentManager).toBeDefined();
            expect(scene.auditManager).toBeDefined();
            expect(scene.stakeholderManager).toBeDefined();
            expect(scene.newHireManager).toBeDefined();
            expect(scene.boardController).toBeDefined();
        });

        it('should launch UIScene on create', () => {
            expect(scene.scene.launch).toHaveBeenCalledWith('UIScene');
        });

        it('should initialize board controller on create', () => {
            expect(scene.boardController.createColumns).toHaveBeenCalled();
            expect(scene.boardController.populateProductBacklog).toHaveBeenCalledWith(5);
            expect(scene.boardController.setupInteractions).toHaveBeenCalled();
        });

        it('should create initial test entities', () => {
            expect(scene.add.existing).toHaveBeenCalledTimes(3); // 1 ticket + 2 devs
            expect(scene.boardController.tickets).toHaveLength(1);
            expect(scene.boardController.devs).toHaveLength(2);
        });

        it('should apply opening stakeholder event', () => {
            expect(scene.stakeholderManager.drawEventCard).toHaveBeenCalled();
            expect(scene.stakeholderManager.applyEvent).toHaveBeenCalled();
        });

        it('should initialize state handling', () => {
            expect(scene.previousState).toBeDefined();
        });
    });

    describe('State Management', () => {
        it('should handle PLANNING state transition', () => {
            scene.gameManager.state = 'PLANNING';
            scene.previousState = 'ACTIVE';
            
            scene.handleStateChange();
            
            expect(scene.boardController.handleStateTransition).toHaveBeenCalledWith('PLANNING');
            expect(scene.boardController.fogOfWar.reset).toHaveBeenCalled();
            expect(scene.incidentManager.incidents).toEqual([]);
            expect(scene.stakeholderManager.advanceSprint).toHaveBeenCalled();
        });

        it('should handle ACTIVE state transition', () => {
            scene.gameManager.state = 'ACTIVE';
            scene.previousState = 'PLANNING';
            
            scene.handleStateChange();
            
            expect(scene.boardController.handleStateTransition).toHaveBeenCalledWith('ACTIVE');
            expect(scene.stakeholderManager.drawEventCard).toHaveBeenCalledTimes(2); // Once in create, once in transition
            expect(scene.stakeholderManager.applyEvent).toHaveBeenCalledTimes(2);
        });

        it('should handle REVIEW state transition', () => {
            scene.gameManager.state = 'REVIEW';
            scene.previousState = 'ACTIVE';
            
            scene.handleStateChange();
            
            expect(scene.boardController.handleStateTransition).toHaveBeenCalledWith('REVIEW');
            expect(scene.boardController.fogOfWar.revealAll).toHaveBeenCalled();
        });

        it('should not act when state does not change', () => {
            scene.gameManager.state = 'PLANNING';
            scene.previousState = 'PLANNING'; // Same as current state
            
            scene.handleStateChange();
            
            // Should not call handleStateTransition again since create() already called it
            expect(scene.boardController.handleStateTransition).toHaveBeenCalledTimes(1); // From create()
        });
    });

    describe('Sprint Evaluation', () => {
        it('should evaluate sprint with completed and committed tickets', () => {
            scene.boardController.tickets = [
                { currentColumn: 'Done' },
                { currentColumn: 'Done' },
                { currentColumn: 'Review' }
            ];
            
            scene.evaluateSprint();
            
            expect(scene.gameManager.evaluateSprint).toHaveBeenCalledWith(2, 3);
        });

        it('should show sprint review in UI when result available', () => {
            const mockUIScene = { showSprintReview: vi.fn() };
            scene.scene.get.mockReturnValue(mockUIScene);
            scene.gameManager.evaluateSprint.mockReturnValue({ completed: 2 });
            
            scene.evaluateSprint();
            
            expect(mockUIScene.showSprintReview).toHaveBeenCalledWith({ completed: 2 });
        });
    });

    describe('Update Loop', () => {
        it('should handle state transitions during update', () => {
            const handleStateChangeSpy = vi.spyOn(scene, 'handleStateChange');
            scene.update(0, 100);
            expect(handleStateChangeSpy).toHaveBeenCalled();
        });

        it('should calculate active developers for budget drain', () => {
            scene.boardController.tickets = [
                { currentColumn: 'In Progress', stackedDevs: [1, 2] },
                { currentColumn: 'Done', stackedDevs: [3] },
                { currentColumn: 'Review', stackedDevs: [] }
            ];
            
            scene.update(0, 100);
            
            expect(scene.gameManager.tick).toHaveBeenCalledWith(100, { activeDevs: 2 });
        });

        it('should tick all managers during ACTIVE state', () => {
            scene.gameManager.state = 'ACTIVE';
            scene.update(0, 100);
            
            expect(scene.boardController.update).toHaveBeenCalledWith(0, 100);
            expect(scene.boardController.tickFog).toHaveBeenCalledWith(100);
            expect(scene.incidentManager.tick).toHaveBeenCalledWith(100);
            expect(scene.auditManager.tick).toHaveBeenCalledWith(100);
            expect(scene.newHireManager.tick).toHaveBeenCalledWith(100);
        });

        it('should spawn incidents from escalated bugs', () => {
            scene.gameManager.state = 'ACTIVE';
            const mockBug = { type: 'BugCard' };
            scene.boardController.fogOfWar.checkEscalations.mockReturnValue([mockBug]);
            
            scene.update(0, 100);
            
            expect(scene.incidentManager.spawnFromBug).toHaveBeenCalledWith(mockBug);
        });

        it('should cap tech health during SEV-1 incidents', () => {
            scene.gameManager.state = 'ACTIVE';
            scene.gameManager.techHealth = 50;
            scene.incidentManager.hasSev1Incident.mockReturnValue(true);
            
            scene.update(0, 100);
            
            expect(scene.gameManager.techHealth).toBe(24);
        });

        it('should stop particles and breathing during non-ACTIVE state', () => {
            scene.gameManager.state = 'PLANNING';
            const mockTicket = { 
                currentColumn: 'Done', 
                stopParticles: vi.fn(),
                stackedDevs: [{ stopBreathing: vi.fn() }]
            };
            scene.boardController.tickets = [mockTicket];
            
            scene.update(0, 100);
            
            expect(mockTicket.stopParticles).toHaveBeenCalled();
            expect(mockTicket.stackedDevs[0].stopBreathing).toHaveBeenCalled();
        });
    });

    describe('Ticket Completion', () => {
        it('should complete unrewarded tickets in Done column', () => {
            const ticket = { 
                currentColumn: 'Done', 
                rewarded: false,
                type: 'TicketCard',
                stackedDevs: []
            };
            scene.boardController.tickets = [ticket];
            
            scene.update(0, 100);
            
            expect(ticket.rewarded).toBe(true);
            expect(scene.gameManager.completeTicket).toHaveBeenCalledWith(ticket);
        });

        it('should not complete already rewarded tickets', () => {
            const ticket = { 
                currentColumn: 'Done', 
                rewarded: true,
                type: 'TicketCard',
                stackedDevs: []
            };
            scene.boardController.tickets = [ticket];
            
            scene.update(0, 100);
            
            expect(scene.gameManager.completeTicket).not.toHaveBeenCalled();
        });

        it('should not complete tickets not in Done column', () => {
            const ticket = { 
                currentColumn: 'Review', 
                rewarded: false,
                type: 'TicketCard',
                stackedDevs: []
            };
            scene.boardController.tickets = [ticket];
            
            scene.update(0, 100);
            
            expect(scene.gameManager.completeTicket).not.toHaveBeenCalled();
        });
    });

    describe('Done Card Cleanup', () => {
        it('should remove Done cards when sprint ends', () => {
            const scene = new MainGameScene();
            scene.gameManager = { state: 'ACTIVE' };
            
            const doneCard1 = { currentColumn: 'Done', destroy: vi.fn() };
            const inProgressCard = { currentColumn: 'In Progress', destroy: vi.fn() };
            const doneCard2 = { currentColumn: 'Done', destroy: vi.fn() };
            
            scene.boardController = {
                tickets: [doneCard1, inProgressCard, doneCard2],
                handleStateTransition: vi.fn(),
                fogOfWar: { revealAll: vi.fn() }
            };
            scene.evaluateSprint = vi.fn();
            
            // Trigger sprint end
            scene.gameManager.state = 'REVIEW';
            scene.handleStateChange();
            
            // Verify Done cards were destroyed
            expect(doneCard1.destroy).toHaveBeenCalled();
            expect(doneCard2.destroy).toHaveBeenCalled();
            expect(inProgressCard.destroy).not.toHaveBeenCalled();
            
            // Verify only In Progress card remains
            expect(scene.boardController.tickets).toHaveLength(1);
            expect(scene.boardController.tickets[0]).toBe(inProgressCard);
        });
    });

    describe('Incident Resolution', () => {
        it('should resolve incident when associated bug is completed', () => {
            const bug = { 
                currentColumn: 'Done', 
                rewarded: false,
                type: 'BugCard',
                stackedDevs: []
            };
            const incident = { sourceBug: bug, resolved: false };
            scene.incidentManager.activeIncidents = [incident];
            scene.boardController.tickets = [bug];
            
            scene.update(0, 100);
            
            expect(scene.incidentManager.resolveIncident).toHaveBeenCalledWith(incident);
        });

        it('should not resolve incident for non-bug tickets', () => {
            const ticket = { 
                currentColumn: 'Done', 
                rewarded: false,
                type: 'TicketCard',
                stackedDevs: []
            };
            const incident = { sourceBug: ticket, resolved: false };
            scene.incidentManager.activeIncidents = [incident];
            scene.boardController.tickets = [ticket];
            
            scene.update(0, 100);
            
            expect(scene.incidentManager.resolveIncident).not.toHaveBeenCalled();
        });

        it('should not resolve unrelated incidents', () => {
            const bug = { 
                currentColumn: 'Done', 
                rewarded: false,
                type: 'BugCard',
                stackedDevs: []
            };
            const unrelatedBug = { type: 'BugCard' };
            const incident = { sourceBug: unrelatedBug, resolved: false };
            scene.incidentManager.activeIncidents = [incident];
            scene.boardController.tickets = [bug];
            
            scene.update(0, 100);
            
            expect(scene.incidentManager.resolveIncident).not.toHaveBeenCalled();
        });
    });

    describe('UI Updates', () => {
        it('should update UI with current game state', () => {
            const mockUIScene = { updateUI: vi.fn() };
            scene.scene.get.mockReturnValue(mockUIScene);
            
            scene.update(0, 100);
            
            expect(mockUIScene.updateUI).toHaveBeenCalledWith(scene.gameManager, {
                incidents: scene.incidentManager.activeIncidents,
                stakeholder: scene.stakeholderManager.getProductOwner(),
                onboardingDevs: scene.newHireManager.getOnboardingDevs()
            });
        });

        it('should handle missing UI scene gracefully', () => {
            scene.scene.get.mockReturnValue(null);
            
            expect(() => scene.update(0, 100)).not.toThrow();
        });
    });
});
