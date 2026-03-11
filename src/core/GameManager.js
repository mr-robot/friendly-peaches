export default class GameManager {
    constructor() {
        this.budget = 10000;
        this.techHealth = 100;
        this.morale = 100;
        this.sprintTime = 60;
        this.state = 'PLANNING';
        this.devCostPerSecond = 10;
        this.ticketReward = 2000;
        this.baseOperatingCost = 5000; // Base cost per sprint
        this.sprintCommitments = [];
        this.currentSprint = 1;
        this.reputation = 0;
        this.maxReputation = 1000;
        this.escapeThreshold = 500;
        // Reveal tokens — earned by completing tickets, spent to reveal hidden cards
        this.revealTokens = 0;
    }

    startSprint() {
        if (this.state === 'PLANNING') {
            this.state = 'ACTIVE';
        }
    }

    startNextSprint() {
        if (this.state === 'REVIEW') {
            this.state = 'PLANNING';
            this.sprintTime = 60;
            this.revealTokens = 0;
        }
    }

    evaluateSprint() {
        const completed = this.sprintCommitments.filter(ticket => 
            ticket.currentColumn === 'Done'
        );
        const missed = this.sprintCommitments.filter(ticket => 
            ticket.currentColumn !== 'Done'
        );
        
        // Rewards: +1000 budget per completed commitment
        this.budget += completed.length * 1000;
        
        // Penalties: -500 budget per missed commitment
        this.budget -= missed.length * 500;
        
        // Clear commitments for next sprint
        this.sprintCommitments = [];
        this.currentSprint++;
    }

    tick(deltaMs, stats = { activeDevs: 0 }) {
        if (this.state !== 'ACTIVE') return;

        const deltaSec = deltaMs / 1000;
        
        // Decrease timer
        this.sprintTime = Math.max(0, this.sprintTime - deltaSec);
        if (this.sprintTime === 0) {
            this.state = 'REVIEW';
            return;
        }

        // Decrease budget based on active devs
        const cost = stats.activeDevs * this.devCostPerSecond * deltaSec;
        this.budget -= cost;
    }

    completeTicket(ticket) {
        const isBug = ticket && ticket.constructor && ticket.constructor.name === 'BugCard';
        if (!isBug) {
            this.budget += this.ticketReward;
            // Award 1 reveal token for completing a regular ticket
            this.revealTokens += 1;
        } else {
            // Award 2 reveal tokens for resolving a bug — better visibility earned
            this.revealTokens += 2;
            this.techHealth = Math.min(100, this.techHealth + 10);
        }
        this.morale = Math.min(100, this.morale + 5);
    }

    // ── Reveal token API ───────────────────────────────────────────────────────

    canSpendRevealToken() {
        return this.revealTokens > 0;
    }

    spendRevealToken() {
        if (this.revealTokens <= 0) return;
        this.revealTokens -= 1;
    }

    handleDevBreakdown() {
        this.morale = Math.max(0, this.morale - 10);
        if (this.morale === 0) {
            this.state = 'GAME_OVER';
        }
    }

    getMoraleMultiplier() {
        if (this.morale < 30) {
            return 0.7;
        }
        return 1.0;
    }
    handleBugSpawned() {
        this.techHealth = Math.max(0, this.techHealth - 10);
        if (this.techHealth === 0) {
            this.state = 'GAME_OVER';
        }
    }

    isOnCallRequired() {
        return this.techHealth < 25;
    }

    endSprint() {
        this.state = 'REVIEW';
        this.evaluateSprint();
    }

    addSprintCommitment(ticket) {
        this.sprintCommitments.push(ticket);
    }

    removeSprintCommitment(ticket) {
        const index = this.sprintCommitments.indexOf(ticket);
        if (index > -1) {
            this.sprintCommitments.splice(index, 1);
        }
    }

    addReputation(amount) {
        this.reputation = Math.min(this.maxReputation, this.reputation + amount);
    }

    subtractReputation(amount) {
        this.reputation = Math.max(0, this.reputation - amount);
    }

    canEscape() {
        return this.reputation >= this.escapeThreshold;
    }
}