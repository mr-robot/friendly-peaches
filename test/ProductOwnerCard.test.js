import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock StakeholderCard to avoid Phaser imports
vi.mock('../src/entities/StakeholderCard.js', () => {
    return {
        default: class MockStakeholderCard {
            constructor(scene, x, y, type) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.type = type;
                this.title = type;
                this.bg = { setTint: vi.fn() };
            }
        }
    };
});

import ProductOwnerCard from '../src/entities/ProductOwnerCard.js';

describe('ProductOwnerCard', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                rectangle: vi.fn().mockReturnValue({ setTint: vi.fn(), setOrigin: vi.fn() }),
                text: vi.fn().mockReturnValue({ setOrigin: vi.fn() })
            }
        };
    });

    it('should extend StakeholderCard with Product Owner type', () => {
        const po = new ProductOwnerCard(mockScene, 0, 0);
        
        expect(po.type).toBe('Product Owner');
        expect(po.title).toBe('Product Owner');
        expect(po.ticketBacklog).toEqual([]);
        expect(po.demands).toEqual([]);
    });
});
