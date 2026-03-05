export default class BoardController {
    constructor(scene) {
        this.scene = scene;
        this.columns = ['Backlog', 'In Progress', 'Review', 'Done'];
        this.columnZones = {};
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
    
    update(time, delta) {
        // Will handle progress updates here later
    }
}