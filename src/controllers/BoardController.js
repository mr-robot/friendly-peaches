import BugCard from '../entities/BugCard.js';

export default class BoardController {
    constructor(scene) {
        this.scene = scene;
        this.columns = ['Icebox', 'Backlog', 'In Progress', 'Review', 'Done'];
        this.columnZones = {};
        this.tickets = [];
        this.devs = [];
        this.bugs = [];
        this.iceboxTickets = [];
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
    }

    showIcebox() {
        const iceboxColumn = this.columnZones['Icebox'];
        if (iceboxColumn) {
            iceboxColumn.bg.setVisible(true);
            iceboxColumn.headerBg.setVisible(true);
            iceboxColumn.zone.setActive(true);
        }
        this.iceboxTickets.forEach(ticket => ticket.setVisible(true));
    }

    hideIcebox() {
        const iceboxColumn = this.columnZones['Icebox'];
        if (iceboxColumn) {
            iceboxColumn.bg.setVisible(false);
            iceboxColumn.headerBg.setVisible(false);
            iceboxColumn.zone.setActive(false);
        }
        this.iceboxTickets.forEach(ticket => ticket.setVisible(false));
    }

    populateIcebox(ticketCount) {
        this.iceboxTickets = [];

        const ticketTitles = [
            'Fix login bug', 'Add user profile', 'Optimize database queries',
            'Implement search', 'Update documentation', 'Refactor payment module',
            'Add dark mode', 'Improve mobile responsiveness', 'Fix security vulnerability',
            'Add API rate limiting'
        ];

        const requirements = ['Frontend', 'Backend', 'DevOps', 'QA'];
        const iceboxColumn = this.columnZones['Icebox'];

        if (!iceboxColumn) return;

        for (let i = 0; i < ticketCount; i++) {
            const title = ticketTitles[i % ticketTitles.length];
            const requirement = requirements[i % requirements.length];

            const colWidth = iceboxColumn.width;
            const x = iceboxColumn.x + 20 + (i % 2) * (colWidth / 2 - 40);
            const y = 120 + Math.floor(i / 2) * 100;

            try {
                const TicketCardModule = eval('require("../entities/TicketCard.js")');
                const TicketCard = TicketCardModule.default;
                const ticket = new TicketCard(this.scene, x, y, title, requirement);
                ticket.currentColumn = 'Icebox';
                this.scene.add.existing(ticket);
                this.iceboxTickets.push(ticket);
            } catch (e) {
                const mockTicket = {
                    constructor: { name: 'TicketCard' },
                    x, y, title, requirement,
                    currentColumn: 'Icebox',
                    setVisible: () => {}
                };
                this.iceboxTickets.push(mockTicket);
                if (this.scene.add.existing) {
                    this.scene.add.existing(mockTicket);
                }
            }
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

            // Check overlap with tickets, but exclude tickets in 'Done' and Icebox/Backlog
            const overlappingTicket = this.tickets.find(t => 
                t.currentColumn !== 'Done' && 
                t.currentColumn !== 'Icebox' && 
                t.currentColumn !== 'Backlog' &&
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

                // Rule 2: Planning phase movement (Icebox <-> Backlog)
                if (isPlanning) {
                    if ((card.currentColumn === 'Icebox' && dropZone.columnName === 'Backlog') ||
                        (card.currentColumn === 'Backlog' && dropZone.columnName === 'Icebox')) {
                        
                        card.currentColumn = dropZone.columnName;
                        this.updateTicketArrays(card);
                        return;
                    }
                }

                // Rule 3: Active phase movement (Backlog -> In Progress only)
                if (isActive) {
                    if (card.currentColumn === 'Backlog' && dropZone.columnName === 'In Progress') {
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
        if (card.currentColumn === 'Icebox') {
            // Remove from main tickets array if it's there
            const mainIndex = this.tickets.indexOf(card);
            if (mainIndex > -1) {
                this.tickets.splice(mainIndex, 1);
            }
            
            // Add to icebox tickets if not already there
            if (this.iceboxTickets && !this.iceboxTickets.includes(card)) {
                this.iceboxTickets.push(card);
            }
        } else {
            // Remove from icebox tickets if it's there
            if (this.iceboxTickets) {
                const iceboxIndex = this.iceboxTickets.indexOf(card);
                if (iceboxIndex > -1) {
                    this.iceboxTickets.splice(iceboxIndex, 1);
                }
            }
            
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

        const backlogColumn = this.columnZones['Backlog'];
        const bugX = backlogColumn ? backlogColumn.x + (backlogColumn.width / 2) : 100;
        const existingBacklogCards = this.tickets.filter(existingTicket => existingTicket.currentColumn === 'Backlog').length;
        const bugY = 120 + (existingBacklogCards * 100);
        const bug = new BugCard(
            this.scene,
            bugX,
            bugY,
            `Bug in ${ticket.title}`,
            ticket.requirement
        );

        bug.currentColumn = 'Backlog';
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
}
