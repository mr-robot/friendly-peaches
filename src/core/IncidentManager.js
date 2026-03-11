/**
 * IncidentManager
 *
 * Manages active incidents spawned from escalated hidden bugs.
 * Responsible for:
 *   - Spawning incidents from bugs when escalation threshold is reached
 *   - Ticking countdown timers and escalating severity when timers expire
 *   - Resolving incidents and restoring Tech Health
 *   - Reporting SEV-1 status (which locks dev work via on-call)
 */
export default class IncidentManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.incidents = [];

        // Tech health damage per severity level on spawn
        this.severityDamage = { 1: 5, 2: 10, 3: 20 };

        // Tech health restored on resolution per severity level
        this.severityRestore = { 1: 5, 2: 10, 3: 15 };

        // Countdown duration per severity level (ms)
        this.severityDuration = { 1: 30000, 2: 20000, 3: 10000 };
    }

    // ── Incident lifecycle ─────────────────────────────────────────────────────

    /**
     * Spawn an incident from an escalated bug.
     * Damages tech health immediately.
     */
    spawnFromBug(bug) {
        const severity = bug.severity || 1;
        const incident = {
            sourceBug: bug,
            severity,
            timeRemaining: this.severityDuration[severity] ?? 20000,
            resolved: false
        };

        this.incidents.push(incident);

        // Immediate tech health hit
        const damage = this.severityDamage[severity] ?? 10;
        this.gameManager.techHealth = Math.max(0, this.gameManager.techHealth - damage);

        // Notify GameManager if it tracks this
        if (typeof this.gameManager.handleBugSpawned === 'function') {
            // Already deducted above — skip double-deduct
        }
    }

    /**
     * Tick all active incident timers by deltaMs.
     * Expired incidents escalate in severity.
     */
    tick(deltaMs) {
        this.incidents.forEach(incident => {
            if (incident.resolved) return;

            incident.timeRemaining -= deltaMs;

            if (incident.timeRemaining <= 0) {
                // Escalate severity (cap at 3)
                if (incident.severity < 3) {
                    incident.severity = Math.min(3, incident.severity + 1);
                    // Reset timer at new severity
                    incident.timeRemaining = this.severityDuration[incident.severity] ?? 10000;
                    // Extra tech health damage on escalation
                    const extraDamage = this.severityDamage[incident.severity] ?? 10;
                    this.gameManager.techHealth = Math.max(0, this.gameManager.techHealth - extraDamage);
                } else {
                    // Already SEV-1 (severity 3), clamp to 0
                    incident.timeRemaining = 0;
                }
            }
        });
    }

    /**
     * Resolve an incident, restoring tech health and awarding tokens.
     */
    resolveIncident(incident) {
        if (incident.resolved) return;
        incident.resolved = true;

        const restore = this.severityRestore[incident.severity] ?? 5;
        this.gameManager.techHealth = Math.min(100, this.gameManager.techHealth + restore);

        // Award reveal tokens for resolving incidents (encourages visibility)
        const tokenReward = incident.severity; // SEV-1→3 tokens, SEV-3(sev1)→1 token
        this.gameManager.revealTokens = (this.gameManager.revealTokens || 0) + tokenReward;
    }

    // ── Queries ────────────────────────────────────────────────────────────────

    get activeIncidents() {
        return this.incidents.filter(i => !i.resolved);
    }

    getIncidentCount() {
        return this.activeIncidents.length;
    }

    /**
     * SEV-1 in game terms = severity 3 (most severe). Locks dev feature work.
     */
    hasSev1Incident() {
        return this.activeIncidents.some(i => i.severity === 3);
    }
}
