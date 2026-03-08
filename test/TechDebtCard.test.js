import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock CardContainer to avoid Phaser imports
vi.mock('../src/entities/CardContainer.js', () => {
    return {
        default: class MockCardContainer {
            constructor(scene, x, y, title) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.title = title;
                this.bg = { setTint: vi.fn() };
                this.setVisible = vi.fn();
                this.setInteractive = vi.fn();
            }
        }
    };
});

import TechDebtCard from '../src/entities/TechDebtCard.js';

describe('TechDebtCard', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                rectangle: vi.fn().mockReturnValue({ setTint: vi.fn(), setOrigin: vi.fn() }),
                text: vi.fn().mockReturnValue({ setOrigin: vi.fn() })
            }
        };
    });

    it('should initialize face-down with dark red tint', () => {
        const debt = new TechDebtCard(mockScene, 0, 0, 'Database Shortcut');
        
        expect(debt.title).toBe('Database Shortcut');
        expect(debt.isFaceDown).toBe(true);
        expect(debt.bg.setTint).toHaveBeenCalledWith(0x8b0000); // Dark red
        expect(debt.setVisible).toHaveBeenCalledWith(false); // Hidden when face-down
    });

    it('should flip face-up to reveal content', () => {
        const debt = new TechDebtCard(mockScene, 0, 0, 'API Hack');
        debt.flipFaceUp();
        
        expect(debt.isFaceDown).toBe(false);
        expect(debt.setVisible).toHaveBeenCalledWith(true);
        expect(debt.bg.setTint).toHaveBeenCalledWith(0xff4444); // Brighter red when visible
    });
});
