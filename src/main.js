import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainGameScene from './scenes/MainGameScene.js';
import UIScene from './scenes/UIScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: [BootScene, MainGameScene, UIScene]
};

const game = new Phaser.Game(config);