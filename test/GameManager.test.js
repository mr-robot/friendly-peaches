import { describe, it, expect, beforeEach } from 'vitest';
import GameManager from '../src/core/GameManager.js';

describe('GameManager', () => {
    let manager;

    beforeEach(() => {
        manager = new GameManager();
    });

    it('should initialize with default values', () => {
        expect(manager.budget).toBe(10000);
        expect(manager.morale).toBe(100);
        expect(manager.sprintTime).toBe(60); // 60 seconds per sprint initially
        expect(manager.state).toBe('PLANNING'); // PLANNING, ACTIVE, REVIEW
    });

    it('should transition to ACTIVE when startSprint is called', () => {
        manager.startSprint();
        expect(manager.state).toBe('ACTIVE');
    });

    it('should decrease sprintTime when tick is called in ACTIVE state', () => {
        manager.startSprint();
        manager.tick(1000); // 1 second
        expect(manager.sprintTime).toBe(59);
    });

    it('should not decrease sprintTime if state is not ACTIVE', () => {
        manager.tick(1000);
        expect(manager.sprintTime).toBe(60);
    });

    it('should transition to REVIEW when sprintTime reaches 0', () => {
        manager.startSprint();
        manager.tick(60000); // 60 seconds
        expect(manager.sprintTime).toBe(0);
        expect(manager.state).toBe('REVIEW');
    });

    it('should reset to PLANNING state and restore timer when startNextSprint is called', () => {
        manager.startSprint();
        manager.tick(60000); // 60 seconds
        expect(manager.state).toBe('REVIEW');
        
        manager.startNextSprint();
        expect(manager.state).toBe('PLANNING');
        expect(manager.sprintTime).toBe(60);
    });

    it('should increase budget when a ticket is completed', () => {
        manager.completeTicket();
        expect(manager.budget).toBe(12000); // base + 2000
    });
    it('should NOT increase budget when a BugCard is completed', () => {
        const bugCard = { constructor: { name: 'BugCard' } };
        manager.completeTicket(bugCard);
        expect(manager.budget).toBe(10000); // no change
    });

    it('should decrease budget based on active devs during tick', () => {
        manager.startSprint();
        // Assume 2 active devs, costing $10 per second each
        manager.tick(1000, { activeDevs: 2 });
        expect(manager.budget).toBe(9980); // 10000 - (2 * 10)
    });

    it('should calculate sprint evaluation metrics correctly', () => {
        manager.startSprint();
        manager.tick(60000); // end sprint
        
        // Add some commitments for testing
        const ticket1 = { id: 'ticket1', currentColumn: 'Done' };
        const ticket2 = { id: 'ticket2', currentColumn: 'In Progress' };
        manager.addSprintCommitment(ticket1);
        manager.addSprintCommitment(ticket2);
        
        const initialBudget = manager.budget;
        
        manager.evaluateSprint();
        
        // Should have +1000 for completed ticket1, -500 for missed ticket2
        expect(manager.budget).toBe(initialBudget + 500); // 10000 + 1000 - 500
    });

    it('should calculate morale multiplier correctly', () => {
        manager.morale = 100;
        expect(manager.getMoraleMultiplier()).toBe(1.0);
        
        manager.morale = 50;
        expect(manager.getMoraleMultiplier()).toBe(1.0);
        
        manager.morale = 25;
        expect(manager.getMoraleMultiplier()).toBe(0.7); // Penalty threshold
    });

    it('should drop morale significantly when a dev breaks down', () => {
        manager.morale = 100;
        manager.handleDevBreakdown();
        expect(manager.morale).toBe(90); // Drops by 10
    });

    it('should return game over state if morale hits 0', () => {
        manager.morale = 10;
        manager.handleDevBreakdown();
        expect(manager.morale).toBe(0);
        expect(manager.state).toBe('GAME_OVER');
    });

    it('should cap morale at 100', () => {
        manager.morale = 95;
        manager.completeTicket();
        expect(manager.morale).toBe(100);
    });
    it('should initialize techHealth at 100', () => {
        expect(manager.techHealth).toBe(100);
    });

    it('should decrease techHealth when a bug is spawned', () => {
        manager.handleBugSpawned();
        expect(manager.techHealth).toBe(90);
    });

    it('should increase techHealth when a bug is completed', () => {
        manager.techHealth = 80;
        const bugCard = { constructor: { name: 'BugCard' } };
        manager.completeTicket(bugCard);
        expect(manager.techHealth).toBe(90);
    });

    it('should trigger GAME_OVER when techHealth hits 0', () => {
        manager.techHealth = 10;
        manager.handleBugSpawned();
        expect(manager.techHealth).toBe(0);
        expect(manager.state).toBe('GAME_OVER');
    });

    it('should identify on-call state when techHealth < 25', () => {
        manager.techHealth = 30;
        expect(manager.isOnCallRequired()).toBe(false);
        manager.techHealth = 20;
        expect(manager.isOnCallRequired()).toBe(true);
    });

    describe('Sprint Phase Management', () => {
        it('should initialize in PLANNING phase', () => {
            expect(manager.state).toBe('PLANNING');
        });

        it('should transition to ACTIVE when startSprint is called', () => {
            manager.startSprint();
            expect(manager.state).toBe('ACTIVE');
        });

        it('should track sprint commitments', () => {
            const ticket = { id: 'ticket1' };
            manager.addSprintCommitment(ticket);
            expect(manager.sprintCommitments).toContain(ticket);
        });
    });

    describe('Sprint Evaluation', () => {
        it('should reward budget for completed commitments', () => {
            const ticket = { id: 'ticket1', currentColumn: 'Done' };
            manager.sprintCommitments = [ticket];
            
            const initialBudget = manager.budget;
            manager.evaluateSprint();
            
            expect(manager.budget).toBeGreaterThan(initialBudget);
        });

        it('should penalize budget for missed commitments', () => {
            const ticket = { id: 'ticket1', currentColumn: 'In Progress' };
            manager.sprintCommitments = [ticket];
            
            const initialBudget = manager.budget;
            manager.evaluateSprint();
            
            expect(manager.budget).toBeLessThan(initialBudget);
        });
    });
});