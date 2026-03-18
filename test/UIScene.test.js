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

    function mockGM(overrides = {}) {
        return {
            budget: 10000, morale: 100, sprintTime: 60,
            techHealth: 100, state: 'PLANNING',
            reputation: 350, revealTokens: 0,
            ...overrides
        };
    }

    describe('Reputation UI', () => {
        it('should display reputation with color coding', () => {
            uiScene.updateUI(mockGM({ reputation: 350 }));
            expect(uiScene.reputationText.setText).toHaveBeenCalledWith('Reputation: 350');
            expect(uiScene.reputationText.setColor).toHaveBeenCalledWith('#00ff00'); // Green for good reputation
        });

        it('should show red text for low reputation', () => {
            uiScene.updateUI(mockGM({ reputation: 50 }));
            expect(uiScene.reputationText.setColor).toHaveBeenCalledWith('#ff0000'); // Red for low reputation
        });

        it('should show escape availability at 500 reputation', () => {
            uiScene.updateUI(mockGM({ reputation: 500, canEscape: vi.fn().mockReturnValue(true) }));
            expect(uiScene.escapeIndicator.setVisible).toHaveBeenCalledWith(true);
        });

        it('should show reveal token count', () => {
            uiScene.updateUI(mockGM({ revealTokens: 3 }));
            expect(uiScene.revealTokenText.setText).toHaveBeenCalledWith('🔍 Reveal: 3');
        });

        it('should show USE TOKEN button when tokens > 0', () => {
            uiScene.updateUI(mockGM({ revealTokens: 2 }));
            expect(uiScene.revealButton.setVisible).toHaveBeenCalledWith(true);
        });

        it('should hide USE TOKEN button when tokens = 0', () => {
            uiScene.updateUI(mockGM({ revealTokens: 0 }));
            expect(uiScene.revealButton.setVisible).toHaveBeenCalledWith(false);
        });
    });

    describe('Stakeholder Demand Interactions', () => {
        it('should create stakeholder demand buttons when stakeholder is present', () => {
            const mockStakeholder = {
                name: 'CTO',
                demandCount: 1,
                demandType: 'infrastructure',
                fulfillDemand: vi.fn(),
                ignoreDemand: vi.fn(),
                pushBack: vi.fn()
            };

            uiScene.updateUI(mockGM(), { stakeholder: mockStakeholder });
            
            // Should show demand panel
            expect(uiScene.demandPanelBg.setVisible).toHaveBeenCalledWith(true);
            expect(uiScene.demandText.setVisible).toHaveBeenCalledWith(true);
        });

        it('should hide stakeholder demand panel when no stakeholder', () => {
            uiScene.updateUI(mockGM(), { stakeholder: null });
            
            expect(uiScene.demandPanelBg.setVisible).toHaveBeenCalledWith(false);
            expect(uiScene.demandText.setVisible).toHaveBeenCalledWith(false);
        });
    });

    describe('Incident UI', () => {
        it('should display incident panel when incidents exist', () => {
            const mockIncidents = [
                { severity: 3, timeRemaining: 15000 },
                { severity: 2, timeRemaining: 30000 }
            ];
            
            uiScene.updateUI(mockGM(), { incidents: mockIncidents });
            
            expect(uiScene.incidentPanelBg.setVisible).toHaveBeenCalledWith(true);
            expect(uiScene.incidentLines[0].setVisible).toHaveBeenCalledWith(true);
            expect(uiScene.incidentLines[0].setText).toHaveBeenCalledWith(expect.stringContaining('SEV-1'));
            expect(uiScene.incidentLines[1].setVisible).toHaveBeenCalledWith(true);
        });

        it('should hide incident panel when no incidents', () => {
            uiScene.updateUI(mockGM(), { incidents: [] });
            
            expect(uiScene.incidentPanelBg.setVisible).toHaveBeenCalledWith(false);
            expect(uiScene.incidentPanelTitle.setVisible).toHaveBeenCalledWith(false);
            uiScene.incidentLines.forEach(l => expect(l.setVisible).toHaveBeenCalledWith(false));
        });
    });
});
