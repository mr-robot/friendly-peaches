import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser to avoid import issues
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class MockScene {
                constructor(config) {
                    this.key = config?.key || 'MockScene';
                }
                add = {
                    rectangle: vi.fn().mockReturnValue({
                        setOrigin: vi.fn().mockReturnThis(),
                        setInteractive: vi.fn().mockReturnThis(),
                        setVisible: vi.fn().mockReturnThis(),
                        on: vi.fn().mockReturnThis()
                    }),
                    text: vi.fn().mockReturnValue({
                        setOrigin: vi.fn().mockReturnThis(),
                        setColor: vi.fn().mockReturnThis(),
                        setVisible: vi.fn().mockReturnThis(),
                        setText: vi.fn().mockReturnThis()
                    })
                };
                scale = { width: 1920, height: 1080 };
                scene = {
                    get: vi.fn()
                };
            }
        }
    };
});

import UIScene from '../src/scenes/UIScene.js';

describe('UIScene', () => {
    let uiScene;

    beforeEach(() => {
        uiScene = new UIScene();
        uiScene.create();
    });

    describe('Reputation UI', () => {
        it('should display reputation with color coding', () => {
            const mockGameManager = { reputation: 350, budget: 10000, morale: 100, sprintTime: 60, techHealth: 100, state: 'PLANNING' };
            uiScene.updateUI(mockGameManager);
            
            expect(uiScene.reputationText.setText).toHaveBeenCalledWith('Reputation: 350');
            expect(uiScene.reputationText.setColor).toHaveBeenLastCalledWith('#00ff00'); // Green for good reputation
        });

        it('should show red text for low reputation', () => {
            const mockGameManager = { reputation: 50, budget: 10000, morale: 100, sprintTime: 60, techHealth: 100, state: 'PLANNING' };
            uiScene.updateUI(mockGameManager);
            
            expect(uiScene.reputationText.setColor).toHaveBeenCalledWith('#ff0000'); // Red for low reputation
        });

        it('should show escape availability at 500 reputation', () => {
            const mockGameManager = { reputation: 500, budget: 10000, morale: 100, sprintTime: 60, techHealth: 100, state: 'PLANNING', canEscape: vi.fn().mockReturnValue(true) };
            uiScene.updateUI(mockGameManager);
            
            expect(uiScene.escapeIndicator.setVisible).toHaveBeenCalledWith(true);
        });
    });
});
