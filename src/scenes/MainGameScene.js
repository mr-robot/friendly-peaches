import Phaser from 'phaser';
import BoardController from '../controllers/BoardController.js';
import DevCard from '../entities/DevCard.js';
import TicketCard from '../entities/TicketCard.js';
import GameManager from '../core/GameManager.js';
import IncidentManager from '../core/IncidentManager.js';
import AuditManager from '../core/AuditManager.js';
import StakeholderManager from '../core/StakeholderManager.js';
import NewHireManager from '../core/NewHireManager.js';

export default class MainGameScene extends Phaser.Scene {
    constructor() {
        super('MainGameScene');
        this.gameManager = new GameManager();
        this.incidentManager = new IncidentManager(this.gameManager);
        this.auditManager = new AuditManager(this.gameManager);
        this.stakeholderManager = new StakeholderManager(this.gameManager);
        this.newHireManager = new NewHireManager(this.gameManager);
        this.previousState = null;
    }

    create() {
        this.scene.launch('UIScene');

        this.boardController = new BoardController(this);
        this.boardController.createColumns();
        
        // Populate Product Backlog with tickets for planning
        this.boardController.populateProductBacklog(5);
        
        this.boardController.setupInteractions();

        // Create a test TicketCard in Sprint Commitment requiring a Frontend dev
        const ticket = new TicketCard(this, 100, 300, "Fix Bug #123", "Frontend");
        this.add.existing(ticket);
        ticket.currentColumn = 'Sprint Commitment';
        this.boardController.tickets.push(ticket);

        // Create test DevCards — Alice is senior, Bob is mid
        const dev1 = new DevCard(this, 300, 500, "Alice", "Frontend");
        dev1.seniority = 'senior';
        dev1.isOnboarding = false;
        this.add.existing(dev1);
        this.boardController.devs.push(dev1);
        
        const dev2 = new DevCard(this, 500, 500, "Bob", "Backend");
        dev2.seniority = 'mid';
        dev2.isOnboarding = false;
        this.add.existing(dev2);
        this.boardController.devs.push(dev2);
        
        // Draw and apply opening sprint event
        const openingEvent = this.stakeholderManager.drawEventCard();
        this.stakeholderManager.applyEvent(openingEvent);

        // Initialize state
        this.handleStateChange();
    }
    
    handleStateChange() {
        const currentState = this.gameManager.state;
        
        // Only act when state actually changes
        if (this.previousState === currentState) return;
        
        console.log(`State transition: ${this.previousState} -> ${currentState}`);
        
        switch (currentState) {
            case 'PLANNING':
                this.boardController.handleStateTransition('PLANNING');
                // Reset fog + incidents for new sprint
                this.boardController.fogOfWar.reset();
                this.incidentManager.incidents = [];
                // Advance stakeholder sprint
                this.stakeholderManager.advanceSprint();
                break;
                
            case 'ACTIVE':
                this.boardController.handleStateTransition('ACTIVE');
                // Draw and apply a mid-sprint event
                const sprintEvent = this.stakeholderManager.drawEventCard();
                this.stakeholderManager.applyEvent(sprintEvent);
                console.log(`Sprint event: ${sprintEvent.type}`);
                break;
                
            case 'REVIEW':
                this.boardController.handleStateTransition('REVIEW');
                // Reveal all remaining hidden bugs at sprint end
                this.boardController.fogOfWar.revealAll();
                
                // Remove Done cards
                this.boardController.tickets = this.boardController.tickets.filter(ticket => {
                    if (ticket.currentColumn === 'Done') {
                        if (typeof ticket.destroy === 'function') {
                            ticket.destroy();
                        }
                        return false;
                    }
                    return true;
                });
                
                this.evaluateSprint();
                break;
        }
        
        this.previousState = currentState;
    }
    
    evaluateSprint() {
        // Count completed and committed tickets
        const completedTickets = this.boardController.tickets.filter(t => t.currentColumn === 'Done').length;
        const committedTickets = this.boardController.tickets.length; // All tickets on board are committed
        
        console.log(`Sprint Review: ${completedTickets}/${committedTickets} tickets completed`);
        
        // Evaluate sprint with GameManager
        const result = this.gameManager.evaluateSprint(completedTickets, committedTickets);
        if (result) {
            console.log('Sprint result:', result);
            
            // Show review overlay in UI
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.showSprintReview) {
                uiScene.showSprintReview(result);
            }
        }
    }
    
    update(time, delta) {
        // Check for state transitions
        this.handleStateChange();

        // Calculate total active devs across all tickets for budget drain
        let activeDevs = 0;
        this.boardController.tickets.forEach(t => {
            if (t.currentColumn !== 'Done') {
                activeDevs += t.stackedDevs.length;
            }
        });

        this.gameManager.tick(delta, { activeDevs });

        // Only allow work if sprint is active
        if (this.gameManager.state === 'ACTIVE') {
            this.boardController.update(time, delta);

            // Tick fog escalation and check for incident triggers
            this.boardController.tickFog(delta);
            const escalated = this.boardController.fogOfWar.checkEscalations();
            escalated.forEach(bug => this.incidentManager.spawnFromBug(bug));

            // Tick active incidents
            this.incidentManager.tick(delta);

            // Tick audit timers
            this.auditManager.tick(delta);

            // Tick new hire onboarding
            this.newHireManager.tick(delta);

            // Override on-call if a SEV-1 incident is active
            if (this.incidentManager.hasSev1Incident()) {
                this.gameManager.techHealth = Math.min(this.gameManager.techHealth, 24);
            }
        } else {
            // Stop particles/breathing if not active
            this.boardController.tickets.forEach(t => {
                if (typeof t.stopParticles === 'function') t.stopParticles();
                t.stackedDevs.forEach(d => {
                    if (typeof d.stopBreathing === 'function') d.stopBreathing();
                });
            });
        }

        // Check if ticket just completed (slider logic is in boardController, but we need to hook into it)
        // For MVP, we can check if it's in Done and hasn't been rewarded yet
        this.boardController.tickets.forEach(t => {
            if (t.currentColumn === 'Done' && !t.rewarded) {
                t.rewarded = true;
                this.gameManager.completeTicket(t);
                
                // If it's a bug, resolve associated incidents
                if (t.type === 'BugCard') {
                    const relatedIncident = this.incidentManager.activeIncidents.find(i => i.sourceBug === t);
                    if (relatedIncident) {
                        this.incidentManager.resolveIncident(relatedIncident);
                    }
                }
            }
        });

        // Update UI
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.updateUI) {
            uiScene.updateUI(this.gameManager, {
                incidents: this.incidentManager.activeIncidents,
                stakeholder: this.stakeholderManager.getProductOwner(),
                onboardingDevs: this.newHireManager.getOnboardingDevs()
            });
        }
    }
}