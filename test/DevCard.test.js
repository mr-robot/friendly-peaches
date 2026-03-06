import { describe, it, expect, beforeEach, vi } from 'vitest';
import DevCard from '../src/entities/DevCard.js';

// Mock CardContainer
vi.mock('../src/entities/CardContainer.js', () => {
    return {
        default: class MockCardContainer {
            constructor(scene, x, y, title) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.title = title;
                this.bg = { setTint: vi.fn() };
                this.add = vi.fn();
            }
        }
    };
});

describe('DevCard', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                text: vi.fn().mockReturnValue({
                    setOrigin: vi.fn().mockReturnThis()
                })
            },
            tweens: {
                add: vi.fn()
            }
        };
    });

    it('should initialize with default properties and no role', () => {
        const dev = new DevCard(mockScene, 0, 0, 'Test Dev');
        expect(dev.role).toBeNull();
    });

    it('should initialize with a specific role if provided', () => {
        const dev = new DevCard(mockScene, 0, 0, 'Test Dev', 'Backend');
        expect(dev.role).toBe('Backend');
        
        // Should create a badge text for the role
        expect(mockScene.add.text).toHaveBeenCalledWith(
            0, 30, // x, y offset for badge
            '[Backend]',
            expect.any(Object)
        );
    });
});