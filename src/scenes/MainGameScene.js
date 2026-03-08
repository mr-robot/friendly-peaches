import Phaser from 'phaser';
import BoardController from '../controllers/BoardController.js';
import DevCard from '../entities/DevCard.js';
import TicketCard from '../entities/TicketCard.js';
import GameManager from '../core/GameManager.js';

export default class MainGameScene extends Phaser.Scene {
    constructor() {
        super('MainGameScene');
        this.gameManager = new GameManager();
        this.previousState = null;
    }
    create() {
        this.scene.launch('UIScene');

        this.boardController = new BoardController(this);
        this.boardController.createColumns();
        
        // Populate Icebox with 5 tickets
        this.boardController.populateIcebox(5);
        
        this.boardController.setupInteractions();

        // Create a test TicketCard in Backlog requiring a Frontend dev
        const ticket = new TicketCard(this, 100, 300, "Fix Bug #123", "Frontend");
        this.add.existing(ticket);
        this.boardController.tickets.push(ticket);

        // Create test DevCards with different roles
        const dev1 = new DevCard(this, 300, 500, "Alice", "Frontend");
        this.add.existing(dev1);
        this.boardController.devs.push(dev1);
        
        const dev2 = new DevCard(this, 500, 500, "Bob", "Backend");
        this.add.existing(dev2);
        this.boardController.devs.push(dev2);
        
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
                // Show Icebox for planning
                this.boardController.showIcebox();
                break;
                
            case 'ACTIVE':
                // Hide Icebox during sprint
                this.boardController.hideIcebox();
                break;
                
            case 'REVIEW':
                // Hide Icebox and prepare for review
                this.boardController.hideIcebox();
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
            }
        });

        // Update UI
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.updateUI) {
            uiScene.updateUI(this.gameManager);
        }
    }
}