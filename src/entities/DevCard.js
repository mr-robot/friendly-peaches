import CardContainer from './CardContainer.js';
export default class DevCard extends CardContainer {
    constructor(scene, x, y, name) {
        super(scene, x, y, name);
        this.bg.setTint(0x4488ff); // Blue for dev
        this.currentTicket = null;
    }
}