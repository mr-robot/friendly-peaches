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

        // Tech Health Text
        this.techHealthText = this.add.text(600, 15, 'Tech Health: 100%', {
            fontSize: '18px',
            color: '#00ffff',
            fontStyle: 'bold'
        });

        // Reputation Text
        this.reputationText = this.add.text(800, 15, 'Reputation: 0', {
            fontSize: '18px',
            color: '#00ff00',
            fontStyle: 'bold'
        });

        // Reveal Token display
        this.revealTokenText = this.add.text(1000, 15, '🔍 Reveal: 0', {
            fontSize: '18px',
            color: '#ffdd88',
            fontStyle: 'bold'
        });

        // Reveal Token button (spend a token to reveal a hidden card)
        this.revealButton = this.add.rectangle(1200, 30, 140, 30, 0x886600).setOrigin(0.5).setInteractive();
        this.revealButtonText = this.add.text(1200, 30, '🔍 USE TOKEN', {
            fontSize: '13px', color: '#ffffff'
        }).setOrigin(0.5);
        this.revealButton.setVisible(false);
        this.revealButtonText.setVisible(false);

        this.revealButton.on('pointerdown', () => {
            const mainScene = this.scene.get('MainGameScene');
            if (!mainScene || !mainScene.boardController) return;
            const bc = mainScene.boardController;
            const gm = mainScene.gameManager;
            if (!gm.canSpendRevealToken()) return;
            // Reveal the first hidden card
            const hidden = bc.getHiddenCards();
            if (hidden.length > 0) {
                bc.useRevealToken(hidden[0]);
            }
        });

        this.revealButton.on('pointerover', () => {
            this.revealButton.fillColor = 0xbbaa00;
        });
        this.revealButton.on('pointerout', () => {
            this.revealButton.fillColor = 0x886600;
        });

        // Escape Indicator
        this.escapeIndicator = this.add.text(400, 50, 'ESCAPE AVAILABLE!', {
            fontSize: '24px',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false);

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
                // Clean up planning UI (hide Product Backlog panel + commitment zone overlay)
                if (mainScene.boardController) {
                    mainScene.boardController.startSprint();
                }
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

        // ── Incident Panel ──────────────────────────────────────────────────────
        // Sits in the top-right corner, shows active incidents with severity + timer
        const incidentPanelX = this.scale.width - 320;
        const incidentPanelY = 60;

        this.incidentPanelBg = this.add.rectangle(incidentPanelX, incidentPanelY, 300, 100, 0x330000, 0.85)
            .setOrigin(0, 0).setVisible(false);

        this.incidentPanelTitle = this.add.text(incidentPanelX + 10, incidentPanelY + 6, '🚨 INCIDENTS', {
            fontSize: '13px', color: '#ff4444', fontStyle: 'bold'
        }).setVisible(false);

        this.incidentLines = [];
        for (let i = 0; i < 3; i++) {
            this.incidentLines.push(this.add.text(incidentPanelX + 10, incidentPanelY + 24 + i * 22, '', {
                fontSize: '12px', color: '#ffaaaa'
            }).setVisible(false));
        }

        // Resolve button — resolves the most severe active incident
        this.resolveButton = this.add.rectangle(incidentPanelX + 150, incidentPanelY + 80, 130, 24, 0x661111)
            .setOrigin(0.5).setInteractive().setVisible(false);
        this.resolveButtonText = this.add.text(incidentPanelX + 150, incidentPanelY + 80, '✅ RESOLVE', {
            fontSize: '12px', color: '#ffffff'
        }).setOrigin(0.5).setVisible(false);

        this.resolveButton.on('pointerdown', () => {
            const mainScene = this.scene.get('MainGameScene');
            if (!mainScene) return;
            const im = mainScene.incidentManager;
            if (!im) return;
            const worst = im.activeIncidents.sort((a, b) => b.severity - a.severity)[0];
            if (worst) im.resolveIncident(worst);
        });

        this.resolveButton.on('pointerover', () => { this.resolveButton.fillColor = 0xaa2222; });
        this.resolveButton.on('pointerout', () => { this.resolveButton.fillColor = 0x661111; });

        // ── Stakeholder Demand Panel ────────────────────────────────────────────
        const demandPanelX = this.scale.width - 320;
        const demandPanelY = 170;

        this.demandPanelBg = this.add.rectangle(demandPanelX, demandPanelY, 300, 60, 0x1a1a44, 0.85)
            .setOrigin(0, 0).setVisible(false);

        this.demandText = this.add.text(demandPanelX + 10, demandPanelY + 8,
            '📋 Product Owner: 0 demands', {
                fontSize: '12px', color: '#aaaaff', wordWrap: { width: 280 }
            }).setVisible(false);

        this.demandPressureText = this.add.text(demandPanelX + 10, demandPanelY + 30,
            'Pressure: 0', { fontSize: '11px', color: '#8888ff' }
        ).setVisible(false);

        // Stakeholder interaction buttons
        const btnY = demandPanelY + 55;

        this.fulfillButton = this.add.rectangle(demandPanelX + 50, btnY, 80, 20, 0x2a5a2a).setOrigin(0.5).setInteractive().setVisible(false);
        this.fulfillText = this.add.text(demandPanelX + 50, btnY, 'FULFILL', { fontSize: '10px' }).setOrigin(0.5).setVisible(false);

        this.ignoreButton = this.add.rectangle(demandPanelX + 150, btnY, 80, 20, 0x5a2a2a).setOrigin(0.5).setInteractive().setVisible(false);
        this.ignoreText = this.add.text(demandPanelX + 150, btnY, 'IGNORE', { fontSize: '10px' }).setOrigin(0.5).setVisible(false);

        this.pushBackButton = this.add.rectangle(demandPanelX + 250, btnY, 80, 20, 0x5a5a2a).setOrigin(0.5).setInteractive().setVisible(false);
        this.pushBackText = this.add.text(demandPanelX + 250, btnY, 'PUSH BACK', { fontSize: '10px' }).setOrigin(0.5).setVisible(false);

        // Event handlers
        const getStakeholderManager = () => {
            const mainScene = this.scene.get('MainGameScene');
            return mainScene?.stakeholderManager;
        };

        const getStakeholder = () => {
            const sm = getStakeholderManager();
            return sm?.getProductOwner();
        };

        this.fulfillButton.on('pointerdown', () => {
            const sm = getStakeholderManager();
            const sh = getStakeholder();
            if (sm && sh && sh.demandCount > 0) sm.fulfillDemand(sh);
        });

        this.ignoreButton.on('pointerdown', () => {
            const sm = getStakeholderManager();
            const sh = getStakeholder();
            if (sm && sh && sh.demandCount > 0) sm.ignoreDemand(sh);
        });

        this.pushBackButton.on('pointerdown', () => {
            const sm = getStakeholderManager();
            const sh = getStakeholder();
            if (sm && sh && sh.demandCount > 0) sm.pushBack(sh);
        });

        // ── Onboarding indicator ────────────────────────────────────────────────
        this.onboardingText = this.add.text(20, this.scale.height - 130, '', {
            fontSize: '12px', color: '#88ffaa', fontStyle: 'italic'
        }).setVisible(false);
    }

    updateUI(gameManager, extra = {}) {
        const { incidents = [], stakeholder = null, onboardingDevs = [] } = extra;

        // ── Incident panel ──────────────────────────────────────────────────────
        if (incidents.length > 0) {
            this.incidentPanelBg.setVisible(true);
            this.incidentPanelTitle.setVisible(true);
            this.resolveButton.setVisible(true);
            this.resolveButtonText.setVisible(true);

            const sevLabel = { 1: 'SEV-3', 2: 'SEV-2', 3: 'SEV-1' };
            const sevColor = { 1: '#ffaaaa', 2: '#ff6666', 3: '#ff0000' };

            incidents.slice(0, 3).forEach((inc, i) => {
                const line = this.incidentLines[i];
                const secs = Math.ceil((inc.timeRemaining || 0) / 1000);
                line.setText(`${sevLabel[inc.severity] || 'SEV-?'} — ${secs}s remaining`);
                line.setColor(sevColor[inc.severity] || '#ffaaaa');
                line.setVisible(true);
            });
            // Hide unused lines
            for (let i = incidents.length; i < 3; i++) {
                this.incidentLines[i].setVisible(false);
            }
        } else {
            this.incidentPanelBg.setVisible(false);
            this.incidentPanelTitle.setVisible(false);
            this.resolveButton.setVisible(false);
            this.resolveButtonText.setVisible(false);
            this.incidentLines.forEach(l => l.setVisible(false));
        }

        // ── Stakeholder demand panel ────────────────────────────────────────────
        if (stakeholder) {
            this.demandPanelBg.setVisible(true);
            this.demandText.setVisible(true);
            this.demandPressureText.setVisible(true);
            this.demandText.setText(`📋 Product Owner: ${stakeholder.demandCount} demand(s)`);
            const pressureColor = stakeholder.pressureLevel > 50 ? '#ff6666' : '#8888ff';
            this.demandPressureText.setText(`Pressure: ${stakeholder.pressureLevel}`);
            this.demandPressureText.setColor(pressureColor);

            // Show interaction buttons when there are demands
            if (stakeholder.demandCount > 0) {
                this.fulfillButton.setVisible(true);
                this.fulfillText.setVisible(true);
                this.ignoreButton.setVisible(true);
                this.ignoreText.setVisible(true);
                this.pushBackButton.setVisible(true);
                this.pushBackText.setVisible(true);
            } else {
                this.fulfillButton.setVisible(false);
                this.fulfillText.setVisible(false);
                this.ignoreButton.setVisible(false);
                this.ignoreText.setVisible(false);
                this.pushBackButton.setVisible(false);
                this.pushBackText.setVisible(false);
            }
        } else {
            this.demandPanelBg.setVisible(false);
            this.demandText.setVisible(false);
            this.demandPressureText.setVisible(false);
            this.fulfillButton.setVisible(false);
            this.fulfillText.setVisible(false);
            this.ignoreButton.setVisible(false);
            this.ignoreText.setVisible(false);
            this.pushBackButton.setVisible(false);
            this.pushBackText.setVisible(false);
        }

        // ── Onboarding indicator ────────────────────────────────────────────────
        if (onboardingDevs.length > 0) {
            const names = onboardingDevs.map(d => d.name || 'New Hire').join(', ');
            this.onboardingText.setText(`🎓 Onboarding: ${names}`);
            this.onboardingText.setVisible(true);
        } else {
            this.onboardingText.setVisible(false);
        }

        // Update State (stateText shows gameManager.state)
        if (this.stateText) this.stateText.setText(gameManager.state || 'PLANNING');

        // Show/hide start button
        if (gameManager.state === 'PLANNING') {
            this.startButton.setVisible(true);
            this.startText.setVisible(true);
        } else {
            this.startButton.setVisible(false);
            this.startText.setVisible(false);
        }
        // Update Budget
        this.budgetText.setText(`Budget: $${Math.floor(gameManager.budget)}`);
        
        // Update Morale
        this.moraleText.setText(`Morale: ${gameManager.morale}%`);
        if (gameManager.morale < 30) {
            this.moraleText.setColor('#ff0000'); // Red for low morale
        } else {
            this.moraleText.setColor('#ffff00'); // Yellow normally
        }
        
        // Update Timer
        this.timerText.setText(`Sprint Time: ${Math.ceil(gameManager.sprintTime)}s`);
        
        // Update Tech Health
        this.techHealthText.setText(`Tech Health: ${gameManager.techHealth}%`);
        if (gameManager.techHealth < 25) {
            this.techHealthText.setColor('#ff0000'); // Red for danger
        } else if (gameManager.techHealth < 50) {
            this.techHealthText.setColor('#ffaa00'); // Orange for warning
        } else {
            this.techHealthText.setColor('#00ffff'); // Cyan normally
        }

        // Update Reputation
        this.reputationText.setText(`Reputation: ${Math.floor(gameManager.reputation)}`);
        
        // Color code reputation
        if (gameManager.reputation < 100) {
            this.reputationText.setColor('#ff0000'); // Red - very low
        } else if (gameManager.reputation < 300) {
            this.reputationText.setColor('#ffaa00'); // Orange - low
        } else {
            this.reputationText.setColor('#00ff00'); // Green - good
        }

        // Update Reveal Tokens
        const tokens = gameManager.revealTokens || 0;
        this.revealTokenText.setText(`🔍 Reveal: ${tokens}`);
        if (tokens > 0) {
            this.revealTokenText.setColor('#ffdd88');
            this.revealButton.setVisible(true);
            this.revealButtonText.setVisible(true);
        } else {
            this.revealTokenText.setColor('#888888');
            this.revealButton.setVisible(false);
            this.revealButtonText.setVisible(false);
        }

        // Show escape indicator
        if (gameManager.canEscape && gameManager.canEscape()) {
            this.escapeIndicator.setVisible(true);
        } else {
            this.escapeIndicator.setVisible(false);
        }
    }
    
    showSprintReview(result) {
        console.log('UIScene.showSprintReview called with:', result);
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
        console.log('UIScene.showSprintReview completed - all elements set visible');
    }
    
    hideSprintReview() {
        this.reviewOverlay.setVisible(false);
        this.reviewTitle.setVisible(false);
        this.reviewText.setVisible(false);
        this.nextSprintButton.setVisible(false);
        this.nextSprintText.setVisible(false);
    }
}