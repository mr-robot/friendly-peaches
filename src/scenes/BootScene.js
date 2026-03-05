import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }
    preload() {
        // Load simple colored rects as placeholders
        const graphics = this.make.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 100, 150);
        graphics.generateTexture('card_bg', 100, 150);
        graphics.clear();
    }
    create() {
        this.scene.start('MainGameScene');
    }
}