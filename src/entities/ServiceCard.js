import CardContainer from './CardContainer.js';

export default class ServiceCard extends CardContainer {
    constructor(scene, x, y, title) {
        super(scene, x, y, title);
        
        // Purple tint to distinguish services from tickets and devs
        this.bg.setTint(0x8844ff); 
        
        // For later: tracking tech debt cards attached to this service
        this.debtCards = [];
        
        // Optionally resize to make them distinct from standard cards
        // this.setSize(120, 100); 
    }
}
