export default class GameManager {
    constructor() {
        this.budget = 10000;
        this.morale = 100;
        this.sprintTime = 60;
        this.state = 'PLANNING';
        this.devCostPerSecond = 10;
        this.ticketReward = 2000;
    }

    startSprint() {
        if (this.state === 'PLANNING') {
            this.state = 'ACTIVE';
        }
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

    completeTicket() {
        this.budget += this.ticketReward;
    }
}