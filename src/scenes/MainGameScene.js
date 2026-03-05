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

        this.input.on('dragend', (pointer, gameObject) => {
            this.boardController.handleDrop(gameObject);
        });

        // Replace dummy cards with real ones, add to controller arrays
        const t1 = new TicketCard(this, 100, 150, "Fix Bug");
        const d1 = new DevCard(this, 100, 400, "Alice");
        this.boardController.tickets.push(t1);
        this.boardController.devs.push(d1);
    }
    update(time, delta) {
        this.boardController.update(time, delta);
    }
}