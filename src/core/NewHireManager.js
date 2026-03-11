/**
 * NewHireManager
 *
 * Manages the new hire onboarding mechanic:
 * - New devs spend their first sprint onboarding (reduced productivity)
 * - Fresh eyes reveal 1-2 hidden debt cards from services
 * - Completing onboarding grants a small reputation boost
 */
export default class NewHireManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.onboardingDevs = [];
        this.onboardingDurationMs = 60000; // one full sprint
        this.productivityDuringOnboarding = 0.5;
        this.maxDebtRevealOnJoin = 2;
    }

    // ── Onboarding ─────────────────────────────────────────────────────────────

    /**
     * Begin onboarding a new dev. Reveals 1-2 hidden debt cards from services.
     * @param {object} dev - The new DevCard being hired
     * @param {object[]} services - Array of ServiceCards to scan for hidden debt
     */
    onboard(dev, services = []) {
        dev.isOnboarding = true;
        dev.onboardingTimeRemaining = this.onboardingDurationMs;
        dev.sprintsOnTeam = (dev.sprintsOnTeam || 0);

        if (!this.onboardingDevs.includes(dev)) {
            this.onboardingDevs.push(dev);
        }

        // Fresh eyes — reveal 1-2 hidden debt cards across all services
        this._revealDebt(services);
    }

    _revealDebt(services) {
        // Collect all hidden debt across all services
        const allHiddenDebt = [];
        services.forEach(service => {
            (service.debtCards || []).forEach(debt => {
                if (debt.isHidden) allHiddenDebt.push(debt);
            });
        });

        if (allHiddenDebt.length === 0) return;

        // Reveal 1 to min(maxDebtRevealOnJoin, available) cards at random
        const revealCount = Math.min(
            allHiddenDebt.length,
            Math.floor(Math.random() * this.maxDebtRevealOnJoin) + 1
        );

        // Shuffle and take the first revealCount
        const shuffled = [...allHiddenDebt].sort(() => Math.random() - 0.5);
        shuffled.slice(0, revealCount).forEach(debt => {
            debt.isHidden = false;
            debt.setAlpha(1);
        });
    }

    // ── Productivity ───────────────────────────────────────────────────────────

    getProductivityMultiplier(dev) {
        return dev.isOnboarding ? this.productivityDuringOnboarding : 1.0;
    }

    // ── Tick ───────────────────────────────────────────────────────────────────

    tick(deltaMs) {
        this.onboardingDevs.forEach(dev => {
            if (!dev.isOnboarding) return;
            dev.onboardingTimeRemaining = Math.max(0, dev.onboardingTimeRemaining - deltaMs);
            if (dev.onboardingTimeRemaining <= 0) {
                dev.isOnboarding = false;
                dev.sprintsOnTeam = (dev.sprintsOnTeam || 0) + 1;
                // Small reputation boost for successfully onboarding a dev
                this.gameManager.reputation = Math.min(
                    this.gameManager.maxReputation,
                    this.gameManager.reputation + 5
                );
            }
        });

        // Remove completed onboarders
        this.onboardingDevs = this.onboardingDevs.filter(d => d.isOnboarding);
    }

    // ── Queries ────────────────────────────────────────────────────────────────

    getOnboardingDevs() {
        return this.onboardingDevs;
    }
}
