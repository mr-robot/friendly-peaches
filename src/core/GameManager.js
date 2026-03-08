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
        }
    }

    evaluateSprint(completedTickets, committedTickets) {
        if (this.state !== 'REVIEW') {
            return null;
        }

        const budgetEarned = completedTickets * this.ticketReward;
        const netBudget = budgetEarned - this.baseOperatingCost;
        
        this.budget += netBudget;

        return {
            completed: completedTickets,
            committed: committedTickets,
            budgetEarned: budgetEarned,
            operatingCost: this.baseOperatingCost,
            netBudget: netBudget
        };
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
        }
        this.morale = Math.min(100, this.morale + 5);
        if (isBug) {
            this.techHealth = Math.min(100, this.techHealth + 10);
        }
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
}