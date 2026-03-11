import { describe, it, expect, beforeEach, vi } from 'vitest';

import GameManager from '../src/core/GameManager.js';
import AuditManager from '../src/core/AuditManager.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDebt(overrides = {}) {
    return {
        constructor: { name: 'TechDebtCard' },
        title: 'Hidden Debt',
        isHidden: true,
        severity: 1,
        setAlpha: vi.fn(),
        setVisible: vi.fn(),
        attachedService: null,
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

function makeDev(overrides = {}) {
    return {
        constructor: { name: 'DevCard' },
        name: 'Alice',
        role: 'Backend',
        seniority: 'senior',
        currentTicket: null,
        ...overrides
    };
}

// ── Phase 5e: AuditManager ────────────────────────────────────────────────────

describe('Phase 5e — AuditManager', () => {
    let auditManager;
    let gameManager;

    beforeEach(() => {
        gameManager = new GameManager();
        auditManager = new AuditManager(gameManager);
    });

    describe('Audit eligibility', () => {
        it('canAudit(dev) returns true for senior devs', () => {
            const dev = makeDev({ seniority: 'senior' });
            expect(auditManager.canAudit(dev)).toBe(true);
        });

        it('canAudit(dev) returns false for junior devs', () => {
            const dev = makeDev({ seniority: 'junior' });
            expect(auditManager.canAudit(dev)).toBe(false);
        });

        it('canAudit(dev) returns false for mid-level devs', () => {
            const dev = makeDev({ seniority: 'mid' });
            expect(auditManager.canAudit(dev)).toBe(false);
        });

        it('canAudit(dev) returns false if dev is already on a ticket', () => {
            const dev = makeDev({ seniority: 'senior', currentTicket: { title: 'Some ticket' } });
            expect(auditManager.canAudit(dev)).toBe(false);
        });
    });

    describe('Conducting an audit', () => {
        it('audit() reveals 1-3 hidden debt cards on a service', () => {
            const debt1 = makeDebt();
            const debt2 = makeDebt();
            const debt3 = makeDebt();
            const debt4 = makeDebt();
            const service = makeService([debt1, debt2, debt3, debt4]);
            const dev = makeDev({ seniority: 'senior' });

            const revealed = auditManager.audit(dev, service);

            expect(revealed.length).toBeGreaterThanOrEqual(1);
            expect(revealed.length).toBeLessThanOrEqual(3);
        });

        it('audit() sets isHidden=false on revealed debt cards', () => {
            const debt1 = makeDebt();
            const debt2 = makeDebt();
            const service = makeService([debt1, debt2]);
            const dev = makeDev({ seniority: 'senior' });

            const revealed = auditManager.audit(dev, service);

            revealed.forEach(d => {
                expect(d.isHidden).toBe(false);
            });
        });

        it('audit() calls setAlpha(1) on revealed debt cards', () => {
            const debt1 = makeDebt();
            const service = makeService([debt1]);
            const dev = makeDev({ seniority: 'senior' });

            auditManager.audit(dev, service);

            expect(debt1.setAlpha).toHaveBeenCalledWith(1);
        });

        it('audit() on a service with no hidden debt returns empty array', () => {
            const visibleDebt = makeDebt({ isHidden: false });
            const service = makeService([visibleDebt]);
            const dev = makeDev({ seniority: 'senior' });

            const revealed = auditManager.audit(dev, service);
            expect(revealed).toHaveLength(0);
        });

        it('audit() does not reveal debt on services with no debt', () => {
            const service = makeService([]);
            const dev = makeDev({ seniority: 'senior' });
            const revealed = auditManager.audit(dev, service);
            expect(revealed).toHaveLength(0);
        });

        it('non-senior dev cannot audit (returns empty array)', () => {
            const debt = makeDebt();
            const service = makeService([debt]);
            const dev = makeDev({ seniority: 'junior' });

            const revealed = auditManager.audit(dev, service);
            expect(revealed).toHaveLength(0);
            expect(debt.isHidden).toBe(true);
        });
    });

    describe('Audit cost', () => {
        it('audit() locks the dev for the audit duration', () => {
            const dev = makeDev({ seniority: 'senior' });
            const service = makeService([makeDebt()]);
            auditManager.audit(dev, service);
            expect(dev.isAuditing).toBe(true);
        });

        it('audit cooldown defaults to 30 seconds', () => {
            expect(auditManager.auditDurationMs).toBe(30000);
        });

        it('tick(delta) reduces audit time on locked devs', () => {
            const dev = makeDev({ seniority: 'senior' });
            dev.isAuditing = true;
            dev.auditTimeRemaining = 30000;
            auditManager.trackAuditingDev(dev);
            auditManager.tick(5000);
            expect(dev.auditTimeRemaining).toBe(25000);
        });

        it('tick() unlocks dev when audit completes', () => {
            const dev = makeDev({ seniority: 'senior' });
            dev.isAuditing = true;
            dev.auditTimeRemaining = 1000;
            auditManager.trackAuditingDev(dev);
            auditManager.tick(2000);
            expect(dev.isAuditing).toBe(false);
        });
    });

    describe('Tech health impact', () => {
        it('auditing a service with hidden debt gives reputation bonus', () => {
            const initialRep = gameManager.reputation;
            const debt = makeDebt();
            const service = makeService([debt]);
            const dev = makeDev({ seniority: 'senior' });
            auditManager.audit(dev, service);
            expect(gameManager.reputation).toBeGreaterThan(initialRep);
        });

        it('audit with no hidden debt found gives no reputation bonus', () => {
            const initialRep = gameManager.reputation;
            const service = makeService([makeDebt({ isHidden: false })]);
            const dev = makeDev({ seniority: 'senior' });
            auditManager.audit(dev, service);
            expect(gameManager.reputation).toBe(initialRep);
        });
    });

    describe('AuditManager state', () => {
        it('starts with no auditing devs', () => {
            expect(auditManager.auditingDevs).toHaveLength(0);
        });

        it('trackAuditingDev() adds dev to the auditing list', () => {
            const dev = makeDev({ seniority: 'senior' });
            auditManager.trackAuditingDev(dev);
            expect(auditManager.auditingDevs).toContain(dev);
        });

        it('completed audits are removed from the auditing list', () => {
            const dev = makeDev({ seniority: 'senior' });
            dev.isAuditing = true;
            dev.auditTimeRemaining = 500;
            auditManager.trackAuditingDev(dev);
            auditManager.tick(1000);
            expect(auditManager.auditingDevs).not.toContain(dev);
        });
    });
});
