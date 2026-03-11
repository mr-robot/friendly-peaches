/**
 * StakeholderManager
 *
 * Manages the stakeholder system: Product Owner (always present),
 * periodic stakeholders (CTO, CFO, VP of Product), mid-sprint events,
 * and the push-back mechanic with political capital tracking.
 */
export default class StakeholderManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.politicalCapitalSpent = 0;
        this.periodicStakeholders = [];

        // Event deck — drawn each sprint
        this.eventDeck = [
            'AllHandsMeeting', 'ScopeCreep', 'HiringFreeze',
            'InvestorDemo', 'TeamBuildingOffsite', 'PoachingAttempt'
        ];

        // Stakeholder pool unlocked by sprint number
        this.stakeholderPool = [];

        // Always start with a Product Owner
        this.activeStakeholders = [this._createProductOwner()];
    }

    // ── Internal factories ─────────────────────────────────────────────────────

    _createProductOwner() {
        return {
            type: 'ProductOwner',
            demandType: 'features',
            demandCount: Math.floor(Math.random() * 3) + 1,
            pressureLevel: 0,
            resolved: false,
            dueInSprints: 1
        };
    }

    _createStakeholder(type) {
        const demandMap = {
            CTO: 'infrastructure',
            CFO: 'budget',
            VPProduct: 'pivot'
        };
        return {
            type,
            demandType: demandMap[type] || 'generic',
            demandCount: 1,
            pressureLevel: 0,
            resolved: false,
            dueInSprints: 1
        };
    }

    // ── Queries ────────────────────────────────────────────────────────────────

    getProductOwner() {
        return this.activeStakeholders.find(s => s.type === 'ProductOwner');
    }

    // ── Demand management ──────────────────────────────────────────────────────

    fulfillDemand(stakeholder) {
        stakeholder.pressureLevel = Math.max(0, stakeholder.pressureLevel - 20);
        stakeholder.resolved = true;
        // Budget reward for satisfying stakeholder
        this.gameManager.budget += 1000;
    }

    ignoreDemand(stakeholder) {
        stakeholder.pressureLevel += 25;
        // Reputation hit for repeated ignoring
        if (stakeholder.pressureLevel >= 50) {
            this.gameManager.reputation = Math.max(0, this.gameManager.reputation - 10);
        }
    }

    // ── Periodic stakeholder spawning ──────────────────────────────────────────

    spawnPeriodicStakeholder(type) {
        const stakeholder = this._createStakeholder(type);
        this.activeStakeholders.push(stakeholder);
        this.periodicStakeholders.push(stakeholder);
        return stakeholder;
    }

    // ── Sprint lifecycle ────────────────────────────────────────────────────────

    advanceSprint() {
        const sprint = this.gameManager.currentSprint;

        // Unlock periodic stakeholders progressively
        if (sprint >= 4 && !this.stakeholderPool.includes('CTO')) {
            this.stakeholderPool.push('CTO');
        }
        if (sprint >= 4 && !this.stakeholderPool.includes('VPProduct')) {
            this.stakeholderPool.push('VPProduct');
        }
        if (sprint >= 6 && !this.stakeholderPool.includes('CFO')) {
            this.stakeholderPool.push('CFO');
        }

        // Remove resolved periodic stakeholders
        this.activeStakeholders = this.activeStakeholders.filter(s => {
            if (s.type === 'ProductOwner') return true;
            return !s.resolved;
        });
        this.periodicStakeholders = this.periodicStakeholders.filter(s => !s.resolved);

        // Reset Product Owner for new sprint
        const po = this.getProductOwner();
        if (po) {
            po.demandCount = Math.floor(Math.random() * 3) + 1;
            po.pressureLevel = 0;
            po.resolved = false;
            po.dueInSprints = 1;
        }
    }

    // ── Events ─────────────────────────────────────────────────────────────────

    drawEventCard() {
        const type = this.eventDeck[Math.floor(Math.random() * this.eventDeck.length)];
        return { type, effect: {} };
    }

    applyEvent(event) {
        const gm = this.gameManager;
        switch (event.type) {
            case 'AllHandsMeeting':
                gm.morale = Math.max(0, gm.morale - 5);
                break;
            case 'TeamBuildingOffsite':
                gm.morale = Math.min(100, gm.morale + 20);
                break;
            case 'HiringFreeze':
                gm.hiringFrozen = true;
                break;
            case 'InvestorDemo':
                gm.activeDemo = { dueInSprints: 2, reward: 5000 };
                break;
            case 'ScopeCreep': {
                const po = this.getProductOwner();
                if (po) po.demandCount += 1;
                break;
            }
            case 'PoachingAttempt':
                gm.poachingTarget = { role: 'senior', offerExpiresSprints: 1 };
                break;
        }
    }

    // ── Push-back mechanic ─────────────────────────────────────────────────────

    pushBack(stakeholder) {
        this.politicalCapitalSpent += 1;
        stakeholder.dueInSprints = (stakeholder.dueInSprints || 1) + 1;

        // Trigger "Leadership Has Concerns" after too much pushback
        if (this.politicalCapitalSpent >= 3) {
            this.gameManager.leadershipConcerned = true;
        }

        // Extra reputation penalty if leadership is already watching
        if (this.gameManager.leadershipConcerned) {
            this.gameManager.reputation = Math.max(0, this.gameManager.reputation - 15);
        }
    }
}
