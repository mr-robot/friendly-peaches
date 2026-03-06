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

    it('should increase budget when a ticket is completed', () => {
        manager.completeTicket();
        expect(manager.budget).toBe(12000); // base + 2000
    });

    it('should decrease budget based on active devs during tick', () => {
        manager.startSprint();
        // Assume 2 active devs, costing $10 per second each
        manager.tick(1000, { activeDevs: 2 });
        expect(manager.budget).toBe(9980); // 10000 - (2 * 10)
    });
});