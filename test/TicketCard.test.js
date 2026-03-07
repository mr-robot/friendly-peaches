import { describe, it, expect, beforeEach, vi } from 'vitest';
import TicketCard from '../src/entities/TicketCard.js';

// Mock CardContainer since we are testing TicketCard specific logic
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

describe('TicketCard', () => {
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
                    setOrigin: vi.fn().mockReturnThis(),
                    setText: vi.fn().mockReturnThis(),
                    setColor: vi.fn().mockReturnThis()
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

    it('should initialize with default properties and no requirement', () => {
        const ticket = new TicketCard(mockScene, 0, 0, 'Test Ticket');
        expect(ticket.progress).toBe(0);
        expect(ticket.maxProgress).toBe(100);
        expect(ticket.requirement).toBeNull();
    });

    it('should initialize with a specific requirement if provided', () => {
        const ticket = new TicketCard(mockScene, 0, 0, 'Test Ticket', 'Frontend');
        expect(ticket.requirement).toBe('Frontend');
        
        // Should create a badge text for the requirement
        expect(mockScene.add.text).toHaveBeenCalledWith(
            0, 30, // x, y offset for badge
            '[Frontend]',
            expect.any(Object)
        );
    });
});