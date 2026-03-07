import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Top Bar Background - full screen width
        this.topBarBg = this.add.rectangle(0, 0, this.scale.width, 50, 0x111111).setOrigin(0, 0);

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
        this.stateText = this.add.text(this.scale.width - 150, 15, 'PLANNING', {
            fontSize: '18px',
            color: '#ffaa00',
            fontStyle: 'bold'
        });

        // Start Sprint Button (shown during PLANNING)
        this.startButton = this.add.rectangle(this.scale.width - 150, 60, 120, 30, 0x44aa44).setOrigin(0.5);
        this.startButton.setInteractive();
        this.startText = this.add.text(this.scale.width - 150, 60, 'START SPRINT', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);

        this.startButton.on('pointerdown', () => {
            const mainScene = this.scene.get('MainGameScene');
            if (mainScene && mainScene.gameManager) {
                mainScene.gameManager.startSprint();
                this.startButton.setVisible(false);
                this.startText.setVisible(false);
            }
        });
        
        // Review overlay (hidden by default) - centered on screen
        this.reviewOverlay = this.add.rectangle(this.scale.width/2, this.scale.height/2, 600, 400, 0x000000, 0.9).setOrigin(0.5);
        this.reviewOverlay.setVisible(false);
        
        this.reviewTitle = this.add.text(this.scale.width/2, this.scale.height/2 - 150, 'SPRINT REVIEW', {
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.reviewTitle.setVisible(false);
        
        this.reviewText = this.add.text(this.scale.width/2, this.scale.height/2 - 50, '', {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 500 }
        }).setOrigin(0.5);
        this.reviewText.setVisible(false);
        
        // Next Sprint button (shown during REVIEW) - centered
        this.nextSprintButton = this.add.rectangle(this.scale.width/2, this.scale.height/2 + 100, 150, 40, 0x4444aa).setOrigin(0.5);
        this.nextSprintButton.setInteractive();
        this.nextSprintText = this.add.text(this.scale.width/2, this.scale.height/2 + 100, 'NEXT SPRINT', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
        this.nextSprintButton.setVisible(false);
        this.nextSprintText.setVisible(false);
        
        this.nextSprintButton.on('pointerdown', () => {
            const mainScene = this.scene.get('MainGameScene');
            if (mainScene && mainScene.gameManager) {
                mainScene.gameManager.startNextSprint();
                this.hideSprintReview();
            }
        });
    }
    
    showSprintReview(result) {
        this.reviewOverlay.setVisible(true);
        this.reviewTitle.setVisible(true);
        this.nextSprintButton.setVisible(true);
        this.nextSprintText.setVisible(true);
        
        const netColor = result.netBudget >= 0 ? '#00ff00' : '#ff0000';
        const netSymbol = result.netBudget >= 0 ? '+' : '';
        
        this.reviewText.setText(
            `Sprint Complete!\n\n` +
            `Completed: ${result.completed} tickets\n` +
            `Committed: ${result.committed} tickets\n` +
            `Budget Earned: $${result.budgetEarned}\n` +
            `Operating Cost: $${result.operatingCost}\n` +
            `Net Budget: ${netSymbol}$${result.netBudget}`
        );
        this.reviewText.setColor(netColor);
        this.reviewText.setVisible(true);
    }
    
    hideSprintReview() {
        this.reviewOverlay.setVisible(false);
        this.reviewTitle.setVisible(false);
        this.reviewText.setVisible(false);
        this.nextSprintButton.setVisible(false);
        this.nextSprintText.setVisible(false);
    }

    updateUI(gameManager) {
        if (!gameManager) return;
        
        this.budgetText.setText(`Budget: $${Math.floor(gameManager.budget)}`);
        this.moraleText.setText(`Morale: ${Math.floor(gameManager.morale)}%`);
        this.timerText.setText(`Sprint Time: ${Math.ceil(gameManager.sprintTime)}s`);
        this.stateText.setText(gameManager.state);
        
        // Show/hide UI elements based on state
        switch (gameManager.state) {
            case 'PLANNING':
                this.startButton.setVisible(true);
                this.startText.setVisible(true);
                this.timerText.setColor('#ffffff');
                break;
                
            case 'ACTIVE':
                this.startButton.setVisible(false);
                this.startText.setVisible(false);
                this.timerText.setColor('#ffffff');
                break;
                
            case 'REVIEW':
                this.startButton.setVisible(false);
                this.startText.setVisible(false);
                this.timerText.setColor('#ff0000');
                break;
        }
    }
}