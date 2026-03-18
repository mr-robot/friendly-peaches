import BugCard from '../entities/BugCard.js';
import TechDebtCard from '../entities/TechDebtCard.js';
import FogOfWarManager from '../core/FogOfWarManager.js';

export default class BoardController {
    constructor(scene) {
        this.scene = scene;
        this.columns = ['Sprint Commitment', 'In Progress', 'Review', 'Done'];
        this.columnZones = {};
        this.tickets = [];
        this.devs = [];
        this.bugs = [];
        this.productBacklogTickets = [];
        this.productBacklogPanel = null;
        this.techDebtCards = [];
        this.serviceCards = [];
        // Simple card store for addCard/moveCard/removeCard/getCardsInColumn helpers
        this._cards = [];
        // Fog of War
        this.fogOfWar = new FogOfWarManager();
    }

    // ── Simple card store helpers (used by tests and step 2 logic) ─────────────
    addCard(card) {
        this._cards.push(card);
    }

    removeCard(id) {
        this._cards = this._cards.filter(c => c.id !== id);
    }

    moveCard(id, targetColumn) {
        const card = this._cards.find(c => c.id === id);
        if (card) card.column = targetColumn;
    }

    getCardsInColumn(columnName) {
        return this._cards.filter(c => c.column === columnName);
    }

    getTotalDifficulty(columnName) {
        return this.getCardsInColumn(columnName).reduce((sum, c) => sum + (c.difficulty || 0), 0);
    }

    logInteraction(event, payload = {}) {
        console.debug(`[BoardController] ${event}`, payload);
    }

    calculateColumnWidth() {
        return this.scene.scale.width / this.columns.length;
    }

    calculateColumnPosition(index) {
        return index * this.calculateColumnWidth();
    }

    createColumns() {
        const colWidth = this.calculateColumnWidth();
        const tableHeight = this.scene.scale.height - 150; // Leave 100px for Services area

        // Create Services Area at the bottom
        this.servicesArea = this.scene.add.rectangle(0, this.scene.scale.height - 100, this.scene.scale.width, 100, 0x1a1a2e).setOrigin(0, 0);
        this.scene.add.text(20, this.scene.scale.height - 80, 'SERVICES', { color: '#ffffff', fontSize: '16px', fontStyle: 'bold' });

        this.columns.forEach((name, index) => {
            const x = this.calculateColumnPosition(index);

            const bg = this.scene.add.rectangle(x, 50, colWidth, tableHeight, 0x222222, 0.5).setOrigin(0, 0);
            const headerBg = this.scene.add.rectangle(x, 50, colWidth, 40, 0x333333, 0.8).setOrigin(0, 0);

            this.scene.add.line(0, 0, x + colWidth, 50, x + colWidth, this.scene.scale.height, 0x555555).setOrigin(0, 0);

            this.scene.add.text(x + colWidth / 2, 70, name, {
                color: '#ffffff',
                fontSize: '16px',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const rowHeight = 80;
            for (let row = 1; row < Math.floor(tableHeight / rowHeight); row++) {
                const y = 50 + row * rowHeight;
                this.scene.add.line(0, 0, x, y, x + colWidth, y, 0x444444, 0.3).setOrigin(0, 0);
            }

            const zone = this.scene.add.zone(x, 50, colWidth, tableHeight).setOrigin(0, 0).setDropZone();
            zone.bgPanel = bg;
            zone.columnName = name;

            this.columnZones[name] = {
                x: x,
                width: colWidth,
                height: tableHeight,
                bg: bg,
                headerBg: headerBg,
                zone: zone
            };
        });
        
        // Sprint Commitment Zone overlay (visible during PLANNING only)
        // Note: the Sprint Commitment *column* is the first main column; this overlay
        // is a visual indicator that sits on top of it and is hidden when ACTIVE begins.
        const scColumn = this.columnZones['Sprint Commitment'];
        const commitmentX = scColumn ? scColumn.x : 0;
        const commitmentY = 50;
        const commitmentWidth = scColumn ? scColumn.width : this.calculateColumnWidth();
        const commitmentHeight = 40; // just the header highlight

        const commitmentLabel = this.scene.add.text(
            commitmentX + commitmentWidth / 2,
            commitmentY + 5,
            '📋 SPRINT COMMITMENT — drag tickets here',
            { color: '#aaffaa', fontSize: '13px', fontStyle: 'italic' }
        ).setOrigin(0.5, 0);

        const commitmentBg = this.scene.add.rectangle(
            commitmentX, commitmentY + 40, commitmentWidth, commitmentHeight, 0x2d4a2b, 0.4
        ).setOrigin(0, 0);

        const commitmentZoneObj = this.scene.add.zone(
            commitmentX, commitmentY, commitmentWidth, this.scene.scale.height - 150
        ).setOrigin(0, 0).setDropZone();
        commitmentZoneObj.columnName = 'Sprint Commitment';

        this.sprintCommitmentZone = {
            bg: commitmentBg,
            label: commitmentLabel,
            zone: commitmentZoneObj,
            x: commitmentX,
            y: commitmentY,
            width: commitmentWidth,
            height: commitmentHeight
        };

        // Create Phase Indicator
        this.phaseIndicator = this.scene.add.text(
            this.scene.scale.width / 2,
            20,
            `Phase: ${this.scene.gameManager ? this.scene.gameManager.state : 'PLANNING'}`,
            {
                color: '#ffffff',
                fontSize: '18px',
                fontStyle: 'bold',
                backgroundColor: '#333333',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5, 0);
    }

    // ── Commitment Zone visibility ─────────────────────────────────────────────

    showCommitmentZone() {
        if (!this.sprintCommitmentZone) return;
        this.sprintCommitmentZone.bg.setVisible(true);
        this.sprintCommitmentZone.label.setVisible(true);
        this.sprintCommitmentZone.zone.setActive(true);
    }

    hideCommitmentZone() {
        if (!this.sprintCommitmentZone) return;
        this.sprintCommitmentZone.bg.setVisible(false);
        this.sprintCommitmentZone.label.setVisible(false);
        this.sprintCommitmentZone.zone.setActive(false);
    }

    // ── Product Backlog panel ──────────────────────────────────────────────────

    populateProductBacklog(ticketCount) {
        this.productBacklogTickets = [];

        const ticketTitles = [
            'Fix login bug', 'Add user profile', 'Optimize database queries',
            'Implement search', 'Update documentation', 'Refactor payment module',
            'Add dark mode', 'Improve mobile responsiveness', 'Fix security vulnerability',
            'Add API rate limiting'
        ];
        const requirements = ['Frontend', 'Backend', 'DevOps', 'QA'];

        // Panel sits below the main board as a slide-in strip
        const panelX = 0;
        const panelY = this.scene.scale.height - 250;
        const panelWidth = this.scene.scale.width;
        const panelHeight = 200;

        // Create the panel background and label lazily (only once)
        if (!this.productBacklogPanel) {
            const panelBg = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a3e, 0.9).setOrigin(0, 0);
            const panelLabel = this.scene.add.text(panelX + 20, panelY + 8, '📦 PRODUCT BACKLOG — drag tickets into Sprint Commitment', {
                color: '#aaaaff', fontSize: '14px', fontStyle: 'bold'
            });
            this.productBacklogPanel = { bg: panelBg, label: panelLabel, x: panelX, y: panelY, width: panelWidth, height: panelHeight };
        }

        const cardSpacing = Math.min(180, panelWidth / Math.max(ticketCount, 1));

        for (let i = 0; i < ticketCount; i++) {
            const title = ticketTitles[i % ticketTitles.length];
            const requirement = requirements[i % requirements.length];
            const x = panelX + 100 + i * cardSpacing;
            const y = panelY + 80;

            try {
                const TicketCardModule = eval('require("../entities/TicketCard.js")');
                const TicketCard = TicketCardModule.default;
                const ticket = new TicketCard(this.scene, x, y, title, requirement);
                ticket.currentColumn = 'Product Backlog';
                this.scene.add.existing(ticket);
                this.productBacklogTickets.push(ticket);
            } catch (e) {
                // In test/mock environments, create a plain object
                const mockTicket = {
                    constructor: { name: 'TicketCard' },
                    x, y, title, requirement,
                    currentColumn: 'Product Backlog',
                    stackedDevs: [],
                    setVisible: function() {},
                    input: null
                };
                this.productBacklogTickets.push(mockTicket);
                if (this.scene.add && this.scene.add.existing) {
                    this.scene.add.existing(mockTicket);
                }
            }
        }
    }

    showProductBacklog() {
        if (!this.productBacklogPanel) return;
        this.productBacklogPanel.bg.setVisible(true);
        this.productBacklogPanel.label.setVisible(true);
        this.productBacklogTickets.forEach(t => t.setVisible(true));
    }

    hideProductBacklog() {
        if (!this.productBacklogPanel) return;
        this.productBacklogPanel.bg.setVisible(false);
        this.productBacklogPanel.label.setVisible(false);
        this.productBacklogTickets.forEach(t => t.setVisible(false));
    }

    // ── Sprint start ───────────────────────────────────────────────────────────

    startSprint() {
        // Hide planning UI
        this.hideProductBacklog();
        this.hideCommitmentZone();

        // Remove any tickets still sitting in the Product Backlog (uncommitted)
        this.productBacklogTickets
            .filter(t => t.currentColumn === 'Product Backlog')
            .forEach(t => {
                if (typeof t.destroy === 'function') t.destroy();
            });
        // Clear the pool entries that weren't committed
        this.productBacklogTickets = this.productBacklogTickets.filter(
            t => t.currentColumn !== 'Product Backlog'
        );
    }

    // ── Fog of War integration ─────────────────────────────────────────────────

    /**
     * Spawn a bug as hidden — registers it with FogOfWarManager,
     * applies dim visual, and adds it to the bugs array.
     */
    spawnBugHidden(bug) {
        bug.isHidden = true;
        this.fogOfWar.registerHidden(bug);
        this.fogOfWar.applyVisualState(bug);
        if (!this.bugs.includes(bug)) {
            this.bugs.push(bug);
        }
    }

    /**
     * Unconditionally reveal a bug (e.g. from an incident firing).
     */
    revealBug(bug) {
        this.fogOfWar.reveal(bug);
    }

    /**
     * Spend one reveal token from GameManager to reveal a specific card.
     * Does nothing if no tokens available.
     */
    useRevealToken(card) {
        const gm = this.scene.gameManager;
        if (!gm || !gm.canSpendRevealToken()) return;
        if (!card.isHidden) return;
        gm.spendRevealToken();
        this.fogOfWar.reveal(card);
    }

    /**
     * Return all currently hidden cards.
     */
    getHiddenCards() {
        return this.fogOfWar.hiddenCards;
    }

    /**
     * Tick fog escalation — call from the main update loop during ACTIVE state.
     */
    tickFog(deltaMs) {
        this.fogOfWar.tickEscalation(deltaMs);
    }

    // ── State transition handler (called by MainGameScene) ────────────────────

    handleStateTransition(newState) {
        switch (newState) {
            case 'PLANNING':
                this.showProductBacklog();
                this.showCommitmentZone();
                break;
            case 'ACTIVE':
                this.hideProductBacklog();
                this.hideCommitmentZone();
                break;
            case 'REVIEW':
                this.hideProductBacklog();
                this.hideCommitmentZone();
                break;
        }
    }

    setupInteractions() {
        this.scene.input.on('dragenter', (pointer, gameObject, dropZone) => {
            if (dropZone.bgPanel) {
                dropZone.bgPanel.fillColor = 0x444444;
            }
        });

        this.scene.input.on('dragleave', (pointer, gameObject, dropZone) => {
            if (dropZone.bgPanel) {
                dropZone.bgPanel.fillColor = 0x222222;
            }
        });

        this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            const dx = dragX - gameObject.x;
            const dy = dragY - gameObject.y;

            gameObject.x = dragX;
            gameObject.y = dragY;

            if (gameObject.constructor.name === 'DevCard') {
                this.logInteraction('drag', {
                    cardType: gameObject.constructor.name,
                    x: gameObject.x,
                    y: gameObject.y,
                    currentTicketTitle: gameObject.currentTicket ? gameObject.currentTicket.title : null
                });
            }

            if (gameObject.constructor.name === 'TicketCard' || gameObject.constructor.name === 'BugCard') {
                if (gameObject.stackedDevs) {
                    gameObject.stackedDevs.forEach(dev => {
                        dev.x += dx;
                        dev.y += dy;
                    });
                }
            }
        });

        this.scene.input.on('drop', (pointer, gameObject, dropZone) => {
            this.logInteraction('drop', {
                cardType: gameObject.constructor.name,
                cardTitle: gameObject.title || null,
                x: gameObject.x,
                y: gameObject.y,
                dropZone: dropZone ? dropZone.columnName || 'unnamed-zone' : null
            });
            this.handleDrop(gameObject, dropZone);
        });

        this.scene.input.on('dragend', (pointer, gameObject, dropped) => {
            this.logInteraction('dragend', {
                cardType: gameObject.constructor.name,
                cardTitle: gameObject.title || null,
                x: gameObject.x,
                y: gameObject.y,
                dropped,
                currentTicketTitle: gameObject.currentTicket ? gameObject.currentTicket.title : null
            });
            if (!dropped) {
                if (gameObject.input) {
                    gameObject.x = gameObject.input.dragStartX;
                    gameObject.y = gameObject.input.dragStartY;
                }
            }
        });

        this.scene.input.on('dragstart', (pointer, gameObject) => {
            this.logInteraction('dragstart', {
                cardType: gameObject.constructor.name,
                cardTitle: gameObject.title || null,
                x: gameObject.x,
                y: gameObject.y,
                currentTicketTitle: gameObject.currentTicket ? gameObject.currentTicket.title : null
            });
            if (gameObject.constructor.name === 'DevCard') {
                if (gameObject.currentTicket) {
                    const ticket = gameObject.currentTicket;
                    ticket.stackedDevs = ticket.stackedDevs.filter(d => d !== gameObject);
                    gameObject.currentTicket = null;
                    // Recalculate positions for remaining devs
                    ticket.stackedDevs.forEach((dev, index) => {
                        dev.y = ticket.y + 40 + (index * 30);
                    });
                }
                if (typeof gameObject.stopBreathing === 'function') {
                    gameObject.stopBreathing();
                }
            }
        });
    }

    handleDrop(card, dropZone) {
        if (card.constructor.name === 'DevCard') {
            this.logInteraction('handleDrop:dev:start', {
                cardType: card.constructor.name,
                cardTitle: card.title || null,
                x: card.x,
                y: card.y,
                dropZone: dropZone ? dropZone.columnName || 'unnamed-zone' : null,
                ticketCount: this.tickets.length
            });

            const ticketDiagnostics = this.tickets.map(t => ({
                title: t.title || null,
                type: t.constructor.name,
                column: t.currentColumn,
                x: t.x,
                y: t.y,
                dx: Math.abs(t.x - card.x),
                dy: Math.abs(t.y - card.y)
            }));

            this.logInteraction('handleDrop:dev:candidates', {
                candidates: ticketDiagnostics
            });

            // Check overlap with tickets, but exclude tickets in 'Done' and Sprint Commitment
            const overlappingTicket = this.tickets.find(t => 
                t.currentColumn !== 'Done' && 
                t.currentColumn !== 'Sprint Commitment' &&
                t.currentColumn !== 'Product Backlog' &&
                Math.abs(t.x - card.x) < 50 && Math.abs(t.y - card.y) < 75
            );
            
            if (overlappingTicket) {
                // Check on-call restriction: prevent stacking on features if techHealth < 25
                if (this.scene.gameManager && this.scene.gameManager.isOnCallRequired()) {
                    // Allow stacking on bugs during on-call, but not on regular tickets
                    if (overlappingTicket.constructor.name !== 'BugCard') {
                        // Snap back to original position
                        card.x = card.input.dragStartX;
                        card.y = card.input.dragStartY;
                        this.logInteraction('handleDrop:dev:on-call-restriction', {
                            ticketType: overlappingTicket.constructor.name,
                            reason: 'On-call duty - only bugs allowed'
                        });
                        return;
                    }
                }

                // Check SEV-1 incident restriction: prevent feature work during critical incidents
                if (this.scene.incidentManager && this.scene.incidentManager.hasSev1Incident()) {
                    // Allow stacking on bugs during SEV-1, but not on regular tickets
                    if (overlappingTicket.constructor.name !== 'BugCard') {
                        // Snap back to original position
                        card.x = card.input.dragStartX;
                        card.y = card.input.dragStartY;
                        this.logInteraction('handleDrop:dev:sev1-restriction', {
                            ticketType: overlappingTicket.constructor.name,
                            reason: 'SEV-1 incident - only emergency bug work allowed'
                        });
                        return;
                    }
                }
                
                this.logInteraction('handleDrop:dev:match', {
                    ticketTitle: overlappingTicket.title || null,
                    ticketType: overlappingTicket.constructor.name,
                    ticketColumn: overlappingTicket.currentColumn,
                    ticketX: overlappingTicket.x,
                    ticketY: overlappingTicket.y
                });
                card.x = overlappingTicket.x;
                card.currentTicket = overlappingTicket;
                if (!overlappingTicket.stackedDevs.includes(card)) {
                    overlappingTicket.stackedDevs.push(card);
                }
                
                // Cascading layout based on index
                const devIndex = overlappingTicket.stackedDevs.indexOf(card);
                card.y = overlappingTicket.y + 40 + (devIndex * 30);
                
                if (typeof card.startBreathing === 'function') {
                    card.startBreathing();
                }
            } else {
                this.logInteraction('handleDrop:dev:no-match', {
                    x: card.x,
                    y: card.y,
                    reason: 'No eligible overlapping ticket found'
                });
                if (card.currentTicket) {
                    card.currentTicket.stackedDevs = card.currentTicket.stackedDevs.filter(d => d !== card);
                    card.currentTicket = null;
                }
                // DevCards don't snap to columns, they stay where dropped unless attached to a ticket
            }
        } else if (card.constructor.name === 'TicketCard' || card.constructor.name === 'BugCard') {
            if (dropZone) {
                const gameManager = this.scene.gameManager;
                const isPlanning = gameManager && gameManager.state === 'PLANNING';
                const isActive = gameManager && gameManager.state === 'ACTIVE';

                // Rule 1: Allow movement within the same column for spatial organization
                if (card.currentColumn === dropZone.columnName) {
                    // Stay where dropped within the zone
                    return;
                }

                // Rule 2: Planning phase movement (Product Backlog <-> Sprint Commitment)
                if (isPlanning) {
                    if (dropZone.columnName === 'Sprint Commitment' && 
                        (card.currentColumn === 'Product Backlog' || card.currentColumn === 'Sprint Commitment')) {
                        card.currentColumn = 'Sprint Commitment';
                        this.updateTicketArrays(card);
                        // Track commitment in GameManager
                        if (gameManager && typeof gameManager.addSprintCommitment === 'function') {
                            gameManager.addSprintCommitment(card);
                        }
                        return;
                    }
                    if (dropZone.columnName === 'Product Backlog' && card.currentColumn === 'Sprint Commitment') {
                        card.currentColumn = 'Product Backlog';
                        this.updateTicketArrays(card);
                        return;
                    }
                }

                // Rule 3: Active phase movement (Sprint Commitment -> In Progress only)
                if (isActive) {
                    if (card.currentColumn === 'Sprint Commitment' && dropZone.columnName === 'In Progress') {
                        card.currentColumn = dropZone.columnName;
                        this.updateTicketArrays(card);
                        return;
                    }
                }

                // If no rules matched, snap back
                if (card.input) {
                    card.x = card.input.dragStartX;
                    card.y = card.input.dragStartY;
                }
            } else {
                // No drop zone, snap back
                if (card.input) {
                    card.x = card.input.dragStartX;
                    card.y = card.input.dragStartY;
                }
            }
        }
    }

    updateTicketArrays(card) {
        if (card.currentColumn === 'Product Backlog') {
            // Remove from main tickets array if it's there
            const mainIndex = this.tickets.indexOf(card);
            if (mainIndex > -1) this.tickets.splice(mainIndex, 1);

            // Add to product backlog pool if not already there
            if (!this.productBacklogTickets.includes(card)) {
                this.productBacklogTickets.push(card);
            }
        } else {
            // Remove from product backlog pool if it's there
            const poolIndex = this.productBacklogTickets.indexOf(card);
            if (poolIndex > -1) this.productBacklogTickets.splice(poolIndex, 1);

            // Add to main tickets array if not already there
            if (!this.tickets.includes(card)) {
                this.tickets.push(card);
            }
        }
    }

    snapToColumn(card) {
        // Find the column based on X coordinate
        const colWidth = this.calculateColumnWidth();
        const colIndex = Math.floor(card.x / colWidth);
        const safeIndex = Math.max(0, Math.min(this.columns.length - 1, colIndex));
        
        const columnName = this.columns[safeIndex];
        const columnZone = this.columnZones[columnName];
        
        if (columnZone) {
            card.x = columnZone.x + columnZone.width / 2;
            if (card.constructor.name === 'TicketCard' || card.constructor.name === 'BugCard') {
                card.currentColumn = columnName;
            }
        }
    }

    slideTicket(ticket) {
        if (typeof ticket.stopParticles === 'function') {
            ticket.stopParticles();
        }

        // Detach devs
        ticket.stackedDevs.forEach(dev => {
            dev.currentTicket = null;
            if (typeof dev.stopBreathing === 'function') {
                dev.stopBreathing();
            }
        });
        ticket.stackedDevs = [];
        
        // Automated transition: In Progress -> Review -> Done
        let nextColumn = '';
        if (ticket.currentColumn === 'In Progress') nextColumn = 'Review';
        else if (ticket.currentColumn === 'Review') nextColumn = 'Done';
        
        if (nextColumn) {
            const targetZone = this.columnZones[nextColumn];
            if (targetZone) {
                ticket.currentColumn = nextColumn;
                ticket.progress = 0;
                if (typeof ticket.updateProgressVisual === 'function') {
                    ticket.updateProgressVisual();
                }
                
                // Animate slide to the center of the next column
                this.scene.tweens.add({
                    targets: ticket,
                    x: targetZone.x + targetZone.width / 2,
                    y: ticket.y,
                    duration: 500,
                    ease: 'Power2'
                });
            }
        }
    }

    spawnBugForTicket(ticket) {
        if (ticket.quality === undefined || ticket.quality >= 100) {
            return;
        }

        const failChance = (100 - ticket.quality) / 100;
        if (Math.random() >= failChance) {
            return;
        }

        const commitmentColumn = this.columnZones['Sprint Commitment'];
        const bugX = commitmentColumn ? commitmentColumn.x + (commitmentColumn.width / 2) : 100;
        const existingBacklogCards = this.tickets.filter(existingTicket => existingTicket.currentColumn === 'Sprint Commitment').length;
        const bugY = 120 + (existingBacklogCards * 100);
        const bug = new BugCard(
            this.scene,
            bugX,
            bugY,
            `Bug in ${ticket.title}`,
            ticket.requirement
        );

        bug.currentColumn = 'Sprint Commitment';
        this.scene.add.existing(bug);
        this.tickets.push(bug);
        
        // Decrease tech health when a bug spawns
        if (this.scene.gameManager && typeof this.scene.gameManager.handleBugSpawned === 'function') {
            this.scene.gameManager.handleBugSpawned();
        }
    }

    update(time, delta) {
        this.tickets.forEach(ticket => {
            if (ticket.stackedDevs && ticket.stackedDevs.length > 0 && ticket.progress < ticket.maxProgress) {
                // Calculate synergy multiplier
                const devCount = ticket.stackedDevs.length;
                const synergyMultiplier = devCount === 2 ? 1.5 : 1.0; // Pair programming bonus
                
                // Get global morale multiplier
                let moraleMultiplier = 1.0;
                if (this.scene && this.scene.gameManager && typeof this.scene.gameManager.getMoraleMultiplier === 'function') {
                    moraleMultiplier = this.scene.gameManager.getMoraleMultiplier();
                }

                // Decay quality if mismatched devs are working
                if (ticket.quality !== undefined) {
                    const hasMismatchedDev = ticket.stackedDevs.some(dev => dev.role !== ticket.requirement);
                    if (hasMismatchedDev) {
                        const qualityDecayMultiplier = moraleMultiplier < 1.0 ? 2.0 : 1.0;
                        ticket.quality = Math.max(0, ticket.quality - (5 * qualityDecayMultiplier * (delta / 1000))); // Decay 5 points per second
                        if (typeof ticket.updateQualityVisual === 'function') {
                            ticket.updateQualityVisual();
                        }
                    }
                }
                
                // Calculate total work rate from all attached devs
                let totalRate = 0;
                
                ticket.stackedDevs.forEach(dev => {
                    const isMatch = ticket.requirement && dev.role === ticket.requirement;
                    const roleMultiplier = isMatch ? 2.0 : 1.0;
                    const exhaustionMultiplier = (typeof dev.isExhausted === 'function' && dev.isExhausted()) ? 0.5 : 1.0;
                    
                    totalRate += 10 * roleMultiplier * synergyMultiplier * exhaustionMultiplier * moraleMultiplier; // 10 base units per sec

                    // Accumulate burnout for working dev
                    if (typeof dev.setBurnout === 'function' && dev.burnout !== undefined) {
                        const baseBurnoutRate = 2.0; // 2 burnout units per second
                        const pairRelief = devCount === 2 ? 0.7 : 1.0; // 30% reduction for pairing
                        dev.setBurnout(dev.burnout + (baseBurnoutRate * pairRelief * (delta / 1000)));
                    }
                });
                
                
                // Fill progress
                ticket.progress += (delta / 1000) * totalRate;
                
                if (typeof ticket.updateProgressVisual === 'function') {
                    ticket.updateProgressVisual();
                }
                
                if (typeof ticket.startParticles === 'function') {
                    ticket.startParticles();
                }
                
                if (ticket.progress >= ticket.maxProgress) {
                    this.spawnBugForTicket(ticket);
                    this.slideTicket(ticket);
                }
            } else {
                if (typeof ticket.stopParticles === 'function') {
                    ticket.stopParticles();
                }
            }
        });
    }

    updatePhaseIndicator(phase) {
        if (this.phaseIndicator) {
            this.phaseIndicator.text = `Phase: ${phase}`;
        }
    }

    spawnTechDebtForTicket(ticket) {
        // Only spawn debt if ticket was rushed or had low quality
        if (!ticket.wasRushed && (!ticket.quality || ticket.quality >= 50)) {
            return;
        }
        
        const debtTitle = `Tech Debt: ${ticket.title}`;
        const debt = new TechDebtCard(this.scene, 0, 0, debtTitle);
        
        // Attach to random service if available
        if (this.serviceCards.length > 0) {
            const randomService = this.serviceCards[Math.floor(Math.random() * this.serviceCards.length)];
            debt.attachToService(randomService);
        }
        
        this.techDebtCards.push(debt);
        this.scene.add.existing(debt);
    }

    handleManagerStack(manager, target) {
        if (target.constructor.name === 'DevCard') {
            this.stackManagerOnDev(manager, target);
        } else if (target.constructor.name === 'StakeholderCard') {
            this.stackManagerOnStakeholder(manager, target);
        }
    }

    stackManagerOnDev(manager, dev) {
        // Apply management bonus
        manager.applyToDev(dev);
        
        // Position manager on top of dev
        manager.x = dev.x;
        manager.y = dev.y - 20;
        
        // Shield dev from interrupts
        if (manager.canShield) {
            dev.isShielded = true;
            dev.shieldingManager = manager;
        }
        
        // Track the stacking
        dev.stackedManager = manager;
        manager.currentDev = dev;
    }

    stackManagerOnStakeholder(manager, stakeholder) {
        // Negotiation logic
        manager.x = stakeholder.x;
        manager.y = stakeholder.y - 20;
        
        // Reduce stakeholder demands
        if (stakeholder.reduceDemands) {
            stakeholder.reduceDemands(manager.stakeholderNegotiationPower);
        }
    }
}
