export default class BoardController {
    constructor(scene) {
        this.scene = scene;
        this.columns = ['Backlog', 'In Progress', 'Review', 'Done'];
        this.columnZones = {};
        this.tickets = [];
        this.devs = [];
    }

    createColumns() {
        const colWidth = 200;
        this.columns.forEach((name, index) => {
            const x = index * colWidth + 100;
            const startX = x - 100;
            
            // Background Panel
            const bg = this.scene.add.rectangle(startX, 0, colWidth, 600, 0x222222, 0.5).setOrigin(0, 0);
            
            // Draw visual line
            this.scene.add.line(0, 0, x - 100, 0, x - 100, 600, 0x555555).setOrigin(0, 0);
            this.scene.add.text(x, 20, name, { color: '#ffffff' }).setOrigin(0.5);
            
            // Drop Zone
            const zone = this.scene.add.zone(startX, 0, colWidth, 600).setOrigin(0, 0).setDropZone();
            zone.bgPanel = bg;
            zone.columnName = name;
            
            // Store basic bounds for dropping
            this.columnZones[name] = { 
                x: startX, 
                width: colWidth,
                bg: bg,
                zone: zone
            };
        });
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

        this.scene.input.on('drop', (pointer, gameObject, dropZone) => {
            if (gameObject.constructor.name === 'TicketCard') {
                gameObject.x = dropZone.x + (dropZone.width / 2);
                gameObject.currentColumn = dropZone.columnName;
            } else if (gameObject.constructor.name === 'DevCard') {
                this.handleDrop(gameObject); // We still need the complex stacking logic for devs
            }
        });

        this.scene.input.on('dragend', (pointer, gameObject, dropped) => {
            if (!dropped) {
                if (gameObject.input) {
                    gameObject.x = gameObject.input.dragStartX;
                    gameObject.y = gameObject.input.dragStartY;
                }
            }
        });

        this.scene.input.on('dragstart', (pointer, gameObject) => {
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

        this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject.constructor.name === 'TicketCard') {
                const dx = dragX - gameObject.x;
                const dy = dragY - gameObject.y;
                if (gameObject.stackedDevs) {
                    gameObject.stackedDevs.forEach(dev => {
                        dev.x += dx;
                        dev.y += dy;
                    });
                }
            }
        });
    }

    handleDrop(card) {
        if (card.constructor.name === 'DevCard') {
            // Check overlap with tickets, but exclude tickets in 'Done'
            const overlappingTicket = this.tickets.find(t => 
                t.currentColumn !== 'Done' && Math.abs(t.x - card.x) < 50 && Math.abs(t.y - card.y) < 75
            );
            
            if (overlappingTicket) {
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
                if (card.currentTicket) {
                    card.currentTicket.stackedDevs = card.currentTicket.stackedDevs.filter(d => d !== card);
                    card.currentTicket = null;
                }
                // Snap back logic for dev card if dropped without ticket
                if (card.input) {
                    card.x = card.input.dragStartX;
                    card.y = card.input.dragStartY;
                }
            }
        } else if (card.constructor.name === 'TicketCard') {
            this.snapToColumn(card);
        }
    }

    snapToColumn(card) {
        const colIndex = Math.floor(card.x / 200);
        const safeIndex = Math.max(0, Math.min(3, colIndex));
        card.x = safeIndex * 200 + 100;
        if (card.constructor.name === 'TicketCard') {
            card.currentColumn = this.columns[safeIndex];
        }
    }

    update(time, delta) {
        this.tickets.forEach(ticket => {
            if (ticket.stackedDevs && ticket.stackedDevs.length > 0 && ticket.progress < ticket.maxProgress) {
                // Calculate synergy multiplier
                const devCount = ticket.stackedDevs.length;
                const synergyMultiplier = devCount === 2 ? 1.5 : 1.0; // Pair programming bonus
                
                // Calculate total work rate from all attached devs
                let totalRate = 0;
                ticket.stackedDevs.forEach(dev => {
                    const roleMultiplier = (ticket.requirement && dev.role === ticket.requirement) ? 2.0 : 1.0;
                    totalRate += 10 * roleMultiplier * synergyMultiplier; // 10 base units per sec
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
                    this.slideTicket(ticket);
                }
            } else {
                if (typeof ticket.stopParticles === 'function') {
                    ticket.stopParticles();
                }
            }
        });
    }

    slideTicket(ticket) {
        if (typeof ticket.stopParticles === 'function') {
            ticket.stopParticles();
        }

        // Detach devs
        ticket.stackedDevs.forEach(dev => {
            dev.currentTicket = null;
            dev.y += 100; // visually separate
            if (typeof dev.stopBreathing === 'function') {
                dev.stopBreathing();
            }
        });
        ticket.stackedDevs = [];
        
        // Move to next column
        const currentIndex = this.columns.indexOf(ticket.currentColumn);
        if (currentIndex < this.columns.length - 1) {
            ticket.currentColumn = this.columns[currentIndex + 1];
            ticket.progress = 0;
            ticket.updateProgressVisual();
            
            // Animate slide
            this.scene.tweens.add({
                targets: ticket,
                x: (currentIndex + 1) * 200 + 100,
                duration: 500,
                ease: 'Power2'
            });
        }
    }
}