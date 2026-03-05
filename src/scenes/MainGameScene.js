import Phaser from 'phaser';
import BoardController from '../controllers/BoardController.js';
import CardContainer from '../entities/CardContainer.js';

export default class MainGameScene extends Phaser.Scene {
    constructor() {
        super('MainGameScene');
    }
    create() {
        this.boardController = new BoardController(this);
        this.boardController.createColumns();

        new CardContainer(this, 100, 150, "Ticket 1");
        new CardContainer(this, 300, 150, "Dev 1");
    }
    update(time, delta) {
        this.boardController.update(time, delta);
    }
}