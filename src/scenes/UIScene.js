import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Top Bar Background
        this.add.rectangle(0, 0, 800, 50, 0x111111).setOrigin(0, 0);

        // Budget Text
        this.budgetText = this.add.text(20, 15, 'Budget: $10000', {
            fontSize: '18px',
            color: '#00ff00',
            fontStyle: 'bold'
        });

        // Morale Text
        this.moraleText = this.add.text(200, 15, 'Morale: 100%', {
            fontSize: '18px',
            color: '#ffff00',
            fontStyle: 'bold'
        });

        // Timer Text
        this.timerText = this.add.text(400, 15, 'Sprint Time: 60s', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        // Sprint State / Controls
        this.stateText = this.add.text(650, 15, 'PLANNING', {
            fontSize: '18px',
            color: '#ffaa00',
            fontStyle: 'bold'
        });

        // Start Sprint Button
        this.startButton = this.add.rectangle(650, 60, 120, 30, 0x44aa44).setOrigin(0.5);
        this.startButton.setInteractive();
        this.startText = this.add.text(650, 60, 'START SPRINT', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);

        this.startButton.on('pointerdown', () => {
            const mainScene = this.scene.get('MainGameScene');
            if (mainScene && mainScene.gameManager) {
                mainScene.gameManager.startSprint();
                this.startButton.setVisible(false);
                this.startText.setVisible(false);
            }
        });
    }

    updateUI(gameManager) {
        if (!gameManager) return;
        
        this.budgetText.setText(`Budget: $${Math.floor(gameManager.budget)}`);
        this.moraleText.setText(`Morale: ${Math.floor(gameManager.morale)}%`);
        this.timerText.setText(`Sprint Time: ${Math.ceil(gameManager.sprintTime)}s`);
        this.stateText.setText(gameManager.state);

        if (gameManager.state === 'REVIEW') {
            this.timerText.setColor('#ff0000');
        }
    }
}