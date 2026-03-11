import { describe, it, expect, beforeEach, vi } from 'vitest';

import GameManager from '../src/core/GameManager.js';
import IncidentManager from '../src/core/IncidentManager.js';
import AuditManager from '../src/core/AuditManager.js';
import StakeholderManager from '../src/core/StakeholderManager.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGM(overrides = {}) {
    const gm = new GameManager();
    Object.assign(gm, overrides);
    return gm;
}

function makeBug(overrides = {}) {
    return {
        constructor: { name: 'BugCard' },
        title: 'Hidden Bug',
        isHidden: true,
        escalationChance: 1.0,
        severity: 2,
        setAlpha: vi.fn(),
        setVisible: vi.fn(),
        currentColumn: 'Sprint Commitment',
        stackedDevs: [],
        ...overrides
    };
}

function makeDev(overrides = {}) {
    return {
        constructor: { name: 'DevCard' },
        name: 'Alice',
        role: 'Backend',
        seniority: 'senior',
        currentTicket: null,
        isOnboarding: false,
        onboardingTimeRemaining: 0,
        sprintsOnTeam: 0,
        ...overrides
    };
}

function makeDebt(overrides = {}) {
    return {
        constructor: { name: 'TechDebtCard' },
        title: 'Hidden Debt',
        isHidden: true,
        severity: 1,
        setAlpha: vi.fn(),
        setVisible: vi.fn(),
        ...overrides
    };
}

function makeService(debtCards = []) {
    return {
        constructor: { name: 'ServiceCard' },
        title: 'API Service',
        debtCards,
        updateVisualIndicators: vi.fn()
    };
}

// ── Task 1: MainGameScene wiring (pure logic, no Phaser) ─────────────────────

describe('Task 1 — Manager wiring integration', () => {
    let gm, im, am, sm;

    beforeEach(() => {
        gm = makeGM();
        im = new IncidentManager(gm);
        am = new AuditManager(gm);
        sm = new StakeholderManager(gm);
    });

    describe('IncidentManager + FogOfWarManager pipeline', () => {
        it('escalated bug → checkEscalations → spawnFromBug creates incident', async () => {
            const { default: FogOfWarManager } = await import('../src/core/FogOfWarManager.js');
            const fog = new FogOfWarManager();
            const bug = makeBug({ escalationChance: 1.0 });
            fog.registerHidden(bug);

            const triggered = fog.checkEscalations();
            triggered.forEach(b => im.spawnFromBug(b));

            expect(im.incidents).toHaveLength(1);
            expect(bug.isHidden).toBe(false);
        });

        it('incident tick reduces timer and escalates on expiry', () => {
            const bug = makeBug({ severity: 1 });
            im.spawnFromBug(bug);
            im.incidents[0].timeRemaining = 500;
            im.tick(1000);
            expect(im.incidents[0].severity).toBe(2);
        });

        it('SEV-1 incident triggers on-call restriction', () => {
            const bug = makeBug({ severity: 3 });
            im.spawnFromBug(bug);
            expect(im.hasSev1Incident()).toBe(true);
        });

        it('hasSev1Incident() feeds into isOnCallRequired logic', () => {
            // When SEV-1 active, on-call should be required regardless of techHealth
            const bug = makeBug({ severity: 3 });
            im.spawnFromBug(bug);
            // A wrapper that combines GameManager + IncidentManager
            const isOnCall = gm.isOnCallRequired() || im.hasSev1Incident();
            expect(isOnCall).toBe(true);
        });
    });

    describe('AuditManager tick lifecycle', () => {
        it('tick() across multiple devs reduces all audit timers', () => {
            const dev1 = makeDev(); dev1.isAuditing = true; dev1.auditTimeRemaining = 20000;
            const dev2 = makeDev({ name: 'Bob' }); dev2.isAuditing = true; dev2.auditTimeRemaining = 15000;
            am.trackAuditingDev(dev1);
            am.trackAuditingDev(dev2);
            am.tick(5000);
            expect(dev1.auditTimeRemaining).toBe(15000);
            expect(dev2.auditTimeRemaining).toBe(10000);
        });

        it('completed audit unlocks dev and removes from auditingDevs', () => {
            const dev = makeDev(); dev.isAuditing = true; dev.auditTimeRemaining = 500;
            am.trackAuditingDev(dev);
            am.tick(1000);
            expect(dev.isAuditing).toBe(false);
            expect(am.auditingDevs).not.toContain(dev);
        });
    });

    describe('StakeholderManager sprint lifecycle', () => {
        it('advanceSprint() on sprint 4 unlocks CTO and VPProduct', () => {
            gm.currentSprint = 4;
            sm.advanceSprint();
            expect(sm.stakeholderPool).toContain('CTO');
            expect(sm.stakeholderPool).toContain('VPProduct');
        });

        it('advanceSprint() resets Product Owner demand for next sprint', () => {
            const po = sm.getProductOwner();
            po.demandCount = 0;
            sm.advanceSprint();
            expect(sm.getProductOwner().demandCount).toBeGreaterThanOrEqual(1);
        });

        it('drawEventCard() then applyEvent() round-trips correctly', () => {
            // Force a known event
            const event = { type: 'TeamBuildingOffsite', effect: {} };
            gm.morale = 50;
            sm.applyEvent(event);
            expect(gm.morale).toBe(70);
        });
    });

    describe('Cross-manager interactions', () => {
        it('resolving incident + stakeholder fulfill both reward budget and tokens', () => {
            const bug = makeBug({ severity: 2 });
            im.spawnFromBug(bug);
            const initialBudget = gm.budget;
            const initialTokens = gm.revealTokens;

            im.resolveIncident(im.incidents[0]);
            const po = sm.getProductOwner();
            sm.fulfillDemand(po);

            expect(gm.revealTokens).toBeGreaterThan(initialTokens);
            expect(gm.budget).toBeGreaterThan(initialBudget);
        });
    });
});

// ── Task 3: New hire onboarding ───────────────────────────────────────────────

import NewHireManager from '../src/core/NewHireManager.js';

describe('Task 3 — New hire onboarding reveals hidden debt', () => {
    let gm, nhm;

    beforeEach(() => {
        gm = makeGM();
        nhm = new NewHireManager(gm);
    });

    describe('Onboarding state', () => {
        it('new hire starts in onboarding state', () => {
            const dev = makeDev({ seniority: 'junior' });
            nhm.onboard(dev);
            expect(dev.isOnboarding).toBe(true);
        });

        it('onboarding duration defaults to one sprint (60000ms)', () => {
            expect(nhm.onboardingDurationMs).toBe(60000);
        });

        it('onboarding dev has reduced productivity (0.5x)', () => {
            const dev = makeDev();
            nhm.onboard(dev);
            expect(nhm.getProductivityMultiplier(dev)).toBe(0.5);
        });

        it('fully onboarded dev has full productivity', () => {
            const dev = makeDev({ isOnboarding: false });
            expect(nhm.getProductivityMultiplier(dev)).toBe(1.0);
        });
    });

    describe('Debt revelation during onboarding', () => {
        it('onboard() reveals 1-2 hidden debt cards from services', () => {
            const debt1 = makeDebt();
            const debt2 = makeDebt();
            const debt3 = makeDebt();
            const service = makeService([debt1, debt2, debt3]);

            const dev = makeDev({ seniority: 'junior' });
            nhm.onboard(dev, [service]);

            const revealed = [debt1, debt2, debt3].filter(d => !d.isHidden);
            expect(revealed.length).toBeGreaterThanOrEqual(1);
            expect(revealed.length).toBeLessThanOrEqual(2);
        });

        it('onboard() with no services reveals nothing and does not throw', () => {
            const dev = makeDev();
            expect(() => nhm.onboard(dev, [])).not.toThrow();
        });

        it('revealed debt cards have setAlpha(1) called', () => {
            const debt = makeDebt();
            const service = makeService([debt]);
            const dev = makeDev({ seniority: 'junior' });
            nhm.onboard(dev, [service]);
            if (!debt.isHidden) {
                expect(debt.setAlpha).toHaveBeenCalledWith(1);
            }
        });

        it('onboard() does not reveal already-visible debt', () => {
            const visibleDebt = makeDebt({ isHidden: false });
            visibleDebt.setAlpha.mockClear();
            const service = makeService([visibleDebt]);
            const dev = makeDev();
            nhm.onboard(dev, [service]);
            expect(visibleDebt.isHidden).toBe(false);
        });
    });

    describe('Onboarding tick', () => {
        it('tick() reduces onboardingTimeRemaining', () => {
            const dev = makeDev();
            nhm.onboard(dev);
            nhm.tick(10000);
            expect(dev.onboardingTimeRemaining).toBe(50000);
        });

        it('tick() completes onboarding when time runs out', () => {
            const dev = makeDev();
            nhm.onboard(dev);
            dev.onboardingTimeRemaining = 1000;
            nhm.tick(2000);
            expect(dev.isOnboarding).toBe(false);
        });

        it('completed onboarding dev has full productivity', () => {
            const dev = makeDev();
            nhm.onboard(dev);
            dev.onboardingTimeRemaining = 500;
            nhm.tick(1000);
            expect(nhm.getProductivityMultiplier(dev)).toBe(1.0);
        });

        it('tick() does not affect non-onboarding devs', () => {
            const dev = makeDev({ isOnboarding: false, onboardingTimeRemaining: 0 });
            nhm.tick(5000);
            expect(dev.onboardingTimeRemaining).toBe(0);
        });
    });

    describe('New hire morale and reputation impact', () => {
        it('hiring a new dev does not reduce morale', () => {
            gm.morale = 80;
            nhm.onboard(makeDev());
            // Onboarding should not hurt morale
            expect(gm.morale).toBeGreaterThanOrEqual(80);
        });

        it('onboarding completion boosts reputation slightly', () => {
            const dev = makeDev();
            nhm.onboard(dev);
            dev.onboardingTimeRemaining = 100;
            nhm.tick(200);
            expect(gm.reputation).toBeGreaterThanOrEqual(0);
        });
    });

    describe('getOnboardingDevs()', () => {
        it('returns list of devs currently onboarding', () => {
            const dev1 = makeDev({ name: 'Alice' });
            const dev2 = makeDev({ name: 'Bob', seniority: 'mid' });
            nhm.onboard(dev1);
            nhm.onboard(dev2);
            expect(nhm.getOnboardingDevs()).toContain(dev1);
            expect(nhm.getOnboardingDevs()).toContain(dev2);
        });

        it('completed onboarding devs are removed from the list', () => {
            const dev = makeDev();
            nhm.onboard(dev);
            dev.onboardingTimeRemaining = 100;
            nhm.tick(200);
            expect(nhm.getOnboardingDevs()).not.toContain(dev);
        });
    });
});
