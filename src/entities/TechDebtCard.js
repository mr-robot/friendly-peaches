import CardContainer from './CardContainer.js';

export default class TechDebtCard extends CardContainer {
    constructor(scene, x, y, title) {
        super(scene, x, y, title);
        
        this.isFaceDown = true;
        this.impact = 10; // Tech Health impact when revealed
        this.serviceAttached = null; // Which service this debt is attached to
        
        // Dark red tint for debt cards
        this.bg.setTint(0x8b0000);
        
        // Hide when face-down
        this.setVisible(false);
        
        // Debt cards are not interactive by default
        this.setInteractive(false);
    }
    
    flipFaceUp() {
        this.isFaceDown = false;
        this.setVisible(true);
        this.bg.setTint(0xff4444); // Brighter red when revealed
    }
    
    flipFaceDown() {
        this.isFaceDown = true;
        this.setVisible(false);
        this.bg.setTint(0x8b0000);
    }
    
    attachToService(serviceCard) {
        this.serviceAttached = serviceCard;
        serviceCard.debtCards.push(this);
    }
}
