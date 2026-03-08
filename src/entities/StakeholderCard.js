import CardContainer from './CardContainer.js';

export default class StakeholderCard extends CardContainer {
    constructor(scene, x, y, type) {
        super(scene, x, y, type);
        
        // Gold tint to distinguish stakeholders from other cards
        this.bg.setTint(0xffd700);
        
        this.type = type;
        
        // Stakeholders can't be dragged by default
        this.setInteractive(false);
    }
}
