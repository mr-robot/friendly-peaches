import CardContainer from './CardContainer.js';
export default class TicketCard extends CardContainer {
    constructor(scene, x, y, title) {
        super(scene, x, y, title);
        this.bg.setTint(0xffaa44); // Orange for ticket
        this.progress = 0;
        this.maxProgress = 100;
        
        this.progressBar = scene.add.graphics();
        this.add(this.progressBar);
        this.updateProgressVisual();
        
        this.stackedDevs = [];
        this.currentColumn = 'Backlog';
    }
    
    updateProgressVisual() {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x00ff00, 1);
        const width = 80;
        const fill = (this.progress / this.maxProgress) * width;
        this.progressBar.fillRect(-40, 50, fill, 10);
    }
}