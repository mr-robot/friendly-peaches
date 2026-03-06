import Phaser from 'phaser';
import BoardController from '../controllers/BoardController.js';
import DevCard from '../entities/DevCard.js';
import TicketCard from '../entities/TicketCard.js';

export default class MainGameScene extends Phaser.Scene {
    constructor() {
        super('MainGameScene');
    }
    create() {
        this.boardController = new BoardController(this);
        this.boardController.createColumns();
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
    }
    update(time, delta) {
        this.boardController.update(time, delta);
    }
}