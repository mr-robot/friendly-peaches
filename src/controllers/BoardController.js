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
            // Draw visual line
            this.scene.add.line(0, 0, x - 100, 0, x - 100, 600, 0x555555).setOrigin(0, 0);
            this.scene.add.text(x, 20, name, { color: '#ffffff' }).setOrigin(0.5);
            
            // Store basic bounds for dropping
            this.columnZones[name] = { x: x - 100, width: colWidth };
        });
    }
    
    handleDrop(card) {
        if (card.constructor.name === 'DevCard') {
            // Check overlap with tickets
            const overlappingTicket = this.tickets.find(t => 
                Math.abs(t.x - card.x) < 50 && Math.abs(t.y - card.y) < 75
            );
            
            if (overlappingTicket) {
                card.x = overlappingTicket.x;
                card.y = overlappingTicket.y + 20; // visual offset
                card.currentTicket = overlappingTicket;
                if (!overlappingTicket.stackedDevs.includes(card)) {
                    overlappingTicket.stackedDevs.push(card);
                }
            } else {
                if (card.currentTicket) {
                    card.currentTicket.stackedDevs = card.currentTicket.stackedDevs.filter(d => d !== card);
                    card.currentTicket = null;
                }
                this.snapToColumn(card);
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
            if (ticket.stackedDevs.length > 0 && ticket.progress < ticket.maxProgress) {
                // Fill progress
                ticket.progress += (delta / 1000) * 10; // 10 units per second per dev
                ticket.updateProgressVisual();
                
                if (ticket.progress >= ticket.maxProgress) {
                    this.slideTicket(ticket);
                }
            }
        });
    }

    slideTicket(ticket) {
        // Detach devs
        ticket.stackedDevs.forEach(dev => {
            dev.currentTicket = null;
            dev.y += 100; // visually separate
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