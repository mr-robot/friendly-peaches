import CardContainer from './CardContainer.js';

export default class ManagerCard extends CardContainer {
    constructor(scene, x, y, title) {
        super(scene, x, y, title);
        
        // Blue tint for managers
        this.bg.setTint(0x4169e1);
        
        // Management properties
        this.managementBonus = 1.5; // 50% speed boost for devs
        this.canShield = true; // Can protect from stakeholder interrupts
        this.stakeholderNegotiationPower = 1; // Base negotiation power
        
        // Managers are not draggable by default
        this.setInteractive(false);
    }
    
    applyToDev(devCard) {
        // Apply management bonus to a dev
        if (devCard.speedMultiplier) {
            devCard.speedMultiplier *= this.managementBonus;
        }
    }
    
    shieldFromInterrupt(interruptCard) {
        // Manager can shield team from stakeholder interrupts
        return this.canShield;
    }
}
