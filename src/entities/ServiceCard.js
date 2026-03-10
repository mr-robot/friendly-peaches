import CardContainer from './CardContainer.js';

export default class ServiceCard extends CardContainer {
    constructor(scene, x, y, title) {
        super(scene, x, y, title);
        
        // Purple tint to distinguish services from tickets and devs
        this.bg.setTint(0x8844ff); 
        
        // For later: tracking tech debt cards attached to this service
        this.debtCards = [];
        
        // Visual indicators for tech debt
        this.wobbleAnimation = false;
        this.warningIndicator = false;
        this.wobbleIntensity = 0;
        this.wobbleTween = null;
        
        // Optionally resize to make them distinct from standard cards
        // this.setSize(120, 100); 
    }
    
    updateVisualIndicators() {
        const debtCount = this.debtCards.length;
        
        if (debtCount === 0) {
            this.wobbleAnimation = false;
            this.warningIndicator = false;
            this.wobbleIntensity = 0;
            return;
        }
        
        // Enable visual indicators based on debt count
        this.wobbleAnimation = true;
        this.warningIndicator = debtCount >= 2;
        this.wobbleIntensity = Math.min(debtCount * 0.1, 0.5); // Max 50% intensity
        
        // Update visual effects
        if (this.wobbleAnimation && !this.wobbleTween) {
            this.startWobbleAnimation();
        }
    }
    
    startWobbleAnimation() {
        this.wobbleTween = this.scene.tweens.add({
            targets: this,
            angle: this.wobbleIntensity * 10, // Wobble angle based on intensity
            duration: 1000 + Math.random() * 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
}
