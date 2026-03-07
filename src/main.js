import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainGameScene from './scenes/MainGameScene.js';
import UIScene from './scenes/UIScene.js';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    scene: [BootScene, MainGameScene, UIScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);