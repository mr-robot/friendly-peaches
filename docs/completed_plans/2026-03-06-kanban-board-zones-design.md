# Design: Kanban Board Zones (Phase 1)

## Architecture & Components
We will update the `BoardController` to manage four distinct column entities: Backlog, In Progress, Review, and Done.
Each column will consist of three stacked Phaser objects:
1. **Background Panel:** A `Phaser.GameObjects.Rectangle` with a semi-transparent dark color (e.g., `0x222222` with `0.5` alpha) to visually delineate the zone.
2. **Title Text:** A text label at the top center of the column.
3. **Drop Zone:** A native Phaser Zone (`scene.add.zone().setDropZone()`) perfectly overlaid on the background panel to handle interaction events.

## Data Flow & Interaction (Interactive Highlights)
We will leverage Phaser's built-in drag events on the `MainGameScene` to drive the visual feedback:
- `dragenter`: When a dragged card enters a column's Drop Zone, the `BoardController` will listen for this event and temporarily change the background panel's color (e.g., to a brighter `0x444444`) to indicate a valid drop target.
- `dragleave`: When the card leaves the zone, the background reverts to its original color.
- `drop`: When the card is dropped within the zone, the `BoardController` will snap the card to a structured position within that column and update the card's internal `currentColumn` state.

## Error Handling
If a card is dropped outside of any valid Drop Zone (a `dragend` event without a corresponding `drop` event), the card will simply snap back to its previous valid column or position to prevent it from getting lost off-screen.
