import { describe, it, expect, beforeEach, vi } from 'vitest';
import ServiceCard from '../src/entities/ServiceCard.js';

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
                this.setSize = vi.fn();
            }
        }
    };
});

describe('ServiceCard', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                text: vi.fn().mockReturnValue({
                    setOrigin: vi.fn().mockReturnThis()
                })
            }
        };
    });

    it('should initialize with a specific tint and title', () => {
        const service = new ServiceCard(mockScene, 0, 0, 'Auth Service');

        // Check if the background tint was set correctly
        expect(service.bg.setTint).toHaveBeenCalledWith(0x8844ff); // Purple tint for services

        // The title should be passed down to the parent class correctly
        expect(service.title).toBe('Auth Service');
        
        // It shouldn't have any stacked devs or anything else initially
        expect(service.debtCards).toBeDefined();
        expect(service.debtCards.length).toBe(0);
    });
});
