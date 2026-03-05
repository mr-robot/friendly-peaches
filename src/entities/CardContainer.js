import Phaser from 'phaser';

export default class CardContainer extends Phaser.GameObjects.Container {
    constructor(scene, x, y, title) {
        super(scene, x, y);
        this.scene.add.existing(this);
        
        this.bg = scene.add.image(0, 0, 'card_bg').setTint(0xaaaaaa);
        this.titleText = scene.add.text(0, -50, title, { color: '#000' }).setOrigin(0.5);
        
        this.add([this.bg, this.titleText]);
        
        this.setSize(100, 150);
        this.setInteractive();
        scene.input.setDraggable(this);
        
        this.on('drag', (pointer, dragX, dragY) => {
            this.x = dragX;
            this.y = dragY;
            this.scene.children.bringToTop(this);
        });
    }
}