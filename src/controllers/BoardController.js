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
        // Will handle progress updates here later
    }
}