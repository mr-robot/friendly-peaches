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
                this.setInteractive = vi.fn();
            }
        }
    };
});

import StakeholderCard from '../src/entities/StakeholderCard.js';

describe('StakeholderCard', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                rectangle: vi.fn().mockReturnValue({ setTint: vi.fn(), setOrigin: vi.fn() }),
                text: vi.fn().mockReturnValue({ setOrigin: vi.fn() })
            }
        };
    });

    it('should initialize with stakeholder type and gold tint', () => {
        const stakeholder = new StakeholderCard(mockScene, 0, 0, 'Product Owner');
        
        expect(stakeholder.type).toBe('Product Owner');
        expect(stakeholder.bg.setTint).toHaveBeenCalledWith(0xffd700); // Gold tint
        expect(stakeholder.title).toBe('Product Owner');
    });
});
