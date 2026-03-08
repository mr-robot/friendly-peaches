import StakeholderCard from './StakeholderCard.js';

export default class ProductOwnerCard extends StakeholderCard {
    constructor(scene, x, y) {
        super(scene, x, y, 'Product Owner');
        
        // Product Owner specific properties
        this.ticketBacklog = [];
        this.demands = [];
    }
}
