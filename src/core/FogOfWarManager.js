/**
 * FogOfWarManager
 *
 * Manages the hidden/revealed state of cards (TicketCard, BugCard) on the board.
 * Responsible for:
 *   - Tracking which cards are hidden
 *   - Revealing cards (individually, by token spend, or all at once)
 *   - Applying visual alpha state to hidden/visible cards
 *   - Ticking escalation chance for hidden bugs over time
 *   - Managing reveal tokens earned from completed work
 */
export default class FogOfWarManager {
    constructor() {
        this.hiddenCards = [];
        this.revealTokens = 0;

        // How fast escalationChance grows per millisecond for hidden bugs
        this.escalationRatePerMs = 0.0001; // reaches ~1.0 after ~10 seconds

        // Threshold at which a hidden bug triggers an incident
        this.escalationThreshold = 1.0;
    }

    // ── Hidden card registry ───────────────────────────────────────────────────

    get hiddenCount() {
        return this.hiddenCards.length;
    }

    /**
     * Register a card as hidden. Only adds cards that are actually hidden.
     */
    registerHidden(card) {
        if (!card.isHidden) return;
        if (!this.hiddenCards.includes(card)) {
            this.hiddenCards.push(card);
        }
    }

    // ── Reveal mechanics ───────────────────────────────────────────────────────

    /**
     * Reveal a card unconditionally (e.g. triggered by game events).
     */
    reveal(card) {
        card.isHidden = false;
        card.setAlpha(1);

        // Reset escalation risk on reveal
        if (card.escalationChance !== undefined) {
            card.escalationChance = 0;
        }

        this.hiddenCards = this.hiddenCards.filter(c => c !== card);
    }

    /**
     * Reveal all currently hidden cards (e.g. sprint end, audit).
     */
    revealAll() {
        [...this.hiddenCards].forEach(card => this.reveal(card));
    }

    /**
     * Spend one reveal token to reveal a card. Does nothing if no tokens available.
     */
    revealWithToken(card) {
        if (this.revealTokens <= 0) return;
        this.revealTokens -= 1;
        this.reveal(card);
    }

    // ── Token system ───────────────────────────────────────────────────────────

    canReveal() {
        return this.revealTokens > 0;
    }

    addRevealTokens(n) {
        this.revealTokens += n;
    }

    // ── Visual state ───────────────────────────────────────────────────────────

    /**
     * Apply the correct alpha to a card based on its hidden state.
     * Call this after registering hidden cards or after reveals.
     */
    applyVisualState(card) {
        if (card.isHidden) {
            card.setAlpha(0.3);
        } else {
            card.setAlpha(1);
        }
    }

    /**
     * Return the info that should be displayed for a card.
     * Hidden cards show masked info; visible cards show full info.
     */
    getDisplayedInfo(card) {
        if (card.isHidden) {
            return {
                title: '???',
                requirement: undefined,
                quality: undefined
            };
        }
        return {
            title: card.title,
            requirement: card.requirement,
            quality: card.quality
        };
    }

    // ── Escalation ─────────────────────────────────────────────────────────────

    /**
     * Advance escalation chance for all hidden bugs by deltaMs milliseconds.
     * Higher severity bugs escalate faster (severity multiplier).
     * Only cards with escalationChance defined are affected.
     */
    tickEscalation(deltaMs) {
        this.hiddenCards.forEach(card => {
            if (card.escalationChance !== undefined) {
                const severityMultiplier = card.severity || 1;
                card.escalationChance = Math.min(
                    1.0,
                    card.escalationChance + this.escalationRatePerMs * deltaMs * severityMultiplier
                );
            }
        });
    }

    /**
     * Check all hidden cards for escalation threshold breach.
     * Returns array of cards that have triggered (and reveals them).
     * Callers should pass triggered cards to IncidentManager.spawnFromBug().
     */
    checkEscalations() {
        const triggered = this.hiddenCards.filter(
            card => card.escalationChance !== undefined &&
                    card.escalationChance >= this.escalationThreshold
        );
        triggered.forEach(card => this.reveal(card));
        return triggered;
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────────

    /**
     * Reset all state (e.g. at the start of a new sprint).
     */
    reset() {
        this.hiddenCards = [];
        this.revealTokens = 0;
    }
}
