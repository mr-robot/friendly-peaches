import TicketCard from './TicketCard.js';

export default class BugCard extends TicketCard {
    constructor(scene, x, y, title, requirement = null) {
        super(scene, x, y, title, requirement);
        
        // Override visual style
        this.bg.setTint(0xff4444); // Red for bug
        
        // Add bug warning badge
        this.bugBadge = scene.add.text(0, -30, '⚠️ BUG', {
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#aa0000',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
        this.add(this.bugBadge);
    }
}