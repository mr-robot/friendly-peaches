# Design: Work Simulation & Auto-Flow (Phase 1)

## Data Flow & Work Simulation
- The `BoardController.update(time, delta)` method will continue to iterate through all tickets. 
- If a `TicketCard` has one or more `stackedDevs` attached, its internal `progress` value will increase by a fixed rate (e.g., 10 units per second per dev) until it hits `maxProgress` (100).
- As progress increases, `ticket.updateProgressVisual()` is called to fill the green bar at the bottom of the card.

## Visual Feedback (Active Work)
To make the board feel alive, we will add two visual effects when work is happening:
1. **DevCard Breathing:** When a `DevCard` is attached to a ticket, a gentle, looping tween will scale the card slightly up and down (e.g., `scaleY` from `1.0` to `0.95` and back over 500ms) to simulate active "typing". When detached, the scale resets to `1.0` and the tween is stopped.
2. **Floating Particles:** We will use Phaser's built-in `ParticleEmitter` attached to the `TicketCard`. While progress is actively increasing, the emitter will release small, fading text particles (like `+`, `<`, `>`) that drift upwards and disappear. The emitter turns off when work pauses or finishes.

## Auto-Flow & Detachment
- When `progress >= maxProgress`, the `BoardController` triggers the `slideTicket(ticket)` logic.
- **Detach and Wait:** All devs currently in `ticket.stackedDevs` are immediately removed from the array, their `currentTicket` is set to null, their breathing animations stop, and their `y` position is increased slightly (e.g., `+100`) so they drop down visually in the current column, ready for reassignment.
- The `TicketCard`'s progress bar resets, its `currentColumn` updates to the next phase, and a Phaser Tween smoothly slides the card along the X-axis to the center of the next Kanban zone.
