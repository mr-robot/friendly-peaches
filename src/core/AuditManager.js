/**
 * AuditManager
 *
 * Manages the audit mechanic: senior devs can stack on a Service card
 * to flip 1-3 hidden debt cards face-up without triggering them.
 * This lets players identify and prioritise debt paydown proactively.
 */
export default class AuditManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.auditingDevs = [];
        this.auditDurationMs = 30000; // 30 seconds to audit a service
        this.reputationRewardPerDebt = 5; // rep earned per debt card revealed
    }

    // ── Eligibility ────────────────────────────────────────────────────────────

    /**
     * Only senior devs who are not already on a ticket can audit.
     */
    canAudit(dev) {
        return dev.seniority === 'senior' && !dev.currentTicket;
    }

    // ── Conducting an audit ────────────────────────────────────────────────────

    /**
     * Perform an audit of a service with a senior dev.
     * Reveals 1-3 hidden debt cards. Does nothing if dev is ineligible.
     * Returns the array of revealed debt cards.
     */
    audit(dev, service) {
        if (!this.canAudit(dev)) return [];

        const hiddenDebt = (service.debtCards || []).filter(d => d.isHidden);
        if (hiddenDebt.length === 0) return [];

        // Reveal between 1 and min(3, hiddenDebt.length) cards
        const revealCount = Math.min(hiddenDebt.length, Math.floor(Math.random() * 3) + 1);
        const toReveal = hiddenDebt.slice(0, revealCount);

        toReveal.forEach(debt => {
            debt.isHidden = false;
            debt.setAlpha(1);
        });

        // Lock the dev for the audit duration
        dev.isAuditing = true;
        dev.auditTimeRemaining = this.auditDurationMs;
        this.trackAuditingDev(dev);

        // Reputation reward for proactive discovery
        const repGain = toReveal.length * this.reputationRewardPerDebt;
        this.gameManager.reputation = Math.min(
            this.gameManager.maxReputation,
            this.gameManager.reputation + repGain
        );

        return toReveal;
    }

    // ── Auditing dev tracking ──────────────────────────────────────────────────

    trackAuditingDev(dev) {
        if (!this.auditingDevs.includes(dev)) {
            this.auditingDevs.push(dev);
        }
    }

    /**
     * Tick audit timers. Unlock devs when their audit completes.
     */
    tick(deltaMs) {
        this.auditingDevs.forEach(dev => {
            if (!dev.isAuditing) return;
            dev.auditTimeRemaining = Math.max(0, dev.auditTimeRemaining - deltaMs);
            if (dev.auditTimeRemaining <= 0) {
                dev.isAuditing = false;
            }
        });

        // Remove completed auditors
        this.auditingDevs = this.auditingDevs.filter(d => d.isAuditing);
    }
}
