import { describe, it, expect, beforeEach, vi } from 'vitest';
import BugCard from '../src/entities/BugCard.js';

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

// We also need to mock TicketCard since BugCard extends it
vi.mock('../src/entities/TicketCard.js', async () => {
    return {
        default: class MockTicketCard {
            constructor(scene, x, y, title, requirement) {
                this.scene = scene;
                this.x = x;
                this.y = y;
                this.title = title;
                this.requirement = requirement;
                this.progress = 0;
                this.maxProgress = 100;
                this.stackedDevs = [];
                this.currentColumn = 'Backlog';
                this.particleTimer = null;
                
                this.bg = { setTint: vi.fn() };
                this.add = vi.fn();
                this.progressBar = {
                    clear: vi.fn(),
                    fillStyle: vi.fn(),
                    fillRect: vi.fn()
                };
                this.updateProgressVisual = vi.fn();
            }
        }
    };
});

describe('BugCard', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                graphics: vi.fn().mockReturnValue({
                    clear: vi.fn(),
                    fillStyle: vi.fn(),
                    fillRect: vi.fn()
                }),
                text: vi.fn().mockReturnValue({
                    setOrigin: vi.fn().mockReturnThis()
                })
            },
            time: {
                addEvent: vi.fn()
            },
            tweens: {
                add: vi.fn()
            }
        };
    });

    it('should initialize with red tint and BUG badge', () => {
        const bug = new BugCard(mockScene, 0, 0, 'Test Bug', 'Backend');
        
        expect(bug.bg.setTint).toHaveBeenCalledWith(0xff4444); // Red tint
        
        // Should create a badge text for "BUG"
        expect(mockScene.add.text).toHaveBeenCalledWith(
            0, -30, // x, y offset for BUG badge
            '⚠️ BUG',
            expect.any(Object)
        );
        
        // And it should still have the requirement property from TicketCard
        expect(bug.requirement).toBe('Backend');
    });
});