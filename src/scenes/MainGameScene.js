import Phaser from 'phaser';

export default class MainGameScene extends Phaser.Scene {
    constructor() {
        super('MainGameScene');
    }
    create() {
        this.add.text(100, 100, 'Main Game Scene', { fill: '#fff' });
    }
}