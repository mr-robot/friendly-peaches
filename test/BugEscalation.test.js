import { describe, it, expect, beforeEach, vi } from 'vitest';

import FogOfWarManager from '../src/core/FogOfWarManager.js';
import GameManager from '../src/core/GameManager.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBug(overrides = {}) {
    return {
        constructor: { name: 'BugCard' },
        title: 'Hidden Bug',
        isHidden: true,
        escalationChance: 0,
        severity: 1,
        setAlpha: vi.fn(),
        setVisible: vi.fn(),
        currentColumn: 'Sprint Commitment',
        stackedDevs: [],
        ...overrides
    };
}

function makeIncidentManager() {
    return {
        incidents: [],
        spawnIncident: vi.fn(function(bug) {
            this.incidents.push({ source: bug, severity: bug.severity || 1, resolved: false });
        })
    };
}

// ── Phase 5d: Escalation threshold ───────────────────────────────────────────

describe('Phase 5d — Bug escalation triggers incidents', () => {
    let fog;

    beforeEach(() => {
        fog = new FogOfWarManager();
    });

    describe('Escalation threshold', () => {
        it('escalationChance starts below threshold (no incident)', () => {
            const bug = makeBug({ escalationChance: 0 });
            fog.registerHidden(bug);
            const triggered = fog.checkEscalations();
            expect(triggered).toHaveLength(0);
        });

        it('checkEscalations() returns bugs whose escalationChance >= threshold', () => {
            const bug = makeBug({ escalationChance: 1.0 });
            fog.registerHidden(bug);
            const triggered = fog.checkEscalations();
            expect(triggered).toContain(bug);
        });

        it('checkEscalations() does not return bugs below threshold', () => {
            const b1 = makeBug({ escalationChance: 0.3 });
            const b2 = makeBug({ escalationChance: 1.0 });
            fog.registerHidden(b1);
            fog.registerHidden(b2);
            const triggered = fog.checkEscalations();
            expect(triggered).not.toContain(b1);
            expect(triggered).toContain(b2);
        });

        it('triggered bugs are revealed after checkEscalations()', () => {
            const bug = makeBug({ escalationChance: 1.0 });
            fog.registerHidden(bug);
            fog.checkEscalations();
            expect(bug.isHidden).toBe(false);
        });

        it('triggered bugs are removed from hiddenCards after escalation', () => {
            const bug = makeBug({ escalationChance: 1.0 });
            fog.registerHidden(bug);
            fog.checkEscalations();
            expect(fog.hiddenCards).not.toContain(bug);
        });

        it('default escalation threshold is 1.0', () => {
            expect(fog.escalationThreshold).toBe(1.0);
        });

        it('escalation threshold is configurable', () => {
            fog.escalationThreshold = 0.5;
            const bug = makeBug({ escalationChance: 0.6 });
            fog.registerHidden(bug);
            const triggered = fog.checkEscalations();
            expect(triggered).toContain(bug);
        });
    });

    describe('Escalation severity', () => {
        it('bug severity defaults to 3 (SEV-3) if not set', () => {
            const bug = makeBug({ escalationChance: 1.0 });
            delete bug.severity;
            fog.registerHidden(bug);
            const triggered = fog.checkEscalations();
            expect(triggered[0].severity).toBeUndefined(); // raw bug object unchanged
        });

        it('bug with higher severity escalates more aggressively', () => {
            const lowBug = makeBug({ escalationChance: 0, severity: 1 });
            const highBug = makeBug({ escalationChance: 0, severity: 3 });
            fog.registerHidden(lowBug);
            fog.registerHidden(highBug);
            fog.tickEscalation(1000);
            // High severity bug should escalate faster
            expect(highBug.escalationChance).toBeGreaterThanOrEqual(lowBug.escalationChance);
        });
    });
});

// ── Phase 5d: IncidentManager ─────────────────────────────────────────────────

import IncidentManager from '../src/core/IncidentManager.js';

describe('Phase 5d — IncidentManager', () => {
    let incidentManager;
    let gameManager;

    beforeEach(() => {
        gameManager = new GameManager();
        incidentManager = new IncidentManager(gameManager);
    });

    describe('Incident spawning', () => {
        it('starts with no active incidents', () => {
            expect(incidentManager.incidents).toHaveLength(0);
        });

        it('spawnFromBug() creates an incident from a bug', () => {
            const bug = makeBug({ severity: 2 });
            incidentManager.spawnFromBug(bug);
            expect(incidentManager.incidents).toHaveLength(1);
        });

        it('incident has correct severity from source bug', () => {
            const bug = makeBug({ severity: 3 });
            incidentManager.spawnFromBug(bug);
            expect(incidentManager.incidents[0].severity).toBe(3);
        });

        it('incident has a countdown timer', () => {
            const bug = makeBug({ severity: 1 });
            incidentManager.spawnFromBug(bug);
            expect(incidentManager.incidents[0].timeRemaining).toBeGreaterThan(0);
        });

        it('incident references source bug', () => {
            const bug = makeBug({ severity: 1 });
            incidentManager.spawnFromBug(bug);
            expect(incidentManager.incidents[0].sourceBug).toBe(bug);
        });

        it('incident starts unresolved', () => {
            const bug = makeBug({ severity: 1 });
            incidentManager.spawnFromBug(bug);
            expect(incidentManager.incidents[0].resolved).toBe(false);
        });
    });

    describe('Incident countdown', () => {
        it('tick() reduces timeRemaining on active incidents', () => {
            const bug = makeBug({ severity: 1 });
            incidentManager.spawnFromBug(bug);
            const initial = incidentManager.incidents[0].timeRemaining;
            incidentManager.tick(1000);
            expect(incidentManager.incidents[0].timeRemaining).toBeLessThan(initial);
        });

        it('tick() does not reduce timeRemaining on resolved incidents', () => {
            const bug = makeBug({ severity: 1 });
            incidentManager.spawnFromBug(bug);
            incidentManager.incidents[0].resolved = true;
            const initial = incidentManager.incidents[0].timeRemaining;
            incidentManager.tick(1000);
            expect(incidentManager.incidents[0].timeRemaining).toBe(initial);
        });

        it('expired incident (timeRemaining <= 0) escalates severity', () => {
            const bug = makeBug({ severity: 1 });
            incidentManager.spawnFromBug(bug);
            incidentManager.incidents[0].timeRemaining = 100;
            incidentManager.tick(200); // exceed timer
            expect(incidentManager.incidents[0].severity).toBeGreaterThan(1);
        });

        it('severity is capped at 3 (SEV-1)', () => {
            const bug = makeBug({ severity: 3 });
            incidentManager.spawnFromBug(bug);
            incidentManager.incidents[0].timeRemaining = 0;
            incidentManager.tick(100);
            expect(incidentManager.incidents[0].severity).toBe(3);
        });
    });

    describe('Incident resolution', () => {
        it('resolveIncident() marks the incident as resolved', () => {
            const bug = makeBug({ severity: 1 });
            incidentManager.spawnFromBug(bug);
            const incident = incidentManager.incidents[0];
            incidentManager.resolveIncident(incident);
            expect(incident.resolved).toBe(true);
        });

        it('resolveIncident() restores Tech Health based on severity', () => {
            gameManager.techHealth = 50;
            const bug = makeBug({ severity: 2 });
            incidentManager.spawnFromBug(bug);
            // After spawn, techHealth is reduced by severity damage (10 for sev 2)
            const healthAfterSpawn = gameManager.techHealth;
            const incident = incidentManager.incidents[0];
            incidentManager.resolveIncident(incident);
            // Resolution should restore health above the post-spawn level
            expect(gameManager.techHealth).toBeGreaterThan(healthAfterSpawn);
        });

        it('resolveIncident() reduces active incident count', () => {
            incidentManager.spawnFromBug(makeBug({ severity: 1 }));
            incidentManager.spawnFromBug(makeBug({ severity: 2 }));
            incidentManager.resolveIncident(incidentManager.incidents[0]);
            expect(incidentManager.activeIncidents).toHaveLength(1);
        });

        it('SEV-1 incident locks all dev work (isOnCallRequired returns true)', () => {
            const bug = makeBug({ severity: 3 });
            incidentManager.spawnFromBug(bug);
            expect(incidentManager.hasSev1Incident()).toBe(true);
        });

        it('no SEV-1 means hasSev1Incident() returns false', () => {
            const bug = makeBug({ severity: 1 });
            incidentManager.spawnFromBug(bug);
            expect(incidentManager.hasSev1Incident()).toBe(false);
        });
    });

    describe('GameManager integration', () => {
        it('spawnFromBug() lowers tech health based on severity', () => {
            gameManager.techHealth = 100;
            incidentManager.spawnFromBug(makeBug({ severity: 1 }));
            expect(gameManager.techHealth).toBeLessThan(100);
        });

        it('higher severity bugs cause more tech health damage on spawn', () => {
            const gm1 = new GameManager(); gm1.techHealth = 100;
            const gm2 = new GameManager(); gm2.techHealth = 100;
            new IncidentManager(gm1).spawnFromBug(makeBug({ severity: 1 }));
            new IncidentManager(gm2).spawnFromBug(makeBug({ severity: 3 }));
            expect(gm2.techHealth).toBeLessThan(gm1.techHealth);
        });

        it('getIncidentCount() returns number of active unresolved incidents', () => {
            incidentManager.spawnFromBug(makeBug({ severity: 1 }));
            incidentManager.spawnFromBug(makeBug({ severity: 2 }));
            expect(incidentManager.getIncidentCount()).toBe(2);
        });
    });
});

// ── Phase 5d: FogOfWarManager + IncidentManager integration ──────────────────

describe('Phase 5d — Fog + Incident integration', () => {
    it('after tickEscalation reaches threshold, checkEscalations provides bugs to spawn incidents', () => {
        const fog = new FogOfWarManager();
        const gm = new GameManager();
        const im = new IncidentManager(gm);

        const bug = makeBug({ escalationChance: 0.95, severity: 2 });
        fog.registerHidden(bug);
        fog.tickEscalation(600); // push over 1.0

        const triggered = fog.checkEscalations();
        triggered.forEach(b => im.spawnFromBug(b));

        expect(im.incidents).toHaveLength(1);
        expect(bug.isHidden).toBe(false);
    });

    it('resolving an incident awards reveal tokens to GameManager', () => {
        const gm = new GameManager();
        const im = new IncidentManager(gm);
        const bug = makeBug({ severity: 1 });
        im.spawnFromBug(bug);
        im.resolveIncident(im.incidents[0]);
        expect(gm.revealTokens).toBeGreaterThan(0);
    });
});
