import Phaser from 'phaser';
import BoardController from '../controllers/BoardController.js';

export default class MainGameScene extends Phaser.Scene {
    constructor() {
        super('MainGameScene');
    }
    create() {
        this.boardController = new BoardController(this);
        this.boardController.createColumns();
    }
    update(time, delta) {
        this.boardController.update(time, delta);
    }
}