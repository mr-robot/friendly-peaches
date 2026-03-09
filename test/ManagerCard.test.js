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

import ManagerCard from '../src/entities/ManagerCard.js';

describe('ManagerCard', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                rectangle: vi.fn().mockReturnValue({ setTint: vi.fn(), setOrigin: vi.fn() }),
                text: vi.fn().mockReturnValue({ setOrigin: vi.fn() })
            }
        };
    });

    it('should initialize with blue tint and management properties', () => {
        const manager = new ManagerCard(mockScene, 0, 0, 'Engineering Manager');
        
        expect(manager.title).toBe('Engineering Manager');
        expect(manager.bg.setTint).toHaveBeenCalledWith(0x4169e1); // Royal blue
        expect(manager.managementBonus).toBe(1.5); // 50% speed boost
        expect(manager.canShield).toBe(true); // Can shield from interrupts
    });
});
