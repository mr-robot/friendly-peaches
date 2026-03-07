import CardContainer from './CardContainer.js';
export default class TicketCard extends CardContainer {
    constructor(scene, x, y, title, requirement = null) {
        super(scene, x, y, title);
        this.bg.setTint(0xffaa44); // Orange for ticket
        this.progress = 0;
        this.maxProgress = 100;
        this.requirement = requirement;
        this.quality = 100; // Starts at 100%, decays if worked on by mismatched devs
        
        this.progressBar = scene.add.graphics();
        this.add(this.progressBar);
        this.updateProgressVisual();

        if (this.requirement) {
            this.requirementBadge = scene.add.text(0, 30, `[${this.requirement}]`, {
                fontSize: '12px',
                color: '#ffffff',
                fontStyle: 'italic',
                backgroundColor: '#555555',
                padding: { x: 4, y: 2 }
            }).setOrigin(0.5);
            this.add(this.requirementBadge);
        }
        
        // Quality text (hidden initially, maybe shows when it drops below 100)
        this.qualityText = scene.add.text(45, -45, '100%', {
            fontSize: '10px',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(1, 0);
        this.add(this.qualityText);
        this.updateQualityVisual();
        
        this.stackedDevs = [];
        this.currentColumn = 'Backlog';
        this.particleTimer = null;
    }
    
    updateQualityVisual() {
        if (!this.qualityText) return;
        this.qualityText.setText(`${Math.floor(this.quality)}%`);
        if (this.quality < 50) {
            this.qualityText.setColor('#ff0000');
        } else if (this.quality < 80) {
            this.qualityText.setColor('#ffff00');
        } else {
            this.qualityText.setColor('#00ff00');
        }
    }

    updateProgressVisual() {
        this.progressBar.clear();
        
        if (this.progress <= 0) {
            return; // Hide the progress bar entirely when there is no progress
        }
        
        // Card width is 100 (from -50 to +50). Top edge is at -75.
        // Draw background for progress bar with a 10px gap above the card (y: -95, height: 10)
        this.progressBar.fillStyle(0x333333, 1);
        this.progressBar.fillRect(-50, -95, 100, 10);
        
        // Draw fill
        this.progressBar.fillStyle(0x00ff00, 1);
        const width = 100;
        const fill = (this.progress / this.maxProgress) * width;
        this.progressBar.fillRect(-50, -95, fill, 10);
    }

    startParticles() {
        if (!this.particleTimer && this.scene && this.scene.time) {
            this.particleTimer = this.scene.time.addEvent({
                delay: 300,
                callback: this.spawnParticle,
                callbackScope: this,
                loop: true
            });
        }
    }

    stopParticles() {
        if (this.particleTimer) {
            this.particleTimer.remove();
            this.particleTimer = null;
        }
    }

    spawnParticle() {
        if (!this.scene) return;
        const chars = ['+', '<', '>', '/', '{', '}'];
        const char = chars[Math.floor(Math.random() * chars.length)];
        const offsetX = (Math.random() - 0.5) * 80;
        
        const particle = this.scene.add.text(this.x + offsetX, this.y, char, { 
            fontSize: '16px', 
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: particle,
            y: this.y - 80,
            alpha: 0,
            duration: 1000,
            onComplete: () => particle.destroy()
        });
    }
}