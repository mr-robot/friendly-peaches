import CardContainer from './CardContainer.js';
export default class DevCard extends CardContainer {
    constructor(scene, x, y, name, role = null) {
        super(scene, x, y, name);
        this.bg.setTint(0x4488ff); // Blue for dev
        this.role = role;
        this.currentTicket = null;
        this.breathingTween = null;

        if (this.role) {
            this.roleBadge = scene.add.text(0, 30, `[${this.role}]`, {
                fontSize: '12px',
                color: '#ffffff',
                fontStyle: 'italic',
                backgroundColor: '#333333',
                padding: { x: 4, y: 2 }
            }).setOrigin(0.5);
            this.add(this.roleBadge);
        }
    }

    startBreathing() {
        if (!this.breathingTween) {
            this.breathingTween = this.scene.tweens.add({
                targets: this,
                scaleY: 0.95,
                scaleX: 1.05,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else if (!this.breathingTween.isPlaying()) {
            this.breathingTween.resume();
        }
    }

    stopBreathing() {
        if (this.breathingTween) {
            this.breathingTween.pause();
            this.scene.tweens.add({
                targets: this,
                scaleY: 1,
                scaleX: 1,
                duration: 200,
                ease: 'Sine.easeOut'
            });
        }
    }
}