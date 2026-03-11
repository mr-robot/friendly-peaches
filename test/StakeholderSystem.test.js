import { describe, it, expect, beforeEach, vi } from 'vitest';

import GameManager from '../src/core/GameManager.js';
import StakeholderManager from '../src/core/StakeholderManager.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGM(overrides = {}) {
    const gm = new GameManager();
    Object.assign(gm, overrides);
    return gm;
}

// ── Phase 5f: StakeholderManager ──────────────────────────────────────────────

describe('Phase 5f — StakeholderManager', () => {
    let sm;
    let gm;

    beforeEach(() => {
        gm = makeGM();
        sm = new StakeholderManager(gm);
    });

    describe('Initialisation', () => {
        it('starts with a Product Owner always present', () => {
            expect(sm.activeStakeholders).toHaveLength(1);
            expect(sm.activeStakeholders[0].type).toBe('ProductOwner');
        });

        it('Product Owner has a demand count for the sprint', () => {
            const po = sm.getProductOwner();
            expect(po).toBeDefined();
            expect(po.demandCount).toBeGreaterThanOrEqual(1);
        });

        it('starts with no periodic stakeholders', () => {
            expect(sm.periodicStakeholders).toHaveLength(0);
        });
    });

    describe('Product Owner', () => {
        it('getProductOwner() returns the Product Owner stakeholder', () => {
            const po = sm.getProductOwner();
            expect(po.type).toBe('ProductOwner');
        });

        it('Product Owner demands increase pressure when ignored', () => {
            const po = sm.getProductOwner();
            const initial = po.pressureLevel;
            sm.ignoreDemand(po);
            expect(po.pressureLevel).toBeGreaterThan(initial);
        });

        it('fulfilling Product Owner demand reduces pressure', () => {
            const po = sm.getProductOwner();
            po.pressureLevel = 50;
            sm.fulfillDemand(po);
            expect(po.pressureLevel).toBeLessThan(50);
        });

        it('fulfilling demand awards budget', () => {
            const initial = gm.budget;
            const po = sm.getProductOwner();
            sm.fulfillDemand(po);
            expect(gm.budget).toBeGreaterThan(initial);
        });

        it('ignoring all demands costs reputation', () => {
            const initial = gm.reputation;
            const po = sm.getProductOwner();
            sm.ignoreDemand(po);
            sm.ignoreDemand(po);
            sm.ignoreDemand(po);
            // Reputation should have dropped or at least not increased
            expect(gm.reputation).toBeLessThanOrEqual(initial);
        });
    });

    describe('Periodic stakeholders', () => {
        it('advanceSprint() may add a CTO after sprint 3', () => {
            gm.currentSprint = 4;
            sm.advanceSprint();
            // CTO has a chance to appear — at minimum periodicStakeholders may include one
            // We test the pool contains CTO as a possibility
            expect(sm.stakeholderPool).toContain('CTO');
        });

        it('advanceSprint() may add a CFO after sprint 5', () => {
            gm.currentSprint = 6;
            sm.advanceSprint();
            expect(sm.stakeholderPool).toContain('CFO');
        });

        it('advanceSprint() may add a VP of Product after sprint 3', () => {
            gm.currentSprint = 4;
            sm.advanceSprint();
            expect(sm.stakeholderPool).toContain('VPProduct');
        });

        it('spawnPeriodicStakeholder(type) adds stakeholder to active list', () => {
            sm.spawnPeriodicStakeholder('CTO');
            expect(sm.activeStakeholders.some(s => s.type === 'CTO')).toBe(true);
        });

        it('CTO demands infrastructure investment', () => {
            sm.spawnPeriodicStakeholder('CTO');
            const cto = sm.activeStakeholders.find(s => s.type === 'CTO');
            expect(cto.demandType).toBe('infrastructure');
        });

        it('CFO demands budget efficiency', () => {
            sm.spawnPeriodicStakeholder('CFO');
            const cfo = sm.activeStakeholders.find(s => s.type === 'CFO');
            expect(cfo.demandType).toBe('budget');
        });

        it('VPProduct brings a pivot demand', () => {
            sm.spawnPeriodicStakeholder('VPProduct');
            const vp = sm.activeStakeholders.find(s => s.type === 'VPProduct');
            expect(vp.demandType).toBe('pivot');
        });
    });

    describe('Mid-sprint events', () => {
        it('drawEventCard() returns an event object', () => {
            const event = sm.drawEventCard();
            expect(event).toBeDefined();
            expect(event.type).toBeDefined();
            expect(event.effect).toBeDefined();
        });

        it('drawEventCard() returns one of the known event types', () => {
            const knownTypes = [
                'AllHandsMeeting', 'ScopeCreep', 'HiringFreeze',
                'InvestorDemo', 'TeamBuildingOffsite', 'PoachingAttempt'
            ];
            const event = sm.drawEventCard();
            expect(knownTypes).toContain(event.type);
        });

        it('applyEvent(AllHandsMeeting) reduces morale slightly', () => {
            const initial = gm.morale;
            sm.applyEvent({ type: 'AllHandsMeeting', effect: {} });
            expect(gm.morale).toBeLessThanOrEqual(initial);
        });

        it('applyEvent(TeamBuildingOffsite) boosts morale', () => {
            gm.morale = 60;
            sm.applyEvent({ type: 'TeamBuildingOffsite', effect: {} });
            expect(gm.morale).toBeGreaterThan(60);
        });

        it('applyEvent(HiringFreeze) sets hiringFrozen flag on GameManager', () => {
            sm.applyEvent({ type: 'HiringFreeze', effect: {} });
            expect(gm.hiringFrozen).toBe(true);
        });

        it('applyEvent(InvestorDemo) adds a demo deadline to GameManager', () => {
            sm.applyEvent({ type: 'InvestorDemo', effect: {} });
            expect(gm.activeDemo).toBeDefined();
        });

        it('applyEvent(ScopeCreep) increases Product Owner demand count', () => {
            const po = sm.getProductOwner();
            const initial = po.demandCount;
            sm.applyEvent({ type: 'ScopeCreep', effect: {} });
            expect(po.demandCount).toBeGreaterThan(initial);
        });

        it('applyEvent(PoachingAttempt) sets poachingTarget on GameManager', () => {
            sm.applyEvent({ type: 'PoachingAttempt', effect: {} });
            expect(gm.poachingTarget).toBeDefined();
        });
    });

    describe('Push-back mechanic', () => {
        it('pushBack(stakeholder) increases political capital cost', () => {
            sm.spawnPeriodicStakeholder('VPProduct');
            const vp = sm.activeStakeholders.find(s => s.type === 'VPProduct');
            const initial = sm.politicalCapitalSpent;
            sm.pushBack(vp);
            expect(sm.politicalCapitalSpent).toBeGreaterThan(initial);
        });

        it('pushBack() delays the stakeholder demand by one sprint', () => {
            sm.spawnPeriodicStakeholder('VPProduct');
            const vp = sm.activeStakeholders.find(s => s.type === 'VPProduct');
            vp.dueInSprints = 1;
            sm.pushBack(vp);
            expect(vp.dueInSprints).toBe(2);
        });

        it('excessive pushBack (>3 times) triggers LeadershipConcerns event', () => {
            sm.politicalCapitalSpent = 2;
            sm.spawnPeriodicStakeholder('VPProduct');
            const vp = sm.activeStakeholders.find(s => s.type === 'VPProduct');
            sm.pushBack(vp);
            expect(gm.leadershipConcerned).toBe(true);
        });

        it('pushBack() reduces reputation when leadership is already concerned', () => {
            gm.leadershipConcerned = true;
            gm.reputation = 200;
            sm.spawnPeriodicStakeholder('CTO');
            const cto = sm.activeStakeholders.find(s => s.type === 'CTO');
            sm.pushBack(cto);
            expect(gm.reputation).toBeLessThan(200);
        });
    });

    describe('Sprint lifecycle integration', () => {
        it('advanceSprint() resets Product Owner demands for the new sprint', () => {
            const po = sm.getProductOwner();
            po.demandCount = 0;
            sm.advanceSprint();
            expect(sm.getProductOwner().demandCount).toBeGreaterThanOrEqual(1);
        });

        it('advanceSprint() removes resolved periodic stakeholders', () => {
            sm.spawnPeriodicStakeholder('CTO');
            const cto = sm.activeStakeholders.find(s => s.type === 'CTO');
            sm.fulfillDemand(cto);
            sm.advanceSprint();
            expect(sm.activeStakeholders.every(s => s.type !== 'CTO' || !s.resolved)).toBe(true);
        });
    });
});
